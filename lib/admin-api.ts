/**
 * Admin API Service for ISP Management System
 * Aligned with Django Backend Swagger API
 * Base URL: http://127.0.0.1:8000/api/v1
 */

import type {
  LoginResponse,
  User,
  Customer,
  CustomerService,
  PaginatedResponse,
  DashboardStats,
  AuditLog,
} from './types'

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

// ==========================================
// ADMIN API SERVICE CLASS
// ==========================================

class AdminApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `Server error: ${response.status}` 
      }))
      throw new Error(error.detail || error.message || `Request failed with status ${response.status}`)
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

    const response = await fetch(url, config)
    return this.handleResponse<T>(response)
  }

  // ------------------------------------------
  // AUTHENTICATION - /core/auth/
  // ------------------------------------------

  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${this.baseUrl}/core/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    })
    
    const data = await this.handleResponse<AdminLoginResponse>(response)
    
    // Verify the user has admin privileges
    if (!data.user?.is_staff && !data.user?.is_superuser) {
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

  async createStaffUser(data: Partial<User>): Promise<User> {
    return this.request<User>('/core/users/', {
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
}

// Export singleton instance
export const adminApi = new AdminApiService()

// Export class for testing/extension
export { AdminApiService }
