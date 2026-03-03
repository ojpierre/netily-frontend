/**
 * Admin API Service for ISP Management System
 * Aligned with Django Backend Swagger API
 * Supports multi-tenant subdomains
 */

import type {
  LoginResponse,
  User,
  Customer,
  CustomerService,
  PaginatedResponse,
  DashboardStats,
  AuditLog,
  OLT,
  PONPort,
  ONU,
  Subnet,
  IPAddress,
  DHCPLease,
  CPEDevice,
  CPETask,
  Invoice,
  InvoiceItem,
  Payment,
  MpesaTransaction,
  Technician,
  DispatchJob,
  EquipmentItem,
  EquipmentType,
  EquipmentCondition,
  EquipmentAssignment,
  Supplier,
  StockAlert,
  Alert,
  AlertRule,
  Plan,
  PlanDashboardStats,
  BillingCycle,
  BillingCycleSummary,
  PaymentMethod,
  Receipt,
  VoucherBatch,
  Voucher,
  VoucherUsage,
  VoucherBatchStats,
  InvoiceDashboardStats,
  PaymentDashboardStats,
  CustomerOutstanding,
  Router,
  RouterMetrics,
  RouterEvent,
  RouterDashboardStats,
  RouterVPNStatus,
  // Router Live Management types
  RouterLiveStatus,
  RouterSystemHealth,
  HotspotUser,
  ActiveHotspotUser,
  HotspotUserStats,
  CreateHotspotUserRequest,
  PPPoEUser,
  ActivePPPoESession,
  PPPoEUserStats,
  CreatePPPoEUserRequest,
  FirewallRule,
  CreateFirewallRuleRequest,
  SimpleQueue,
  CreateQueueRequest,
  RouterInterface,
  InterfaceTraffic,
  DHCPLease,
  RouterLogEntry,
  WirelessInterface,
  WirelessRegistration,
  RouterActionResponse,
  PingResult,
  // Analytics types
  AnalyticsDashboard,
  AnalyticsKPIs,
  RevenueData,
  UserGrowthData,
  PlanPerformance,
  LocationAnalytics,
  RouterAnalytics,
  PaymentMethodAnalytics,
  PaymentStats,
  UserTypeDistribution,
  RevenueByType,
  RevenueForecast,
  RevenueTargetProgress,
  NetworkStats,
  // Support Ticket types
  SupportTicket,
  SupportTicketMessage,
  SupportTicketStats,
  CreateTicketRequest,
  TicketReplyRequest,
  // SMS types
  SMSMessage,
  SMSTemplate,
  SMSCampaign,
  SMSStats,
  SendSMSRequest,
  SendBulkSMSRequest,
  SMSBalance,
  // Staff types
  CreateStaffUserRequest,
  CreateStaffUserResponse,
  StaffRole,
  // Subscription & Payout types
  NetilyPlan,
  CompanySubscription,
  SubscriptionPayment,
  ISPPayoutConfig,
  ISPSettlement,
  UsageStats,
  SettlementSummary,
  // Hotspot types
  HotspotPlan,
  HotspotSession,
  HotspotBranding,
  // VPN types
  VPNServer,
  VPNCertificate,
  VPNConnection,
  VPNDashboardStats,
  CreateVPNCertificateRequest,
  VPNCertificateWithConfig,
  // IP Pool types
  IPPool,
  IPPoolsByRouter,
  IPPoolStatistics,
  IPPoolType,
  AvailableIPsResponse,
  SubnetPrefixOptionsResponse,
  // RADIUS types
  RADIUSUser,
  RADIUSProfile,
  RADIUSNAS,
  RADIUSAccountingSession,
  RADIUSDashboardStats,
  CreateRADIUSUserRequest,
  UpdateRADIUSUserRequest,
  CreateRADIUSProfileRequest,
  CreateRADIUSNASRequest,
  // NEW: RADIUS Multi-Tenant types
  RADIUSTenantConfig,
  CustomerRADIUSCredentials,
  // Online session type
  OnlineSession,
} from './types'

import { getApiBaseUrl } from './subdomain'

// Re-export for backward compatibility
export type { Customer }

export interface AdminLoginResponse extends LoginResponse {
  user: User
}

export interface AdminUser extends User {}

export interface AdminStats extends DashboardStats {}

// ==========================================
// CONFIGURATION
// ==========================================

// Get environment variable (inlined at build time for client)
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL
const ENV_API_PORT = process.env.NEXT_PUBLIC_API_PORT || '8000'

// Smart API URL detection
const getBaseUrl = (): string => {
  // During SSR, use environment variable or default
  if (typeof window === 'undefined') {
    return ENV_API_URL || 'http://127.0.0.1:8000/api/v1'
  }
  
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  
  console.log('[AdminAPI] Detecting URL for hostname:', hostname)
  
  // Case 1: Local development with subdomains (e.g., yellow2.localhost)
  // Use same hostname with different port for API
  if (hostname.endsWith('.localhost') || hostname === 'localhost') {
    const url = `${protocol}//${hostname}:${ENV_API_PORT}/api/v1`
    console.log('[AdminAPI] Local subdomain mode:', url)
    return url
  }
  
  // Case 2: IP-based local development (127.0.0.1, 192.168.x.x)
  if (hostname.startsWith('127.') || hostname.startsWith('192.168.')) {
    const url = `${protocol}//${hostname}:${ENV_API_PORT}/api/v1`
    console.log('[AdminAPI] IP-based local mode:', url)
    return url
  }
  
  // Case 3: ngrok/pinggy/tunnels - MUST use ENV_API_URL
  // These are public URLs that can't reach localhost
  if (hostname.includes('ngrok') || hostname.includes('pinggy') || 
      hostname.includes('loca.lt') || hostname.includes('localhost.run')) {
    if (ENV_API_URL && ENV_API_URL.trim() !== '') {
      console.log('[AdminAPI] Tunnel mode, using ENV_API_URL:', ENV_API_URL)
      return ENV_API_URL
    }
    console.warn('[AdminAPI] WARNING: Using tunnel but NEXT_PUBLIC_API_URL not set!')
    // Fallback to dynamic detection (may not work)
    return getApiBaseUrl()
  }
  
  // Case 4: Production domains (e.g. pink4.netily.co.ke, netily.co.ke)
  // For tenant subdomains, use same-origin /api/v1 so:
  //   - No CORS needed (request stays on pink4.netily.co.ke)
  //   - nginx routes /api/ to Django, which reads the Host header for tenant detection
  // Only use ENV_API_URL for the bare domain (netily.co.ke / www.netily.co.ke)
  const KNOWN_DOMAINS = ['netily.co.ke']
  const isKnownDomain = KNOWN_DOMAINS.some(d => hostname === d || hostname === `www.${d}`)
  const isTenantSubdomain = KNOWN_DOMAINS.some(d => hostname.endsWith(`.${d}`) && hostname !== `www.${d}` && hostname !== `api.${d}`)

  if (isTenantSubdomain) {
    // Same-origin: pink4.netily.co.ke/api/v1/... → nginx → Django
    const url = `${protocol}//${hostname}/api/v1`
    console.log('[AdminAPI] Tenant subdomain (same-origin):', url)
    return url
  }

  if (ENV_API_URL && ENV_API_URL.trim() !== '') {
    console.log('[AdminAPI] Production mode, using ENV_API_URL:', ENV_API_URL)
    return ENV_API_URL
  }
  
  // Fallback: Use subdomain detection from subdomain.ts
  const dynamicUrl = getApiBaseUrl()
  console.log('[AdminAPI] Fallback to dynamic URL:', dynamicUrl)
  return dynamicUrl
}

// ==========================================
// ADMIN API SERVICE CLASS
// ==========================================

class AdminApiService {
  private get baseUrl(): string {
    return getBaseUrl()
  }

