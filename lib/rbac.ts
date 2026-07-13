// ============================================================
// RBAC – Role Based Access Control
// Supports: page-level access + granular CRUD action flags
// ============================================================

export interface RbacUser {
  is_superuser?: boolean
  role?: string | null
  access_level?: string | null
  department?: string | null
}

export interface AccessRule {
  allowedRoles?: string[]
  allowedDepartments?: string[]
  href?: string
  pathPrefix?: string
}

export interface RouteAccessRule extends AccessRule {
  pathPrefix: string
  label: string
  /** Canonical CRUD actions this page supports */
  actions?: PageAction[]
}

// ─────────────────────────────────────────────────────────────
// CRUD action taxonomy
// ─────────────────────────────────────────────────────────────
export type PageAction =
  | "view"        // Can see the main listing page
  | "view_details"// Can open individual detail / profile
  | "add"         // Can create new records
  | "edit"        // Can edit / modify existing records
  | "delete"      // Can remove / delete records

export const PAGE_ACTION_LABELS: Record<PageAction, string> = {
  view: "View Main Page",
  view_details: "View Details",
  add: "Add New",
  edit: "Edit / Modify",
  delete: "Remove / Delete",
}

// Encoded as `${pathPrefix}::${action}` – stored in allowed_paths
export const encodeAction = (pathPrefix: string, action: PageAction) =>
  `${pathPrefix}::${action}`

export const decodeAction = (encoded: string): { pathPrefix: string; action: PageAction } | null => {
  const idx = encoded.indexOf("::")
  if (idx === -1) return null
  return { pathPrefix: encoded.slice(0, idx), action: encoded.slice(idx + 2) as PageAction }
}

/** Return the plain pathPrefix tokens (no action suffix) from an allowed_paths array */
export const getPaths = (allowed: string[]) =>
  [...new Set(allowed.map((s) => s.split("::")[0]))]

/** Return the actions granted for a specific page */
export const getActionsForPath = (allowed: string[], pathPrefix: string): PageAction[] =>
  allowed
    .filter((s) => s.startsWith(`${pathPrefix}::`))
    .map((s) => s.split("::")[1] as PageAction)

// ─────────────────────────────────────────────────────────────
// Runtime state – loaded once from backend at app boot
// ─────────────────────────────────────────────────────────────
const normalize = (value?: string | null) => String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_")
let roleAccessPolicies: Record<string, string[]> = {}

export const ADMIN_ROLES = ["admin", "super_admin", "superadmin"]
export const USER_MANAGEMENT_ROLES = [...ADMIN_ROLES, "staff", "support", "accountant"]
export const NETWORK_ROLES = [...ADMIN_ROLES, "technician"]
export const FINANCE_ROLES = [...ADMIN_ROLES, "accountant"]
export const OPERATIONS_ROLES = [...ADMIN_ROLES, "staff", "technician", "support"]
export const SUPPORT_ROLES = [...ADMIN_ROLES, "staff", "support"]
export const ENGAGEMENT_ROLES = [...ADMIN_ROLES, "staff", "support"]

export const setRoleAccessPolicies = (policies: Array<{ role: string; allowed_paths: string[] }>) => {
  roleAccessPolicies = policies.reduce<Record<string, string[]>>((acc, policy) => {
    acc[normalize(policy.role)] = Array.isArray(policy.allowed_paths) ? policy.allowed_paths : []
    return acc
  }, {})
}

// ─────────────────────────────────────────────────────────────
// Page-level access helpers (unchanged external API)
// ─────────────────────────────────────────────────────────────
export const getEffectiveRoutePathsForRole = (role: string) => {
  const normalizedRole = normalize(role)
  if (roleAccessPolicies[normalizedRole]) return getPaths(roleAccessPolicies[normalizedRole])
  return adminRouteAccessRules
    .filter((rule) => rule.allowedRoles?.map(normalize).includes(normalizedRole))
    .map((rule) => rule.pathPrefix)
}

export const canAccess = (user: RbacUser | null | undefined, rule?: AccessRule): boolean => {
  if (!rule || (!rule.allowedRoles?.length && !rule.allowedDepartments?.length)) return true
  if (!user) return false
  if (user.is_superuser) return true

  const role = normalize(user.role)
  const accessLevel = normalize(user.access_level)
  const department = normalize(user.department)
  if (ADMIN_ROLES.includes(role) || ADMIN_ROLES.includes(accessLevel)) return true

  const targetPath = rule.pathPrefix || rule.href
  if (targetPath && Object.prototype.hasOwnProperty.call(roleAccessPolicies, role)) {
    const granted = roleAccessPolicies[role]
    return granted.some((token) => {
      const [path, action] = token.split("::")
      if (action) return path === targetPath && action === "view"
      return targetPath === path || targetPath.startsWith(`${path}/`)
    })
  }

  const allowedRoles = rule.allowedRoles?.map(normalize) || []
  const roleAllowed = allowedRoles.includes(role) || allowedRoles.includes(accessLevel)
  const departmentAllowed = !!rule.allowedDepartments?.map(normalize).includes(department)

  return roleAllowed || departmentAllowed
}

