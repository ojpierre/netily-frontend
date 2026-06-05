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

export const canAccess = (user: RbacUser | null | undefined, rule?: AccessRule): boolean => {
  if (!rule || (!rule.allowedRoles?.length && !rule.allowedDepartments?.length)) return true
  if (!user) return false
  if (user.is_superuser) return true

  const role = normalize(user.access_level || user.role)
  const department = normalize(user.department)
  const roleAllowed = !!rule.allowedRoles?.map(normalize).includes(role)
  const departmentAllowed = !!rule.allowedDepartments?.map(normalize).includes(department)

  return roleAllowed || departmentAllowed
}

export const adminRouteAccessRules: RouteAccessRule[] = [
  { pathPrefix: "/admin/staff", label: "Staff management", allowedRoles: ["admin", "super_admin"] },
  { pathPrefix: "/admin/plans", label: "Plan management", allowedRoles: ["admin", "super_admin"] },
  {
    pathPrefix: "/admin/olt",
    label: "Network architecture",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/onu",
    label: "Network architecture",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/routers",
    label: "Router management",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/networks",
    label: "IP network management",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/radius",
    label: "RADIUS management",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/fup",
    label: "Fair usage policy",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/usage",
    label: "Network usage analytics",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
  },
  {
    pathPrefix: "/admin/invoices",
    label: "Invoices",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/payments",
    label: "Payments",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/receipts",
    label: "Receipts",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/vouchers",
    label: "Vouchers",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/payment-methods",
    label: "Payment methods",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/analytics",
    label: "Financial reports",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/settings/billing",
    label: "Subscription billing",
    allowedRoles: ["admin", "super_admin"],
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
  },
  {
    pathPrefix: "/admin/settings",
    label: "System settings",
    allowedRoles: ["admin", "super_admin"],
  },
]

export const getAccessRuleForPath = (pathname?: string | null): RouteAccessRule | undefined => {
  if (!pathname) return undefined
  return adminRouteAccessRules
    .filter((rule) => pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`))
    .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)[0]
}
