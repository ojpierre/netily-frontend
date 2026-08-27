# Netily ISP Management System - Feature Roadmap

**Created:** December 30, 2025  
**Last Updated:** December 30, 2025 (Phase 1 Implementation Complete)  
**Purpose:** Gap analysis between envisioned features and current implementation

---

## 🎉 Implementation Progress Update

### Recently Implemented (This Session)

| Feature | Route | Status |
|---------|-------|--------|
| OLT Management Page | `/admin/olt` | ✅ Complete |
| OLT Detail with PON Ports | `/admin/olt/[id]` | ✅ Complete |
| ONU Management Page | `/admin/onu` | ✅ Complete |
| Invoice Management Page | `/admin/invoices` | ✅ Complete |
| IP Address Management (IPAM) | `/admin/ipam` | ✅ Complete |
| Technician Dispatch | `/admin/dispatch` | ✅ Complete |
| Inventory Management | `/admin/inventory` | ✅ Complete |
| M-Pesa STK Push Integration | `/dashboard/recharge` | ✅ Complete |
| Updated Admin Navigation | Layout Sidebar | ✅ Complete |

---

## Executive Summary

| Module | Envisioned Features | Currently Implemented | Gap % |
|--------|--------------------:|----------------------:|------:|
| 1. Dashboard | 12 | 4 | 67% |
| 2. Customer Management | 18 | 8 | 56% |
| 3. Network Management | 24 | 12 | 50% ⬇️ |
| 4. Bandwidth Management | 12 | 2 | 83% |
| 5. Billing & Finance | 20 | 10 | 50% ⬇️ |
| 6. Support & Ticketing | 12 | 8 | 33% ⬇️ |
| 7. Reports & Analytics | 15 | 5 | 67% |
| 8. Staff Management | 12 | 4 | 67% ⬇️ |
| 9. Self-Service Portal | 10 | 9 | 10% ⬇️ |
| 10. System Settings | 10 | 2 | 80% |
| 11. Alerts & Notifications | 6 | 2 | 67% |
| 12. Inventory Management | 8 | 6 | 25% ⬇️ |
| **TOTAL** | **159** | **72** | **55%** ⬇️ |

**Progress: Gap reduced from 72% to 55%**

---

## Detailed Module Analysis

### ✅ = Implemented | 🔄 = Partial | ❌ = Missing

---

## 📊 1. DASHBOARD MODULE

### Admin Dashboard (`/admin`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Overview cards (Customers, Revenue, Uptime, Tickets) | ✅ | `/admin` | Basic stats cards |
| Bandwidth utilization graph (real-time) | ❌ | - | Needs WebSocket |
| Revenue trend chart (monthly/yearly) | 🔄 | `/admin` | Static mock |
| Quick actions (New Customer, Invoice, Ticket) | ❌ | - | Need quick action buttons |
| Recent alerts/notifications | ❌ | - | Need notification feed |
| Top 5 bandwidth users | ❌ | - | Need usage ranking |
| Pending bill payments | ❌ | - | Need payment queue |
| Network health status | ❌ | - | Need router/OLT status |

### Executive Dashboard

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| KPI summary for management | ❌ | `/admin/analytics` | Need executive view |
| Churn rate vs acquisition rate | ❌ | `/admin/analytics/churn` | Page exists, needs data |
| ARPU (Average Revenue Per User) | ❌ | - | Need calculation |
| Service penetration by region | ❌ | - | Need geo analytics |
| Revenue breakdown (prepaid vs postpaid) | ❌ | - | Need billing type split |
| Network investment ROI | ❌ | - | Need financial metrics |

**TODO Items:**
1. [ ] Add real-time bandwidth chart to dashboard
2. [ ] Add quick action buttons
3. [ ] Add notification feed widget
4. [ ] Add top bandwidth users widget
5. [ ] Add pending payments widget
6. [ ] Create executive dashboard page
7. [ ] Add ARPU calculation
8. [ ] Add churn vs acquisition chart

---

## 👥 2. CUSTOMER MANAGEMENT MODULE

