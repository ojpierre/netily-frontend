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
// OLT/ONU NETWORK TYPES
// ==========================================

export type OLTStatus = 'online' | 'offline' | 'warning' | 'maintenance'
export type ONUStatus = 'online' | 'offline' | 'los' | 'dying_gasp' | 'power_fail'
export type ONURegistrationStatus = 'registered' | 'unregistered' | 'pending'

export interface OLT {
  id: number
  name: string
  ip_address: string
  model: string
  manufacturer: 'huawei' | 'zte' | 'fiberhome' | 'nokia' | 'other'
  serial_number: string
  firmware_version?: string
  total_pon_ports: number
  active_pon_ports: number
  total_onus: number
  online_onus: number
  location: string
  latitude?: number
  longitude?: number
  status: OLTStatus
  uptime?: string
  cpu_usage?: number
  memory_usage?: number
  temperature?: number
  last_seen?: string
  created_at: string
  updated_at: string
}

export interface PONPort {
  id: number
  olt: number
  port_number: string
  name?: string
  status: 'active' | 'inactive' | 'fault'
  total_onus: number
  online_onus: number
  rx_power?: number
  tx_power?: number
  description?: string
}

export interface ONU {
  id: number
  serial_number: string
  pon_port: number
  pon_port_name?: string
  olt: number
  olt_name?: string
  customer?: number
  customer_name?: string
  model: string
  manufacturer: string
  firmware_version?: string
  status: ONUStatus
  registration_status: ONURegistrationStatus
  rx_power?: number
  tx_power?: number
  distance?: number  // in meters
  mac_address?: string
  ip_address?: string
  description?: string
  last_seen?: string
  online_since?: string
  created_at: string
  updated_at: string
}

export interface ONUOpticalInfo {
  rx_power: number
  tx_power: number
  temperature?: number
  voltage?: number
  bias_current?: number
  status: 'good' | 'warning' | 'critical'
}

// ==========================================
// IPAM (IP Address Management) TYPES
// ==========================================

export type SubnetStatus = 'active' | 'reserved' | 'deprecated'
export type IPAddressStatus = 'available' | 'assigned' | 'reserved' | 'dhcp'

export interface Subnet {
  id: number
  name: string
  network: string  // e.g., "192.168.1.0/24"
  gateway?: string
  vlan_id?: number
  description?: string
  status: SubnetStatus
  total_ips: number
  used_ips: number
  available_ips: number
  is_dhcp_enabled: boolean
  dhcp_range_start?: string
  dhcp_range_end?: string
  dns_servers?: string[]
  created_at: string
  updated_at: string
}

export interface IPAddress {
  id: number
  subnet: number
  subnet_name?: string
  address: string
  status: IPAddressStatus
  assigned_to?: number  // customer id
  customer_name?: string
  mac_address?: string
  hostname?: string
  description?: string
  lease_expires?: string
  created_at: string
  updated_at: string
}

export interface DHCPLease {
  id: number
  subnet: number
  ip_address: string
  mac_address: string
  hostname?: string
  customer?: number
  customer_name?: string
  lease_start: string
  lease_expires: string
  is_active: boolean
}

// ==========================================
// TR-069 / CPE TYPES
// ==========================================

export type CPEStatus = 'online' | 'offline' | 'pending' | 'error'