  // ------------------------------------------
  // UTILITY METHODS
  // ------------------------------------------

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    const token = this.getAdminToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  private getAdminToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    }
    return null
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminRefreshToken') || sessionStorage.getItem('adminRefreshToken')
    }
    return null
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        const refreshed = await this.tryRefreshToken()
        if (refreshed) {
          // Token was refreshed, but caller needs to retry the request
          throw new Error('TOKEN_REFRESHED')
        }
        throw new Error('Session expired. Please login again.')
      }
      
      // Parse error response - preserve field-specific errors for 400 responses
      const error = await response.json().catch(() => ({ 
        detail: `Server error: ${response.status}` 
      }))
      
      // For 400 Bad Request, extract the specific backend message
      if (response.status === 400) {
        console.error('API 400 Error:', error)
        let errorMessage = 'Invalid request'

        // Format A: DRF ValidationError as top-level array – ["Cannot delete Plan ..."]
        if (Array.isArray(error)) {
          errorMessage = error.join(', ')
        }
        // Standard DRF "detail" key
        else if (error.detail) {
          if (Array.isArray(error.detail)) {
            errorMessage = error.detail.join(', ')
          } else if (typeof error.detail === 'string') {
            errorMessage = error.detail
          } else if (typeof error.detail === 'object') {
            errorMessage = JSON.stringify(error.detail)
          }
        }
        // "non_field_errors" key
        else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) 
            ? error.non_field_errors.join(', ') 
            : error.non_field_errors
        }
        // Format B: field-keyed object – {"ip_address": ["The IP ... is already assigned"]}
        else if (typeof error === 'object' && error !== null) {
          const messages: string[] = []
          for (const key of Object.keys(error)) {
            const val = error[key]
            if (Array.isArray(val)) {
              messages.push(...val)
            } else if (typeof val === 'string') {
              messages.push(val)
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(', ')
          }
        }

        console.error('API 400 Error Message:', errorMessage)
        throw new Error(errorMessage)
      }
      
      throw new Error(error.detail || error.message || `Request failed with status ${response.status}`)
    }

    // Handle 204 No Content (e.g. successful DELETE)
    if (response.status === 204) return undefined as unknown as T
    return response.json()
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refresh = this.getRefreshToken()
    if (!refresh) return false
    
    try {
      const response = await fetch(`${this.baseUrl}/core/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      
      if (!response.ok) {
        // Token refresh failed - clear tokens and redirect to login
        this.clearTokensAndRedirect()
        return false
      }
      
      const data = await response.json()
      const storage = localStorage.getItem('adminRefreshToken') ? localStorage : sessionStorage
      storage.setItem('adminToken', data.access)
      document.cookie = `adminToken=${data.access}; path=/; max-age=3600; SameSite=Lax`
      
      return true
    } catch {
      // Network error or server error (500) - clear tokens and redirect
      this.clearTokensAndRedirect()
      return false
    }
  }

  private clearTokensAndRedirect(): void {
    if (typeof window !== 'undefined') {
      // Clear all auth tokens
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminRefreshToken')
      sessionStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminRefreshToken')
      
      // Clear cookies
      document.cookie = 'adminToken=; path=/; max-age=0'
      document.cookie = 'adminRefreshToken=; path=/; max-age=0'
      
      // Redirect to login page
      window.location.href = '/admin/login'
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    const response = await fetch(url, config)
    
    try {
      return await this.handleResponse<T>(response)
    } catch (error: any) {
      // If token was refreshed, retry the request once
      if (error.message === 'TOKEN_REFRESHED') {
        const retryResponse = await fetch(url, {
          ...config,
          headers: {
            ...this.getAuthHeaders(), // Get new token
            ...options.headers,
          },
        })
        return this.handleResponse<T>(retryResponse)
      }
      throw error
    }
  }

  // ------------------------------------------
  // AUTHENTICATION - /core/auth/
  // ------------------------------------------

  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const loginUrl = `${this.baseUrl}/core/auth/login/`
    console.log('AdminAPI login: Attempting to fetch:', loginUrl)
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    
    const data = await this.handleResponse<AdminLoginResponse>(response)
    
    // Debug: log the user data to see what fields are returned
    console.log('Login response user:', data.user)
    
    // Check for admin privileges - support multiple field formats
    // Backend may use role field or is_staff/is_superuser
    const user = data.user as any
    const allowedRoles = ['admin', 'staff', 'accountant', 'support', 'superadmin']
    const hasAdminRole = user?.role && allowedRoles.includes(user.role.toLowerCase())
    const isStaffOrSuper = user?.is_staff || user?.is_superuser
    
    if (!hasAdminRole && !isStaffOrSuper) {
      console.log('Access check failed:', { role: user?.role, is_staff: user?.is_staff, is_superuser: user?.is_superuser })
      throw new Error('Access denied. Admin privileges required.')
    }
    
    return data
  }

  async refreshToken(refresh: string): Promise<{ access: string }> {
    return this.request<{ access: string }>('/core/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    })
  }

  async logout(): Promise<void> {
    await this.request('/core/auth/logout/', {
      method: 'POST',
    })
  }

  async getCurrentAdmin(): Promise<AdminUser> {
    return this.request<AdminUser>('/core/users/me/')
  }

  // Alias for compatibility
  async getCurrentUser(): Promise<AdminUser> {
    return this.getCurrentAdmin()
  }

  async updateProfile(data: { first_name?: string; last_name?: string; email?: string; phone_number?: string }): Promise<AdminUser> {
    return this.request<AdminUser>('/core/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/core/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  }

  // ------------------------------------------
  // DASHBOARD - /core/dashboard/
  // ------------------------------------------

  async getStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/core/dashboard/')
  }

  async getDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/core/dashboard/')
  }

  // ------------------------------------------
  // USERS/STAFF - /core/users/
  // ------------------------------------------

  async getStaffUsers(params?: Record<string, string>): Promise<PaginatedResponse<User>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<User>>(`/core/users/${queryString}`)
  }

  async getStaffUser(id: number): Promise<User> {
    return this.request<User>(`/core/users/${id}/`)
  }

  async createStaffUser(data: CreateStaffUserRequest): Promise<CreateStaffUserResponse> {
    return this.request<CreateStaffUserResponse>('/core/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStaffUser(id: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/core/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteStaffUser(id: number): Promise<void> {
    await this.request(`/core/users/${id}/`, {
      method: 'DELETE',
    })
  }

  // ------------------------------------------
  // CUSTOMERS - /customers/
  // ------------------------------------------

  async getCustomers(params?: Record<string, string>): Promise<PaginatedResponse<Customer>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Customer>>(`/customers/${queryString}`)
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}/`)
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>('/customers/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.request(`/customers/${id}/`, {
      method: 'DELETE',
    })
  }

  async changeCustomerStatus(id: number, status: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}/change_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    })
  }

  async getCustomerDashboard(id: number): Promise<any> {
    return this.request(`/customers/${id}/dashboard/`)
  }

  // Aliases for backward compatibility
  async getUsers(params?: Record<string, string>): Promise<PaginatedResponse<Customer>> {
    return this.getCustomers(params)
  }

  async getUser(id: number): Promise<Customer> {
    return this.getCustomer(id)
  }

  async updateUser(id: number, data: Partial<Customer>): Promise<Customer> {
    return this.updateCustomer(id, data)
  }

  async deleteUser(id: number): Promise<void> {
    return this.deleteCustomer(id)
  }

  async activateUser(id: number): Promise<Customer> {
    return this.changeCustomerStatus(id, 'active')
  }

  async deactivateUser(id: number): Promise<Customer> {
    return this.changeCustomerStatus(id, 'inactive')
  }

  // ------------------------------------------
  // CUSTOMER SERVICES
  // ------------------------------------------

  async getCustomerServices(customerId: number): Promise<CustomerService[]> {
    return this.request<CustomerService[]>(`/customers/${customerId}/services/`)
  }

  async createCustomerService(customerId: number, data: Partial<CustomerService>): Promise<CustomerService> {
    return this.request<CustomerService>(`/customers/${customerId}/services/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async activateService(customerId: number, serviceId: number): Promise<any> {
    return this.request(`/customers/${customerId}/services/${serviceId}/activate/`, {
      method: 'POST',
    })
  }

  async suspendService(customerId: number, serviceId: number, reason?: string): Promise<void> {
    await this.request(`/customers/${customerId}/services/${serviceId}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async terminateService(customerId: number, serviceId: number): Promise<void> {
    await this.request(`/customers/${customerId}/services/${serviceId}/terminate/`, {
      method: 'POST',
    })
  }

  /** P3: Extend a service subscription by adding time, optionally changing plan */
  async extendService(
    customerId: number,
    serviceId: number,
    durationAmount: number,
    durationUnit: 'MINUTES' | 'HOURS' | 'DAYS',
    planId?: number
  ): Promise<any> {
    const body: Record<string, any> = {
      duration_amount: durationAmount,
      duration_unit: durationUnit,
    }
    if (planId) {
      body.plan_id = planId
    }
    return this.request(`/customers/${customerId}/services/${serviceId}/extend/`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** P5: Toggle RADIUS access (disable/enable) without deleting the customer */
  async toggleRadius(
    customerId: number,
    enabled: boolean,
    reason?: string
  ): Promise<any> {
    return this.request(`/customers/${customerId}/toggle_radius/`, {
      method: 'POST',
      body: JSON.stringify({ enabled, reason }),
    })
  }

  async getPendingActivations(): Promise<CustomerService[]> {
    return this.request<CustomerService[]>('/customers/services/pending-activations/')
  }

  // ------------------------------------------
  // CUSTOMER ONBOARDING
  // ------------------------------------------

  async onboardCustomer(data: any): Promise<Customer> {
    return this.request<Customer>('/customers/onboarding/wizard/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // AUDIT LOGS - /core/audit-logs/
  // ------------------------------------------

  async getAuditLogs(params?: Record<string, string>): Promise<PaginatedResponse<AuditLog>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<AuditLog>>(`/core/audit-logs/${queryString}`)
  }

  async getAuditLog(id: number): Promise<AuditLog> {
    return this.request<AuditLog>(`/core/audit-logs/${id}/`)
  }

  // Alias for backward compatibility
  async getLogs(params?: Record<string, string>): Promise<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs(params)
  }

  // ------------------------------------------
  // SETTINGS - /core/settings/
  // ------------------------------------------

  async getSettings(): Promise<any[]> {
    return this.request<any[]>('/core/settings/')
  }

  async getSetting(id: number): Promise<any> {
    return this.request(`/core/settings/${id}/`)
  }

  async updateSetting(id: number, data: any): Promise<any> {
    return this.request(`/core/settings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // COMPANIES - /core/companies/
  // ------------------------------------------

  async getCompanies(): Promise<any[]> {
    return this.request<any[]>('/core/companies/')
  }

  async getCompany(id: number): Promise<any> {
    return this.request(`/core/companies/${id}/`)
  }

  async updateCompany(id: number, data: any): Promise<any> {
    return this.request(`/core/companies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // TENANTS - /core/tenants/
  // ------------------------------------------

  async getTenants(): Promise<any[]> {
    return this.request<any[]>('/core/tenants/')
  }

  async activateTenant(id: number): Promise<void> {
    await this.request(`/core/tenants/${id}/activate/`, {
      method: 'POST',
    })
  }

  async deactivateTenant(id: number): Promise<void> {
    await this.request(`/core/tenants/${id}/deactivate/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // HEALTH CHECK
  // ------------------------------------------

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/core/health/')
  }

  // ------------------------------------------
  // ROUTER MANAGEMENT - /network/routers/
  // ------------------------------------------

  async getRouters(params?: Record<string, string>): Promise<PaginatedResponse<Router>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Router>>(`/network/routers/${queryString}`)
  }

  async getRouter(id: number): Promise<Router> {
    return this.request<Router>(`/network/routers/${id}/`)
  }

  async createRouter(data: Partial<Router>): Promise<Router> {
    return this.request<Router>('/network/routers/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRouter(id: number, data: Partial<Router>): Promise<Router> {
    return this.request<Router>(`/network/routers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRouter(id: number): Promise<void> {
    await this.request(`/network/routers/${id}/`, {
      method: 'DELETE',
    })
  }

  async testRouterConnection(id: number): Promise<{ success: boolean; message: string; latency?: number }> {
    return this.request<{ success: boolean; message: string; latency?: number }>(`/network/routers/${id}/test_connection/`, {
      method: 'POST',
    })
  }

  async rebootRouter(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/routers/${id}/reboot/`, {
      method: 'POST',
    })
  }

  async getRouterMetrics(id: number): Promise<RouterMetrics> {
    return this.request<RouterMetrics>(`/network/routers/${id}/metrics/`)
  }

  async getRouterEvents(id: number, params?: Record<string, string>): Promise<PaginatedResponse<RouterEvent>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RouterEvent>>(`/network/routers/${id}/events/${queryString}`)
  }

  async getRouterUsers(id: number): Promise<{ active_users: number; total_users: number; users: any[] }> {
    return this.request<{ active_users: number; total_users: number; users: any[] }>(`/network/routers/${id}/users/`)
  }

  async syncRouterUsers(id: number): Promise<{ message: string; synced_count: number }> {
    return this.request<{ message: string; synced_count: number }>(`/network/routers/${id}/sync_users/`, {
      method: 'POST',
    })
  }

  async getRouterDashboardStats(): Promise<RouterDashboardStats> {
    return this.request<RouterDashboardStats>('/network/routers/dashboard_stats/')
  }

  async setRouterMaintenance(id: number, enabled: boolean, reason?: string): Promise<Router> {
    return this.request<Router>(`/network/routers/${id}/maintenance/`, {
      method: 'POST',
      body: JSON.stringify({ enabled, reason }),
    })
  }

  async backupRouterConfig(id: number): Promise<{ message: string; backup_id: number }> {
    return this.request<{ message: string; backup_id: number }>(`/network/routers/${id}/backup/`, {
      method: 'POST',
    })
  }

  async restoreRouterConfig(id: number, backupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/routers/${id}/restore/`, {
      method: 'POST',
      body: JSON.stringify({ backup_id: backupId }),
    })
  }

  async getRouterAuthKey(id: number): Promise<{ auth_key: string; one_liner: string; is_authenticated: boolean; authenticated_at: string | null }> {
    return this.request<{ auth_key: string; one_liner: string; is_authenticated: boolean; authenticated_at: string | null }>(`/network/routers/${id}/auth-key/`)
  }

  async regenerateRouterAuthKey(id: number): Promise<{ status: string; new_auth_key: string }> {
    return this.request<{ status: string; new_auth_key: string }>(`/network/routers/${id}/regenerate_auth_key/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // ROUTER VPN / CLOUD CONTROLLER
  // ------------------------------------------

  async getRouterVPNStatus(id: number): Promise<RouterVPNStatus> {
    return this.request<RouterVPNStatus>(`/network/routers/${id}/vpn_status/`)
  }

  async reprovisionRouterVPN(id: number): Promise<{ status: string; vpn_ip: string }> {
    return this.request<{ status: string; vpn_ip: string }>(`/network/routers/${id}/reprovision_vpn/`, {
      method: 'POST',
    })
  }

  async downloadRouterScript(id: number, version: number = 7): Promise<string> {
    return this.request<string>(`/network/routers/${id}/script/?version=${version}`)
  }

  async revokeRouterVPN(id: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/network/routers/${id}/revoke_vpn/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // ROUTER LIVE MONITORING - /routers/{id}/
  // ------------------------------------------

  async getRouterLiveStatus(id: number): Promise<RouterLiveStatus> {
    return this.request<RouterLiveStatus>(`/network/routers/${id}/live_status/`)
  }

  async getRouterSystemHealth(id: number): Promise<RouterSystemHealth> {
    return this.request<RouterSystemHealth>(`/network/routers/${id}/system_health/`)
  }

  async syncRouterDeviceInfo(id: number): Promise<RouterLiveStatus> {
    return this.request<RouterLiveStatus>(`/network/routers/${id}/sync_device_info/`)
  }

  // ------------------------------------------
  // ROUTER HOTSPOT MANAGEMENT
  // ------------------------------------------

  async getActiveHotspotUsers(id: number): Promise<ActiveHotspotUser[]> {
    return this.request<ActiveHotspotUser[]>(`/network/routers/${id}/active_hotspot_users/`)
  }

  async getHotspotUsers(id: number): Promise<HotspotUser[]> {
    return this.request<HotspotUser[]>(`/network/routers/${id}/hotspot_users/`)
  }

  async getHotspotUserStats(id: number, username: string): Promise<HotspotUserStats | null> {
    return this.request<HotspotUserStats | null>(`/network/routers/${id}/hotspot_user_stats/?username=${encodeURIComponent(username)}`)
  }

  async createHotspotUser(id: number, data: CreateHotspotUserRequest): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/create_hotspot_user/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async enableHotspotUser(id: number, username: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/enable_hotspot_user/`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  async disableHotspotUser(id: number, username: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/disable_hotspot_user/`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  // ------------------------------------------
  // ROUTER PPPOE MANAGEMENT
  // ------------------------------------------

  async getActivePPPoESessions(id: number): Promise<ActivePPPoESession[]> {
    return this.request<ActivePPPoESession[]>(`/network/routers/${id}/active_pppoe_sessions/`)
  }

  async getPPPoEUsers(id: number): Promise<PPPoEUser[]> {
    return this.request<PPPoEUser[]>(`/network/routers/${id}/pppoe_users/`)
  }

  async getPPPoEUserStats(id: number, username: string): Promise<PPPoEUserStats | null> {
    return this.request<PPPoEUserStats | null>(`/network/routers/${id}/pppoe_user_stats/?username=${encodeURIComponent(username)}`)
  }

  async createPPPoEUser(id: number, data: CreatePPPoEUserRequest): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/create_pppoe_user/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // ROUTER FIREWALL MANAGEMENT
  // ------------------------------------------

  async getFirewallRules(id: number): Promise<FirewallRule[]> {
    return this.request<FirewallRule[]>(`/network/routers/${id}/firewall_filter_rules/`)
  }

  async addFirewallRule(id: number, data: CreateFirewallRuleRequest): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/add_firewall_rule/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // ROUTER QUEUE MANAGEMENT
  // ------------------------------------------

  async getQueues(id: number): Promise<SimpleQueue[]> {
    return this.request<SimpleQueue[]>(`/network/routers/${id}/queues/`)
  }

  async addSimpleQueue(id: number, data: { name: string; target: string; max_limit: string }): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/add_simple_queue/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createQueue(id: number, data: CreateQueueRequest): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/create_queue/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async enableQueue(id: number, queueName: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/enable_queue/`, {
      method: 'POST',
      body: JSON.stringify({ queue_name: queueName }),
    })
  }

  async disableQueue(id: number, queueName: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/disable_queue/`, {
      method: 'POST',
      body: JSON.stringify({ queue_name: queueName }),
    })
  }

  // ------------------------------------------
  // ROUTER INTERFACE MANAGEMENT
  // ------------------------------------------

  async getRouterInterfaces(id: number): Promise<RouterInterface[]> {
    return this.request<RouterInterface[]>(`/network/routers/${id}/interfaces/`)
  }

  async getInterfaceTraffic(id: number, interfaceName: string): Promise<InterfaceTraffic> {
    return this.request<InterfaceTraffic>(`/network/routers/${id}/interface_traffic/?interface_name=${encodeURIComponent(interfaceName)}`)
  }

  async enableInterface(id: number, interfaceName: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/enable_interface/`, {
      method: 'POST',
      body: JSON.stringify({ interface_name: interfaceName }),
    })
  }

  async disableInterface(id: number, interfaceName: string): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/disable_interface/`, {
      method: 'POST',
      body: JSON.stringify({ interface_name: interfaceName }),
    })
  }

  // ------------------------------------------
  // ROUTER DHCP MANAGEMENT
  // ------------------------------------------

  async getDHCPLeases(id: number): Promise<DHCPLease[]> {
    return this.request<DHCPLease[]>(`/network/routers/${id}/dhcp_leases/`)
  }

  // ------------------------------------------
  // ROUTER LOGS
  // ------------------------------------------

  async getRouterLogs(id: number, lines: number = 50): Promise<RouterLogEntry[]> {
    return this.request<RouterLogEntry[]>(`/network/routers/${id}/system_logs/?lines=${lines}`)
  }

  // ------------------------------------------
  // ROUTER WIRELESS MANAGEMENT
  // ------------------------------------------

  async getWirelessInterfaces(id: number): Promise<WirelessInterface[]> {
    return this.request<WirelessInterface[]>(`/network/routers/${id}/wireless_interfaces/`)
  }

  async getWirelessRegistrations(id: number): Promise<WirelessRegistration[]> {
    return this.request<WirelessRegistration[]>(`/network/routers/${id}/wireless_registrations/`)
  }

  // ------------------------------------------
  // ROUTER PORT SCAN
  // ------------------------------------------

  async scanRouterPorts(id: number): Promise<{
    router_id: number
    router_name: string
    router_status: string
    target_ip: string | null
    results: Array<{
      port: number
      service: string
      description: string
      status: 'open' | 'closed' | 'filtered' | 'error'
      latency_ms: number | null
    }>
    api_reachable: boolean
    winbox_reachable: boolean
    web_reachable: boolean
    open_count: number
    total_scanned: number
    error?: string
  }> {
    return this.request(`/network/routers/${id}/scan/`)
  }

  // ------------------------------------------
  // ROUTER PORT MANAGER
  // ------------------------------------------

  async getPortManager(id: number): Promise<{
    router_id: number
    wan_interface: string
    ports: Array<{
      name: string
      type: 'ethernet' | 'wireless'
      running: boolean
      is_selected: boolean
      is_wan: boolean
      disabled: boolean
    }>
  }> {
    return this.request(`/network/routers/${id}/port-manager/`)
  }

  async savePortManager(id: number, ports: string[]): Promise<{
    success?: boolean
    message: string
    added?: string[]
    removed?: string[]
    applied?: boolean
    error?: string
  }> {
    return this.request(`/network/routers/${id}/port-manager/`, {
      method: 'POST',
      body: JSON.stringify({ ports }),
    })
  }

  // ------------------------------------------
  // ROUTER HOTSPOT CONFIGURATION
  // ------------------------------------------

  async getRouterPorts(id: number): Promise<{ ports: any[] }> {
    return this.request<{ ports: any[] }>(`/network/routers/${id}/ports/`)
  }

  async getRouterHotspotConfig(id: number): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/config/`)
  }

  async configureRouterHotspot(id: number, config: {
    interface: string
    network: {
      network_address: string
      network_mask: string
      pool_name: string
      pool_range: string
      dns_server: string
    }
    server: {
      name: string
      idle_timeout: string
      keepalive_timeout: string
      login_by: string[]
    }
    branding: {
      company_name: string
      logo_url: string
      primary_color: string
      welcome_message: string
      terms_url: string
    }
  }): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/configure/`, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async disableRouterHotspot(id: number): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/disable/`, {
      method: 'POST',
    })
  }

  async enableRouterHotspot(id: number, serverName?: string): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/enable/`, {
      method: 'POST',
      body: JSON.stringify({ server_name: serverName || 'netily-hotspot' }),
    })
  }

  async updateRouterHotspot(id: number, config: { dns_name?: string; pool_range?: string }): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/update/`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    })
  }

  async addPortToBridge(id: number, interfaceName: string, bridgeName?: string): Promise<any> {
    return this.request<any>(`/network/routers/${id}/bridge/port/`, {
      method: 'POST',
      body: JSON.stringify({
        interface: interfaceName,
        action: 'add',
        bridge: bridgeName || 'netily-bridge',
      }),
    })
  }

  async removePortFromBridge(id: number, interfaceName: string): Promise<any> {
    return this.request<any>(`/network/routers/${id}/bridge/port/`, {
      method: 'POST',
      body: JSON.stringify({
        interface: interfaceName,
        action: 'remove',
      }),
    })
  }

  // ------------------------------------------
  // HOTSPOT IPAM (IP Address + Subnet Config)
  // ------------------------------------------

  async getRouterHotspotIPAM(id: number): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/ipam/`)
  }

  async previewRouterHotspotIPAM(id: number, base_ip: string, subnet_cidr: number): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/ipam/`, {
      method: 'POST',
      body: JSON.stringify({ base_ip, subnet_cidr }),
    })
  }

  async applyRouterHotspotIPAM(id: number, base_ip: string, subnet_cidr: number): Promise<any> {
    return this.request<any>(`/network/routers/${id}/hotspot/ipam/apply/`, {
      method: 'POST',
      body: JSON.stringify({ base_ip, subnet_cidr }),
    })
  }

  // ------------------------------------------
  // ROUTER ACTIONS
  // ------------------------------------------

  async pingFromRouter(id: number, target: string, count: number = 5): Promise<PingResult> {
    return this.request<PingResult>(`/network/routers/${id}/ping/`, {
      method: 'POST',
      body: JSON.stringify({ target, count }),
    })
  }

  async rebootRouterConfirm(id: number, confirm: boolean = true): Promise<RouterActionResponse> {
    return this.request<RouterActionResponse>(`/network/routers/${id}/reboot/`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    })
  }

  // ------------------------------------------
  // OLT MANAGEMENT - /network/olt/
  // ------------------------------------------

  async getOLTs(params?: Record<string, string>): Promise<PaginatedResponse<OLT>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<OLT>>(`/network/olt/${queryString}`)
  }

  async getOLT(id: number): Promise<OLT> {
    return this.request<OLT>(`/network/olt/${id}/`)
  }

  async createOLT(data: Partial<OLT>): Promise<OLT> {
    return this.request<OLT>('/network/olt/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOLT(id: number, data: Partial<OLT>): Promise<OLT> {
    return this.request<OLT>(`/network/olt/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteOLT(id: number): Promise<void> {
    await this.request(`/network/olt/${id}/`, {
      method: 'DELETE',
    })
  }

  async rebootOLT(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/olt/${id}/reboot/`, {
      method: 'POST',
    })
  }

  async getOLTStats(id: number): Promise<any> {
    return this.request(`/network/olt/${id}/stats/`)
  }

  async getOLTPONPorts(oltId: number): Promise<PONPort[]> {
    return this.request<PONPort[]>(`/network/olt/${oltId}/ports/`)
  }

  // ------------------------------------------
  // ONU MANAGEMENT - /network/onu/
  // ------------------------------------------

  async getONUs(params?: Record<string, string>): Promise<PaginatedResponse<ONU>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<ONU>>(`/network/onu/${queryString}`)
  }

  async getONU(id: number): Promise<ONU> {
    return this.request<ONU>(`/network/onu/${id}/`)
  }

  async createONU(data: Partial<ONU>): Promise<ONU> {
    return this.request<ONU>('/network/onu/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateONU(id: number, data: Partial<ONU>): Promise<ONU> {
    return this.request<ONU>(`/network/onu/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteONU(id: number): Promise<void> {
    await this.request(`/network/onu/${id}/`, {
      method: 'DELETE',
    })
  }

  async provisionONU(id: number, data?: any): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/onu/${id}/provision/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  async getONUOpticalPower(id: number): Promise<any> {
    return this.request(`/network/onu/${id}/optical-power/`)
  }

  async getUnregisteredONUs(): Promise<ONU[]> {
    return this.request<ONU[]>('/network/onu/unregistered/')
  }

  // ------------------------------------------
  // IPAM - /network/ (Subnets, IP Addresses, DHCP, IP Pools)
  // ------------------------------------------

  async getSubnets(params?: Record<string, string>): Promise<PaginatedResponse<Subnet>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Subnet>>(`/network/subnets/${queryString}`)
  }

  async getSubnet(id: number): Promise<Subnet> {
    return this.request<Subnet>(`/network/subnets/${id}/`)
  }

  async createSubnet(data: Partial<Subnet>): Promise<Subnet> {
    return this.request<Subnet>('/network/subnets/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSubnet(id: number, data: Partial<Subnet>): Promise<Subnet> {
    return this.request<Subnet>(`/network/subnets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSubnet(id: number): Promise<void> {
    await this.request(`/network/subnets/${id}/`, {
      method: 'DELETE',
    })
  }

  async getIPAddresses(params?: Record<string, string>): Promise<PaginatedResponse<IPAddress>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<IPAddress>>(`/network/ip-addresses/${queryString}`)
  }

  async assignIPAddress(id: number, customerId: number): Promise<IPAddress> {
    return this.request<IPAddress>(`/network/ip-addresses/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    })
  }

  async releaseIPAddress(id: number): Promise<IPAddress> {
    return this.request<IPAddress>(`/network/ip-addresses/${id}/release/`, {
      method: 'POST',
    })
  }

  async getDHCPLeases(params?: Record<string, string>): Promise<PaginatedResponse<DHCPLease>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<DHCPLease>>(`/network/dhcp-ranges/${queryString}`)
  }

  // ------------------------------------------
  // IP Pools - /network/ip-pools/
  // ------------------------------------------

  async getIPPools(params?: Record<string, string>): Promise<PaginatedResponse<IPPool>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<IPPool>>(`/network/ip-pools/${queryString}`)
  }

  async getIPPool(id: number): Promise<IPPool> {
    return this.request<IPPool>(`/network/ip-pools/${id}/`)
  }

  async createIPPool(data: Partial<IPPool>): Promise<IPPool> {
    return this.request<IPPool>('/network/ip-pools/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIPPool(id: number, data: Partial<IPPool>): Promise<IPPool> {
    return this.request<IPPool>(`/network/ip-pools/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteIPPool(id: number): Promise<void> {
    await this.request(`/network/ip-pools/${id}/`, {
      method: 'DELETE',
    })
  }

  async getIPPoolsByRouter(): Promise<IPPoolsByRouter[]> {
    return this.request<IPPoolsByRouter[]>('/network/ip-pools/by_router/')
  }

  async getIPPoolStatistics(id: number): Promise<IPPoolStatistics> {
    return this.request<IPPoolStatistics>(`/network/ip-pools/${id}/statistics/`)
  }

  async getIPPoolAvailableIPs(poolId: number, search?: string): Promise<AvailableIPsResponse> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.request<AvailableIPsResponse>(`/network/ip-pools/${poolId}/available-ips/${params}`)
  }

  async getSubnetPrefixOptions(): Promise<SubnetPrefixOptionsResponse> {
    return this.request<SubnetPrefixOptionsResponse>('/network/ip-pools/subnet-prefix-options/')
  }

  // ------------------------------------------
  // CPE/TR-069 - /network/cpe/
  // ------------------------------------------

  async getCPEDevices(params?: Record<string, string>): Promise<PaginatedResponse<CPEDevice>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<CPEDevice>>(`/network/cpe/${queryString}`)
  }

  async getCPEDevice(id: number): Promise<CPEDevice> {
    return this.request<CPEDevice>(`/network/cpe/${id}/`)
  }

  async rebootCPE(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/cpe/${id}/reboot/`, {
      method: 'POST',
    })
  }

  async factoryResetCPE(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/cpe/${id}/factory-reset/`, {
      method: 'POST',
    })
  }

  async getCPEDiagnostics(id: number): Promise<any> {
    return this.request(`/network/cpe/${id}/diagnostics/`)
  }

  async pushCPEConfig(id: number, config: Record<string, any>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/network/cpe/${id}/config/`, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  // ------------------------------------------
  // INVOICES - /billing/invoices/
  // ------------------------------------------

  async getInvoices(params?: Record<string, string>): Promise<PaginatedResponse<Invoice>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Invoice>>(`/billing/invoices/${queryString}`)
  }

  async getInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/`)
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    return this.request<Invoice>('/billing/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteInvoice(id: number): Promise<void> {
    await this.request(`/billing/invoices/${id}/`, {
      method: 'DELETE',
    })
  }

  async generateInvoice(customerId: number): Promise<Invoice> {
    return this.request<Invoice>('/billing/invoices/generate/', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    })
  }

  async sendInvoice(id: number, method: 'email' | 'sms' | 'both'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/billing/invoices/${id}/send/`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    })
  }

  async markInvoicePaid(id: number, paymentData?: any): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/mark-paid/`, {
      method: 'POST',
      body: JSON.stringify(paymentData || {}),
    })
  }

  async downloadInvoicePDF(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/billing/invoices/${id}/pdf/`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to download invoice')
    return response.blob()
  }

  // ------------------------------------------
  // PAYMENTS - /billing/payments/
  // ------------------------------------------

  async getPayments(params?: Record<string, string>): Promise<PaginatedResponse<Payment>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Payment>>(`/billing/payments/${queryString}`)
  }

  async getPayment(id: number): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${id}/`)
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    return this.request<Payment>('/billing/payments/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async initiateMpesaSTKPush(phone: string, amount: number, customerId?: number): Promise<MpesaTransaction> {
    return this.request<MpesaTransaction>('/payments/mpesa/stk-push/', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, amount, customer_id: customerId }),
    })
  }

  async getMpesaTransactions(params?: Record<string, string>): Promise<PaginatedResponse<MpesaTransaction>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<MpesaTransaction>>(`/payments/mpesa/transactions/${queryString}`)
  }

  // ------------------------------------------
  // TECHNICIANS & DISPATCH - /staff/
  // ------------------------------------------

  async getTechnicians(params?: Record<string, string>): Promise<PaginatedResponse<Technician>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Technician>>(`/staff/technicians/${queryString}`)
  }

  async getTechnician(id: number): Promise<Technician> {
    return this.request<Technician>(`/staff/technicians/${id}/`)
  }

  async getDispatchJobs(params?: Record<string, string>): Promise<PaginatedResponse<DispatchJob>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<DispatchJob>>(`/staff/dispatch/jobs/${queryString}`)
  }

  async getDispatchJob(id: number): Promise<DispatchJob> {
    return this.request<DispatchJob>(`/staff/dispatch/jobs/${id}/`)
  }

  async createDispatchJob(data: Partial<DispatchJob>): Promise<DispatchJob> {
    return this.request<DispatchJob>('/staff/dispatch/jobs/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async assignDispatchJob(jobId: number, technicianId: number): Promise<DispatchJob> {
    return this.request<DispatchJob>(`/staff/dispatch/jobs/${jobId}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ technician_id: technicianId }),
    })
  }

  async updateJobStatus(jobId: number, status: string, notes?: string): Promise<DispatchJob> {
    return this.request<DispatchJob>(`/staff/dispatch/jobs/${jobId}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    })
  }

  // ------------------------------------------
  // INVENTORY - /inventory/ (Asset Tracking Model)
  // ------------------------------------------

  // Equipment Items (Individual Assets)
  async getEquipmentItems(params?: Record<string, string>): Promise<PaginatedResponse<EquipmentItem>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<EquipmentItem>>(`/inventory/equipment/${queryString}`)
  }

  async getEquipmentItem(id: number): Promise<EquipmentItem> {
    return this.request<EquipmentItem>(`/inventory/equipment/${id}/`)
  }

  async createEquipmentItem(data: Partial<EquipmentItem>): Promise<EquipmentItem> {
    return this.request<EquipmentItem>('/inventory/equipment/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEquipmentItem(id: number, data: Partial<EquipmentItem>): Promise<EquipmentItem> {
    return this.request<EquipmentItem>(`/inventory/equipment/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteEquipmentItem(id: number): Promise<void> {
    return this.request<void>(`/inventory/equipment/${id}/`, {
      method: 'DELETE',
    })
  }

  // Assign equipment to employee
  async assignEquipmentToEmployee(itemId: number, data: {
    employee_id: string
    purpose?: string
    expected_return_date?: string
  }): Promise<EquipmentAssignment> {
    return this.request<EquipmentAssignment>(`/inventory/equipment/${itemId}/assign/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Return equipment from employee
  async returnEquipment(itemId: number, data: {
    condition?: string
    notes?: string
  }): Promise<EquipmentItem> {
    return this.request<EquipmentItem>(`/inventory/equipment/${itemId}/return_item/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Send equipment to maintenance
  async sendToMaintenance(itemId: number, data?: {
    notes?: string
  }): Promise<EquipmentItem> {
    return this.request<EquipmentItem>(`/inventory/equipment/${itemId}/maintenance/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // Mark equipment as disposed
  async disposeEquipment(itemId: number, data?: {
    reason?: string
  }): Promise<EquipmentItem> {
    return this.request<EquipmentItem>(`/inventory/equipment/${itemId}/dispose/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // Equipment Types (Categories)
  async getEquipmentTypes(params?: Record<string, string>): Promise<PaginatedResponse<EquipmentType>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<EquipmentType>>(`/inventory/equipment-types/${queryString}`)
  }

  async getEquipmentType(id: number): Promise<EquipmentType> {
    return this.request<EquipmentType>(`/inventory/equipment-types/${id}/`)
  }

  async createEquipmentType(data: Partial<EquipmentType>): Promise<EquipmentType> {
    return this.request<EquipmentType>('/inventory/equipment-types/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEquipmentType(id: number, data: Partial<EquipmentType>): Promise<EquipmentType> {
    return this.request<EquipmentType>(`/inventory/equipment-types/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Equipment Assignments
  async getAssignments(params?: Record<string, string>): Promise<PaginatedResponse<EquipmentAssignment>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<EquipmentAssignment>>(`/inventory/assignments/${queryString}`)
  }

  async getAssignment(id: number): Promise<EquipmentAssignment> {
    return this.request<EquipmentAssignment>(`/inventory/assignments/${id}/`)
  }

  // Mark assignment as returned
  async markAssignmentReturned(assignmentId: number, data: {
    condition: EquipmentCondition
    notes?: string
  }): Promise<EquipmentAssignment> {
    return this.request<EquipmentAssignment>(`/inventory/assignments/${assignmentId}/mark_returned/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Get available equipment for assignment
  async getAvailableEquipment(params?: Record<string, string>): Promise<PaginatedResponse<EquipmentItem>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<EquipmentItem>>(`/inventory/equipment/available/${queryString}`)
  }

  // Stock Alerts
  async getStockAlerts(): Promise<StockAlert[]> {
    return this.request<StockAlert[]>('/inventory/stock-alerts/')
  }

  // Stock Report
  async getStockReport(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/inventory/stock-report/')
  }

  // Equipment Report
  async getEquipmentReport(params?: Record<string, string>): Promise<Record<string, unknown>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<Record<string, unknown>>(`/inventory/equipment/report/${queryString}`)
  }

  // Suppliers
  async getSuppliers(params?: Record<string, string>): Promise<PaginatedResponse<Supplier>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Supplier>>(`/inventory/suppliers/${queryString}`)
  }

  async getSupplier(id: number): Promise<Supplier> {
    return this.request<Supplier>(`/inventory/suppliers/${id}/`)
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    return this.request<Supplier>('/inventory/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
    return this.request<Supplier>(`/inventory/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // ALERTS - /alerts/
  // ------------------------------------------

  async getAlerts(params?: Record<string, string>): Promise<PaginatedResponse<Alert>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Alert>>(`/alerts/${queryString}`)
  }

  async acknowledgeAlert(id: number): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/acknowledge/`, {
      method: 'POST',
    })
  }

  async resolveAlert(id: number): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/resolve/`, {
      method: 'POST',
    })
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return this.request<AlertRule[]>('/alerts/rules/')
  }

  async createAlertRule(data: Partial<AlertRule>): Promise<AlertRule> {
    return this.request<AlertRule>('/alerts/rules/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // PLANS - /billing/plans/
  // ------------------------------------------

  async getPlans(params?: Record<string, string>): Promise<PaginatedResponse<Plan>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Plan>>(`/billing/plans/${queryString}`)
  }

  async getPlan(id: number): Promise<Plan> {
    return this.request<Plan>(`/billing/plans/${id}/`)
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.request<Plan>('/billing/plans/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    return this.request<Plan>(`/billing/plans/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deletePlan(id: number): Promise<void> {
    await this.request(`/billing/plans/${id}/`, {
      method: 'DELETE',
    })
  }

  async togglePlanActive(id: number): Promise<Plan> {
    return this.request<Plan>(`/billing/plans/${id}/toggle_active/`, {
      method: 'POST',
    })
  }

  async getPublicPlans(): Promise<Plan[]> {
    return this.request<Plan[]>('/billing/plans/public/')
  }

  async getPlanDashboardStats(): Promise<PlanDashboardStats> {
    return this.request<PlanDashboardStats>('/billing/plans/dashboard_stats/')
  }

  // ------------------------------------------
  // BILLING CYCLES - /billing/billing-cycles/
  // ------------------------------------------

  async getBillingCycles(params?: Record<string, string>): Promise<PaginatedResponse<BillingCycle>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<BillingCycle>>(`/billing/billing-cycles/${queryString}`)
  }

  async getBillingCycle(id: number): Promise<BillingCycle> {
    return this.request<BillingCycle>(`/billing/billing-cycles/${id}/`)
  }

  async createBillingCycle(data: Partial<BillingCycle>): Promise<BillingCycle> {
    return this.request<BillingCycle>('/billing/billing-cycles/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBillingCycle(id: number, data: Partial<BillingCycle>): Promise<BillingCycle> {
    return this.request<BillingCycle>(`/billing/billing-cycles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async closeBillingCycle(id: number): Promise<BillingCycle> {
    return this.request<BillingCycle>(`/billing/billing-cycles/${id}/close_cycle/`, {
      method: 'POST',
    })
  }

  async calculateBillingCycleTotals(id: number): Promise<BillingCycle> {
    return this.request<BillingCycle>(`/billing/billing-cycles/${id}/calculate_totals/`, {
      method: 'POST',
    })
  }

  async getCurrentBillingCycle(): Promise<BillingCycle> {
    return this.request<BillingCycle>('/billing/billing-cycles/current/')
  }

  async getBillingCycleSummary(id: number): Promise<BillingCycleSummary> {
    return this.request<BillingCycleSummary>(`/billing/billing-cycles/${id}/summary/`)
  }

  // ------------------------------------------
  // INVOICES - Extended Actions
  // ------------------------------------------

  async issueInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/issue/`, {
      method: 'POST',
    })
  }

  async markInvoiceSent(id: number, method?: 'email' | 'sms' | 'both'): Promise<Invoice> {
    // If method is provided, use the send endpoint which notifies the customer
    if (method) {
      return this.request<Invoice>(`/billing/invoices/${id}/send/`, {
        method: 'POST',
        body: JSON.stringify({ method }),
      })
    }
    // Otherwise, just mark as sent without notification
    return this.request<Invoice>(`/billing/invoices/${id}/mark_as_sent/`, {
      method: 'POST',
    })
  }

  async addPaymentToInvoice(id: number, data: { amount: string | number; payment_method: string; reference?: string }): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/add_payment/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async applyInvoiceDiscount(id: number, data: { 
    discount_type: 'PERCENTAGE' | 'FIXED'; 
    discount_value: string | number; 
    reason?: string 
  }): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}/apply_discount/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getInvoiceItems(id: number): Promise<InvoiceItem[]> {
    return this.request<InvoiceItem[]>(`/billing/invoices/${id}/items/`)
  }

  async getInvoicePayments(id: number): Promise<Payment[]> {
    return this.request<Payment[]>(`/billing/invoices/${id}/payments/`)
  }

  async bulkGenerateInvoices(billingCycleId: number): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/billing/invoices/bulk_generate/', {
      method: 'POST',
      body: JSON.stringify({ billing_cycle_id: billingCycleId }),
    })
  }

  async getOverdueInvoices(): Promise<PaginatedResponse<Invoice>> {
    return this.request<PaginatedResponse<Invoice>>('/billing/invoices/overdue/')
  }

  async getInvoiceDashboardStats(): Promise<InvoiceDashboardStats> {
    return this.request<InvoiceDashboardStats>('/billing/invoices/dashboard_stats/')
  }

  async getCustomerOutstanding(): Promise<CustomerOutstanding[]> {
    return this.request<CustomerOutstanding[]>('/billing/invoices/customer_outstanding/')
  }

  // ------------------------------------------
  // PAYMENT METHODS - /billing/payment-methods/
  // ------------------------------------------

  async getPaymentMethods(params?: Record<string, string>): Promise<PaginatedResponse<PaymentMethod>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<PaymentMethod>>(`/billing/payment-methods/${queryString}`)
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod> {
    return this.request<PaymentMethod>(`/billing/payment-methods/${id}/`)
  }

  async createPaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.request<PaymentMethod>('/billing/payment-methods/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.request<PaymentMethod>(`/billing/payment-methods/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await this.request(`/billing/payment-methods/${id}/`, {
      method: 'DELETE',
    })
  }

  async togglePaymentMethodActive(id: number): Promise<PaymentMethod> {
    return this.request<PaymentMethod>(`/billing/payment-methods/${id}/toggle_active/`, {
      method: 'POST',
    })
  }

  async testPaymentMethodConnection(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/billing/payment-methods/${id}/test_connection/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // PAYMENTS - Extended Actions
  // ------------------------------------------

  async markPaymentCompleted(id: number): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${id}/mark_completed/`, {
      method: 'POST',
    })
  }

  async markPaymentFailed(id: number, reason: string): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${id}/mark_failed/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async reconcilePayment(id: number): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${id}/reconcile/`, {
      method: 'POST',
    })
  }

  async refundPayment(id: number, data: { refund_amount: number; refund_reason: string }): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${id}/refund/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async initiateMpesaStkPush(data: {
    customer_id: number
    invoice_id?: number
    amount: number
    phone_number: string
  }): Promise<MpesaTransaction> {
    return this.request<MpesaTransaction>('/billing/payments/mpesa_stk_push/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async processBankTransfer(data: {
    customer_id: number
    invoice_id?: number
    amount: number
    bank_name: string
    account_number: string
    transaction_reference: string
  }): Promise<Payment> {
    return this.request<Payment>('/billing/payments/bank_transfer/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // PAYHERO UNIFIED PAYMENT - /billing/payments/initiate/
  // ------------------------------------------

  /**
   * Initiate a payment using PayHero unified flow
   * This is the recommended method for all payments
   */
  async initiatePayment(data: {
    amount: number | string
    external_reference?: string  // Optional: unique reference (e.g., invoice_number)
    channel_id?: number  // Optional: force specific payment method
    phone_number?: string  // For STK Push
    customer_id?: number
    invoice_id?: number
  }): Promise<{
    status: 'success' | 'failed' | 'pending' | 'error'
    payment_id?: number
    payhero_response?: {
      status?: string
      checkout_request_id?: string
      payment_url?: string
      paybill_number?: string
      till_number?: string
      account_number?: string
      bank_details?: {
        bank_name?: string
        account_name?: string
        account_number?: string
        branch?: string
      }
      message?: string
    } | null
    error?: string
    message?: string
  }> {
    return this.request('/billing/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Poll payment status - useful for async payments (Paybill, Bank, Till)
   */
  async pollPaymentStatus(paymentId: number): Promise<Payment> {
    return this.request<Payment>(`/billing/payments/${paymentId}/`)
  }

  /**
   * Get active payment methods for customer selection
   */
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.request<PaginatedResponse<PaymentMethod>>(
      '/billing/payment-methods/?is_active=true'
    )
    return response.results || []
  }

  async getPaymentDashboardStats(): Promise<PaymentDashboardStats> {
    return this.request<PaymentDashboardStats>('/billing/payments/dashboard_stats/')
  }

  // ------------------------------------------
  // RECEIPTS - /billing/receipts/
  // ------------------------------------------

  async getReceipts(params?: Record<string, string>): Promise<PaginatedResponse<Receipt>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Receipt>>(`/billing/receipts/${queryString}`)
  }

  async getReceipt(id: number): Promise<Receipt> {
    return this.request<Receipt>(`/billing/receipts/${id}/`)
  }

  async createReceipt(data: Partial<Receipt>): Promise<Receipt> {
    return this.request<Receipt>('/billing/receipts/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async issueReceipt(id: number): Promise<Receipt> {
    return this.request<Receipt>(`/billing/receipts/${id}/issue/`, {
      method: 'POST',
    })
  }

  async downloadReceiptPDF(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/billing/receipts/${id}/download_pdf/`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to download receipt')
    return response.blob()
  }

  async shareReceipt(id: number, method: 'email' | 'sms'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/billing/receipts/${id}/share/?method=${method}`)
  }

  // ------------------------------------------
  // VOUCHER BATCHES - /billing/voucher-batches/
  // ------------------------------------------

  async getVoucherBatches(params?: Record<string, string>): Promise<PaginatedResponse<VoucherBatch>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<VoucherBatch>>(`/billing/voucher-batches/${queryString}`)
  }

  async getVoucherBatch(id: number): Promise<VoucherBatch> {
    return this.request<VoucherBatch>(`/billing/voucher-batches/${id}/`)
  }

  async createVoucherBatch(data: Partial<VoucherBatch>): Promise<VoucherBatch> {
    return this.request<VoucherBatch>('/billing/voucher-batches/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVoucherBatch(id: number, data: Partial<VoucherBatch>): Promise<VoucherBatch> {
    return this.request<VoucherBatch>(`/billing/voucher-batches/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async activateVoucherBatch(id: number): Promise<VoucherBatch> {
    return this.request<VoucherBatch>(`/billing/voucher-batches/${id}/activate/`, {
      method: 'POST',
    })
  }

  async generateVouchers(batchId: number, count: number): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>(`/billing/voucher-batches/${batchId}/generate_vouchers/`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    })
  }

  async getBatchVouchers(batchId: number): Promise<Voucher[]> {
    return this.request<Voucher[]>(`/billing/voucher-batches/${batchId}/vouchers/`)
  }

  async getBatchStatistics(batchId: number): Promise<VoucherBatchStats> {
    return this.request<VoucherBatchStats>(`/billing/voucher-batches/${batchId}/statistics/`)
  }

  // ------------------------------------------
  // VOUCHERS - /billing/vouchers/
  // ------------------------------------------

  async getVouchers(params?: Record<string, string>): Promise<PaginatedResponse<Voucher>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Voucher>>(`/billing/vouchers/${queryString}`)
  }

  async getVoucher(id: number): Promise<Voucher> {
    return this.request<Voucher>(`/billing/vouchers/${id}/`)
  }

  async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
    return this.request<Voucher>('/billing/vouchers/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVoucher(id: number, data: Partial<Voucher>): Promise<Voucher> {
    return this.request<Voucher>(`/billing/vouchers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async sellVoucher(id: number, sellerName?: string, notes?: string): Promise<Voucher> {
    return this.request<Voucher>(`/billing/vouchers/${id}/sell/`, {
      method: 'POST',
      body: JSON.stringify({ seller_name: sellerName, notes }),
    })
  }

  async redeemVoucher(code: string, pin?: string, customerId?: number): Promise<Voucher> {
    return this.request<Voucher>('/billing/vouchers/redeem/', {
      method: 'POST',
      body: JSON.stringify({ code, pin, customer_id: customerId }),
    })
  }

  async checkVoucherValidity(id: number): Promise<{ valid: boolean; message: string }> {
    return this.request<{ valid: boolean; message: string }>(`/billing/vouchers/${id}/check_validity/`, {
      method: 'POST',
    })
  }

  async validateVoucherCode(code: string, pin?: string): Promise<{ valid: boolean; message?: string; voucher?: Voucher }> {
    return this.request<{ valid: boolean; message?: string; voucher?: Voucher }>('/billing/vouchers/validate/', {
      method: 'POST',
      body: JSON.stringify({ code, pin }),
    })
  }

  async getVoucherUsageHistory(id: number): Promise<VoucherUsage[]> {
    return this.request<VoucherUsage[]>(`/billing/vouchers/${id}/usage_history/`)
  }

  // ------------------------------------------
  // VOUCHER USAGES - /billing/voucher-usages/
  // ------------------------------------------

  async getVoucherUsages(params?: Record<string, string>): Promise<PaginatedResponse<VoucherUsage>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<VoucherUsage>>(`/billing/voucher-usages/${queryString}`)
  }

  async getCustomerVoucherHistory(customerId: number): Promise<VoucherUsage[]> {
    return this.request<VoucherUsage[]>(`/billing/voucher-usages/customer_history/?customer_id=${customerId}`)
  }

  // ------------------------------------------
  // ANALYTICS - /analytics/
  // ------------------------------------------

  /**
   * Get complete analytics dashboard data
   * @param timeRange - Time range filter: 7d, 30d, 90d, 12m, ytd
   */
  async getAnalyticsDashboard(timeRange: string = '30d'): Promise<AnalyticsDashboard> {
    return this.request<AnalyticsDashboard>(`/analytics/dashboard/?time_range=${timeRange}`)
  }

  /**
   * Get key performance indicators
   */
  async getAnalyticsKPIs(timeRange: string = '30d'): Promise<AnalyticsKPIs> {
    return this.request<AnalyticsKPIs>(`/analytics/kpis/?time_range=${timeRange}`)
  }

  /**
   * Get revenue trend data
   */
  async getRevenueData(timeRange: string = '30d'): Promise<RevenueData[]> {
    return this.request<RevenueData[]>(`/analytics/revenue/?time_range=${timeRange}`)
  }

  /**
   * Get user growth data
   */
  async getUserGrowthData(timeRange: string = '30d'): Promise<UserGrowthData[]> {
    return this.request<UserGrowthData[]>(`/analytics/user-growth/?time_range=${timeRange}`)
  }

  /**
   * Get plan performance analytics
   */
  async getPlanPerformance(timeRange: string = '30d'): Promise<PlanPerformance[]> {
    return this.request<PlanPerformance[]>(`/analytics/plans/?time_range=${timeRange}`)
  }

  /**
   * Get location/area based analytics
   */
  async getLocationAnalytics(timeRange: string = '30d'): Promise<LocationAnalytics[]> {
    return this.request<LocationAnalytics[]>(`/analytics/locations/?time_range=${timeRange}`)
  }

  /**
   * Get router performance analytics
   */
  async getRouterAnalytics(timeRange: string = '30d'): Promise<RouterAnalytics[]> {
    return this.request<RouterAnalytics[]>(`/analytics/routers/?time_range=${timeRange}`)
  }

  /**
   * Get payment method breakdown
   */
  async getPaymentMethodAnalytics(timeRange: string = '30d'): Promise<PaymentMethodAnalytics[]> {
    return this.request<PaymentMethodAnalytics[]>(`/analytics/payment-methods/?time_range=${timeRange}`)
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(timeRange: string = '30d'): Promise<PaymentStats> {
    return this.request<PaymentStats>(`/analytics/payment-stats/?time_range=${timeRange}`)
  }

  /**
   * Get user type distribution (hotspot, pppoe, static)
   */
  async getUserTypeDistribution(timeRange: string = '30d'): Promise<UserTypeDistribution> {
    return this.request<UserTypeDistribution>(`/analytics/user-distribution/?time_range=${timeRange}`)
  }

  /**
   * Get revenue breakdown by connection type
   */
  async getRevenueByType(timeRange: string = '30d'): Promise<RevenueByType> {
    return this.request<RevenueByType>(`/analytics/revenue-by-type/?time_range=${timeRange}`)
  }

  /**
   * Get revenue forecast for upcoming months
   */
  async getRevenueForecast(): Promise<RevenueForecast[]> {
    return this.request<RevenueForecast[]>('/analytics/revenue-forecast/')
  }

  /**
   * Get revenue target progress
   */
  async getRevenueTargetProgress(timeRange: string = '30d'): Promise<RevenueTargetProgress> {
    return this.request<RevenueTargetProgress>(`/analytics/revenue-target/?time_range=${timeRange}`)
  }

  /**
   * Get network statistics summary
   */
  async getNetworkStats(): Promise<NetworkStats> {
    return this.request<NetworkStats>('/analytics/network-stats/')
  }

  /**
   * Export analytics report
   * @param format - Export format: csv, pdf, xlsx
   */
  async exportAnalyticsReport(timeRange: string = '30d', format: 'csv' | 'pdf' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/analytics/export/?time_range=${timeRange}&format=${format}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to export analytics report')
    }
    return response.blob()
  }

  // ------------------------------------------
  // SUPPORT TICKETS - /support/tickets/
  // ------------------------------------------

  async getTickets(params?: Record<string, string>): Promise<PaginatedResponse<SupportTicket>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<SupportTicket>>(`/support/tickets/${queryString}`)
  }

  async getTicket(id: number): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${id}/`)
  }

  async createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
    return this.request<SupportTicket>('/support/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTicket(id: number): Promise<void> {
    await this.request(`/support/tickets/${id}/`, { method: 'DELETE' })
  }

  async assignTicket(id: number, userId: number): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to: userId }),
    })
  }

  async updateTicketStatus(id: number, status: string, resolution?: string): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${id}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution }),
    })
  }

  async replyToTicket(id: number, data: TicketReplyRequest): Promise<SupportTicketMessage> {
    return this.request<SupportTicketMessage>(`/support/tickets/${id}/reply/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getTicketMessages(id: number): Promise<SupportTicketMessage[]> {
    return this.request<SupportTicketMessage[]>(`/support/tickets/${id}/messages/`)
  }

  async getTicketStats(): Promise<SupportTicketStats> {
    return this.request<SupportTicketStats>('/support/tickets/stats/')
  }

  async getMyTickets(params?: Record<string, string>): Promise<PaginatedResponse<SupportTicket>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<SupportTicket>>(`/support/tickets/my_tickets/${queryString}`)
  }

  async escalateTicket(id: number, reason?: string): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${id}/escalate/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // ------------------------------------------
  // SMS MESSAGING - /messaging/sms/
  // ------------------------------------------

  async getSMSMessages(params?: Record<string, string>): Promise<PaginatedResponse<SMSMessage>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<SMSMessage>>(`/messaging/sms/${queryString}`)
  }

  async getSMSMessage(id: number): Promise<SMSMessage> {
    return this.request<SMSMessage>(`/messaging/sms/${id}/`)
  }

  async sendSMS(data: SendSMSRequest): Promise<SMSMessage | SMSMessage[]> {
    return this.request<SMSMessage | SMSMessage[]>('/messaging/sms/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async sendBulkSMS(data: SendBulkSMSRequest): Promise<SMSCampaign> {
    return this.request<SMSCampaign>('/messaging/sms/send_bulk/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async retrySMS(id: number): Promise<SMSMessage> {
    return this.request<SMSMessage>(`/messaging/sms/${id}/retry/`, {
      method: 'POST',
    })
  }

  async getSMSStats(): Promise<SMSStats> {
    return this.request<SMSStats>('/messaging/sms/stats/')
  }

  async getSMSBalance(): Promise<SMSBalance> {
    return this.request<SMSBalance>('/messaging/sms/balance/')
  }

  // ------------------------------------------
  // SMS TEMPLATES - /messaging/templates/
  // ------------------------------------------

  async getSMSTemplates(params?: Record<string, string>): Promise<PaginatedResponse<SMSTemplate>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<SMSTemplate>>(`/messaging/templates/${queryString}`)
  }

  async getSMSTemplate(id: number): Promise<SMSTemplate> {
    return this.request<SMSTemplate>(`/messaging/templates/${id}/`)
  }

  async createSMSTemplate(data: Partial<SMSTemplate>): Promise<SMSTemplate> {
    return this.request<SMSTemplate>('/messaging/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSMSTemplate(id: number, data: Partial<SMSTemplate>): Promise<SMSTemplate> {
    return this.request<SMSTemplate>(`/messaging/templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSMSTemplate(id: number): Promise<void> {
    await this.request(`/messaging/templates/${id}/`, { method: 'DELETE' })
  }

  // ------------------------------------------
  // SMS CAMPAIGNS - /messaging/campaigns/
  // ------------------------------------------

  async getSMSCampaigns(params?: Record<string, string>): Promise<PaginatedResponse<SMSCampaign>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<SMSCampaign>>(`/messaging/campaigns/${queryString}`)
  }

  async getSMSCampaign(id: number): Promise<SMSCampaign> {
    return this.request<SMSCampaign>(`/messaging/campaigns/${id}/`)
  }

  async createSMSCampaign(data: Partial<SMSCampaign>): Promise<SMSCampaign> {
    return this.request<SMSCampaign>('/messaging/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSMSCampaign(id: number, data: Partial<SMSCampaign>): Promise<SMSCampaign> {
    return this.request<SMSCampaign>(`/messaging/campaigns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSMSCampaign(id: number): Promise<void> {
    await this.request(`/messaging/campaigns/${id}/`, { method: 'DELETE' })
  }

  async startSMSCampaign(id: number): Promise<SMSCampaign> {
    return this.request<SMSCampaign>(`/messaging/campaigns/${id}/start/`, {
      method: 'POST',
    })
  }

  async cancelSMSCampaign(id: number): Promise<SMSCampaign> {
    return this.request<SMSCampaign>(`/messaging/campaigns/${id}/cancel/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // NETILY SUBSCRIPTIONS - /subscriptions/
  // ------------------------------------------

  // Simple dedup cache: prevents 3+ components from hitting the API simultaneously
  private _subscriptionCache: { data: CompanySubscription | null; ts: number } | null = null
  private _subscriptionInflight: Promise<CompanySubscription | null> | null = null
  private static readonly SUB_CACHE_TTL = 30_000 // 30 seconds

  async getNetilyPlans(): Promise<NetilyPlan[]> {
    return this.request<NetilyPlan[]>('/subscriptions/plans/')
  }

  async getCurrentSubscription(): Promise<CompanySubscription | null> {
    // Return cached result if fresh (< 30s old)
    if (this._subscriptionCache && Date.now() - this._subscriptionCache.ts < AdminApiService.SUB_CACHE_TTL) {
      return this._subscriptionCache.data
    }
    // Deduplicate: if a request is already in-flight, piggy-back on it
    if (this._subscriptionInflight) {
      return this._subscriptionInflight
    }
    this._subscriptionInflight = (async () => {
      try {
        const data = await this.request<CompanySubscription>('/subscriptions/current/')
        this._subscriptionCache = { data, ts: Date.now() }
        return data
      } catch {
        this._subscriptionCache = { data: null, ts: Date.now() }
        return null
      } finally {
        this._subscriptionInflight = null
      }
    })()
    return this._subscriptionInflight
  }

  async getUsageStats(): Promise<UsageStats | null> {
    try {
      return await this.request<UsageStats>('/subscriptions/usage/')
    } catch {
      return null
    }
  }

  async initiateSubscriptionPayment(data: {
    plan_id: string  // 'starter' | 'professional' | 'enterprise'
    payment_method: 'mpesa_stk' | 'mpesa_paybill' | 'bank_transfer'
    phone_number?: string
    billing_period: 'monthly' | 'yearly'
  }): Promise<{ 
    checkout_request_id: string
    merchant_request_id: string
    message: string 
  }> {
    return this.request('/subscriptions/pay/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // ISP PAYOUT CONFIG - /subscriptions/payout-config/
  // ------------------------------------------

  async getPayoutConfig(): Promise<ISPPayoutConfig | null> {
    try {
      return await this.request<ISPPayoutConfig>('/subscriptions/payout-config/')
    } catch {
      return null
    }
  }

  async updatePayoutConfig(data: Partial<ISPPayoutConfig>): Promise<ISPPayoutConfig> {
    return this.request<ISPPayoutConfig>('/subscriptions/payout-config/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async verifyPayoutConfig(): Promise<{ verified: boolean; message: string }> {
    return this.request('/subscriptions/payout-config/verify/', {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // ISP SETTLEMENTS - /subscriptions/settlements/
  // ------------------------------------------

  async getSettlements(params?: Record<string, string>): Promise<PaginatedResponse<ISPSettlement>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<ISPSettlement>>(`/subscriptions/settlements/${queryString}`)
  }

  async getSettlementSummary(): Promise<SettlementSummary> {
    return this.request<SettlementSummary>('/subscriptions/settlements/summary/')
  }

  async requestManualPayout(): Promise<{ message: string; settlement_id?: number }> {
    return this.request('/subscriptions/settlements/request-payout/', {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // VPN MANAGEMENT - /vpn/
  // ------------------------------------------

  async getVPNDashboard(): Promise<VPNDashboardStats> {
    return this.request<VPNDashboardStats>('/vpn/dashboard/')
  }

  async getVPNServers(): Promise<VPNServer[]> {
    try {
      const response = await this.request<PaginatedResponse<VPNServer>>('/vpn/servers/')
      return response.results || []
    } catch {
      return []
    }
  }

  async getVPNServer(id?: number): Promise<VPNServer | null> {
    try {
      if (id) {
        return await this.request<VPNServer>(`/vpn/servers/${id}/`)
      }
      // Get first server if no ID provided
      const servers = await this.getVPNServers()
      return servers.length > 0 ? servers[0] : null
    } catch {
      return null
    }
  }

  async updateVPNServer(id: number, data: Partial<VPNServer>): Promise<VPNServer> {
    return this.request<VPNServer>(`/vpn/servers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async startVPNServer(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/vpn/servers/${id}/start/`, {
      method: 'POST',
    })
  }

  async stopVPNServer(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/vpn/servers/${id}/stop/`, {
      method: 'POST',
    })
  }

  async getVPNCertificates(params?: Record<string, string>): Promise<PaginatedResponse<VPNCertificate>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<VPNCertificate>>(`/vpn/certificates/${queryString}`)
  }

  async getVPNCertificate(id: number): Promise<VPNCertificate> {
    return this.request<VPNCertificate>(`/vpn/certificates/${id}/`)
  }

  async createVPNCertificate(data: CreateVPNCertificateRequest): Promise<VPNCertificateWithConfig> {
    return this.request<VPNCertificateWithConfig>('/vpn/certificates/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async revokeVPNCertificate(id: number, reason?: string): Promise<VPNCertificate> {
    return this.request<VPNCertificate>(`/vpn/certificates/${id}/revoke/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async downloadVPNConfig(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/vpn/certificates/${id}/download/`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to download config')
    return response.blob()
  }

  async regenerateVPNCertificate(id: number): Promise<VPNCertificateWithConfig> {
    return this.request<VPNCertificateWithConfig>(`/vpn/certificates/${id}/regenerate/`, {
      method: 'POST',
    })
  }

  async getVPNConnections(): Promise<VPNConnection[]> {
    // Backend returns { count, connections } for active connections
    const response = await this.request<{ count: number; connections: VPNConnection[] }>('/vpn/connections/active/')
    return response.connections || []
  }

  async disconnectVPNUser(commonName: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/vpn/connections/disconnect/', {
      method: 'POST',
      body: JSON.stringify({ common_name: commonName }),
    })
  }

  // ------------------------------------------
  // RADIUS MANAGEMENT - /radius/
  // ------------------------------------------

  async getRADIUSDashboard(): Promise<RADIUSDashboardStats> {
    return this.request<RADIUSDashboardStats>('/radius/dashboard/')
  }

  async getRADIUSUsers(params?: Record<string, string>): Promise<PaginatedResponse<RADIUSUser>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RADIUSUser>>(`/radius/users/${queryString}`)
  }

  async getRADIUSUser(username: string): Promise<RADIUSUser> {
    return this.request<RADIUSUser>(`/radius/users/${username}/`)
  }

  async createRADIUSUser(data: CreateRADIUSUserRequest): Promise<RADIUSUser> {
    return this.request<RADIUSUser>('/radius/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRADIUSUser(username: string, data: UpdateRADIUSUserRequest): Promise<RADIUSUser> {
    return this.request<RADIUSUser>(`/radius/users/${username}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRADIUSUser(username: string): Promise<void> {
    await this.request(`/radius/users/${username}/`, { method: 'DELETE' })
  }

  async enableRADIUSUser(username: string): Promise<RADIUSUser> {
    return this.request<RADIUSUser>(`/radius/users/${username}/enable/`, {
      method: 'POST',
    })
  }

  async disableRADIUSUser(username: string): Promise<RADIUSUser> {
    return this.request<RADIUSUser>(`/radius/users/${username}/disable/`, {
      method: 'POST',
    })
  }

  async disconnectRADIUSUser(username: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/radius/users/${username}/disconnect/`, {
      method: 'POST',
    })
  }

  async getRADIUSProfiles(params?: Record<string, string>): Promise<PaginatedResponse<RADIUSProfile>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RADIUSProfile>>(`/radius/profiles/${queryString}`)
  }

  async getRADIUSProfile(id: number): Promise<RADIUSProfile> {
    return this.request<RADIUSProfile>(`/radius/profiles/${id}/`)
  }

  async createRADIUSProfile(data: CreateRADIUSProfileRequest): Promise<RADIUSProfile> {
    return this.request<RADIUSProfile>('/radius/profiles/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRADIUSProfile(id: number, data: Partial<CreateRADIUSProfileRequest>): Promise<RADIUSProfile> {
    return this.request<RADIUSProfile>(`/radius/profiles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRADIUSProfile(id: number): Promise<void> {
    await this.request(`/radius/profiles/${id}/`, { method: 'DELETE' })
  }

  async getRADIUSNASList(params?: Record<string, string>): Promise<PaginatedResponse<RADIUSNAS>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RADIUSNAS>>(`/radius/nas/${queryString}`)
  }

  async getRADIUSNAS(id: number): Promise<RADIUSNAS> {
    return this.request<RADIUSNAS>(`/radius/nas/${id}/`)
  }

  async createRADIUSNAS(data: CreateRADIUSNASRequest): Promise<RADIUSNAS> {
    return this.request<RADIUSNAS>('/radius/nas/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRADIUSNAS(id: number, data: Partial<CreateRADIUSNASRequest>): Promise<RADIUSNAS> {
    return this.request<RADIUSNAS>(`/radius/nas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRADIUSNAS(id: number): Promise<void> {
    await this.request(`/radius/nas/${id}/`, { method: 'DELETE' })
  }

  async getRADIUSSessions(params?: Record<string, string>): Promise<PaginatedResponse<RADIUSAccountingSession>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RADIUSAccountingSession>>(`/radius/accounting/${queryString}`)
  }

  async getRADIUSActiveSessions(): Promise<RADIUSAccountingSession[]> {
    try {
      const response = await this.request<{ count: number; sessions: RADIUSAccountingSession[] }>('/radius/sessions/active/')
      return response.sessions || []
    } catch {
      return []
    }
  }

  // Online user sessions — pre-formatted for display tables
  async getOnlineSessions(): Promise<{ count: number; sessions: OnlineSession[] }> {
    return this.request<{ count: number; sessions: OnlineSession[] }>('/radius/sessions/active/')
  }

  // ------------------------------------------
  // RADIUS CUSTOMER CREDENTIALS - /radius/credentials/
  // NEW: Auto-sync customer RADIUS credentials
  // ------------------------------------------

  async getRADIUSCredentials(params?: Record<string, string>): Promise<PaginatedResponse<CustomerRADIUSCredentials>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<CustomerRADIUSCredentials>>(`/radius/credentials/${queryString}`)
  }

  async getRADIUSCredential(id: string): Promise<CustomerRADIUSCredentials> {
    return this.request<CustomerRADIUSCredentials>(`/radius/credentials/${id}/`)
  }

  async createRADIUSCredential(data: {
    customer: string
    username: string
    password: string
    bandwidth_profile?: string
    connection_type?: 'PPPOE' | 'HOTSPOT' | 'BOTH'
    static_ip?: string
    simultaneous_use?: number
  }): Promise<CustomerRADIUSCredentials> {
    return this.request<CustomerRADIUSCredentials>('/radius/credentials/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRADIUSCredential(id: string, data: Partial<CustomerRADIUSCredentials>): Promise<CustomerRADIUSCredentials> {
    return this.request<CustomerRADIUSCredentials>(`/radius/credentials/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRADIUSCredential(id: string): Promise<void> {
    await this.request(`/radius/credentials/${id}/`, { method: 'DELETE' })
  }

  async syncRADIUSCredential(id: string): Promise<{ status: string; message: string; synced_at: string }> {
    return this.request(`/radius/credentials/${id}/sync/`, { method: 'POST' })
  }

  async enableRADIUSCredential(id: string): Promise<{ status: string; message: string }> {
    return this.request(`/radius/credentials/${id}/enable/`, { method: 'POST' })
  }

  async disableRADIUSCredential(id: string, reason?: string): Promise<{ status: string; message: string }> {
    return this.request(`/radius/credentials/${id}/disable/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Manually disabled' }),
    })
  }

  /**
   * Renew RADIUS credential subscription - extends expiration based on plan
   */
  async renewRADIUSCredential(id: string): Promise<{ 
    status: string
    message: string
    new_expiration: string | null
    username: string 
  }> {
    return this.request(`/radius/credentials/${id}/renew/`, { method: 'POST' })
  }

  /**
   * Update RADIUS credentials for a customer by customer ID
   * This is a convenience method that first fetches the credential ID
   */
  async updateRADIUSCredentials(customerId: number, data: { password?: string; username?: string }): Promise<CustomerRADIUSCredentials> {
    // First, find the credential for this customer
    const credentials = await this.getRADIUSCredentials({ customer: String(customerId) })
    if (credentials.results.length === 0) {
      throw new Error('No RADIUS credentials found for this customer')
    }
    const credentialId = credentials.results[0].id
    return this.updateRADIUSCredential(String(credentialId), data)
  }

  /**
   * Regenerate RADIUS username based on phone number
   */
  async regenerateRADIUSUsername(customerId: number): Promise<{ old_username: string; new_username: string; message: string }> {
    // First, find the credential for this customer
    const credentials = await this.getRADIUSCredentials({ customer: String(customerId) })
    if (credentials.results.length === 0) {
      throw new Error('No RADIUS credentials found for this customer')
    }
    const credentialId = credentials.results[0].id
    return this.request(`/radius/credentials/${credentialId}/regenerate_username/`, { method: 'POST' })
  }

  // ------------------------------------------
  // RADIUS TENANT CONFIGURATION - /radius/tenant-config/
  // NEW: Multi-tenant RADIUS management
  // ------------------------------------------

  async getRADIUSTenantConfigs(params?: Record<string, string>): Promise<PaginatedResponse<RADIUSTenantConfig>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<RADIUSTenantConfig>>(`/radius/tenant-config/${queryString}`)
  }

  async getRADIUSTenantConfig(id: number): Promise<RADIUSTenantConfig> {
    return this.request<RADIUSTenantConfig>(`/radius/tenant-config/${id}/`)
  }

  async createRADIUSTenantConfig(data: {
    schema_name: string
    tenant_name: string
    deployment_mode?: 'SHARED' | 'ISOLATED'
    radius_port_auth?: number
    radius_port_acct?: number
  }): Promise<RADIUSTenantConfig> {
    return this.request<RADIUSTenantConfig>('/radius/tenant-config/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRADIUSTenantConfig(id: number, data: Partial<RADIUSTenantConfig>): Promise<RADIUSTenantConfig> {
    return this.request<RADIUSTenantConfig>(`/radius/tenant-config/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRADIUSTenantConfig(id: number): Promise<void> {
    await this.request(`/radius/tenant-config/${id}/`, { method: 'DELETE' })
  }

  async configureRADIUSTenant(id: number): Promise<{ status: string; message: string; result: any }> {
    return this.request(`/radius/tenant-config/${id}/configure/`, { method: 'POST' })
  }

  async regenerateRADIUSTenantConfig(id: number, radius_secret?: string): Promise<{ status: string; message: string; result: any }> {
    return this.request(`/radius/tenant-config/${id}/regenerate/`, {
      method: 'POST',
      body: JSON.stringify({ radius_secret }),
    })
  }

  // ------------------------------------------
  // RADIUS SYNC - /radius/sync/
  // ------------------------------------------

  async syncRADIUS(syncType: 'customers' | 'routers' | 'profiles' | 'all'): Promise<{ status: string; result?: any; results?: any }> {
    return this.request(`/radius/sync/${syncType}/`, { method: 'POST' })
  }

  // ------------------------------------------
  // HOTSPOT MANAGEMENT - /hotspot/
  // ------------------------------------------

  async getHotspotPlans(routerId: number): Promise<HotspotPlan[]> {
    return this.request<HotspotPlan[]>(`/hotspot/admin/routers/${routerId}/plans/`)
  }

  async createHotspotPlan(routerId: number, data: Partial<HotspotPlan>): Promise<HotspotPlan> {
    return this.request<HotspotPlan>(`/hotspot/admin/routers/${routerId}/plans/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateHotspotPlan(routerId: number, planId: string, data: Partial<HotspotPlan>): Promise<HotspotPlan> {
    return this.request<HotspotPlan>(`/hotspot/admin/routers/${routerId}/plans/${planId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteHotspotPlan(routerId: number, planId: string): Promise<void> {
    await this.request(`/hotspot/admin/routers/${routerId}/plans/${planId}/`, { method: 'DELETE' })
  }

  async getHotspotSessions(routerId: number, params?: Record<string, string>): Promise<PaginatedResponse<HotspotSession>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<HotspotSession>>(`/hotspot/admin/routers/${routerId}/sessions/${queryString}`)
  }

  async getHotspotBranding(routerId: number): Promise<HotspotBranding | null> {
    try {
      return await this.request<HotspotBranding>(`/hotspot/admin/routers/${routerId}/branding/`)
    } catch {
      return null
    }
  }

  async updateHotspotBranding(routerId: number, data: Partial<HotspotBranding>): Promise<HotspotBranding> {
    return this.request<HotspotBranding>(`/hotspot/admin/routers/${routerId}/branding/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }
}

// Export singleton instance
export const adminApi = new AdminApiService()

// Export class for testing/extension
export { AdminApiService }