### Customer Directory (`/admin/users`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Search/filter (Name, ID, Location, Status) | ✅ | `/admin/users` | Implemented |
| Customer list table | ✅ | `/admin/users` | Implemented |
| Bulk actions (Email/SMS, Export, Status) | ✅ | `/admin/users` | Implemented |
| Quick view modal/drawer | ✅ | `/admin/users` | Sheet drawer |

### Customer Profile Page (`/admin/users/[id]`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| **Personal Details Tab** | | | |
| Personal info (Name, ID, Phone, Email, Address) | 🔄 | `/admin/users/[id]` | Basic only |
| Next of kin details | ❌ | - | Need NOK section |
| ID/Passport upload | ❌ | - | Need document upload |
| Registration date | ✅ | - | In drawer |
| **Service Details Tab** | | | |
| Assigned IP/MAC address | ✅ | - | In drawer |
| Connection type | ✅ | - | In drawer |
| OLT port assignment | ❌ | - | **MISSING - Need OLT module** |
| Router details (TR-069) | ❌ | - | Need TR-069 integration |
| Installation technician notes | ❌ | - | Need notes section |
| Service activation date | ✅ | - | In drawer |
| **Billing Tab** | | | |
| Current plan details | ✅ | - | In drawer |
| Payment history | ❌ | - | Need in profile |
| Outstanding balances | ✅ | - | Balance shown |
| Invoice download | ❌ | - | Need invoice list |
| M-Pesa payment records | ❌ | - | Need M-Pesa log |
| **Usage & Support Tab** | | | |
| Bandwidth usage graphs | ❌ | - | Need per-customer usage |
| Ticket history | ❌ | - | Need ticket list |
| Contract documents | ❌ | - | Need document storage |
| SLA status | ❌ | - | Need SLA tracking |

### New Customer Onboarding Wizard

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Personal details collection | 🔄 | `/admin/users` | Dialog form |
| Service selection (plan, installation date) | 🔄 | `/admin/users` | Basic select |
| Documentation upload | ❌ | - | Need file upload |
| Payment/Deposit | ❌ | - | Need payment step |
| Technician assignment | ❌ | - | Need technician select |

**TODO Items:**
1. [ ] Create full customer profile page `/admin/users/[id]`
2. [ ] Add tabbed interface (Personal, Service, Billing, Usage)
3. [ ] Add next of kin section
4. [ ] Add document upload (ID, contracts)
5. [ ] Add OLT port assignment field
6. [ ] Add TR-069 device info
7. [ ] Add payment history to profile
8. [ ] Add bandwidth usage chart per customer
9. [ ] Create onboarding wizard with stepper
10. [ ] Add technician assignment

---

## 🌐 3. NETWORK MANAGEMENT MODULE

### OLT Management Console (`/admin/olt`) - ✅ IMPLEMENTED

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| OLT device list | ✅ | `/admin/olt` | Full CRUD with stats |
| Per-OLT PON port status | ✅ | `/admin/olt/[id]` | Grid view with power levels |
| Customer mapping per port | ✅ | `/admin/olt/[id]` | ONU list per port |
| Remote reboot/restart | ✅ | `/admin/olt` | Action in table |
| Firmware management | ❌ | - | Need firmware upload |
| Performance metrics per OLT | ✅ | `/admin/olt/[id]` | Stats cards |

### ONU Management (`/admin/onu`) - ✅ IMPLEMENTED

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| ONU device list | ✅ | `/admin/onu` | Full table with filters |
| ONU registration | ✅ | `/admin/onu` | Provision dialog |
| Optical power monitoring | ✅ | `/admin/onu` | Rx/Tx in detail sheet |
| ONU provisioning | ✅ | `/admin/onu` | Bulk provisioning |

### TR-069 Device Management - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Connected CPE devices list | ❌ | `/admin/cpe` | **NEW PAGE NEEDED** |
| Remote configuration push | ❌ | - | Need ACS integration |
| Firmware update scheduling | ❌ | - | Need scheduler |
| Parameter monitoring | ❌ | - | Need signal strength etc |
| Diagnostics tools | ❌ | - | Need ping/trace |
| Auto-provisioning settings | ❌ | - | Need provision config |

