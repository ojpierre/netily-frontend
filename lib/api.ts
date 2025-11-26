const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface LoginResponse {
  access: string
  refresh: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  full_name: string
  phone: string
  address: string
}

interface Customer {
  id: number
  full_name: string
  phone: string
  email: string
  address: string
  balance: string
  expiry_date: string
  is_active: boolean
  package: {
    id: number
    name: string
    price: string
    speed_down: number
    speed_up: number
    validity_days: number
  }
  user: {
    id: number
    username: string
    email: string
  }
}

interface Invoice {
  id: number
  amount: string
  invoice_date: string
  due_date: string
  paid: boolean
  paid_date: string | null
}

interface Payment {
  id: number
  amount: string
  payment_date: string
  payment_method: string
}

class ApiService {
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
      const error = await response.json().catch(() => ({ detail: 'Network error' }))
      throw new Error(error.detail || error.message || 'Request failed')
    }
    return response.json()
  }

  // AUTH
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return this.handleResponse<LoginResponse>(response)
  }

  async register(data: RegisterData): Promise<{ access: string; refresh: string; user: any }> {
    const response = await fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    return this.handleResponse(response)
  }

  // CUSTOMER
  async getCustomerProfile(): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers/me/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Customer>(response)
  }

  async updateCustomerProfile(data: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers/me/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<Customer>(response)
  }

  // INVOICES
  async getInvoices(): Promise<{ results: Invoice[] }> {
    const response = await fetch(`${API_BASE}/invoices/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // PAYMENTS
  async getPayments(): Promise<{ results: Payment[] }> {
    const response = await fetch(`${API_BASE}/payments/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createPayment(amount: string, method: string): Promise<Payment> {
    const response = await fetch(`${API_BASE}/payments/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount, payment_method: method }),
    })
    return this.handleResponse(response)
  }

  // PACKAGES
  async getPackages(): Promise<{ results: any[] }> {
    const response = await fetch(`${API_BASE}/packages/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }
}

export const api = new ApiService()
export type { Customer, Invoice, Payment, LoginResponse, RegisterData }