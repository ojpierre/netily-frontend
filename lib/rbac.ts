export interface RbacUser {
  is_superuser?: boolean
  role?: string | null
  access_level?: string | null
  department?: string | null
}

export interface AccessRule {
  allowedRoles?: string[]
  allowedDepartments?: string[]
}

export interface RouteAccessRule extends AccessRule {
  pathPrefix: string
  label: string
}

const normalize = (value?: string | null) => String(value || "").trim().toLowerCase()

export const ADMIN_ROLES = ["admin", "super_admin"]
export const USER_MANAGEMENT_ROLES = [...ADMIN_ROLES, "staff", "support", "accountant"]
export const NETWORK_ROLES = [...ADMIN_ROLES, "technician"]
export const FINANCE_ROLES = [...ADMIN_ROLES, "accountant"]
export const OPERATIONS_ROLES = [...ADMIN_ROLES, "staff", "technician", "support"]
export const SUPPORT_ROLES = [...ADMIN_ROLES, "staff", "support"]
export const ENGAGEMENT_ROLES = [...ADMIN_ROLES, "staff", "support"]

export const canAccess = (user: RbacUser | null | undefined, rule?: AccessRule): boolean => {
  if (!rule || (!rule.allowedRoles?.length && !rule.allowedDepartments?.length)) return true
  if (!user) return false
  if (user.is_superuser) return true

  const role = normalize(user.role)
  const accessLevel = normalize(user.access_level)
  const department = normalize(user.department)
  const allowedRoles = rule.allowedRoles?.map(normalize) || []
  const roleAllowed = allowedRoles.includes(role) || allowedRoles.includes(accessLevel)
  const departmentAllowed = !!rule.allowedDepartments?.map(normalize).includes(department)

  return roleAllowed || departmentAllowed
}

export const adminRouteAccessRules: RouteAccessRule[] = [
  { pathPrefix: "/admin/users", label: "User management", allowedRoles: USER_MANAGEMENT_ROLES },
  { pathPrefix: "/admin/staff", label: "Staff management", allowedRoles: ADMIN_ROLES },
  { pathPrefix: "/admin/plans", label: "Plan management", allowedRoles: ADMIN_ROLES },
  {
    pathPrefix: "/admin/olt",
    label: "Network architecture",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/onu",
    label: "Network architecture",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/routers",
    label: "Router management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/networks",
    label: "IP network management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/radius",
    label: "RADIUS management",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/fup",
    label: "Fair usage policy",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/usage",
    label: "Network usage analytics",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/invoices",
    label: "Invoices",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/payments",
    label: "Payments",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/receipts",
    label: "Receipts",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/vouchers",
    label: "Vouchers",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/payment-methods",
    label: "Payment methods",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/analytics",
    label: "Financial reports",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/settings/billing",
    label: "Subscription billing",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  { pathPrefix: "/admin/dispatch", label: "Dispatch management", allowedRoles: OPERATIONS_ROLES },
  { pathPrefix: "/admin/inventory", label: "Inventory management", allowedRoles: OPERATIONS_ROLES },
  { pathPrefix: "/admin/tickets", label: "Support tickets", allowedRoles: [...SUPPORT_ROLES, "technician"] },
  { pathPrefix: "/admin/leads", label: "Leads management", allowedRoles: ENGAGEMENT_ROLES },
  { pathPrefix: "/admin/loyalty", label: "Loyalty management", allowedRoles: ENGAGEMENT_ROLES },
  { pathPrefix: "/admin/sms", label: "SMS management", allowedRoles: [...ENGAGEMENT_ROLES, "accountant"] },
  { pathPrefix: "/admin/ads", label: "Ads management", allowedRoles: ENGAGEMENT_ROLES },
  { pathPrefix: "/admin/notifications", label: "Notifications", allowedRoles: ADMIN_ROLES },
  { pathPrefix: "/admin/logs", label: "System logs", allowedRoles: ADMIN_ROLES },
  {
    pathPrefix: "/admin/settings",
    label: "System settings",
    allowedRoles: ADMIN_ROLES,
  },
]

export const getAccessRuleForPath = (pathname?: string | null): RouteAccessRule | undefined => {
  if (!pathname) return undefined
  return adminRouteAccessRules
    .filter((rule) => pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`))
    .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)[0]
}