/**
 * Check if a user has a specific CRUD action on a page.
 * Admins always pass. Falls back to full access if no policies exist yet.
 */
export const canDo = (
  user: RbacUser | null | undefined,
  pathPrefix: string,
  action: PageAction
): boolean => {
  if (!user) return false
  if (user.is_superuser) return true

  const role = normalize(user.role)
  const accessLevel = normalize(user.access_level)
  if (ADMIN_ROLES.includes(role) || ADMIN_ROLES.includes(accessLevel)) return true

  const hasPolicy = Object.prototype.hasOwnProperty.call(roleAccessPolicies, role)
  const policies = roleAccessPolicies[role]
  if (!hasPolicy) return true
  if (!policies || policies.length === 0) return false

  // Check encoded action token
  const actionToken = encodeAction(pathPrefix, action)
  if (policies.includes(actionToken)) return true

  // Legacy support: if only plain paths are stored (no "::" tokens), treat "view" as granted
  const hasSomeActionForPath = policies.some((p) => p.startsWith(`${pathPrefix}::`))
  if (!hasSomeActionForPath) {
    // Old-style entry: plain path allowed means the page is accessible (all actions)
    return policies.some((p) => pathPrefix === p || pathPrefix.startsWith(`${p}/`))
  }

  return false
}

// ─────────────────────────────────────────────────────────────
// Route access rules (single source of truth)
// ─────────────────────────────────────────────────────────────
export const adminRouteAccessRules: RouteAccessRule[] = [
  {
    pathPrefix: "/admin/users",
    label: "User Management",
    allowedRoles: USER_MANAGEMENT_ROLES,
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/staff",
    label: "Staff Management",
    allowedRoles: ADMIN_ROLES,
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/plans",
    label: "Plan Management",
    allowedRoles: ADMIN_ROLES,
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/routers",
    label: "Router Management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/networks",
    label: "IP Network Management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/radius",
    label: "RADIUS Management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/fup",
    label: "Fair Usage Policy",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/usage",
    label: "Network Usage Analytics",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view"],
  },
  {
    pathPrefix: "/admin/olt",
    label: "OLT / Optical Network",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/onu",
    label: "ONU Management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/invoices",
    label: "Invoices",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/payments",
    label: "Payments",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "view_details", "add", "delete"],
  },
  {
    pathPrefix: "/admin/receipts",
    label: "Receipts",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "view_details"],
  },
  {
    pathPrefix: "/admin/vouchers",
    label: "Vouchers",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/payment-methods",
    label: "Payment Methods",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/analytics",
    label: "Financial Reports",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view"],
  },
  {
    pathPrefix: "/admin/settings/billing",
    label: "Subscription Billing",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    actions: ["view", "edit"],
  },
  {
    pathPrefix: "/admin/dispatch",
    label: "Dispatch Management",
    allowedRoles: OPERATIONS_ROLES,
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/inventory",
    label: "Inventory Management",
    allowedRoles: OPERATIONS_ROLES,
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/tickets",
    label: "Support Tickets",
    allowedRoles: [...SUPPORT_ROLES, "technician"],
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/leads",
    label: "Leads Management",
    allowedRoles: ENGAGEMENT_ROLES,
    actions: ["view", "view_details", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/loyalty",
    label: "Loyalty Management",
    allowedRoles: ENGAGEMENT_ROLES,
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/sms",
    label: "SMS Management",
    allowedRoles: [...ENGAGEMENT_ROLES, "accountant"],
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/ads",
    label: "Ads Management",
    allowedRoles: ENGAGEMENT_ROLES,
    actions: ["view", "add", "edit", "delete"],
  },
  {
    pathPrefix: "/admin/notifications",
    label: "Notifications",
    allowedRoles: ADMIN_ROLES,
    actions: ["view"],
  },
  {
    pathPrefix: "/admin/logs",
    label: "System Logs",
    allowedRoles: ADMIN_ROLES,
    actions: ["view"],
  },
  {
    pathPrefix: "/admin/settings",
    label: "System Settings",
    allowedRoles: ADMIN_ROLES,
    actions: ["view", "edit"],
  },
]

export const getAccessRuleForPath = (pathname?: string | null): RouteAccessRule | undefined => {
  if (!pathname) return undefined
  return adminRouteAccessRules
    .filter((rule) => pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`))
    .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)[0]
}

/** Build the default allowed_paths (with CRUD suffixes) for a role from the route rules */
export const defaultTokensForRole = (role: string): string[] => {
  const normalizedRole = normalize(role)
  const tokens: string[] = []
  for (const rule of adminRouteAccessRules) {
    if (!rule.allowedRoles?.map(normalize).includes(normalizedRole)) continue
    const actions = rule.actions || (["view"] as PageAction[])
    for (const action of actions) {
      tokens.push(encodeAction(rule.pathPrefix, action))
    }
  }
  return tokens
}
