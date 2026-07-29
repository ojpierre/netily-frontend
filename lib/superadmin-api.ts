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
  subscription_status: string | null
  subscription_status_code?: string | null
  subscription_status_display?: string | null
  tenant_status_display?: string | null
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

export interface TenantSupportEmailUser {
  id: number
  email: string
  name: string
  is_superuser: boolean
  is_active: boolean
}

export interface TenantSupportEmailInfo {
  tenant_id: string
  tenant_subdomain: string
  company_email: string
  admin_users: TenantSupportEmailUser[]
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

export interface TenantDeletionJob {
  id: string
  tenant_id: string | null
  company_name: string
  subdomain: string
  schema_name: string
  status: "queued" | "running" | "completed" | "failed"
  current_step:
    | "queued"
    | "revoking_access"
    | "cleaning_storage"
    | "cleaning_integrations"
    | "dropping_schema"
    | "deleting_records"
    | "completed"
    | "failed"
  progress_percent: number
  status_message: string
  error_message: string
  requested_options: Record<string, unknown>
  cleanup_summary: Record<string, unknown>
  step_history: Array<{
    step: string
    status: string
    message: string
    timestamp: string
  }>
  created_at: string | null
  updated_at: string | null
  started_at: string | null
  finished_at: string | null
}

export interface RoleAccessNormalizeResult {
  mode: "normalize_legacy" | "reset_defaults" | string
  dry_run: boolean
  summary: {
    tenants_total: number
    tenants_processed: number
    created: number
    updated: number
    unchanged: number
    custom_preserved: number
    deduplicated: number
    errors: number
  }
  results?: Array<{
    tenant_id?: string
    schema_name: string
    company_name?: string
    created?: number
    updated?: number
    unchanged?: number
    custom_preserved?: number
    deduplicated?: number
    error?: string
  }>
  truncated?: boolean
}

export interface SubscriptionInvoiceSummary {
  count: number
  active: number
  invoiced: number
  paid: number
  partial?: number
  past_due?: number
  outstanding_total?: string
  calculated_total: string
  hotspot_revenue: string
  duplicates_hidden?: number
}

export interface SubscriptionInvoiceReminderSettings {
  enabled: boolean
  days_before: number[]
  channels: Array<"email" | "sms" | "in_app">
}

export interface SubscriptionInvoice {
  id: string
  tenant_id: string
  tenant_name: string
  tenant_subdomain: string
  tenant_schema: string
  company_email?: string
  company_phone?: string
  status: "active" | "invoiced" | "paid"
  subscription_status?: string
  plan_name?: string
  billing_period?: string
  start_date: string | null
  end_date: string | null
  grace_ends_at: string | null
  invoice_reference: string | null
  pppoe_count: number
  pppoe_unit_price: string
  pppoe_charge: string
  hotspot_revenue: string
  hotspot_share_pct: string
  hotspot_share: string
  usage_subtotal: string
  monthly_minimum: string
  minimum_adjustment: string
  calculated_total: string
  effective_total?: string
  invoice: {
    id: number
    invoice_number: string
    status: string
    subtotal: string
    discount_amount: string
    manual_adjustment_amount?: string
    manual_adjustment_description?: string
    total_amount: string
    amount_paid?: string
    balance: string
    billing_date?: string | null
    due_date: string | null
    paid_at?: string | null
    created_at?: string | null
    updated_at?: string | null
    is_overdue?: boolean
    overdue_days?: number
    notes: string
    internal_notes: string
  } | null
  recipients?: Array<{
    id: number
    email?: string
    phone_number?: string
    first_name?: string
    last_name?: string
  }>
}

export interface SubscriptionInvoiceListResponse {
  count: number
  page: number
  page_size: number
  summary: SubscriptionInvoiceSummary
  results: SubscriptionInvoice[]
}

export interface TenantHardDeleteResult {
  detail: string
  purge_summary: {
    tenant_pk: string
    schema_name: string
    subdomain: string
    company_name: string
    rows_deleted: Record<string, number | boolean>
    integrations_cleaned: Record<string, number>
    schema_dropped: boolean
    schema_drop_error: string
    warnings: string[]
  }
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

export interface SupportExecutive {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  user_is_active: boolean
  title: string
  phone_number: string
  can_register_tenants: boolean
  can_manage_leads: boolean
  can_view_tenants: boolean
  is_active: boolean
  last_seen_at: string | null
  created_by_email: string | null
  created_at: string
  updated_at: string
}

export interface SupportActivityLog {
  id: number
  support_user: number | null
  support_email: string | null
  support_name: string
  action: string
  area: string
  summary: string
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string
  created_at: string
}

export interface SupportActivityResponse {
  summary: Array<{ support_user__email: string | null; actions: number }>
  results: SupportActivityLog[]
}

export interface SuperadminCredential {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  role: string
  date_joined: string
  last_login: string | null
}

export interface SuperadminCredentialResponse {
  active_count: number
  results: SuperadminCredential[]
}

export interface SuperadminActivityLog {
  id: number
  actor: number | null
  actor_email: string | null
  actor_name: string
  target_user: number | null
  target_email: string | null
  target_name: string
  action: string
  summary: string
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string
  created_at: string
}

export interface SuperadminActivityResponse {
  summary: Array<{ actor__email: string | null; actions: number }>
  results: SuperadminActivityLog[]
}

export interface SubscriptionPayment {
  id: string
  source?: string
  company_name: string
  plan_name: string
  customer_name?: string
  amount: string
  currency: string
  status: string
  payment_method: string
  service_type?: "subscription" | "hotspot" | "pppoe" | "other" | string
  reference: string
  created_at: string
  completed_at?: string
  period_start?: string
  period_end?: string
  invoice_number?: string
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
  notification_channels?: string[];
  notification_sent_at?: string | null;
  notification_summary?: {
    channels?: string[];
    tenants_total?: number;
    tenants_processed?: number;
    users_targeted?: number;
    notifications_created?: number;
    notifications_sent?: number;
    notifications_failed?: number;
    errors?: Array<{ tenant: string; error: string }>;
  };
  notification_request?: {
    channels: string[];
    queued: boolean;
  };
  created_at: string;
}

export interface ChangelogCreatePayload {
  title: string;
  version: string;
  update_type: 'feature' | 'improvement' | 'bugfix' | 'maintenance';
  content: string;
  is_published: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
  notify_in_app?: boolean;
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

// Lead Types
export interface LeadItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  lead_source: string;
  referral_name: string;
  affiliate_referral: AffiliateLeadAttribution | null;
  message: string;
  is_contacted: boolean;
  contacted_at: string | null;
  created_at: string;
}

export interface AffiliateLeadAttribution {
  referral_id: number;
  referral_status: 'pending' | 'approved' | 'paid' | 'rejected' | 'churned';
  affiliate_id: number;
  affiliate_name: string;
  affiliate_email: string;
  referral_code: string;
}

export interface LeadStats {
  total: number;
  this_month: number;
  last_30_days: number;
  last_7_days: number;
  contacted: number;
  not_contacted: number;
  affiliate_referrals: number;
  source_breakdown: { lead_source: string; count: number }[];
  trend: { month: string; count: number }[];
}

// Tenant User Ledger (Immutable Audit Trail)
export interface LedgerEntry {
  id: number;
  tenant: string;
  tenant_name: string;
  tenant_subdomain: string;
  event: string;
  user_type: string;
  customer_code: string;
  customer_name: string;
  username: string;
  phone_number: string;
  plan_name: string;
  pppoe_count_after: number;
  hotspot_count_after: number;
  active_cycle_id?: string | null;
  cycle_hotspot_revenue?: string | number;
  cycle_hotspot_share_pct?: string | number;
  cycle_hotspot_share_amount?: string | number;
  created_at: string;
}

export interface LedgerHotspotTenantSummary {
  tenant_id: string;
  tenant_name: string;
  tenant_schema: string;
  billing_cycle_id: string;
  hotspot_revenue: string | number;
  hotspot_share_pct: string | number;
  hotspot_share_amount: string | number;
}

export interface LedgerSummary {
  active_cycle_count: number;
  hotspot_revenue_total: string | number;
  hotspot_share_total: string | number;
  hotspot_tenants: LedgerHotspotTenantSummary[];
}

export interface LedgerResponse extends PaginatedResponse<LedgerEntry> {
  summary?: LedgerSummary;
}

// ── SMS Types ──────────────────────────────────────

export interface SMSTenantRow {
  tenant_id: string
  tenant_name: string
  tenant_subdomain: string
  sms_units: string
  sell_price_per_unit: string
  recent_topups: SMSTopupRecord[]
}

export interface SMSTopupRecord {
  id: number
  units_purchased: number
  amount_paid: string
  status: "pending" | "completed" | "failed"
  payment_method: string
  payment_reference?: string
  checkout_request_id?: string
  created_at: string
  tenant_name?: string
  tenant_subdomain?: string
}

export interface SMSOverview {
  total_inbuilt_units: string
  inbuilt_tenant_count: number
  provider_balance: {
    success: boolean
    balance: number
    currency?: string
    error?: string
    raw?: {
      remaining_balance?: string
      expired_on?: string
    }
  }
  tenants: SMSTenantRow[]
  all_topups: SMSTopupRecord[]
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
    this.logSuperadminActivity({
      action: "login",
      summary: "Signed in to superadmin console",
    }).catch(() => undefined)
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