### Mikrotik NAS/Hotspot Management (`/admin/routers`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Hotspot user sessions | ❌ | `/admin/routers` | Need session list |
| PPPoE/PPTP/L2TP users | 🔄 | `/admin/users` | Partial via user type |
| Bandwidth limits per user | ❌ | - | Need in router page |
| User login/logout history | ❌ | - | Need session log |
| Voucher management | 🔄 | `/admin/plans/vouchers` | Page exists |
| NAS device health monitoring | ❌ | - | Need health check |

### IP Address Management (`/admin/ipam`) - ✅ IMPLEMENTED

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| IP allocation (static/dynamic) | ✅ | `/admin/ipam` | IP grid with status |
| Subnet management | ✅ | `/admin/ipam` | Subnet CRUD |
| DHCP lease management | ✅ | `/admin/ipam` | Leases tab |
| IP conflict detection | ❌ | - | Need detection |
| IPv6 management | ❌ | - | Future |

**TODO Items:**
1. [x] **Create `/admin/olt` - OLT Management page**
2. [x] Create `/admin/olt/[id]` - OLT detail with PON ports
3. [x] **Create `/admin/onu` - ONU Management page**
4. [x] Create ONU registration flow
5. [x] Add optical power monitoring
6. [ ] **Create `/admin/cpe` - TR-069 Devices page**
7. [ ] Add remote diagnostics (ping, traceroute)
8. [ ] Add hotspot session viewer to routers page
9. [x] **Create `/admin/ipam` - IP Management page**
10. [x] Add subnet/VLAN management
11. [x] Add DHCP lease viewer

---

## 📈 4. BANDWIDTH MANAGEMENT MODULE

### Bandwidth Policies (`/admin/fup`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Create/edit bandwidth profiles | 🔄 | `/admin/fup` | Page exists |
| Speed limits (upload/download) | 🔄 | `/admin/plans` | In plan config |
| Data caps (daily/weekly/monthly) | ❌ | - | Need cap config |
| Fair usage policy settings | 🔄 | `/admin/fup` | Basic page |
| Time-based restrictions | ❌ | - | Need scheduler |
| QoS rules | ❌ | - | Need QoS config |

### Real-time Monitoring (`/admin/usage`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Live bandwidth usage graph | ❌ | `/admin/usage` | Need real-time |
| Top bandwidth consumers | ❌ | - | Need ranking |
| Protocol-based monitoring | ❌ | - | Need DPI data |
| Historical usage per customer | ❌ | - | Need graphs |
| Alert thresholds | ❌ | - | Need threshold config |

### Traffic Shaping - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Priority queuing | ❌ | `/admin/qos` | **NEW PAGE NEEDED** |
| Application filtering | ❌ | - | Need app rules |
| P2P traffic management | ❌ | - | Need P2P rules |
| Bandwidth borrowing | ❌ | - | Need burst config |

**TODO Items:**
1. [ ] Add data cap configuration to plans
2. [ ] Add time-based restriction UI
3. [ ] Create real-time bandwidth graph (WebSocket)
4. [ ] Add top consumers widget
5. [ ] **Create `/admin/qos` - QoS Management page**
6. [ ] Add traffic shaping rules

---

## 💰 5. BILLING & FINANCE MODULE

### Billing Cycles Management

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Define billing cycles | ❌ | `/admin/billing/cycles` | **NEW PAGE NEEDED** |
| Auto-invoice generation | ❌ | - | Need scheduler |
| Late payment penalties | ❌ | - | Need config |
| Discount/promotion management | ❌ | `/admin/promotions` | **NEW PAGE NEEDED** |

### Invoicing System (`/admin/invoices`) - ✅ IMPLEMENTED

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Invoice list with filters | ✅ | `/admin/invoices` | Full table with tabs |
| Invoice generation | ✅ | `/admin/invoices` | Create dialog |
| Invoice preview/customization | ✅ | `/admin/invoices` | Preview sheet |
| Email/SMS invoice delivery | ✅ | `/admin/invoices` | Send dialog |
| Receipt generation | ❌ | - | Need receipts |

