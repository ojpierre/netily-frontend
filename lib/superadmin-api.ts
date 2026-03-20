/**
 * Superadmin API Service
 * ──────────────────────
 * Handles all communication with /api/v1/superadmin/ endpoints.
 * Uses separate "superadminToken" key so it never collides with
 * regular admin sessions.
 */

// ── Types ──────────────────────────────────────────

export interface DashboardKPI {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  suspended_tenants: number
  total_users: number
  total_revenue: string
  mrr: string
  recent_signups: number
}

export interface TenantDomain {
  id: number
  domain: string
  is_primary: boolean
}

export interface TenantCompany {
  id: string
  name: string
  slug: string
  company_type: string
  email: string
  phone_number: string
  address: string
  city: string
  county: string
  registration_number: string | null
  tax_pin: string | null
  website: string | null
  logo: string | null
  subscription_plan: string
  subscription_expiry: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  total_customers: number
}

export interface Tenant {
  id: string
  subdomain: string
  schema_name: string
  status: "trial" | "active" | "suspended" | "cancelled"
  trial_start: string | null
  trial_days: number
  subscription_expiry: string | null
  max_users: number
  max_customers: number
  features: Record<string, unknown>
  billing_cycle: string
  monthly_rate: string
  next_billing_date: string | null
  company_name: string
  company_email: string
  company_phone: string
  company_type: string
  company_logo: string | null
  subscription_plan: string
  days_left: number | null
  domains: TenantDomain[]
  is_active: boolean
  created_at: string
  updated_at: string
  
  // NEW: Billing cycle metrics for metered usage display
  raw_active_pppoe_count?: number
  billed_pppoe_count?: number
  current_cycle_status?: 'active' | 'invoiced' | 'paid' | null
  current_cycle_end?: string | null
  
  // Detail-only
  company?: TenantCompany
}

export interface TenantUpdatePayload {
  status?: string
  max_users?: number
  max_customers?: number
  trial_days?: number
  subscription_expiry?: string
  billing_cycle?: string
  monthly_rate?: string
  next_billing_date?: string
  features?: Record<string, unknown>
  is_active?: boolean
  // company fields (handled by TenantUpdateSerializer)
  company_name?: string
  company_email?: string
  company_phone?: string
  company_address?: string
  company_city?: string
}

export interface TenantCreatePayload {
  company_name: string
  company_type: string
  company_email: string
  company_phone: string
  subdomain: string
  admin_email: string
  admin_password: string
  admin_phone: string
  admin_first_name?: string
  admin_last_name?: string
  status?: string
  max_users?: number
  max_customers?: number
  billing_cycle?: string
  monthly_rate?: string
  address?: string
  city?: string
  county?: string
}

export interface PlatformUser {
  id: number
  email: string
  full_name: string
  first_name: string
  last_name: string
  phone_number: string
  role: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  is_verified: boolean
  company_name: string | null
  tenant_subdomain: string | null
  date_joined: string
  last_login: string | null
}

export interface PlatformUserDetail extends PlatformUser {
  id_number: string | null
  gender: string | null
  date_of_birth: string | null
  profile_picture: string | null
}

export interface SubscriptionPayment {
  id: string
  company_name: string
  plan_name: string
  amount: string
  currency: string
  status: string
  payment_method: string
  reference: string
  created_at: string
}

export interface PaymentSummary {
  total_revenue: number
  this_month: number
  last_month: number
  currency: string
}

export interface ActivityItem {
  type: "login" | "tenant_created" | string
  timestamp: string | null
  actor: string
  detail: string
  target: string
  tenant: string
}

export interface TenantStats {
  tenant_id: string
  subdomain: string
  company_name: string
  customers: number
  routers: number
  invoices: number
  payments: number
  tickets: number
  staff: number
  pppoe_users: number
  hotspot_users: number
  pppoe_active: number
  hotspot_active: number
  ip_addresses: number
  subnets: number
  equipment_items: number
  plans: number
  bandwidth_profiles: number
  olt_devices: number
  support_tickets_open: number
  routers_online: number
  routers_offline: number
  tenant_revenue: number
  customers_active: number
  customers_suspended: number
  customers_pending: number
  equipment_in_stock: number
  equipment_in_use: number
  equipment_faulty: number
  // ADD THIS:
  metered_usage?: {
    is_metered: boolean
    pppoe_clients: number
    hotspot_revenue: number
    estimated_total: number
    cycle_end: string | null
  }
}

export interface PaginatedResponse<T> {
  count: number
  page: number
  page_size: number
  results: T[]
}

