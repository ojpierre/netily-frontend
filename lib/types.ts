/**
 * API Types for ISP Management System
 * Based on Django Backend Swagger API Structure
 * Base URL: http://127.0.0.1:8000/api/v1
 */

// ==========================================
// CORE MODULE TYPES
// ==========================================

// Staff role types supported by backend
export type StaffRole = 'staff' | 'technician' | 'accountant' | 'support'
export type UserRole = 'admin' | 'customer' | StaffRole

export type Gender = 'male' | 'female' | 'other'

export interface User {
  id: number
  username?: string
  email: string
  first_name?: string
  last_name?: string
  role?: UserRole
  phone_number?: string
  id_number?: string
  gender?: Gender
  date_of_birth?: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  is_verified?: boolean
  date_joined?: string
  last_login?: string
  company?: Company
}

export interface Company {
  id: number
  name: string
  email: string
}

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

// Request payload for creating staff users
export interface CreateStaffUserRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: StaffRole
  phone_number?: string
  id_number?: string
  gender?: Gender
  date_of_birth?: string
  is_active?: boolean
  is_verified?: boolean
  is_staff?: boolean
}

// Response from creating staff user
export interface CreateStaffUserResponse {
  user: User
  refresh: string
  access: string
  message: string
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

export interface Tenant {
  id: number
  name: string
  slug: string
  company: Company
  is_active: boolean
  created_at: string
  