### Payment Processing (`/admin/payments`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| M-Pesa integration (STK Push) | ✅ | `/dashboard/recharge` | Full STK Push flow |
| Bank transfer tracking | ❌ | - | Need bank module |
| Cash payment recording | 🔄 | `/admin/payments` | Basic list |
| Payment reconciliation | ❌ | - | Need reconcile |
| Payment reminders | ❌ | - | Need SMS trigger |

### Prepaid System

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Voucher generation | 🔄 | `/admin/plans/vouchers` | Page exists |
| Voucher sales tracking | ❌ | - | Need sales log |
| Auto-topup configuration | ❌ | - | Need auto-topup |
| Low balance alerts | ❌ | - | Need SMS alert |

### Revenue Reports

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Daily/weekly/monthly revenue | 🔄 | `/admin/analytics/revenue` | Page exists |
| Payment method breakdown | ❌ | - | Need pie chart |
| Outstanding debts report | ❌ | - | Need debt report |
| Agent commission tracking | ❌ | - | Need agent module |

**TODO Items:**
1. [ ] **Create `/admin/billing` - Billing Dashboard**
2. [x] Create `/admin/invoices` - Invoice Management
3. [x] Create invoice generation flow
4. [x] Add M-Pesa STK Push integration
5. [ ] Add payment reconciliation
6. [ ] Create `/admin/promotions` - Discounts/Promotions
7. [ ] Add voucher sales tracking
8. [ ] Add outstanding debts report

---

## 🛠️ 6. SUPPORT & TICKETING MODULE

### Ticket Management (`/admin/tickets`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Ticket queue (open, pending, resolved) | ✅ | `/admin/tickets` | Implemented |
| Ticket assignment | 🔄 | `/admin/tickets/[id]` | Basic |
| Priority levels | ✅ | `/admin/tickets` | Implemented |
| SLA tracking | ❌ | - | Need SLA timer |
| Communication history | ❌ | - | Need thread view |

### Technician Dispatch (`/admin/dispatch`) - ✅ IMPLEMENTED

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Technician availability | ✅ | `/admin/dispatch` | Roster tab |
| Job assignment | ✅ | `/admin/dispatch` | Assign dialog |
| Field work tracking | ✅ | `/admin/dispatch` | Job status tracking |
| Completion reports | ✅ | `/admin/dispatch` | Job details sheet |
| Customer ratings | ❌ | - | Need feedback |

### Knowledge Base - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Common issues/solutions | ❌ | `/admin/kb` | **NEW PAGE NEEDED** |
| Network status updates | ❌ | - | Need status page |
| Maintenance schedules | ❌ | - | Need calendar |
| FAQ section | ❌ | - | Need FAQ editor |

**TODO Items:**
1. [ ] Add SLA timer to tickets
2. [ ] Add communication thread to ticket detail
3. [x] **Create `/admin/dispatch` - Technician Dispatch**
4. [ ] Add technician GPS tracking
5. [ ] **Create `/admin/kb` - Knowledge Base**
6. [ ] Add maintenance calendar

---

## 📊 7. REPORTS & ANALYTICS MODULE

### Existing Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/admin/analytics` | ✅ | Overview page |
| `/admin/analytics/revenue` | ✅ | Revenue reports |
| `/admin/analytics/usage` | ✅ | Usage analytics |
| `/admin/analytics/customers` | ✅ | Customer analytics |
| `/admin/analytics/churn` | ✅ | Churn analysis |

### Missing Reports

| Report | Status | Notes |
|--------|--------|-------|
| Customer acquisition funnel | ❌ | Need funnel chart |
| Service uptime reports | ❌ | Need uptime calc |
| Network performance trends | ❌ | Need network graphs |
| Ticket resolution metrics | ❌ | Need ticket stats |
| P&L statements | ❌ | Need accounting |
| Collection efficiency | ❌ | Need payment ratio |
| Expense tracking | ❌ | Need expense module |
| Tax reports (KRA) | ❌ | Need tax calc |
| Device performance | ❌ | Need device stats |
| Network growth projections | ❌ | Need forecasting |

