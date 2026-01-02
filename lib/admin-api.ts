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
  OLT,
  PONPort,
  ONU,
  Subnet,
  IPAddress,
  DHCPLease,
  CPEDevice,
  CPETask,
  Invoice,
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
      // Send both username and email fields - backend will use whichever it expects
      body: JSON.stringify({ 
        username, 
        email: username, // In case backend expects email
        password 
      }),
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
  // IPAM - /network/ipam/
  // ------------------------------------------

  async getSubnets(params?: Record<string, string>): Promise<PaginatedResponse<Subnet>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<Subnet>>(`/network/ipam/subnets/${queryString}`)
  }

  async getSubnet(id: number): Promise<Subnet> {
    return this.request<Subnet>(`/network/ipam/subnets/${id}/`)
  }

  async createSubnet(data: Partial<Subnet>): Promise<Subnet> {
    return this.request<Subnet>('/network/ipam/subnets/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSubnet(id: number, data: Partial<Subnet>): Promise<Subnet> {
    return this.request<Subnet>(`/network/ipam/subnets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSubnet(id: number): Promise<void> {
    await this.request(`/network/ipam/subnets/${id}/`, {
      method: 'DELETE',
    })
  }

  async getIPAddresses(params?: Record<string, string>): Promise<PaginatedResponse<IPAddress>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<IPAddress>>(`/network/ipam/addresses/${queryString}`)
  }

  async assignIPAddress(id: number, customerId: number): Promise<IPAddress> {
    return this.request<IPAddress>(`/network/ipam/addresses/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    })
  }

  async releaseIPAddress(id: number): Promise<IPAddress> {
    return this.request<IPAddress>(`/network/ipam/addresses/${id}/release/`, {
      method: 'POST',
    })
  }

  async getDHCPLeases(params?: Record<string, string>): Promise<PaginatedResponse<DHCPLease>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<PaginatedResponse<DHCPLease>>(`/network/ipam/dhcp/leases/${queryString}`)
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
}

// Export singleton instance
export const adminApi = new AdminApiService()

// Export class for testing/extension
export { AdminApiService }
