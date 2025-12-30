/**
 * API Types for ISP Management System
 * Based on Django Backend Swagger API Structure
 * Base URL: http://127.0.0.1:8000/api/v1
 */

// ==========================================
// CORE MODULE TYPES
// ==========================================

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  date_joined?: string
  last_login?: string
}

export interface UserProfile {
  id: number
  user: User
  phone?: string
  avatar?: string
  timezone?: string
  language?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user?: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
  phone?: string
}

export interface RegisterResponse {
  access: string
  refresh: string
  user: User
  message?: string
}

export interface PasswordChangeRequest {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
}

export interface AuditLog {
  id: number
  user: User
  action: string
  model: string
  object_id: number
  changes: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export interface Company {
  id: number
  name: string
  logo?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: number
  name: string
  slug: string
  company: Company
  is_active: boolean
  created_at: string
}

export interface SystemSetting {
  id: number
  key: string
  value: string
  description?: string
  is_public: boolean
  category?: string
}

export interface DashboardStats {
  total_customers: number
  active_customers: number
  expired_customers: number
  online_customers: number
  total_revenue: number
  monthly_revenue: number
  pending_tickets: number
  network_uptime: number
  bandwidth_usage: number
  new_customers_this_month: number
}

// ==========================================
// CUSTOMER MODULE TYPES
// ==========================================

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type ConnectionType = 'hotspot' | 'pppoe' | 'static' | 'fiber' | 'wireless'

export interface Customer {
  id: number
  customer_number: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  phone_secondary?: string
  id_number?: string
  id_type?: 'national_id' | 'passport' | 'alien_id'
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  status: CustomerStatus
  balance: string
  credit_limit?: string
  created_at: string
  updated_at: string
  user?: User
  primary_address?: CustomerAddress
  services?: CustomerService[]
}

export interface CustomerAddress {
  id: number
  customer: number
  address_type: 'home' | 'office' | 'billing' | 'installation'
  street_address: string
  building_name?: string
  floor?: string
  apartment_number?: string
  county: string
  sub_county?: string
  ward?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  is_primary: boolean
  created_at: string
}

export interface CustomerDocument {
  id: number
  customer: number
  document_type: 'id_front' | 'id_back' | 'passport' | 'utility_bill' | 'contract' | 'other'
  file: string
  file_name: string
  description?: string
  is_verified: boolean
  verified_by?: User
  verified_at?: string
  created_at: string
}

export interface CustomerNote {
  id: number
  customer: number
  note: string
  note_type: 'general' | 'billing' | 'technical' | 'followup'
  is_followup: boolean
  followup_date?: string
  followup_completed: boolean
  created_by: User
  created_at: string
  updated_at: string
}

export interface NextOfKin {
  id: number
  customer: number
  full_name: string
  relationship: string
  phone: string
  email?: string
  address?: string
}

export interface CustomerService {
  id: number
  customer: number
  service_type: ConnectionType
  plan?: ServicePlan
  ip_address?: string
  mac_address?: string
  username?: string
  password?: string  // Only for creation/update, not returned
  device?: NetworkDevice
  installation_date?: string
  expiry_date?: string
  status: 'pending' | 'active' | 'suspended' | 'terminated'
  is_online?: boolean
  last_seen?: string
  data_used?: number
  data_limit?: number
  download_speed?: number
  upload_speed?: number
  created_at: string
  updated_at: string
}

export interface ServicePlan {
  id: number
  name: string
  description?: string
  price: string
  speed_down: number
  speed_up: number
  data_limit?: number
  validity_days: number
  plan_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  connection_type: ConnectionType
  is_active: boolean
  features?: string[]
  created_at: string
}

export interface OnboardingWizardData {
  // Step 1: Personal Info
  first_name: string
  last_name: string
  email: string
  phone: string
  id_number?: string
  
  // Step 2: Address
  address: Partial<CustomerAddress>
  
  // Step 3: Service Selection
  service_type: ConnectionType
  plan_id: number
  installation_date?: string
  
  // Step 4: Documents
  documents?: File[]
  