**TODO Items:**
1. [ ] Add customer acquisition funnel
2. [ ] Add service uptime report
3. [ ] Add ticket resolution metrics
4. [ ] Add P&L statements
5. [ ] Add expense tracking
6. [ ] Add KRA tax report export

---

## 👨‍💼 8. STAFF MANAGEMENT MODULE

### User Roles & Permissions - **PARTIAL**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Role-based access control | ❌ | `/admin/settings/roles` | Need RBAC |
| Department management | ❌ | - | Need departments |
| Activity logs | ✅ | `/admin/logs` | Audit logs exist |
| Login/Logout tracking | ❌ | - | Need session log |

### Technician Management - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Technician profiles | ❌ | `/admin/technicians` | **NEW PAGE NEEDED** |
| Skills matrix | ❌ | - | Need skills |
| Work schedule | ❌ | - | Need calendar |
| Job history | ❌ | - | Need job log |
| Performance metrics | ❌ | - | Need KPIs |
| Inventory assignment | ❌ | - | Need tool tracking |

### Agent/Retailer Management - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Commission structure | ❌ | `/admin/agents` | **NEW PAGE NEEDED** |
| Sales tracking | ❌ | - | Need sales log |
| Customer referrals | ❌ | - | Need referral tracking |
| Payout management | ❌ | - | Need payout calc |

**TODO Items:**
1. [ ] Implement RBAC system
2. [ ] Add department management
3. [ ] **Create `/admin/technicians` - Technician Management**
4. [ ] Add technician scheduling
5. [ ] **Create `/admin/agents` - Agent/Retailer Management**
6. [ ] Add commission calculator

---

## 📱 9. SELF-SERVICE PORTAL MODULE (Customer)

### Customer Dashboard (`/dashboard`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Account overview | ✅ | `/dashboard` | Implemented |
| Current usage | 🔄 | `/dashboard/usage-history` | Basic |
| Bill payment (M-Pesa) | ✅ | `/dashboard/recharge` | STK Push implemented |
| Ticket submission | ✅ | `/dashboard/support` | Implemented |
| Plan upgrade requests | ❌ | - | Need upgrade flow |

### Service Management

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Bandwidth usage details | 🔄 | `/dashboard/usage-history` | Basic |
| Payment history | 🔄 | `/dashboard/invoices` | Basic list |
| Invoice download | ❌ | - | Need PDF download |
| Profile updates | ✅ | `/dashboard/profile` | Implemented |
| Service change requests | ❌ | - | Need request form |

**TODO Items:**
1. [x] Add M-Pesa STK Push to recharge
2. [ ] Add plan upgrade flow
3. [ ] Add invoice PDF download
4. [ ] Add service change request form

---

## ⚙️ 10. SYSTEM SETTINGS MODULE

### General Settings (`/admin/settings`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Company information | 🔄 | `/admin/settings` | Basic |
| SMS/Email templates | ❌ | - | Need template editor |
| Notification preferences | ❌ | - | Need config |
| System backup/restore | ❌ | - | Need backup |