// Plans
export interface NetilyPlan {
  id: string
  name: string
  code: string
  description: string
  price_monthly: string
  price_yearly: string
  max_subscribers: number
  max_routers: number
  max_staff: number
  features: Record<string, unknown>
  is_active: boolean
  sort_order: number
  subscriber_count?: number
  // NEW METERED FIELDS
  is_metered?: boolean
  base_license_fee?: string
  pppoe_unit_price?: string
  pppoe_min_clients?: number
  hotspot_revenue_share_pct?: string
}

// Analytics
export interface RevenueTrendItem {
  month: string
  revenue: number
  count: number
}

export interface TenantGrowthItem {
  month: string
  new_tenants: number
  cumulative: number
}

export interface ChurnMetrics {
  total: number
  active: number
  trial: number
  suspended: number
  cancelled: number
  churn_rate: number
  total_trials: number
  converted: number
  conversion_rate: number
}

export interface PlanDistribution {
  plan_name: string
  plan_code: string
  subscriber_count: number
  monthly_revenue: number
  price_monthly: number
}

export interface TopTenant {
  id: string
  subdomain: string
  company_name: string
  value: number
  metric: string
  status: string
}

// Audit log
export interface AuditLogEntry {
  id: string
  timestamp: string
  actor_email: string
  action: string
  model_name: string
  object_repr: string
  ip_address: string | null
  changes: Record<string, unknown> | null
}

// Per-tenant data types
export interface TenantRouter {
  id: string
  name: string
  ip_address: string
  router_type: string
  config_type: string
  status: string
  total_users: number
  active_users: number
  uptime: string | null
  last_seen: string | null
  location: string
  enable_hotspot: boolean
  enable_pppoe: boolean
  routeros_version: string
  model: string
}

export interface PPPoEUser {
  id: string
  username: string
  caller_id: string
  local_address: string
  remote_address: string
  bytes_in: number
  bytes_out: number
  status: string
  profile: string
  connected_since: string | null
  last_seen: string | null
  router_name: string
}

export interface HotspotUser {
  id: string
  username: string
  mac_address: string
  ip_address: string
  bytes_in: number
  bytes_out: number
  status: string
  profile: string
  connected_since: string | null
  last_seen: string | null
  router_name: string
}

export interface InventoryItem {
  id: string
  name: string
  model: string
  serial_number: string
  asset_tag: string
  status: string
  condition: string
  location: string
  mac_address: string | null
  ip_address: string | null
  purchase_price: number | null
  warranty_expiry: string | null
  type_name: string
}

export interface ImpersonateResult {
  access: string
  refresh: string
  user: { id: number; email: string; first_name: string; last_name: string; role: string }
  tenant: { subdomain: string; company_name: string }
  panel_url: string
}

// Platform Changelog Types
export interface PlatformChangelog {
  id: number;
  title: string;
  version: string | null;
  content: string;
  update_type: 'feature' | 'improvement' | 'bugfix' | 'maintenance';
  is_published: boolean;
  release_date: string;
  created_at: string;
}

// Feature Request Types
export interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  category: 'network' | 'billing' | 'hotspot' | 'ui_ux' | 'automation' | 'other';
  status: 'pending' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  requested_by_name: string;
  admin_comment: string | null;
  upvotes_count: number;
  has_upvoted: boolean;
  created_at: string;
}

// ── API class ──────────────────────────────────────

const TOKEN_KEY = "superadminToken"
const REFRESH_KEY = "superadminRefreshToken"

class SuperadminApiService {
  private getBaseUrl(): string {
    // SSR fallback
    if (typeof window === "undefined") return "http://localhost:8000/api/v1"

    // Production: use NEXT_PUBLIC_API_URL env var (e.g. https://api.netily.co.ke/api/v1)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
    }