  async normalizeTenantRoleAccess(data?: {
    tenant_id?: string
    schema_name?: string
    mode?: "normalize_legacy" | "reset_defaults"
    dry_run?: boolean
  }): Promise<RoleAccessNormalizeResult> {
    return this.request("/superadmin/tenants/role-access/normalize/", {
      method: "POST",
      body: JSON.stringify(data || {}),
    })
  }

  async requestTenantDeletion(id: string, confirmationName: string): Promise<TenantDeletionJob> {
    return this.request(`/superadmin/tenants/${id}/delete-request/`, {
      method: "POST",
      body: JSON.stringify({ confirmation_name: confirmationName }),
    })
  }

  async hardDeleteTenant(id: string, confirmationName: string): Promise<TenantHardDeleteResult> {
    return this.request(`/superadmin/tenants/${id}/hard-delete/`, {
      method: "DELETE",
      body: JSON.stringify({ confirmation_name: confirmationName }),
    })
  }

  async getTenantDeletionJob(jobId: string): Promise<TenantDeletionJob> {
    return this.request(`/superadmin/tenant-deletion-jobs/${jobId}/`)
  }

  async suspendTenant(id: string, reason?: string): Promise<Tenant & { detail?: string }> {
    return this.request(`/superadmin/tenants/${id}/suspend/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    })
  }

  async activateTenant(id: string, options?: { extendDays?: number; setExpiryDate?: string }): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${id}/activate/`, {
      method: "POST",
      body: JSON.stringify({
        extend_days: options?.extendDays,
        set_expiry_date: options?.setExpiryDate,
      }),
    })
  }