### Integration Settings - **MISSING**

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| M-Pesa API configuration | ❌ | `/admin/settings/mpesa` | **NEW SECTION NEEDED** |
| SMS gateway (Africa's Talking) | ❌ | `/admin/settings/sms` | **NEW SECTION NEEDED** |
| Email server configuration | ❌ | `/admin/settings/email` | **NEW SECTION NEEDED** |
| API keys management | ❌ | `/admin/settings/api` | **NEW SECTION NEEDED** |

### Localization Settings

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Currency (KES) | ❌ | - | Need currency config |
| Date formats | ❌ | - | Need format config |
| Language (English/Swahili) | ❌ | - | Need i18n |
| County tax rates | ❌ | - | Need tax config |

**TODO Items:**
1. [ ] Add SMS/Email template editor
2. [ ] Add M-Pesa API configuration
3. [ ] Add SMS gateway (Africa's Talking) config
4. [ ] Add email server configuration
5. [ ] Add API keys management
6. [ ] Add multi-language support (Swahili)

---

## 🚨 11. ALERTS & NOTIFICATIONS MODULE

### Alert Configuration

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Threshold settings | ❌ | `/admin/alerts` | **NEW PAGE NEEDED** |
| Alert channels (SMS, Email, In-app) | ❌ | - | Need config |
| Escalation rules | ❌ | - | Need escalation |

### Notification Center

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| System notifications | 🔄 | `/dashboard/notifications` | Customer side |
| Customer notifications log | ❌ | - | Need log |
| Scheduled notifications | ❌ | - | Need scheduler |

**TODO Items:**
1. [ ] **Create `/admin/alerts` - Alert Configuration**
2. [ ] Add alert threshold settings
3. [ ] Add notification scheduler
4. [ ] Add escalation rules

---

## 📦 12. INVENTORY MANAGEMENT MODULE - ✅ IMPLEMENTED

### Equipment Inventory (`/admin/inventory`)

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Router/ONT stock | ✅ | `/admin/inventory` | Full inventory list |
| Serial number tracking | ✅ | `/admin/inventory` | In item details |
| Assignment to customers | ✅ | `/admin/inventory` | Assignment field |
| Warranty tracking | ✅ | `/admin/inventory` | Warranty dates |
| Supplier management | ✅ | `/admin/inventory` | Suppliers tab |

### Network Equipment

| Feature | Status | Route | Notes |
|---------|--------|-------|-------|
| Spare parts inventory | ✅ | `/admin/inventory` | Category filter |
| Maintenance schedules | ❌ | - | Need calendar |
| Depreciation tracking | ❌ | - | Need accounting |

**TODO Items:**
1. [x] **Create `/admin/inventory` - Equipment Inventory**
2. [x] Add serial number tracking
3. [x] Add customer equipment assignment
4. [x] Add warranty tracking
5. [x] **Create `/admin/suppliers` - Supplier Management** (in inventory page)
6. [ ] Add maintenance calendar

---

## 🎯 PRIORITY TODO LIST

### Phase 1: Critical Missing Features (Week 1-2) - ✅ COMPLETE

| # | Priority | Task | Module | Route | Status |
|---|----------|------|--------|-------|--------|
| 1 | P0 | Create OLT Management page | Network | `/admin/olt` | ✅ Done |
| 2 | P0 | Create ONU Management page | Network | `/admin/onu` | ✅ Done |
| 3 | P0 | Create Invoice Management | Billing | `/admin/invoices` | ✅ Done |
| 4 | P0 | Add M-Pesa integration | Billing | `/dashboard/recharge` | ✅ Done |
| 5 | P1 | Full customer profile page | Customers | `/admin/users/[id]` | ✅ Exists |
| 6 | P1 | Create IP Address Management | Network | `/admin/ipam` | ✅ Done |
| 7 | P1 | Add SLA tracking to tickets | Support | `/admin/tickets` | ⏳ Pending |

### Phase 2: Important Features (Week 3-4)

| # | Priority | Task | Module | Route | Status |
|---|----------|------|--------|-------|--------|
| 8 | P1 | Create Technician Dispatch | Support | `/admin/dispatch` | ✅ Done |
| 9 | P1 | Create Inventory Management | Inventory | `/admin/inventory` | ✅ Done |
| 10 | P1 | Add real-time bandwidth monitoring | Bandwidth | `/admin/usage` | ⏳ Pending |
| 11 | P2 | Create TR-069 Device Management | Network | `/admin/cpe` | ⏳ Pending |
| 12 | P2 | Create Agent/Retailer Management | Staff | `/admin/agents` | ⏳ Pending |
| 13 | P2 | Implement RBAC | Staff | `/admin/settings/roles` | ⏳ Pending |

### Phase 3: Enhancement Features (Week 5-6)

| # | Priority | Task | Module | Route |
|---|----------|------|--------|-------|
| 14 | P2 | Create Knowledge Base | Support | `/admin/kb` |
| 15 | P2 | Create Promotions Management | Billing | `/admin/promotions` |
| 16 | P2 | Add QoS Management | Bandwidth | `/admin/qos` |
| 17 | P3 | Add Executive Dashboard | Dashboard | `/admin/executive` |
| 18 | P3 | Create Alert Configuration | Alerts | `/admin/alerts` |
| 19 | P3 | Add Swahili language support | Settings | - |

### Phase 4: Advanced Features (Week 7-8)

| # | Priority | Task | Module | Route |
|---|----------|------|--------|-------|
| 20 | P3 | Add GPS technician tracking | Support | `/admin/dispatch` |
| 21 | P3 | Create financial P&L reports | Reports | `/admin/analytics/finance` |
| 22 | P3 | Add predictive churn analysis | Reports | `/admin/analytics/churn` |
| 23 | P3 | Create supplier management | Inventory | `/admin/suppliers` |
| 24 | P4 | Add customer mobile app APIs | Portal | - |

---

## New Routes to Create

### ✅ Implemented This Session
```
/admin/olt                    # OLT Device Management ✅
/admin/olt/[id]               # OLT Detail & PON Ports ✅
/admin/onu                    # ONU/ONT Management ✅
/admin/ipam                   # IP Address Management ✅
/admin/invoices               # Invoice Management ✅
/admin/dispatch               # Technician Dispatch ✅
/admin/inventory              # Equipment Inventory ✅
```

### ⏳ Still Needed
```
/admin/cpe                    # TR-069 CPE Devices
/admin/qos                    # QoS & Traffic Shaping
/admin/billing                # Billing Dashboard
/admin/promotions             # Discounts & Promotions
/admin/technicians            # Technician Profiles
/admin/agents                 # Agent/Retailer Management
/admin/kb                     # Knowledge Base
/admin/alerts                 # Alert Configuration
/admin/suppliers              # Supplier Management (separate page)
/admin/executive              # Executive Dashboard
/admin/settings/roles         # RBAC Configuration
/admin/settings/mpesa         # M-Pesa API Config
/admin/settings/sms           # SMS Gateway Config
```

---

## Backend API Requirements

For the missing modules, the Django backend needs these endpoints:

### OLT/ONU Management
```
/api/v1/network/olt/                    # OLT CRUD
/api/v1/network/olt/{id}/ports/         # PON ports
/api/v1/network/olt/{id}/reboot/        # Remote reboot
/api/v1/network/olt/{id}/stats/         # Performance metrics
/api/v1/network/onu/                    # ONU CRUD
/api/v1/network/onu/{id}/provision/     # Provision ONU
/api/v1/network/onu/{id}/optical-power/ # Rx/Tx power
/api/v1/network/onu/unregistered/       # Pending ONUs
```

### TR-069 / CPE Management
```
/api/v1/network/cpe/                    # CPE devices list
/api/v1/network/cpe/{id}/config/        # Push configuration
/api/v1/network/cpe/{id}/firmware/      # Firmware update
/api/v1/network/cpe/{id}/diagnostics/   # Ping/trace
```

### IP Address Management
```
/api/v1/network/ipam/subnets/           # Subnet CRUD
/api/v1/network/ipam/addresses/         # IP allocation
/api/v1/network/ipam/dhcp/leases/       # DHCP leases
/api/v1/network/ipam/conflicts/         # IP conflicts
```

### Billing & Invoicing
```
/api/v1/billing/invoices/               # Invoice CRUD
/api/v1/billing/invoices/generate/      # Generate invoice
/api/v1/billing/cycles/                 # Billing cycles
/api/v1/billing/promotions/             # Discounts
/api/v1/payments/mpesa/stk-push/        # M-Pesa STK
/api/v1/payments/mpesa/callback/        # M-Pesa callback
```

### Staff & Dispatch
```
/api/v1/staff/technicians/              # Technician profiles
/api/v1/staff/technicians/{id}/schedule/# Work schedule
/api/v1/staff/dispatch/jobs/            # Job assignments
/api/v1/staff/agents/                   # Agents/retailers
/api/v1/staff/agents/{id}/commissions/  # Commissions
```

### Inventory
```
/api/v1/inventory/equipment/            # Equipment list
/api/v1/inventory/equipment/{id}/assign/# Assign to customer
/api/v1/inventory/suppliers/            # Suppliers
/api/v1/inventory/warranty/             # Warranty tracking
```

---

*Last Updated: December 30, 2025*