    // Development: same-host with port 8000
    const proto = window.location.protocol
    const hostname = window.location.hostname
    const port = process.env.NEXT_PUBLIC_API_PORT || "8000"
    return `${proto}//${hostname}:${port}/api/v1`
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`
    const token = this.getToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    }
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(url, { ...options, headers })

    if (!res.ok) {
      if (res.status === 401) {
        const refreshed = await this.tryRefresh()
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.getToken()}`
          const retry = await fetch(url, { ...options, headers })
          if (retry.ok) return retry.json()
        }
        throw new Error("Session expired. Please login again.")
      }
      const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }))

      // Extract meaningful error message from DRF response formats
      let errorMessage = 'Request failed'
      if (Array.isArray(err)) {
        // Format A: top-level array ["Cannot delete ..."]
        errorMessage = err.join(', ')
      } else if (err.detail) {
        errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
      } else if (err.non_field_errors) {
        errorMessage = Array.isArray(err.non_field_errors) ? err.non_field_errors.join(', ') : err.non_field_errors
      } else if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Format B: field-keyed object {"field": ["message"]}
        const messages: string[] = []
        for (const key of Object.keys(err)) {
          const val = err[key]
          if (Array.isArray(val)) messages.push(...val)
          else if (typeof val === 'string') messages.push(val)
        }
        if (messages.length > 0) errorMessage = messages.join(', ')
        else errorMessage = JSON.stringify(err)
      }
      throw new Error(errorMessage)
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as unknown as T
    return res.json()
  }

  private async tryRefresh(): Promise<boolean> {
    const refresh =
      localStorage.getItem(REFRESH_KEY) ||
      sessionStorage.getItem(REFRESH_KEY)
    if (!refresh) return false
    try {
      const res = await fetch(`${this.getBaseUrl()}/core/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) return false
      const data = await res.json()
      const storage = localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, data.access)
      document.cookie = `superadminToken=${data.access}; path=/; max-age=3600; SameSite=Lax`
      return true
    } catch {
      return false
    }
  }

  // ── Auth helpers (usable by login page) ──

  async login(email: string, password: string): Promise<{ user: PlatformUser }> {
    const res = await fetch(`${this.getBaseUrl()}/core/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }))
      throw new Error(err.detail || "Login failed")
    }
    const data = await res.json()
    if (!data.user?.is_superuser) {
      throw new Error("Access denied. Superadmin privileges required.")
    }
    localStorage.setItem(TOKEN_KEY, data.access)
    localStorage.setItem(REFRESH_KEY, data.refresh)
    document.cookie = `superadminToken=${data.access}; path=/; max-age=3600; SameSite=Lax`
    return data
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    document.cookie = "superadminToken=; path=/; max-age=0"
  }

  // ── Dashboard ──

  async getDashboard(): Promise<DashboardKPI> {
    return this.request("/superadmin/dashboard/")
  }

  // ── Tenants ──

  async getTenants(params?: Record<string, string>): Promise<Tenant[]> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/tenants/${qs}`)
  }

  async createTenant(data: TenantCreatePayload): Promise<Tenant> {
    return this.request("/superadmin/tenants/create/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${id}/`)
  }

  async updateTenant(id: string, data: TenantUpdatePayload): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteTenant(id: string): Promise<void> {
    await this.request(`/superadmin/tenants/${id}/`, { method: "DELETE" })
  }

  async suspendTenant(id: string, reason?: string): Promise<{ detail: string }> {
    return this.request(`/superadmin/tenants/${id}/suspend/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    })
  }

  async activateTenant(id: string, extendDays?: number): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${id}/activate/`, {
      method: "POST",
      body: JSON.stringify({ extend_days: extendDays }),
    })
  }

  async updateCompany(tenantId: string, data: Partial<TenantCompany>): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${tenantId}/company/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getTenantStats(id: string): Promise<TenantStats> {
    return this.request(`/superadmin/tenants/${id}/stats/`)
  }

  async getTenantAuditLog(id: string, params?: Record<string, string>): Promise<PaginatedResponse<AuditLogEntry>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/tenants/${id}/audit-log/${qs}`)
  }

  async getTenantRouters(id: string): Promise<TenantRouter[]> {
    return this.request(`/superadmin/tenants/${id}/routers/`)
  }

  async getTenantPPPoEUsers(id: string, params?: Record<string, string>): Promise<PaginatedResponse<PPPoEUser>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/tenants/${id}/pppoe-users/${qs}`)
  }

  async getTenantHotspotUsers(id: string, params?: Record<string, string>): Promise<PaginatedResponse<HotspotUser>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/tenants/${id}/hotspot-users/${qs}`)
  }

  async getTenantInventory(id: string, params?: Record<string, string>): Promise<PaginatedResponse<InventoryItem>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/tenants/${id}/inventory/${qs}`)
  }

  async impersonateTenant(id: string): Promise<ImpersonateResult> {
    return this.request(`/superadmin/tenants/${id}/impersonate/`, { method: "POST" })
  }

  // ── Plans ──

  async getPlans(): Promise<NetilyPlan[]> {
    return this.request("/superadmin/plans/")
  }

  async createPlan(data: Partial<NetilyPlan>): Promise<NetilyPlan> {
    return this.request("/superadmin/plans/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updatePlan(id: string, data: Partial<NetilyPlan>): Promise<NetilyPlan> {
    return this.request(`/superadmin/plans/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deletePlan(id: string): Promise<void> {
    await this.request(`/superadmin/plans/${id}/`, { method: "DELETE" })
  }

  // ── Users ──

  async getUsers(params?: Record<string, string>): Promise<PaginatedResponse<PlatformUser>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/users/${qs}`)
  }

  async getUser(id: number): Promise<PlatformUserDetail> {
    return this.request(`/superadmin/users/${id}/`)
  }

  async updateUser(id: number, data: Partial<PlatformUser>): Promise<PlatformUserDetail> {
    return this.request(`/superadmin/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deactivateUser(id: number): Promise<{ detail: string }> {
    return this.request(`/superadmin/users/${id}/deactivate/`, { method: "POST" })
  }

  async activateUser(id: number): Promise<{ detail: string }> {
    return this.request(`/superadmin/users/${id}/activate/`, { method: "POST" })
  }

  // ── Payments ──

  async getPayments(params?: Record<string, string>): Promise<PaginatedResponse<SubscriptionPayment>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/payments/${qs}`)
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    return this.request("/superadmin/payments/summary/")
  }

  // ── Analytics ──

  async getRevenueTrend(months?: number): Promise<RevenueTrendItem[]> {
    const qs = months ? `?months=${months}` : ""
    return this.request(`/superadmin/analytics/revenue-trend/${qs}`)
  }

  async getTenantGrowth(months?: number): Promise<TenantGrowthItem[]> {
    const qs = months ? `?months=${months}` : ""
    return this.request(`/superadmin/analytics/tenant-growth/${qs}`)
  }

  async getChurnMetrics(): Promise<ChurnMetrics> {
    return this.request("/superadmin/analytics/churn/")
  }

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    return this.request("/superadmin/analytics/plan-distribution/")
  }

  async getTopTenants(metric?: string, limit?: number): Promise<TopTenant[]> {
    const p = new URLSearchParams()
    if (metric) p.set("metric", metric)
    if (limit) p.set("limit", limit.toString())
    const qs = p.toString() ? `?${p.toString()}` : ""
    return this.request(`/superadmin/analytics/top-tenants/${qs}`)
  }

  // ── Audit Log ──

  async getAuditLog(params?: Record<string, string>): Promise<PaginatedResponse<AuditLogEntry>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/audit-log/${qs}`)
  }

  // ── Activity ──

  async getActivity(limit = 30): Promise<ActivityItem[]> {
    return this.request(`/superadmin/activity/?limit=${limit}`)
  }

  // ── Settings ──

  async getSettings(): Promise<Record<string, unknown>> {
    return this.request("/superadmin/settings/")
  }

  async updateSettings(data: Record<string, unknown>): Promise<{ detail: string }> {
    return this.request("/superadmin/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  // ── Changelogs ──

  async getChangelogs(): Promise<PlatformChangelog[]> {
    const response = await this.request<PlatformChangelog[]>('/superadmin/changelogs/');
    return response;
  }

  async createChangelog(data: Partial<PlatformChangelog>): Promise<PlatformChangelog> {
    const response = await this.request<PlatformChangelog>('/superadmin/changelogs/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async updateChangelog(id: number, data: Partial<PlatformChangelog>): Promise<PlatformChangelog> {
    const response = await this.request<PlatformChangelog>(`/superadmin/changelogs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  }

  async deleteChangelog(id: number): Promise<void> {
    await this.request(`/superadmin/changelogs/${id}/`, { method: 'DELETE' });
  }

  /**
   * Get all feature requests for superadmin management
   */
  async getFeatureRequests(): Promise<FeatureRequest[]> {
    return this.request<FeatureRequest[]>('/superadmin/feature-requests/')
  }

  // ── Feature Requests Management ──

  /**
   * Update a feature request's status or admin comment
   * This is the superadmin command center for managing community feature requests
   */
  async updateFeatureStatus(id: number, data: {status?: string, admin_comment?: string}): Promise<FeatureRequest> {
    const response = await this.request<FeatureRequest>(`/superadmin/feature-requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  }

  // ── Export ──

  async exportTenants(): Promise<void> {
    const url = `${this.getBaseUrl()}/superadmin/export/tenants/`
    const token = this.getToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "tenants_export.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async exportUsers(): Promise<void> {
    const url = `${this.getBaseUrl()}/superadmin/export/users/`
    const token = this.getToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "users_export.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async exportPayments(): Promise<void> {
    const url = `${this.getBaseUrl()}/superadmin/export/payments/`
    const token = this.getToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "payments_export.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }
}

export const superadminApi = new SuperadminApiService()