  // NEW: Add these billing fields
  raw_active_pppoe_count?: number
  billed_pppoe_count?: number
  current_cycle_status?: 'active' | 'invoiced' | 'paid' | null
  current_cycle_end?: string | null
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
// PLATFORM CHANGELOG TYPES
// ==========================================

export interface PlatformChangelog {
  id: number;
  title: string;
  version: string | null;
  content: string;
  update_type: 'feature' | 'improvement' | 'bugfix' | 'maintenance';
  is_published: boolean;
  release_date: string;
  created_at: string;
}

// ==========================================
// CUSTOMER MODULE TYPES
// ==========================================

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type ConnectionType = 'hotspot' | 'pppoe' | 'static' | 'fiber' | 'wireless'

export interface Customer {
  id: number
  customer_number: string
  billing_account_number?: string
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

export type RouterType = 'mikrotik' | 'ubiquiti' | 'cisco' | 'other'
export type RouterStatus = 'online' | 'offline' | 'warning' | 'maintenance'

export interface RouterMetrics {
  cpu_usage: number
  memory_usage: number
  temperature?: number
  active_connections: number
  download_speed: number // Mbps
  upload_speed: number // Mbps
  packets_in?: number
  packets_out?: number
  bandwidth_in?: number
  bandwidth_out?: number
}

export interface RouterEvent {
  id: number
  router: number
  event_type: 'up' | 'down' | 'warning' | 'config_change' | 'reboot'
  message: string
  created_at: string
}

export interface Router {
  id: number
  name: string
  ip_address: string
  mac_address?: string
  api_port: number
  api_username: string
  api_password?: string  // Not returned by API, only for create/update
  secret?: string
  router_type: RouterType
  model?: string
  firmware_version?: string
  location?: string
  latitude?: number
  longitude?: number
  status: RouterStatus
  total_users: number
  active_users: number
  uptime?: string
  uptime_percentage?: number
  sla_target?: number
  last_seen?: string
  metrics?: RouterMetrics
  tags?: string[]
  notes?: string
  is_active: boolean
  // Authentication
  auth_key?: string
  is_authenticated?: boolean
  authenticated_at?: string
  // Cloud Controller / VPN
  vpn_provisioned?: boolean
  vpn_provisioned_at?: string
  vpn_ip_address?: string
  vpn_last_seen?: string
  ca_certificate?: string
  client_certificate?: string
  client_key?: string
  // Provisioning (v4)
  provision_slug?: string
  last_provisioned_at?: string
  routeros_version?: string
  magic_link?: string
  enable_openvpn?: boolean
  openvpn_server?: string
  openvpn_port?: number
  enable_hotspot?: boolean
  enable_pppoe?: boolean
  gateway_cidr?: string
  dns_name?: string
  wan_interface?: string
  hotspot_interfaces?: string[]
  pppoe_pool?: string
  pppoe_local_address?: string
  config_type?: string
  // Captive Portal Customisation
  template_id?: number
  hotspot_name?: string
  support_phone?: string
  announcement_text?: string
  created_at: string
  updated_at?: string
}

export type VPNTunnelStatus = 'connected' | 'disconnected' | 'unknown'

export interface RouterVPNStatus {
  vpn_provisioned: boolean
  vpn_ip_address: string | null
  vpn_provisioned_at: string | null
  tunnel_status: VPNTunnelStatus
  last_seen: string | null
  bytes_received: number
  bytes_sent: number
  connected_since: string | null
  certificate_expires_at: string | null
}

export interface RouterDashboardStats {
  total_routers: number
  online_routers: number
  offline_routers: number
  warning_routers: number
  maintenance_routers: number
  total_connected_users: number
  average_uptime: number
  below_sla_count: number
}

// ==========================================
// ROUTER LIVE STATUS & MONITORING TYPES
// ==========================================

export interface RouterLiveStatus {
  online: boolean
  identity: string
  model: string
  serial: string
  firmware: string
  uptime: string
  cpu_load: string
  free_memory: string
  total_memory: string
  free_hdd: string
  architecture: string
}

export interface RouterSystemHealth {
  online: boolean
  identity?: string
  model?: string
  cpu_load: string
  free_memory: string
  total_memory: string
  free_hdd?: string
  uptime?: string
}

// ==========================================
// ROUTER HOTSPOT TYPES
// ==========================================

export interface HotspotUser {
  '.id'?: string
  name: string
  password?: string
  profile: string
  disabled?: string | boolean
  'limit-uptime'?: string
  'limit-bytes-total'?: string
  'limit-bytes-in'?: string
  'limit-bytes-out'?: string
  comment?: string
  server?: string
}

export interface ActiveHotspotUser {
  '.id'?: string
  user: string
  address: string
  'mac-address'?: string
  'bytes-in': number | string
  'bytes-out'?: number | string
  uptime: string
  'idle-time'?: string
  server?: string
  'session-time-left'?: string
}

export interface HotspotUserStats {
  address: string
  mac_address: string
  bytes_in: number
  bytes_out: number
  session_time: string
  idle_time: string
  server: string
}

export interface CreateHotspotUserRequest {
  username: string
  password: string
  profile?: string
  limit_uptime?: string
  limit_bytes?: string
}

// ==========================================
// ROUTER PPPOE TYPES
// ==========================================

export interface PPPoEUser {
  '.id'?: string
  name: string
  password?: string
  profile: string
  'local-address'?: string
  'remote-address'?: string
  disabled?: string | boolean
  service?: string
  comment?: string
}

export interface ActivePPPoESession {
  '.id'?: string
  name: string
  service: string
  'caller-id'?: string
  address: string
  uptime: string
  'encoding'?: string
  'session-id'?: string
  'limit-bytes-in'?: string
  'limit-bytes-out'?: string
}

export interface PPPoEUserStats {
  address: string
  mac_address?: string
  bytes_in: number
  bytes_out: number
  session_time: string
  uptime: string
}

export interface CreatePPPoEUserRequest {
  username: string
  password: string
  profile?: string
  local_address?: string
  remote_address?: string
}

// ==========================================
// ROUTER FIREWALL TYPES
// ==========================================

export interface FirewallRule {
  '.id'?: string
  chain: string
  action: string
  'src-address'?: string
  'dst-address'?: string
  'src-port'?: string
  'dst-port'?: string
  protocol?: string
  'in-interface'?: string
  'out-interface'?: string
  comment?: string
  disabled?: string | boolean
  bytes?: string
  packets?: string
}

export interface CreateFirewallRuleRequest {
  chain: string
  action: string
  src_address?: string
  dst_address?: string
  protocol?: string
  dst_port?: string
  comment?: string
}

// ==========================================
// ROUTER QUEUE TYPES
// ==========================================

export interface SimpleQueue {
  '.id'?: string
  name: string
  target: string
  'max-limit'?: string
  'burst-limit'?: string
  'burst-threshold'?: string
  'burst-time'?: string
  priority?: string
  disabled?: string | boolean
  bytes?: string
  packets?: string
  'queues'?: string
  parent?: string
  comment?: string
}

export interface CreateQueueRequest {
  name: string
  target: string
  max_limit: string
  burst_limit?: string
  priority?: string
}

// ==========================================
// ROUTER INTERFACE TYPES
// ==========================================

export interface RouterInterface {
  '.id'?: string
  name: string
  type: string
  'mac-address'?: string
  mtu?: string
  'actual-mtu'?: string
  'l2mtu'?: string
  running?: string | boolean
  disabled?: string | boolean
  comment?: string
  'default-name'?: string
}

export interface InterfaceTraffic {
  name: string
  'rx-byte': string | number
  'tx-byte': string | number
  'rx-packet': string | number
  'tx-packet': string | number
  'rx-drop'?: string | number
  'tx-drop'?: string | number
  'rx-error'?: string | number
  'tx-error'?: string | number
}

// ==========================================
// ROUTER DHCP TYPES
// ==========================================

// This is the IPAM-aligned DHCPLease type (keeping the detailed one)
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
// ROUTER LOG TYPES
// ==========================================

export interface RouterLogEntry {
  '.id'?: string
  time: string
  topics: string
  message: string
}

// ==========================================
// ROUTER WIRELESS TYPES
// ==========================================

export interface WirelessInterface {
  '.id'?: string
  name: string
  'mac-address': string
  ssid?: string
  mode?: string
  band?: string
  frequency?: string
  'channel-width'?: string
  disabled?: string | boolean
  running?: string | boolean
  'noise-floor'?: string
  'overall-tx-ccq'?: string
  'registered-clients'?: number
}

export interface WirelessRegistration {
  '.id'?: string
  interface: string
  'mac-address': string
  'signal-strength'?: string
  'signal-to-noise'?: string
  'tx-rate'?: string
  'rx-rate'?: string
  uptime?: string
  'last-activity'?: string
  bytes?: string
  packets?: string
}

// ==========================================
// ROUTER ACTION RESPONSE TYPES
// ==========================================

export interface RouterActionResponse {
  status: 'success' | 'error'
  message: string
  error?: string
}

export interface PingResult {
  status: 'success' | 'error'
  message?: string
  results?: {
    target: string
    sent: number
    received: number
    'packet-loss': string
    'min-rtt': string
    'avg-rtt': string
    'max-rtt': string
  }
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
  subtotal?: string
  tax_amount?: string
  discount_amount?: string
  discount_reason?: string
  total_amount: string
  amount_paid?: string
  balance_due?: string
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  invoice_date: string
  due_date: string
  paid_date?: string
  sent_at?: string
  sent_via?: 'email' | 'sms' | 'both'
  items: InvoiceItem[]
  notes?: string
  terms?: string
  created_at: string
  updated_at?: string
  // ADD THESE:
  period_start?: string  // The start of the 30-day cycle
  period_end?: string    // The end of the 30-day cycle
  category?: 'subscription' | 'customer' // To distinguish Netily fees from ISP sales
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
  invoice_number?: string
  amount: string
  payment_method: 'mpesa' | 'bank' | 'cash' | 'card' | 'voucher' | 'paybill' | 'till' | 'payhero'
  payment_date: string
  reference_number?: string
  reference?: string  // Alias for reference_number
  transaction_id?: string  // Transaction ID from payment gateway
  external_reference?: string
  mpesa_receipt?: string
  notes?: string  // Payment notes/description
  // PayHero integration fields
  payhero_reference?: string
  payhero_checkout_id?: string
  payhero_response?: PayHeroResponse
  channel_id?: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  created_at: string
  updated_at?: string
  // Refund fields
  refund_amount?: string
  refund_reason?: string
  refunded_at?: string
  // Reconciliation fields
  reconciled?: boolean
  reconciled_at?: string
  reconciled_by?: number
}

// PayHero response structure
export interface PayHeroResponse {
  status?: string  // Can be various statuses from PayHero
  checkout_request_id?: string
  payment_url?: string  // For payment links
  paybill_number?: string  // For Paybill instructions
  till_number?: string  // For Till instructions
  account_number?: string
  bank_details?: {
    bank_name?: string
    account_name?: string
    account_number?: string
    branch?: string
  }
  message?: string
  error?: string
}

// Payment initiate request
export interface PaymentInitiateRequest {
  amount: number | string
  external_reference?: string  // Optional: unique reference (e.g., invoice_number)
  channel_id?: number  // Optional: force specific payment method
  phone_number?: string  // For STK Push
  customer_id?: number
  invoice_id?: number
}

// Payment initiate response
export interface PaymentInitiateResponse {
  status: 'success' | 'failed' | 'pending' | 'error'
  payment_id?: number
  payhero_response?: PayHeroResponse | null
  error?: string
  message?: string
}

// Note: Voucher interface is defined in "VOUCHERS (Backend Aligned)" section

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

// ==========================================
// IP POOL TYPES (Router-linked PPPoE Pools)
// ==========================================

export type IPPoolType = 'DHCP' | 'STATIC' | 'PPPOE' | 'HOTSPOT' | 'MANAGEMENT'

export interface IPPool {
  id: number
  router: number | null
  router_name: string
  router_ip: string
  router_status: string
  subnet: number | null
  subnet_cidr: string
  name: string
  pool_type: IPPoolType
  pool_type_display?: string
  // Cloud-Led subnet builder fields
  subnet_prefix?: string       // e.g. "10.50"
  subnet_octet?: number        // e.g. 3
  cidr_prefix?: number         // e.g. 24
  network_address?: string     // e.g. "10.50.3.0"
  broadcast_address?: string   // e.g. "10.50.3.255"
  cidr_notation?: string       // e.g. "10.50.3.0/24"
  // Computed range
  start_ip: string
  end_ip: string
  ip_range: string            // "start - end" display string
  gateway: string
  dns_servers: string
  lease_time: number | string | null
  description: string
  is_active: boolean
  total_ips: number
  used_ips: number
  available_ips: number
  utilization_percentage: number
  created_at: string
  updated_at: string
}

// Available IP for the "Long Dropdown" picker
export interface AvailableIP {
  id: number
  ip_address: string
}

export interface AvailableIPsResponse {
  pool_id: number
  pool_name: string
  total_available: number
  results: AvailableIP[]
}

// Subnet prefix/CIDR options from backend
export interface SubnetPrefixOption {
  value: string
  label: string
}

export interface CIDROption {
  value: number
  label: string
}

export interface SubnetPrefixOptionsResponse {
  prefixes: SubnetPrefixOption[]
  cidr_options: CIDROption[]
  blocked_prefixes: string[]
  default_prefix: string
}

export interface IPPoolsByRouter {
  router_id: number
  router_name: string
  router_ip: string
  router_status: string
  pools: IPPool[]
}

export interface IPPoolStatistics {
  total_ips: number
  used_ips: number
  available_ips: number
  utilization_percentage: number
  allocations: Array<{
    ip: string
    customer: string
    assigned_at: string
  }>
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

// Note: BillingCycle is now defined in "BILLING PLANS & CYCLES" section with full backend alignment

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
  mpesa_receipt?: string
  phone_number: string
  amount: string
  customer?: number
  customer_name?: string
  account_reference?: string
  result_desc?: string
  payment?: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT' | 'pending' | 'completed' | 'failed' | 'cancelled'
  result_code?: string
  result_description?: string
  transaction_date?: string
  created_at: string
}

export interface MpesaConfiguration {
  id: number
  business_shortcode: string
  shortcode_type: 'PAYBILL' | 'TILL'
  consumer_key?: string
  consumer_secret?: string
  passkey?: string
  is_sandbox: boolean
  is_active: boolean
  is_default: boolean
  validation_status?: 'VALID' | 'INVALID' | 'PENDING' | string
  validation_error?: string
  last_validated_at?: string | null
  created_at?: string
  updated_at?: string
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
// BILLING PLANS & CYCLES (Backend Aligned)
// ==========================================

export type PlanType = 'INTERNET' | 'ADDON' | 'BUNDLE' | 'TOPUP' | 'PPPOE' | 'HOTSPOT' | 'STATIC'

export interface Plan {
  id: number
  name: string
  code: string
  plan_type: PlanType
  description?: string
  base_price: string
  price?: string  // Alias for base_price
  setup_fee?: string
  download_speed?: number  // Speed value
  upload_speed?: number    // Speed value
  speed_unit?: 'MBPS' | 'KBPS'  // Speed unit
  data_limit?: number | null      // GB, null = unlimited
  // Validity - flexible time-based options
  validity_type?: 'DAYS' | 'HOURS' | 'MINUTES' | 'MONTHS' | 'UNLIMITED'
  duration_days?: number
  validity_days?: number   // Alias for duration_days
  validity_hours?: number  // For hourly plans
  validity_minutes?: number  // For minute-based plans (hotspot)
  validity_months?: number  // For monthly plans (LipaNet parity)
  validity_display?: string  // Human-readable validity string
  speed_display?: string  // Human-readable speed string
  total_validity_minutes?: number  // Total validity in minutes for RADIUS
  // Session/Connection limits
  max_sessions?: number  // Concurrent devices allowed
  session_timeout?: number  // Idle timeout in minutes
  // MikroTik QoS Priority (1=highest, 8=lowest)
  priority?: number
  // Burst Speed (for MikroTik)
  burst_enabled?: boolean
  burst_download?: number
  burst_upload?: number
  burst_threshold?: number  // KB
  burst_time?: number  // seconds
  // IP Pool linkage
  ip_pool?: number | null  // FK to IPPool
  ip_pool_name?: string    // Pool name (read-only)
  ip_pool_range?: string   // Pool IP range (read-only)
  // Fair Usage Policy
  fup_limit?: number       // Fair Usage Policy limit in GB
  fup_speed?: number       // Reduced speed after FUP
  // Status
  is_active: boolean
  is_public: boolean       // Visible to customers
  is_popular?: boolean
  features?: string[]
  subscribers_count?: number
  subscriber_count?: number  // Alias
  created_at: string
  updated_at: string
}

export interface PlanDashboardStats {
  total_plans: number
  active_plans: number
  inactive_plans: number
  hotspot_plans: number
  pppoe_plans: number
  static_plans: number
  total_subscribers: number
  popular_plans: number
}

// ==========================================
// ANALYTICS MODULE TYPES
// ==========================================

export interface AnalyticsKPIs {
  total_revenue: number
  total_users: number
  new_users: number
  arpu: number                    // Average Revenue Per User
  churn_rate: number              // Percentage
  conversion_rate: number         // Lead to customer conversion %
  revenue_change: number          // % change from previous period
  users_change: number            // % change from previous period
  new_users_change: number        // % change from previous period
  churn_change: number            // % change from previous period
}

export interface RevenueData {
  month: string
  revenue: number
  target: number
  users: number
}

export interface UserGrowthData {
  month: string
  new_users: number
  churn: number
  net_growth: number
}

export interface PlanPerformance {
  id: number
  name: string
  type: 'hotspot' | 'pppoe' | 'static'
  users: number
  revenue: number
  arpu: number
  share: number                   // % of total users
}

export interface LocationAnalytics {
  id: number
  name: string
  users: number
  revenue: number
  growth: number                  // % growth
  share: number                   // % of total revenue
}

export interface RouterAnalytics {
  id: number
  name: string
  users: number
  uptime: number                  // Percentage
  bandwidth: number               // Percentage utilization
  status: 'healthy' | 'warning' | 'critical'
}

export interface PaymentMethodAnalytics {
  method: string
  transactions: number
  amount: number
  percentage: number
}

export interface PaymentStats {
  success_rate: number
  failure_rate: number
  total_transactions: number
  average_transaction: number
  highest_transaction: number
  collection_rate: number
}

export interface UserTypeDistribution {
  hotspot_users: number
  pppoe_users: number
  static_users: number
  hotspot_percentage: number
  pppoe_percentage: number
  static_percentage: number
}

export interface RevenueByType {
  hotspot_revenue: number
  pppoe_revenue: number
  static_revenue: number
  hotspot_percentage: number
  pppoe_percentage: number
  static_percentage: number
}

export interface RevenueForecast {
  month: string
  projected_revenue: number
  growth_rate: number
}

export interface RevenueTargetProgress {
  current_revenue: number
  target_revenue: number
  progress_percentage: number
  monthly_average: number
  best_month_revenue: number
  projected_annual: number
}

export interface NetworkStats {
  avg_uptime: number
  active_routers: number
  avg_bandwidth: number
  warning_count: number
}

export interface AnalyticsDashboard {
  kpis: AnalyticsKPIs
  revenue_data: RevenueData[]
  user_growth_data: UserGrowthData[]
  plan_performance: PlanPerformance[]
  location_analytics: LocationAnalytics[]
  router_analytics: RouterAnalytics[]
  payment_methods: PaymentMethodAnalytics[]
  payment_stats: PaymentStats
  user_distribution: UserTypeDistribution
  revenue_by_type: RevenueByType
  revenue_forecast: RevenueForecast[]
  revenue_target: RevenueTargetProgress
  network_stats: NetworkStats
  time_range: string
}

export type BillingCycleStatus = 'OPEN' | 'CLOSED' | 'PROCESSING'

export interface BillingCycle {
  id: number
  name: string
  start_date: string
  end_date: string
  due_date: string
  status: BillingCycleStatus
  total_invoiced?: string
  total_collected?: string
  total_outstanding?: string
  invoice_count?: number
  created_at: string
  updated_at: string
}

export interface BillingCycleSummary {
  id: number
  name: string
  status: BillingCycleStatus
  start_date: string
  end_date: string
  total_invoices: number
  total_invoiced: string
  total_collected: string
  total_outstanding: string
  collection_rate: number  // Percentage
  overdue_count: number
  paid_count: number
  pending_count: number
}

// ==========================================
// PAYMENT METHODS
// ==========================================

export type PaymentMethodType =
  | 'MPESA'
  | 'MPESA_NUMBER'
  | 'MPESA_STK'
  | 'MPESA_TILL'
  | 'MPESA_PAYBILL'
  | 'AIRTEL_MONEY'
  | 'BANK'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYMENT_LINK'
  | 'MOBILE_MONEY'
  | 'CASH'
  | 'CHEQUE'
  | 'VOUCHER'
  | 'PAYPAL'
  | 'STRIPE'
  | 'OTHER'

export interface PaymentMethod {
  id: number
  name: string
  code: string
  method_type: PaymentMethodType
  description?: string
  // PayHero integration
  use_payhero: boolean
  payhero_channel_id?: number
  // Configuration fields (JSON for flexibility)
  config?: {
    // Mobile Money config
    mobile_provider?: 'SAFARICOM' | 'AIRTEL' | 'TELKOM'
    phone_number?: string
    // M-Pesa config
    consumer_key?: string
    consumer_secret?: string
    shortcode?: string
    paybill_number?: string
    till_number?: string
    account_reference?: string
    passkey?: string
    environment?: 'sandbox' | 'production'
    // Airtel Money config
    airtel_paybill?: string
    airtel_merchant_code?: string
    airtel_business_name?: string
    // Bank config
    bank_name?: string
    account_number?: string
    account_name?: string
    branch?: string
    swift_code?: string
    // Card config
    card_provider?: string
    merchant_id?: string
    api_key?: string
    public_key?: string
    // PayHero config
    payhero_api_key?: string
  }
  is_active: boolean
  is_default: boolean
  display_order?: number
  instructions?: string  // Instructions to show user (e.g., Paybill steps)
  created_at: string
  updated_at: string
}

// ==========================================
// RECEIPTS
// ==========================================

export type ReceiptStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED'

export interface Receipt {
  id: number
  receipt_number: string
  customer: number
  customer_name: string
  payment: number
  payment_reference?: string
  amount: string
  status: ReceiptStatus
  issued_by?: number
  issued_by_name?: string
  issued_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ==========================================
// VOUCHERS (Backend Aligned)
// ==========================================

export type VoucherType = 'PREPAID' | 'DISCOUNT' | 'CREDIT' | 'DATA' | 'TIME'
export type VoucherStatus = 'DRAFT' | 'ACTIVE' | 'AVAILABLE' | 'SOLD' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'
export type VoucherBatchStatus = 'DRAFT' | 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELLED'

export interface VoucherBatch {
  id: number
  batch_number: string
  name: string
  description?: string
  notes?: string
  voucher_type: VoucherType
  face_value: string
  price?: string
  plan_id?: number
  plan_name?: string
  validity_days?: number
  quantity: number
  generated_count: number
  sold_count: number
  redeemed_count: number
  total_vouchers?: number
  available_vouchers?: number
  status: VoucherBatchStatus
  expiry_date?: string
  prefix?: string
  code_length?: number
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

export interface Voucher {
  id: number
  batch: number
  batch_name?: string
  code: string
  pin?: string
  face_value: string
  remaining_value: string
  voucher_type: VoucherType
  status: VoucherStatus
  sold_to?: number
  sold_to_name?: string
  sold_at?: string
  sold_by?: number
  redeemed_by?: number
  redeemed_by_name?: string
  redeemed_at?: string
  expiry_date?: string
  created_at: string
}

export interface VoucherUsage {
  id: number
  voucher: number
  voucher_code: string
  customer: number
  customer_name: string
  amount: string
  description?: string
  created_at: string
}

export interface VoucherBatchStats {
  batch_id: number
  batch_name: string
  total_vouchers: number
  total?: number
  available?: number
  active_vouchers: number
  sold_vouchers: number
  sold?: number
  redeemed_vouchers: number
  redeemed?: number
  expired_vouchers: number
  expired?: number
  total_value: string
  sold_value: string
  redeemed_value: string
  remaining_value: string
  usage_rate: number  // Percentage
  redemption_rate?: number  // Percentage
  total_revenue?: string | number
}

// ==========================================
// HOTSPOT VOUCHERS (New Backend Contract)
// ==========================================

export type VoucherSummary = {
  total: number;
  used: number;
  unused: number;
};

export type VoucherItem = {
  id: string | number;
  code: string;
  pin: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED" | "RESERVED" | string;
  use_count: number;
  is_valid: boolean;
  expires_at: string;
  plan_id?: string | null;
  plan_name?: string | null;
  batch_number?: string;
};

export type VoucherListResponse = {
  summary: VoucherSummary;
  count: number;
  results: VoucherItem[];
};

export type VoucherGeneratePayload = {
  plan_id: string;
  quantity: number;
  valid_days?: number;
  prefix?: string;
};

export type VoucherGenerateResponse = {
  message: string;
  batch: {
    id: string | number;
    batch_number: string;
    plan_id: string;
    plan_name: string;
    price: string;
    valid_to: string;
  };
  vouchers: VoucherItem[];
};

// ==========================================
// DASHBOARD STATS (Backend Aligned)
// ==========================================

export interface InvoiceDashboardStats {
  total_invoices: number
  total_invoiced: string
  total_collected: string
  total_outstanding: string
  collection_rate: number
  overdue_invoices: number
  pending_invoices: number
  paid_invoices: number
  average_invoice_amount: string
  invoices_this_month: number
  revenue_this_month: string
  revenue_growth: number  // Percentage
  // Frontend computed stats
  total_paid?: number | string
  total_pending?: number | string
  total_overdue?: number | string
  paid_count?: number
  pending_count?: number
  overdue_count?: number
}

export interface PaymentDashboardStats {
  total_payments: number
  total_amount: string
  // Alias properties for frontend compatibility
  total_collected?: number | string
  total_pending?: number | string
  completed_count?: number
  pending_count?: number
  failed_count?: number
  mpesa_total?: number | string
  bank_total?: number | string
  // Original properties
  completed_payments: number
  pending_payments: number
  failed_payments: number
  refunded_amount: string
  payments_today: number
  amount_today: string
  payments_this_month: number
  amount_this_month: string
  payment_methods_breakdown?: {
    method: PaymentMethodType
    count: number
    amount: string
  }[]
  daily_trend?: {
    date: string
    count: number
    amount: string
  }[]
}

export interface CustomerOutstanding {
  customer_id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  total_outstanding: string
  overdue_amount: string
  overdue_invoices: number
  oldest_invoice_date?: string
}

// ==========================================
// SUPPORT TICKETS (Backend Aligned)
// ==========================================

export type SupportTicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SupportTicketCategory = 'technical' | 'billing' | 'account' | 'service' | 'other'

export interface SupportTicket {
  id: number
  ticket_number: string
  subject: string
  description: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  category: SupportTicketCategory
  customer_id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_plan?: string
  assigned_to?: number
  assigned_to_name?: string
  resolution?: string
  resolved_at?: string
  first_response_at?: string
  sla_due_date?: string
  sla_breached: boolean
  created_at: string
  updated_at: string
  messages?: SupportTicketMessage[]
}

export interface SupportTicketMessage {
  id: number
  ticket_id: number
  sender_type: 'customer' | 'agent'
  sender_id: number
  sender_name: string
  message: string
  is_internal: boolean
  attachments?: string[]
  created_at: string
}

export interface SupportTicketStats {
  total: number
  open: number
  in_progress: number
  pending: number
  resolved: number
  closed: number
  avg_response_time: string    // e.g., "2.5 hrs"
  avg_resolution_time: string  // e.g., "18 hrs"
  sla_compliance_rate: number  // Percentage
  tickets_today: number
  tickets_this_week: number
}

export interface CreateTicketRequest {
  subject: string
  description: string
  category: SupportTicketCategory
  priority: SupportTicketPriority
  customer_id: number
}

export interface TicketReplyRequest {
  message: string
  is_internal?: boolean
  attachments?: string[]
}

// ==========================================
// NETILY SUBSCRIPTIONS & PAYOUTS
// ==========================================

export type NetilyPlanCode = 'starter' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type PayoutMethod = 'mpesa' | 'bank'

// ojpierre/netily-frontend/netily-frontend-prod-frontend/lib/types.ts

export interface NetilyPlan {
  id: number
  name: string
  code: NetilyPlanCode
  price: string                   // Legacy price field
  price_monthly: string           // Added: Current monthly price
  base_license_fee?: string       // Added: Used for metered plans
  description: string
  is_metered: boolean
  is_popular?: boolean            // Added: For the "Most Popular" badge
  max_staff_users: number | null
  max_subscribers: number | null  
  max_routers: number | null
  // Support both the object format and the simple string array format
  features: {
    sms_notifications: boolean
    email_notifications: boolean
    api_access: boolean
    custom_branding: boolean
    white_label: boolean
    priority_support: boolean
    hotspot_portal: boolean
    analytics_dashboard: boolean
    multi_location: boolean
  } | string[] 
  is_active: boolean
  sort_order: number
}

export interface CompanySubscription {
  id: number
  company_id: number
  plan: NetilyPlan
  plan_name?: string           // Flattened name from serializer
  status: SubscriptionStatus
  billing_period?: 'monthly' | 'yearly' // Billing cycle (monthly/yearly)
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  cancelled_at: string | null
  subscriber_count: number
  router_count: number
  staff_count: number
  created_at: string
  updated_at: string
}

export interface SubscriptionPayment {
  id: number
  subscription_id: number
  amount: string
  currency: string
  payhero_reference: string | null
  mpesa_reference: string | null
  status: 'pending' | 'completed' | 'failed'
  paid_at: string | null
  created_at: string
}

export interface ISPPayoutConfig {
  id: number
  company_id: number
  payout_method: PayoutMethod
  mpesa_phone: string | null
  mpesa_name: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  bank_branch: string | null
  bank_swift_code: string | null
  is_verified: boolean
  verified_at: string | null
  min_payout_amount: string
  auto_payout_enabled: boolean
  auto_payout_day: number  // 1-28
  created_at: string
  updated_at: string
}

export interface ISPSettlement {
  id: number
  company_id: number
  period_start: string
  period_end: string
  gross_amount: string
  commission_amount: string
  net_amount: string
  status: SettlementStatus
  payhero_reference: string | null
  processed_at: string | null
  failure_reason: string | null
  created_at: string
}

export interface CommissionLedger {
  id: number
  settlement_id: number | null
  payment_type: 'hotspot' | 'subscription' | 'recharge'
  source_id: number
  gross_amount: string
  commission_rate: string
  commission_amount: string
  isp_amount: string
  created_at: string
}

export interface UsageStats {
  subscribers: { current: number; limit: number | null; percentage: number | null }
  routers: { current: number; limit: number | null; percentage: number | null }
  staff: { current: number; limit: number | null; percentage: number | null }
  is_over_limit: boolean
  warnings: string[]
}

export interface SettlementSummary {
  pending_balance: string
  total_commission: string
  total_gross: string
  next_payout_date: string | null
  last_payout: {
    amount: string
    date: string
    status: SettlementStatus
  } | null
  pending_settlements_count: number
}

// ==========================================
// HOTSPOT PORTAL
// ==========================================

export type HotspotPlanType = 'time' | 'data' | 'unlimited'
export type HotspotSessionStatus = 'pending' | 'paid' | 'active' | 'expired' | 'failed' | 'cancelled'
export type HotspotValidityType = 'MINUTES' | 'HOURS' | 'DAYS' | 'UNLIMITED'
export type HotspotLimitationType = 'UNLIMITED' | 'DATA'
export type HotspotSpeedUnit = 'MBPS' | 'KBPS'
export type HotspotDataUnit = 'MB' | 'GB'

export interface HotspotPlan {
  id: string  // UUID
  router_id: number
  name: string
  description?: string
  price: string
  currency: string
  
