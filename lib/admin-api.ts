const ADMIN_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface AdminLoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
    is_staff: boolean
    is_superuser: boolean
    is_active: boolean
    date_joined?: string
  }
}

interface AdminUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  date_joined?: string
}

interface AdminStats {
  total_users: number
  active_users: number
  expired_users: number
  total_revenue: number
  monthly_revenue: number
  bandwidth_usage: number
}

interface Customer {
  id: number
  user: {
    id: number
    username: string
    email: string
  }
  full_name: string
  phone: string
  address: string
  balance: string
  expiry_date: string
  is_active: boolean
  package?: {
    id: number
    name: string
    price: string
    speed_down: number
    speed_up: number
  }
  created_at: string
}

class AdminApiService {
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

  // AUTHENTICATION
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${ADMIN_API_BASE}/auth/admin/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    })
    return this.handleResponse<AdminLoginResponse>(response)
  }

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await fetch(`${ADMIN_API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    return this.handleResponse(response)
  }

  async getCurrentAdmin(): Promise<AdminUser> {
    const response = await fetch(`${ADMIN_API_BASE}/auth/admin/me/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<AdminUser>(response)
  }

  // DASHBOARD STATS
  async getStats(): Promise<AdminStats> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/stats/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<AdminStats>(response)
  }

  // USERS MANAGEMENT
  async getUsers(params?: { 
    page?: number
    search?: string
    is_active?: boolean
  }): Promise<{ results: Customer[]; count: number; next: string | null; previous: string | null }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    
    const url = `${ADMIN_API_BASE}/admin/customers/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getUser(userId: number): Promise<Customer> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/customers/${userId}/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Customer>(response)
  }

  async updateUser(userId: number, data: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/customers/${userId}/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<Customer>(response)
  }

  async deleteUser(userId: number): Promise<void> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/customers/${userId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
  }

  async activateUser(userId: number): Promise<Customer> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/customers/${userId}/activate/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Customer>(response)
  }

  async deactivateUser(userId: number): Promise<Customer> {
    const response = await fetch(`${ADMIN_API_BASE}/admin/customers/${userId}/deactivate/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Customer>(response)
  }

  // PACKAGES
  async getPackages(): Promise<{ results: any[] }> {
    const response = await fetch(`${ADMIN_API_BASE}/packages/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createPackage(data: any): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE}/packages/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  // PAYMENTS
  async getPayments(params?: { 
    page?: number
    customer?: number
  }): Promise<{ results: any[]; count: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.customer) queryParams.append('customer', params.customer.toString())
    
    const url = `${ADMIN_API_BASE}/admin/payments/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // SYSTEM LOGS
  async getLogs(params?: { 
    page?: number
    level?: string
  }): Promise<{ results: any[]; count: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.level) queryParams.append('level', params.level)
    
    const url = `${ADMIN_API_BASE}/admin/logs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }
}

export const adminApi = new AdminApiService()
export type { 
  AdminLoginResponse, 
  AdminUser, 
  AdminStats, 
  Customer 
}
