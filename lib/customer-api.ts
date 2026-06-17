/**
 * Customer Self-Service API
 * For end-user (customer) operations on ISP tenant subdomains
 */

import type {
  CustomerSelfRegisterRequest,
  CustomerSelfRegisterResponse,
  PhoneVerificationRequest,
  PhoneVerificationResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  CustomerDashboardData,
  CustomerPaymentInitiateRequest,
  CustomerPaymentInitiateResponse,
  CustomerPaymentStatus,
  CustomerPlan,
  CaptivePortalResponse,
  HotspotPurchaseRequest,
  HotspotPurchaseResponse,
  HotspotPurchaseStatus,
  Invoice,
  Payment,
} from './types'

// ==========================================
// CONFIGURATION
// ==========================================

const ENV_API_PORT = process.env.NEXT_PUBLIC_API_PORT || '8000'
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Get the API base URL preserving current domain context
 * 
 * This ensures that API calls are always made to the same domain
 * as the frontend, avoiding CORS/CSRF issues.
 */
const getBaseUrl = (): string => {
  // During SSR (Server Side Rendering), default to the env variable
  if (typeof window === 'undefined') {
    return ENV_API_URL || 'http://127.0.0.1:8000/api/v1'
  }
  
  // Always use the current protocol and hostname (e.g., bentrextechnologies.com)
  // This ensures the API call is same-origin and avoids CORS/CSRF issues.
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  
  // For local development with subdomains, we need to keep the port
  if (hostname.endsWith('.localhost') || hostname === 'localhost') {
    return `${protocol}//${hostname}:${ENV_API_PORT}/api/v1`
  }
  
  // For all other environments (including custom domains like bentrextechnologies.com),
  // use the same hostname for API calls
  return `${protocol}//${hostname}/api/v1`
}

// ==========================================
// CUSTOMER API SERVICE CLASS
// ==========================================

class CustomerApiService {
  private get baseUrl(): string {
    return getBaseUrl()
  }