  // Validity (new fields)
  validity_type: HotspotValidityType
  validity_value: number
  
  // Legacy field for backward compatibility
  duration_minutes: number
  duration_display?: string
  
  // Data Limits (new fields)
  limitation_type: HotspotLimitationType
  data_limit_value: number | null
  data_limit_unit: HotspotDataUnit
  
  // Legacy field for backward compatibility
  data_limit_mb: number | null     // null for unlimited
  data_limit_display?: string
  
  // Speed (new fields)
  download_speed: number
  upload_speed: number
  speed_unit: HotspotSpeedUnit
  speed_display?: string
  
  // Legacy field for backward compatibility
  speed_limit_mbps: string
  
  // Session limits
  simultaneous_devices: number
  
  // Valid days
  valid_monday: boolean
  valid_tuesday: boolean
  valid_wednesday: boolean
  valid_thursday: boolean
  valid_friday: boolean
  valid_saturday: boolean
  valid_sunday: boolean
  valid_days_list?: string[]
  
  // MikroTik
  mikrotik_profile?: string
  
  // Display settings
  is_active: boolean
  is_popular: boolean
  sort_order: number
  
  // Computed
  total_validity_minutes?: number
  
  created_at?: string
  updated_at?: string
}

export interface HotspotSession {
  id: string  // UUID
  session_id: string
  router_id: number
  plan_id: string  // UUID
  plan_name: string
  plan_price?: number
  phone_number: string
  mac_address: string
  amount: string
  mpesa_receipt?: string | null
  access_code: string | null
  status: HotspotSessionStatus
  activated_at: string | null
  expires_at: string | null
  data_used_mb: number
  time_remaining_minutes?: number
  data_remaining_mb?: number | null
  is_active?: boolean
  failure_reason?: string | null
  created_at: string
  updated_at?: string
}

// Keeping the detailed HotspotBranding interface (from line 1318)
export interface HotspotBranding {
  id: string  // UUID
  router_id: number
  company_name: string
  logo?: string | null
  logo_url: string | null
  background_image?: string | null
  background_image_url: string | null
  primary_color: string
  secondary_color: string
  text_color?: string
  background_color?: string
  welcome_title: string
  welcome_message?: string
  terms_and_conditions?: string
  support_phone: string | null
  support_email: string | null
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  website_url?: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

// ==========================================
// SMS MODULE (Backend Aligned)
// ==========================================

export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed'
export type SMSType = 'single' | 'bulk' | 'automated' | 'campaign'

export interface SMSMessage {
  id: number
  recipient: string
  recipient_name?: string
  customer_id?: number
  message: string
  status: SMSStatus
  message_type: SMSType
  provider: string
  provider_message_id?: string
  cost?: string
  segments?: number
  sent_at: string
  delivered_at?: string
  failed_reason?: string
  created_at: string
}

export interface SMSTemplate {
  id: number
  name: string
  content: string
  variables: string[]
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface SMSCampaign {
  id: number
  name: string
  message: string
  template_id?: number
  recipient_count: number
  sent_count: number
  delivered_count: number
  failed_count: number
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled'
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface SMSStats {
  total_messages: number
  delivered: number
  pending: number
  failed: number
  delivery_rate: number    // Percentage
  total_cost: string
  messages_today: number
  messages_this_month: number
}

export interface SendSMSRequest {
  recipients: string[]          // Array of phone numbers
  message: string
  template_id?: number
  scheduled_at?: string
}

export interface SendBulkSMSRequest {
  customer_filter?: {
    plan_id?: number
    status?: string
    expiring_in_days?: number
  }
  message: string
  template_id?: number
  campaign_name?: string
  scheduled_at?: string
}

export interface SMSBalance {
  provider: string
  balance: string
  currency: string
  credits?: number
}

export type SMSProvider = 'africastalking' | 'twilio' | 'vonage' | 'infobip' | 'beem' | 'advanta' | 'hubtel'

export interface SMSGatewayConfig {
  id: number
  provider: SMSProvider
  provider_display: string
  is_active: boolean
  api_key: string        // masked on read
  api_secret: string     // masked on read  
  username: string
  sender_id: string
  extra_config: Record<string, string>
  auto_payment_confirmation: boolean
  auto_expiry_reminder: boolean
  auto_welcome_message: boolean
  auto_service_suspension: boolean
  field_labels: Record<string, string>
  created_at: string
  updated_at: string
}

export interface SMSGatewayConfigWrite {
  provider: SMSProvider
  is_active?: boolean
  api_key: string
  api_secret?: string
  username?: string
  sender_id?: string
  extra_config?: Record<string, string>
  auto_payment_confirmation?: boolean
  auto_expiry_reminder?: boolean
  auto_welcome_message?: boolean
  auto_service_suspension?: boolean
}

// ==========================================
// VPN MODULE TYPES
// ==========================================

export type VPNCertificateStatus = 'active' | 'revoked' | 'expired'

export interface VPNServer {
  id: number
  name: string
  hostname: string
  port: number
  protocol: 'udp' | 'tcp'
  network: string
  netmask: string
  dns_servers: string[]
  status: 'running' | 'stopped' | 'error'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VPNCertificate {
  id: number
  customer: number
  customer_name?: string
  customer_email?: string
  common_name: string
  status: VPNCertificateStatus
  issued_at: string
  expires_at: string
  revoked_at?: string
  revocation_reason?: string
  serial_number: string
  created_at: string
  updated_at: string
}

export interface VPNConnection {
  id: number
  certificate: number
  common_name: string
  customer_name?: string
  real_address: string
  virtual_address: string
  bytes_received: number
  bytes_sent: number
  connected_since: string
  last_ref: string
  username?: string
}

export interface VPNDashboardStats {
  total_certificates: number
  active_certificates: number
  revoked_certificates: number
  expired_certificates: number
  active_connections: number
  server_status: 'running' | 'stopped' | 'error'
  total_bytes_in: number
  total_bytes_out: number
}

export interface CreateVPNCertificateRequest {
  customer_id: number
  validity_days?: number
}

export interface VPNCertificateWithConfig extends VPNCertificate {
  config_content?: string
}

// ==========================================
// RADIUS MODULE TYPES
// ==========================================

export type RADIUSUserStatus = 'enabled' | 'disabled'
export type RADIUSAttributeOp = ':=' | '=' | '+=' | '-=' | '==' | '!=' | '>' | '>=' | '<' | '<='

export interface RADIUSUser {
  id: number
  username: string
  customer?: number
  customer_name?: string
  customer_email?: string
  service_connection?: number
  status: RADIUSUserStatus
  download_speed: number  // kbps
  upload_speed: number    // kbps
  simultaneous_use?: number
  data_limit?: number     // bytes
  data_used?: number      // bytes
  session_timeout?: number
  idle_timeout?: number
  valid_from?: string
  valid_until?: string
  created_at: string
  updated_at: string
  // Multi-tenant fields
  tenant_schema?: string  // e.g., "tenant_yellow1"
  public_sync_status?: 'synced' | 'pending' | 'failed'
  last_sync_at?: string
}

export interface RADIUSUserAttribute {
  id: number
  user: number
  attribute: string
  op: RADIUSAttributeOp
  value: string
  table: 'check' | 'reply'
}

export interface RADIUSProfile {
  id: number
  name: string
  description?: string
  download_speed: number
  upload_speed: number
  simultaneous_use: number
  session_timeout?: number
  idle_timeout?: number
  data_limit?: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RADIUSNAS {
  id: number
  router?: number
  router_name?: string
  nasname: string
  shortname: string
  secret: string
  type: string
  ports?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RADIUSAccountingSession {
  id: number
  username: string
  customer_name?: string
  nasipaddress: string
  nas_name?: string
  acctsessionid: string
  acctuniqueid: string
  framedipaddress?: string
  acctstarttime: string
  acctstoptime?: string
  acctinputoctets: number
  acctoutputoctets: number
  acctterminatecause?: string
  callingstationid?: string
  session_duration?: number
  is_active: boolean
}

// Online user session from /radius/sessions/active/ — pre-formatted for display
export interface OnlineSession {
  radacctid: number
  acctsessionid: string
  username: string
  full_name: string
  phone_number: string
  mac_address: string
  ip_address: string
  uptime: string
  usage: string
  router: string
  service_type: string
  canonical_username: string | null  // ADD THIS LINE
}

export interface ActiveSubscription {
  type: "pppoe" | "hotspot"
  username: string
  canonical_username: string | null
  display_name: string
  phone: string | null
  email: string | null
  customer_code: string | null
  plan_name: string
  plan_price: number
  expiry_date: string | null
  days_left: number | null
  hours_left: number
  is_unlimited: boolean
  connection_type: string
  subscribed_at: string | null
  router: string | null
  mac_address: string | null
  session_id: string | null
  client_total_sessions: number
  client_total_spend: number
}

export interface ActiveSubscriptionsResponse {
  pppoe: ActiveSubscription[]
  hotspot: ActiveSubscription[]
  total: number
}

export interface RADIUSDashboardStats {
  total_users: number
  active_users: number
  disabled_users: number
  active_sessions: number
  total_nas: number
  online_nas: number
  total_profiles: number
  total_data_in: number
  total_data_out: number
}

export interface CreateRADIUSUserRequest {
  username: string
  password: string
  customer_id?: number
  service_connection_id?: number
  profile_id?: number
  download_speed?: number
  upload_speed?: number
  simultaneous_use?: number
  session_timeout?: number
  idle_timeout?: number
  data_limit?: number
  valid_from?: string
  valid_until?: string
}

export interface UpdateRADIUSUserRequest {
  password?: string
  status?: RADIUSUserStatus
  download_speed?: number
  upload_speed?: number
  simultaneous_use?: number
  session_timeout?: number
  idle_timeout?: number
  data_limit?: number
  valid_from?: string
  valid_until?: string
}

export interface CreateRADIUSProfileRequest {
  name: string
  description?: string
  download_speed: number
  upload_speed: number
  simultaneous_use?: number
  session_timeout?: number
  idle_timeout?: number
  data_limit?: number
  is_default?: boolean
}

export interface CreateRADIUSNASRequest {
  router_id?: number
  nasname: string
  shortname: string
  secret: string
  type?: string
  ports?: number
  description?: string
}

// ==========================================
// RADIUS MULTI-TENANT CONFIGURATION (NEW)
// ==========================================

export type RADIUSDeploymentMode = 'SHARED' | 'ISOLATED'

export interface RADIUSTenantConfig {
  id: number
  schema_name: string
  tenant_name: string
  radius_secret?: string  // Write-only in non-detail views
  radius_port_auth: number
  radius_port_acct: number
  deployment_mode: RADIUSDeploymentMode
  container_name: string
  container_status: string
  is_active: boolean
  config_generated: boolean
  last_config_update: string | null
  created_at: string
  updated_at: string
}

export type RADIUSConnectionType = 'PPPOE' | 'HOTSPOT' | 'BOTH'

export interface CustomerRADIUSCredentials {
  id: string
  customer: string
  customer_name: string
  customer_code: string
  username: string
  password?: string  // Write-only in non-detail views
  router: number | null
  router_name?: string
  bandwidth_profile: string | null
  profile_name: string | null
  connection_type: RADIUSConnectionType
  is_enabled: boolean
  disabled_reason: string
  static_ip: string | null
  ip_pool: string
  simultaneous_use: number
  expiration_date: string | null
  synced_to_radius: boolean
  last_sync: string | null
  created_at: string
  updated_at: string
}

// ==========================================
// HELPER TYPE UTILITIES
// ==========================================

export type CreateData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>
export type UpdateData<T> = Partial<CreateData<T>>

// ==========================================
// SELF-SERVICE (Customer Portal)
// ==========================================

export interface CustomerSelfRegisterRequest {
  email: string
  phone_number: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
  id_number?: string
}

export interface CustomerSelfRegisterResponse {
  status: 'success' | 'error'
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone_number: string
  }
  customer: {
    id: number
    customer_code: string
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  }
  access: string
  refresh: string
  message: string
  requires_verification?: boolean
}

export interface PhoneVerificationRequest {
  phone_number: string
  otp_code: string
}

export interface PhoneVerificationResponse {
  status: 'success' | 'error'
  message: string
  verified: boolean
}

export interface ResendOTPRequest {
  phone_number: string
}

export interface ResendOTPResponse {
  status: 'success' | 'error'
  message: string
}

export interface CustomerDashboardData {
  customer: {
    id: number
    customer_code: string
    full_name: string
    email: string
    phone_number: string
    status: string
    balance: string
    created_at: string
  }
  current_plan: {
    id: number
    name: string
    price: string
    speed_down: string
    speed_up: string
    expiry_date: string | null
    days_remaining: number | null
  } | null
  usage: {
    data_used: string
    data_limit: string | null
    percentage: number
  }
  recent_payments: Array<{
    id: number
    amount: string
    method: string
    status: string
    created_at: string
  }>
  pending_invoices: Array<{
    id: number
    invoice_number: string
    amount: string
    due_date: string
    status: string
  }>
  weekly_income?: { day: string; amount: number }[]
  last_week_income?: { day: string; amount: number }[]
  monthly_earnings?: { month: string; amount: number }[]
  last_year_earnings?: { month: string; amount: number }[]
}

export interface CustomerPaymentInitiateRequest {
  amount: number
  phone_number: string
  payment_type: 'recharge' | 'invoice'
  invoice_id?: number
  plan_id?: number
}

export interface CustomerPaymentInitiateResponse {
  status: 'success' | 'error'
  payment_id: number
  checkout_request_id: string
  merchant_request_id: string
  message: string
}

export interface CustomerPaymentStatus {
  payment_id: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount: string
  reference?: string
  completed_at?: string
  error_message?: string
}

export interface CustomerPlan {
  id: number
  name: string
  description: string
  price: string
  speed_down: string
  speed_up: string
  data_limit: string | null
  validity_days: number
  is_active: boolean
}

// ==========================================
// HOTSPOT PORTAL (Public)
// ==========================================

export interface CaptivePortalResponse {
  status: string
  portal_config: CaptivePortalConfig
  plans: CaptivePortalPlan[]
}

export interface CaptivePortalConfig {
  template_id: number
  hotspot_name: string
  support_phone: string
  announcement_text: string
  gateway_ip: string
}

export interface CaptivePortalPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  // Validity
  validity_type: string
  validity_value: number
  duration_display: string
  // Speed
  download_speed: number
  upload_speed: number
  speed_unit: string
  speed_display: string
  // Data limits
  limitation_type: string
  data_limit_value: number | null
  data_limit_unit: string
  data_limit_display: string
  // Display
  is_popular: boolean
}

/** @deprecated Use CaptivePortalResponse instead */
export interface HotspotRouterInfo {
  id: number
  name: string
  location: string
  branding: HotspotBranding
  plans: HotspotPlanPublic[]
}

export interface HotspotPlanPublic {
  id: number
  name: string
  description: string
  price: string
  duration_minutes: number
  duration_display: string
  data_limit_mb: number | null
  data_limit_display: string
  speed_limit: string | null
}

export interface HotspotPurchaseRequest {
  router_id: number
  plan_id: number
  phone_number: string
  mac_address?: string
}

export interface HotspotPurchaseResponse {
  status: 'success' | 'error'
  session_id: string
  checkout_request_id: string
  message: string
}

export interface HotspotPurchaseStatus {
  session_id: string
  status: 'pending_payment' | 'active' | 'expired' | 'failed'
  username?: string
  password?: string
  expires_at?: string
  error_message?: string
}