  // Step 5: Payment
  payment_method?: string
  amount_paid?: number
}

// ==========================================
// NETWORK MODULE TYPES (Future endpoints)
// ==========================================

export interface NetworkDevice {
  id: number
  name: string
  device_type: 'router' | 'olt' | 'switch' | 'ap' | 'ont'
  ip_address: string
  mac_address?: string
  model?: string
  manufacturer?: string
  location?: string
  status: 'online' | 'offline' | 'maintenance'
  last_seen?: string
  created_at: string
}

export interface Router {
  id: number
  name: string
  ip_address: string
  api_port: number
  api_username: string
  router_type: 'mikrotik' | 'ubiquiti' | 'cisco' | 'other'
  location?: string
  status: 'online' | 'offline'
  total_users: number
  active_users: number
  uptime?: string
  created_at: string
}

// ==========================================
// BILLING MODULE TYPES (Future endpoints)
// ==========================================

export interface Invoice {
  id: number
  invoice_number: string
  customer: number
  customer_name: string
  amount: string
  tax_amount?: string
  total_amount: string
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  due_date: string
  paid_date?: string
  items: InvoiceItem[]
  created_at: string
}

export interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unit_price: string
  total: string
}

export interface Payment {
  id: number
  payment_number: string
  customer: number
  customer_name: string
  invoice?: number
  amount: string
  payment_method: 'mpesa' | 'bank' | 'cash' | 'card' | 'voucher'
  payment_date: string
  reference_number?: string
  mpesa_receipt?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export interface Voucher {
  id: number
  code: string
  plan: ServicePlan
  amount: string
  status: 'unused' | 'used' | 'expired'
  used_by?: Customer
  used_at?: string
  expires_at: string
  created_by: User
  created_at: string
}

// ==========================================
// SUPPORT MODULE TYPES (Future endpoints)
// ==========================================

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'

export interface Ticket {
  id: number
  ticket_number: string
  customer: Customer
  subject: string
  description: string
  category: 'billing' | 'technical' | 'general' | 'installation' | 'complaint'
  priority: TicketPriority
  status: TicketStatus
  assigned_to?: User
  resolution?: string
  resolved_at?: string
  sla_due_date?: string
  sla_breached: boolean
  created_at: string
  updated_at: string
  messages?: TicketMessage[]
}

export interface TicketMessage {
  id: number
  ticket: number
  sender: User
  message: string
  is_internal: boolean
  attachments?: string[]
  created_at: string
}

// ==========================================
// LEADS MODULE TYPES
// ==========================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Lead {
  id: number
  full_name: string
  email?: string
  phone: string
  company?: string
  source: 'website' | 'referral' | 'social' | 'walk_in' | 'phone' | 'other'
  status: LeadStatus
  interested_plan?: ServicePlan
  notes?: string
  assigned_to?: User
  converted_customer?: Customer
  expected_close_date?: string
  created_at: string
  updated_at: string
}

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface RevenueAnalytics {
  total_revenue: number
  monthly_revenue: number
  daily_revenue: number
  revenue_by_plan: { plan: string; revenue: number }[]
  revenue_by_payment_method: { method: string; revenue: number }[]
  revenue_trend: { date: string; revenue: number }[]
}

export interface CustomerAnalytics {
  total_customers: number
  active_customers: number
  new_customers_this_month: number
  churn_rate: number
  acquisition_rate: number
  customers_by_plan: { plan: string; count: number }[]
  customers_by_status: { status: string; count: number }[]
}

export interface UsageAnalytics {
  total_bandwidth: number
  peak_bandwidth: number
  average_usage_per_user: number
  top_users: { customer: string; usage: number }[]
  usage_by_time: { hour: number; usage: number }[]
}

// ==========================================
// API RESPONSE WRAPPERS
// ==========================================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  message?: string
  errors?: Record<string, string[]>
  code?: string
}

// ==========================================
// HELPER TYPE UTILITIES
// ==========================================

export type CreateData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>
export type UpdateData<T> = Partial<CreateData<T>>