  async updateCompany(tenantId: string, data: Partial<TenantCompany>): Promise<Tenant> {
    return this.request(`/superadmin/tenants/${tenantId}/company/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getTenantSupportEmailInfo(id: string): Promise<TenantSupportEmailInfo> {
    return this.request(`/superadmin/tenants/${id}/support-email/`)
  }

  async updateTenantSupportEmails(
    id: string,
    data: { company_email?: string; tenant_admin_email?: string; user_id?: number | string },
  ): Promise<Tenant & { detail?: string; support_email_info?: TenantSupportEmailInfo }> {
    return this.request(`/superadmin/tenants/${id}/support-email/`, {
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

  async getSubscriptionPayments(params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/subscription-payments/${qs}`)
  }

  async getSubscriptionInvoices(params?: Record<string, string>): Promise<SubscriptionInvoiceListResponse> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/subscription-invoices/${qs}`)
  }

  async getSubscriptionInvoice(id: string): Promise<SubscriptionInvoice> {
    return this.request(`/superadmin/subscription-invoices/${id}/`)
  }

  async updateSubscriptionInvoiceDiscount(
    id: string,
    data: {
      discount_amount: string | number
      discount_reason?: string
      manual_adjustment_amount?: string | number
      manual_adjustment_description?: string
    },
  ): Promise<SubscriptionInvoice> {
    return this.request(`/superadmin/subscription-invoices/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async holdSubscriptionInvoice(
    id: string,
    data: { amount_paid: string | number; reason?: string },
  ): Promise<SubscriptionInvoice> {
    return this.request(`/superadmin/subscription-invoices/${id}/hold/`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async reconcileSubscriptionInvoice(
    id: string,
    data: {
      invoice_status?: string
      cycle_status?: string
      subscription_status?: string
      amount_paid?: string | number
      balance?: string | number
      billing_date?: string
      due_date?: string
      start_date?: string
      end_date?: string
      sync_tenant_access?: boolean
      reason: string
    },
  ): Promise<SubscriptionInvoice> {
    return this.request(`/superadmin/subscription-invoices/${id}/reconcile/`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteSubscriptionInvoice(id: string, reason?: string): Promise<void> {
    return this.request(`/superadmin/subscription-invoices/${id}/`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    })
  }

  async sendSubscriptionInvoice(
    id: string,
    channel: "email" | "sms" | "in_app" | "all",
  ): Promise<{ detail: string; email_count: number; notification_count: number; sms_count: number; invoice: SubscriptionInvoice }> {
    return this.request(`/superadmin/subscription-invoices/${id}/send/`, {
      method: "POST",
      body: JSON.stringify({ channel }),
    })
  }

  // ── SMS Overview ──

  async getSubscriptionInvoiceReminderSettings(): Promise<SubscriptionInvoiceReminderSettings> {
    return this.request("/superadmin/subscription-invoices/reminder-settings/")
  }

  async updateSubscriptionInvoiceReminderSettings(
    data: SubscriptionInvoiceReminderSettings,
  ): Promise<SubscriptionInvoiceReminderSettings> {
    return this.request("/superadmin/subscription-invoices/reminder-settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getSMSOverview(): Promise<SMSOverview> {
    return this.request("/superadmin/sms/overview/")
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

  async createChangelog(data: ChangelogCreatePayload): Promise<PlatformChangelog> {
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

  // ── Leads ──

  async getLeads(params?: Record<string, string>): Promise<PaginatedResponse<LeadItem>> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/leads/${qs}`)
  }

  async getLeadStats(): Promise<LeadStats> {
    return this.request("/superadmin/leads/stats/")
  }

  async toggleLeadContacted(id: number, is_contacted: boolean): Promise<LeadItem> {
    return this.request(`/superadmin/leads/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_contacted }),
    })
  }

  // ── Tenant User Ledger ──

  async getUserLedger(params?: Record<string, string>): Promise<LedgerResponse> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/user-ledger/${qs}`)
  }

  // ─── Platform Support Executives ───

  async getSupportExecutives(): Promise<SupportExecutive[]> {
    return this.request("/superadmin/support-executives/")
  }

  async createSupportExecutive(data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone_number: string
    title?: string
    can_register_tenants?: boolean
    can_manage_leads?: boolean
    can_view_tenants?: boolean
    is_active?: boolean
  }): Promise<SupportExecutive> {
    return this.request("/superadmin/support-executives/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateSupportExecutive(id: number, data: Partial<SupportExecutive> & { password?: string }): Promise<SupportExecutive> {
    return this.request(`/superadmin/support-executives/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deactivateSupportExecutive(id: number): Promise<void> {
    await this.request(`/superadmin/support-executives/${id}/`, { method: "DELETE" })
  }

  async getSupportActivity(params?: Record<string, string>): Promise<SupportActivityResponse> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/support-activity/${qs}`)
  }

  // ───  Supes Credential Management ───

  async getSuperadminCredentials(): Promise<SuperadminCredentialResponse> {
    return this.request("/superadmin/superadmins/")
  }

  async createSuperadminCredential(data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone_number: string
  }): Promise<SuperadminCredential> {
    return this.request("/superadmin/superadmins/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateSuperadminCredential(
    id: number,
    data: Partial<SuperadminCredential> & { password?: string },
  ): Promise<SuperadminCredential> {
    return this.request(`/superadmin/superadmins/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteSuperadminCredential(id: number): Promise<void> {
    await this.request(`/superadmin/superadmins/${id}/`, { method: "DELETE" })
  }

  async getSuperadminActivity(params?: Record<string, string>): Promise<SuperadminActivityResponse> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/superadmin/superadmin-activity/${qs}`)
  }

  async logSuperadminActivity(data: {
    action: string
    summary: string
    metadata?: Record<string, unknown>
  }): Promise<{ detail: string }> {
    return this.request("/superadmin/superadmin-activity/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

export const superadminApi = new SuperadminApiService()