  private getAuthHeaders(): HeadersInit {
    // Use customerToken which is set by customer-auth-context during login
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('customerToken') 
      : null
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `Server error: ${response.status}` 
      }))
      
      // Extract meaningful error message
      let errorMessage = 'Request failed'
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail.join(', ')
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail
        }
      } else if (error.non_field_errors) {
        errorMessage = Array.isArray(error.non_field_errors) 
          ? error.non_field_errors.join(', ') 
          : error.non_field_errors
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error(`[CustomerAPI] Error ${response.status}:`, errorMessage)
      throw new Error(errorMessage)
    }
    return response.json()
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log('[CustomerAPI] Request:', options.method || 'GET', url)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    })
    
    return this.handleResponse<T>(response)
  }

  // ------------------------------------------
  // AUTH / REGISTRATION - PUBLIC
  // ------------------------------------------

  /**
   * Customer self-registration (public endpoint)
   */
  async register(data: CustomerSelfRegisterRequest): Promise<CustomerSelfRegisterResponse> {
    const response = await fetch(`${this.baseUrl}/self-service/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })
    
    return this.handleResponse<CustomerSelfRegisterResponse>(response)
  }

  /**
   * Customer login (phone + password or phone + OTP)
   */
  async login(phone_number: string, password: string): Promise<{ access: string; refresh: string; user?: any }> {
    const response = await fetch(`${this.baseUrl}/self-service/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, password }),
      credentials: 'include',
    })
    
    return this.handleResponse(response)
  }

  /**
   * Customer login via email
   */
  async loginWithEmail(email: string, password: string): Promise<{ access: string; refresh: string; user?: any }> {
    const response = await fetch(`${this.baseUrl}/self-service/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    
    return this.handleResponse(response)
  }

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(data: PhoneVerificationRequest): Promise<PhoneVerificationResponse> {
    const response = await fetch(`${this.baseUrl}/self-service/verify-phone/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })
    
    return this.handleResponse<PhoneVerificationResponse>(response)
  }

  /**
   * Resend OTP code
   */
  async resendOTP(data: ResendOTPRequest): Promise<ResendOTPResponse> {
    const response = await fetch(`${this.baseUrl}/self-service/resend-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })
    
    return this.handleResponse<ResendOTPResponse>(response)
  }

  /**
   * Refresh access token
   */
  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await fetch(`${this.baseUrl}/core/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    
    return this.handleResponse(response)
  }

  // ------------------------------------------
  // CUSTOMER DASHBOARD - AUTHENTICATED
  // ------------------------------------------

  /**
   * Get customer dashboard data
   */
  async getDashboard(): Promise<CustomerDashboardData> {
    return this.request<CustomerDashboardData>('/self-service/dashboard/')
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    return this.request('/self-service/profile/')
  }

  /**
   * Update customer profile
   */
  async updateProfile(data: Partial<{
    first_name: string
    last_name: string
    email: string
    address: string
  }>): Promise<any> {
    return this.request('/self-service/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ------------------------------------------
  // PLANS - PUBLIC
  // ------------------------------------------

  /**
   * Get available ISP plans (public)
   */
  async getPlans(): Promise<{ plans: CustomerPlan[]; branding: any }> {
    const response = await fetch(`${this.baseUrl}/self-service/plans/`, {
      headers: { 'Content-Type': 'application/json' },
    })
    
    return this.handleResponse<{ plans: CustomerPlan[]; branding: any }>(response)
  }

  /**
   * Request a plan change (upgrade/downgrade)
   */
  async requestPlanChange(data: {
    plan_id: number
    request_type: 'upgrade' | 'downgrade'
    notes?: string
  }): Promise<any> {
    return this.request('/self-service/service-requests/', {
      method: 'POST',
      body: JSON.stringify({
        request_type: data.request_type,
        requested_plan: data.plan_id,
        subject: `Plan ${data.request_type}`,
        description: data.notes || `Requesting plan ${data.request_type}`,
        customer_notes: data.notes || '',
      }),
    })
  }

  // ------------------------------------------
  // PAYMENTS - AUTHENTICATED
  // ------------------------------------------

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiatePayment(data: CustomerPaymentInitiateRequest): Promise<CustomerPaymentInitiateResponse> {
    return this.request<CustomerPaymentInitiateResponse>('/self-service/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(paymentId: number): Promise<CustomerPaymentStatus> {
    return this.request<CustomerPaymentStatus>(`/self-service/payments/${paymentId}/status/`)
  }

  /**
   * Get payment history
   */
  async getPayments(page: number = 1): Promise<{ results: Payment[]; count: number }> {
    return this.request(`/self-service/payments/?page=${page}`)
  }

  // ------------------------------------------
  // INVOICES - AUTHENTICATED
  // ------------------------------------------

  /**
   * Get customer invoices
   */
  async getInvoices(page: number = 1): Promise<{ results: Invoice[]; count: number }> {
    return this.request(`/self-service/invoices/?page=${page}`)
  }

  /**
   * Get invoice details
   */
  async getInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/self-service/invoices/${id}/`)
  }

  // ------------------------------------------
  // USAGE - AUTHENTICATED
  // ------------------------------------------

  /**
   * Get usage statistics
   */
  async getUsage(): Promise<{
    data_used: string
    data_limit: string | null
    percentage: number
    history: Array<{ date: string; usage: string }>
  }> {
    return this.request('/self-service/usage/')
  }

  // ------------------------------------------
  // HOTSPOT - PUBLIC (No Auth Required)
  // ------------------------------------------

  /**
   * Get captive portal config and plans (public)
   */
  async getCaptivePortal(routerId: number | string, tenant: string): Promise<CaptivePortalResponse> {
    const response = await fetch(`${this.baseUrl}/hotspot/captive-portal/?router=${routerId}&tenant=${encodeURIComponent(tenant)}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    
    return this.handleResponse<CaptivePortalResponse>(response)
  }

  /**
   * Initiate hotspot purchase (public)
   */
  async purchaseHotspot(data: HotspotPurchaseRequest): Promise<HotspotPurchaseResponse> {
    const response = await fetch(`${this.baseUrl}/hotspot/purchase/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    return this.handleResponse<HotspotPurchaseResponse>(response)
  }

  /**
   * Check hotspot purchase status (public)
   */
  async getHotspotPurchaseStatus(sessionId: string): Promise<HotspotPurchaseStatus> {
    const response = await fetch(`${this.baseUrl}/hotspot/purchase/${sessionId}/status/`, {
      headers: { 'Content-Type': 'application/json' },
    })
    
    return this.handleResponse<HotspotPurchaseStatus>(response)
  }

  // ------------------------------------------
  // SUPPORT - AUTHENTICATED
  // ------------------------------------------

  /**
   * Get support tickets
   */
  async getTickets(): Promise<any[]> {
    return this.request('/self-service/tickets/')
  }

  /**
   * Create support ticket
   */
  async createTicket(data: { subject: string; message: string; priority?: string }): Promise<any> {
    return this.request('/self-service/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Reply to ticket
   */
  async replyToTicket(ticketId: number, message: string): Promise<any> {
    return this.request(`/self-service/tickets/${ticketId}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }
}

// Export singleton instance
export const customerApi = new CustomerApiService()
export default customerApi