export interface CPEDevice {
  id: number
  serial_number: string
  oui: string  // Manufacturer OUI
  product_class: string
  manufacturer: string
  model: string
  firmware_version?: string
  hardware_version?: string
  customer?: number
  customer_name?: string
  ip_address?: string
  mac_address?: string
  status: CPEStatus
  last_inform?: string
  last_boot?: string
  uptime?: number
  parameters?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CPETask {
  id: number
  device: number
  task_type: 'reboot' | 'factory_reset' | 'firmware_update' | 'parameter_set' | 'diagnostic'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  parameters?: Record<string, any>
  result?: Record<string, any>
  error_message?: string
  created_at: string
  completed_at?: string
}

// ==========================================
// TECHNICIAN & DISPATCH TYPES
// ==========================================

export type TechnicianStatus = 'available' | 'busy' | 'offline' | 'on_leave'
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type JobType = 'installation' | 'repair' | 'maintenance' | 'relocation' | 'disconnection'

export interface Technician {
  id: number
  user: User
  employee_id: string
  phone: string
  skills: string[]
  status: TechnicianStatus
  current_location?: string
  latitude?: number
  longitude?: number
  total_jobs_completed: number
  average_rating: number
  created_at: string
}

export interface DispatchJob {
  id: number
  job_number: string
  customer: number
  customer_name: string
  customer_phone: string
  customer_address: string
  job_type: JobType
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: JobStatus
  assigned_to?: Technician
  scheduled_date: string
  scheduled_time?: string
  started_at?: string
  completed_at?: string
  notes?: string
  customer_rating?: number
  customer_feedback?: string
  equipment_used?: InventoryItem[]
  created_at: string
  updated_at: string
}

// ==========================================
// INVENTORY TYPES
// ==========================================

// Equipment Status (Asset-based tracking, not quantity-based)
export type EquipmentStatus = 
  | 'in_stock'     // Available in warehouse
  | 'assigned'     // Assigned to employee but not deployed
  | 'in_use'       // Deployed and in use by customer
  | 'maintenance'  // Under repair
  | 'faulty'       // Defective, needs repair
  | 'retired'      // End of life
  | 'lost'         // Cannot be located
  | 'disposed'     // Disposed of

export type EquipmentCondition = 'new' | 'good' | 'fair' | 'poor' | 'faulty'

export type EquipmentCategory = 
  | 'router' 
  | 'ont' 
  | 'onu' 
  | 'cable' 
  | 'splitter' 
  | 'connector' 
  | 'olt_module'
  | 'tools' 
  | 'other'

// Equipment Type (Category) - from API /api/inventory/equipment-types/
export interface EquipmentType {
  id: number
  name: string
  code: string
  description?: string
  parent?: number
  parent_name?: string
  min_stock_level: number
  item_count: number
  available_count: number
  is_active: boolean
  created_at: string
}

// Individual Equipment Item - from API /api/inventory/equipment/
export interface EquipmentItem {
  id: number
  equipment_type: number
  equipment_type_name: string
  name: string
  model?: string
  serial_number?: string
  asset_tag: string              // Auto-generated (e.g., "ONU-000001")
  supplier?: number
  supplier_name?: string
  purchase_date?: string
  purchase_price?: string
  warranty_expiry?: string
  status: EquipmentStatus
  condition: EquipmentCondition
  location?: string
  shelf?: string
  assigned_to?: number           // Employee ID
  assigned_to_name?: string
  assigned_to_customer?: number  // Customer ID if deployed
  assigned_to_customer_name?: string
  notes?: string
  age_in_months: number          // Calculated
  is_available: boolean          // Calculated (status='in_stock' and condition in ['new','good','fair'])
  created_at: string
  updated_at: string
}

// Equipment Assignment - from API /api/inventory/assignments/
export interface EquipmentAssignment {
  id: number
  equipment: number
  equipment_name: string
  equipment_serial: string
  employee_id: string
  employee_name: string
  purpose?: string
  assigned_date: string
  expected_return_date?: string
  actual_return_date?: string
  condition_at_assignment: EquipmentCondition
  condition_at_return?: EquipmentCondition
  notes?: string
  status: 'active' | 'returned' | 'overdue'
  created_at: string
}

// Stock Alert - from API /api/inventory/stock-alerts/
export interface StockAlert {
  id: number
  equipment_type: number
  equipment_type_name: string
  current_count: number
  min_stock_level: number
  shortfall: number
  severity: 'critical' | 'warning'
  created_at: string
}

// Legacy InventoryItem type for backward compatibility
export interface InventoryItem {
  id: number
  name: string
  equipment_type: EquipmentCategory
  serial_number?: string
  model?: string
  manufacturer?: string
  status: EquipmentStatus
  assigned_to_customer?: number
  assigned_to_technician?: number
  purchase_date?: string
  purchase_price?: string
  warranty_expires?: string
  location?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_name?: string
  contact_person?: string   // Alias for contact_name
  email?: string
  phone: string
  address?: string
  website?: string
  notes?: string
  payment_terms?: string
  is_active: boolean
  // Calculated fields
  total_purchases?: string
  equipment_count?: number
  created_at: string
}

// ==========================================
// BILLING EXTENDED TYPES
// ==========================================

export interface BillingCycle {
  id: number
  name: string
  cycle_type: 'monthly' | 'quarterly' | 'yearly'
  billing_day: number  // Day of month
  grace_period_days: number
  late_fee_percentage?: number
  is_active: boolean
}

export interface Promotion {
  id: number
  name: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  applicable_plans?: number[]
  min_purchase?: string
  max_discount?: string
  start_date: string
  end_date: string
  usage_limit?: number
  times_used: number
  is_active: boolean
  created_at: string
}

export interface MpesaTransaction {
  id: number
  transaction_id: string
  mpesa_receipt: string
  phone_number: string
  amount: string
  customer?: number
  customer_name?: string
  payment?: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  result_code?: string
  result_description?: string
  transaction_date: string
  created_at: string
}

// ==========================================
// ALERT & NOTIFICATION TYPES
// ==========================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface Alert {
  id: number
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  source: 'system' | 'network' | 'billing' | 'support'
  related_object_type?: string
  related_object_id?: number
  acknowledged_by?: User
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

export interface AlertRule {
  id: number
  name: string
  description?: string
  condition_type: 'threshold' | 'status_change' | 'event'
  condition_value: Record<string, any>
  severity: AlertSeverity
  notification_channels: ('email' | 'sms' | 'in_app')[]
  is_active: boolean
  created_at: string
}

// ==========================================
// HELPER TYPE UTILITIES
// ==========================================

export type CreateData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>
export type UpdateData<T> = Partial<CreateData<T>>
