/**
 * API Service for ISP Management System
 * Aligned with Django Backend Swagger API
 * Supports multi-tenant subdomains
 */

import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshResponse,
  User,
  UserProfile,
  Customer,
  CustomerService,
  CustomerAddress,
  CustomerDocument,
  CustomerNote,
  NextOfKin,
  Invoice,
  Payment,
  PaginatedResponse,
  DashboardStats,
  AuditLog,
  SystemSetting,
} from './types'

import { getApiBaseUrl, getSubdomainInfo } from './subdomain'

// Re-export types for backward compatibility
export type { LoginResponse, Customer, Invoice, Payment }

// ==========================================
// CONFIGURATION
// ==========================================

// Dynamic API URL based on subdomain (with fallback for SSR)
const getBaseUrl = (): string => {
  // During SSR, use environment variable or default
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
  }
  // On client, detect subdomain dynamically
  return getApiBaseUrl()
}

// Flag to use mock data when backend is unavailable
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true

// ==========================================
// API SERVICE CLASS
// ==========================================

class ApiService {
  private get baseUrl(): string {
    return getBaseUrl()
  }

  // ------------------------------------------
  // UTILITY METHODS
  // ------------------------------------------

  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    const authToken = token || this.getToken()
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }
    
    return headers
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `Server error: ${response.status}` 
      }))
      throw new Error(error.detail || error.message || 'Request failed')
    }
    return response.json()
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

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response)
    } catch (error) {
      if (USE_MOCK_DATA) {
        console.warn(`API call failed, using mock data for: ${endpoint}`)
      }
      throw error
    }
  }

  // ------------------------------------------
  // AUTHENTICATION - /core/auth/
  // ------------------------------------------

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/core/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return this.handleResponse<LoginResponse>(response)
  }

  async loginLegacy(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/core/auth/login/legacy/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return this.handleResponse<LoginResponse>(response)
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseUrl}/core/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return this.handleResponse<RegisterResponse>(response)
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/core/auth/logout/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })
  }

  async refreshToken(refresh: string): Promise<TokenRefreshResponse> {
    const response = await fetch(`${this.baseUrl}/core/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    return this.handleResponse<TokenRefreshResponse>(response)
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/core/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPassword,
      }),
    })
  }

  async resendVerification(email: string): Promise<void> {
    await fetch(`${this.baseUrl}/core/auth/resend-verification/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }

  async verifyEmail(token: string): Promise<void> {
    await fetch(`${this.baseUrl}/core/auth/verify-email/${token}/`, {
      method: 'GET',
    })
  }

  // ------------------------------------------
  // USERS - /core/users/
  // ------------------------------------------

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/core/users/me/')
  }

  async getUsers(params?: Record<string, string>): Promise<PaginatedResponse<User>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<User>>(`/core/users/${queryString}`)
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/core/users/${id}/`)
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.request<User>('/core/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/core/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/core/users/${id}/`, {
      method: 'DELETE',
    })
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/core/users/update_profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // PROFILE - /core/profile/
  // ------------------------------------------

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/core/profile/')
  }

  async patchProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/core/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // DASHBOARD - /core/dashboard/
  // ------------------------------------------

  async getDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/core/dashboard/')
  }

  // ------------------------------------------
  // SETTINGS - /core/settings/
  // ------------------------------------------

  async getSettings(): Promise<SystemSetting[]> {
    return this.request<SystemSetting[]>('/core/settings/')
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/core/settings/public/')
  }

  async getSetting(id: number): Promise<SystemSetting> {
    return this.request<SystemSetting>(`/core/settings/${id}/`)
  }

  async createSetting(data: Partial<SystemSetting>): Promise<SystemSetting> {
    return this.request<SystemSetting>('/core/settings/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSetting(id: number, data: Partial<SystemSetting>): Promise<SystemSetting> {
    return this.request<SystemSetting>(`/core/settings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSetting(id: number): Promise<void> {
    await this.request(`/core/settings/${id}/`, {
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

  // ------------------------------------------
  // CUSTOMER NESTED: ADDRESSES
  // ------------------------------------------

  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return this.request<CustomerAddress[]>(`/customers/${customerId}/addresses/`)
  }

  async createCustomerAddress(customerId: number, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
    return this.request<CustomerAddress>(`/customers/${customerId}/addresses/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomerAddress(customerId: number, addressId: number, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
    return this.request<CustomerAddress>(`/customers/${customerId}/addresses/${addressId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomerAddress(customerId: number, addressId: number): Promise<void> {
    await this.request(`/customers/${customerId}/addresses/${addressId}/`, {
      method: 'DELETE',
    })
  }

  async setAddressPrimary(customerId: number, addressId: number): Promise<void> {
    await this.request(`/customers/${customerId}/addresses/${addressId}/set_primary/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // CUSTOMER NESTED: SERVICES
  // ------------------------------------------

  async getCustomerServices(customerId: number): Promise<CustomerService[]> {
    return this.request<CustomerService[]>(`/customers/${customerId}/services/`)
  }

  async getCustomerService(customerId: number, serviceId: number): Promise<CustomerService> {
    return this.request<CustomerService>(`/customers/${customerId}/services/${serviceId}/`)
  }

  async createCustomerService(customerId: number, data: Partial<CustomerService>): Promise<CustomerService> {
    return this.request<CustomerService>(`/customers/${customerId}/services/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomerService(customerId: number, serviceId: number, data: Partial<CustomerService>): Promise<CustomerService> {
    return this.request<CustomerService>(`/customers/${customerId}/services/${serviceId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomerService(customerId: number, serviceId: number): Promise<void> {
    await this.request(`/customers/${customerId}/services/${serviceId}/`, {
      method: 'DELETE',
    })
  }

  async activateService(customerId: number, serviceId: number): Promise<void> {
    await this.request(`/customers/${customerId}/services/${serviceId}/activate/`, {
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

  async getCustomerServiceStats(customerId: number): Promise<any> {
    return this.request(`/customers/${customerId}/services/stats/`)
  }

  async getPendingActivations(): Promise<CustomerService[]> {
    return this.request<CustomerService[]>('/customers/services/pending-activations/')
  }

  // ------------------------------------------
  // CUSTOMER NESTED: DOCUMENTS
  // ------------------------------------------

  async getCustomerDocuments(customerId: number): Promise<CustomerDocument[]> {
    return this.request<CustomerDocument[]>(`/customers/${customerId}/documents/`)
  }

  async getDocumentTypes(customerId: number): Promise<string[]> {
    return this.request<string[]>(`/customers/${customerId}/documents/types/`)
  }

  async uploadDocument(customerId: number, file: File, documentType: string): Promise<CustomerDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)

    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/documents/upload/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: formData,
      }
    )
    return this.handleResponse<CustomerDocument>(response)
  }

  async verifyDocument(customerId: number, documentId: number): Promise<void> {
    await this.request(`/customers/${customerId}/documents/${documentId}/verify/`, {
      method: 'POST',
    })
  }

  async deleteDocument(customerId: number, documentId: number): Promise<void> {
    await this.request(`/customers/${customerId}/documents/${documentId}/`, {
      method: 'DELETE',
    })
  }

  // ------------------------------------------
  // CUSTOMER NESTED: NOTES
  // ------------------------------------------

  async getCustomerNotes(customerId: number): Promise<CustomerNote[]> {
    return this.request<CustomerNote[]>(`/customers/${customerId}/notes/`)
  }

  async createCustomerNote(customerId: number, data: Partial<CustomerNote>): Promise<CustomerNote> {
    return this.request<CustomerNote>(`/customers/${customerId}/notes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomerNote(customerId: number, noteId: number, data: Partial<CustomerNote>): Promise<CustomerNote> {
    return this.request<CustomerNote>(`/customers/${customerId}/notes/${noteId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomerNote(customerId: number, noteId: number): Promise<void> {
    await this.request(`/customers/${customerId}/notes/${noteId}/`, {
      method: 'DELETE',
    })
  }

  async markFollowupCompleted(customerId: number, noteId: number): Promise<void> {
    await this.request(`/customers/${customerId}/notes/${noteId}/mark_followup_completed/`, {
      method: 'POST',
    })
  }

  // ------------------------------------------
  // CUSTOMER NESTED: NEXT OF KIN
  // ------------------------------------------

  async getNextOfKin(customerId: number): Promise<NextOfKin[]> {
    return this.request<NextOfKin[]>(`/customers/${customerId}/next-of-kin/`)
  }

  async createNextOfKin(customerId: number, data: Partial<NextOfKin>): Promise<NextOfKin> {
    return this.request<NextOfKin>(`/customers/${customerId}/next-of-kin/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateNextOfKin(customerId: number, nokId: number, data: Partial<NextOfKin>): Promise<NextOfKin> {
    return this.request<NextOfKin>(`/customers/${customerId}/next-of-kin/${nokId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteNextOfKin(customerId: number, nokId: number): Promise<void> {
    await this.request(`/customers/${customerId}/next-of-kin/${nokId}/`, {
      method: 'DELETE',
    })
  }

  // ------------------------------------------
  // CUSTOMER ONBOARDING
  // ------------------------------------------

  async getOnboardingChecklist(customerId: number): Promise<any> {
    return this.request(`/customers/${customerId}/onboarding/checklist/`)
  }

  async completeOnboarding(customerId: number): Promise<void> {
    await this.request(`/customers/${customerId}/onboarding/complete/`, {
      method: 'POST',
    })
  }

  async onboardingWizard(data: any): Promise<Customer> {
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

  // ------------------------------------------
  // COMPANIES - /core/companies/
  // ------------------------------------------

  async getCompanies(): Promise<any[]> {
    return this.request<any[]>('/core/companies/')
  }

  async getCompany(id: number): Promise<any> {
    return this.request(`/core/companies/${id}/`)
  }

  async createCompany(data: any): Promise<any> {
    return this.request('/core/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCompany(id: number, data: any): Promise<any> {
    return this.request(`/core/companies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCompany(id: number): Promise<void> {
    await this.request(`/core/companies/${id}/`, {
      method: 'DELETE',
    })
  }

  // ------------------------------------------
  // TENANTS - /core/tenants/
  // ------------------------------------------

  async getTenants(): Promise<any[]> {
    return this.request<any[]>('/core/tenants/')
  }

  async getTenant(id: number): Promise<any> {
    return this.request(`/core/tenants/${id}/`)
  }

  async createTenant(data: any): Promise<any> {
    return this.request('/core/tenants/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTenant(id: number, data: any): Promise<any> {
    return this.request(`/core/tenants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTenant(id: number): Promise<void> {
    await this.request(`/core/tenants/${id}/`, {
      method: 'DELETE',
    })
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
  // PAYHERO PAYMENTS - /billing/
  // ------------------------------------------

  /**
   * Get customer invoices
   */
  async getInvoices(params?: Record<string, string>): Promise<{ results: Invoice[] }> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<{ results: Invoice[] }>(`/billing/invoices/${queryString}`)
  }

  /**
   * Get active payment methods for customer to choose from
   */
  async getActivePaymentMethods(): Promise<any[]> {
    return this.request<any[]>('/billing/payment-methods/?is_active=true')
  }

  /**
   * Initiate a payment using PayHero unified flow
   */
  async initiatePayment(data: {
    amount: number | string
    external_reference?: string
    channel_id?: number
    phone_number?: string
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
}

// Export singleton instance
export const api = new ApiService()

// Export class for testing/extension
export { ApiService }


// =============================
// HOTSPOT (Captive Portal)
// =============================

/**
 * Fetch available hotspot plans for a router
 */
export async function fetchHotspotPlans(routerId: string) {
  // TODO: Replace with real API call when backend is ready
  // return api.request(`/hotspot/plans/?router=${routerId}`)
  return [
    { id: 1, name: "1 Hour", price: 50, duration: "1h", speed: "5Mbps" },
    { id: 2, name: "1 Day", price: 200, duration: "24h", speed: "10Mbps" },
  ]
}

/**
 * Purchase hotspot access (plan) for a router
 */
export async function purchaseHotspotAccess({ routerId, planId, phoneNumber }: { routerId: string, planId: number, phoneNumber: string }) {
  // TODO: Replace with real API call when backend is ready
  // return api.request(`/hotspot/purchase/`, { method: 'POST', body: JSON.stringify({ router: routerId, plan: planId, phone_number: phoneNumber }) })
  return { status: 'success', message: 'Payment simulated. Access granted.' }
}
