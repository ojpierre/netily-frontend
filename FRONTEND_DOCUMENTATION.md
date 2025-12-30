# Netily Frontend - Comprehensive Documentation

A detailed guide to the Next.js 14 frontend architecture, routes, pages, and user flows for the ISP Management System.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Complete Routes Reference](#complete-routes-reference)
4. [Page Descriptions](#page-descriptions)
5. [Customer User Flows](#customer-user-flows)
6. [Admin User Flows](#admin-user-flows)
7. [Component Library](#component-library)
8. [API Integration](#api-integration)
9. [Authentication System](#authentication-system)

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Server/client rendering, routing |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Pre-built UI components |
| Icons | Lucide React | SVG icon library |
| State | React Context | Auth state management |
| API | Fetch + Custom Services | Backend communication |

### Key Design Decisions

1. **App Router**: Using Next.js 14 App Router for file-based routing
2. **Server Components**: Default to server components, client only when needed
3. **Layouts**: Nested layouts for dashboard shells
4. **Mock Mode**: Toggle between mock data and real API for development
5. **Type Safety**: Full TypeScript coverage with strict mode

---

## Project Structure

```
netily/
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # Root layout (global providers)
│   ├── page.tsx                     # Landing page (/)
│   ├── globals.css                  # Global styles
│   ├── auth-context.tsx             # Customer auth state
│   │
│   ├── login/
│   │   └── page.tsx                 # Customer login form
│   │
│   ├── register/
│   │   └── page.tsx                 # Customer registration
│   │
│   ├── dashboard/                   # Customer portal
│   │   ├── layout.tsx               # Dashboard shell (sidebar + header)
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── invoices/page.tsx        # Billing invoices
│   │   ├── loyalty/page.tsx         # Loyalty points
│   │   ├── notifications/page.tsx   # Alerts
│   │   ├── profile/page.tsx         # User profile
│   │   ├── recharge/page.tsx        # Account top-up
│   │   ├── settings/page.tsx        # Preferences
│   │   ├── support/page.tsx         # Help tickets
│   │   └── usage-history/page.tsx   # Data usage
│   │
│   └── admin/                       # Admin panel
│       ├── layout.tsx               # Admin shell
│       ├── page.tsx                 # Admin dashboard
│       ├── admin-auth-context.tsx   # Admin auth state
│       ├── login/page.tsx           # Admin login
│       │
│       ├── users/                   # Customer management
│       │   ├── page.tsx             # Users list + filters
│       │   └── [id]/page.tsx        # User detail
│       │
│       ├── plans/                   # Service packages
│       │   ├── page.tsx             # Plans list
│       │   ├── create/page.tsx      # New plan wizard
│       │   ├── [id]/page.tsx        # Edit plan
│       │   └── vouchers/page.tsx    # Voucher management
│       │
│       ├── routers/                 # Network devices
│       │   ├── page.tsx             # Router list
│       │   ├── [id]/page.tsx        # Router config
│       │   └── sla/page.tsx         # SLA monitoring
│       │
│       ├── payments/page.tsx        # Transactions
│       ├── tickets/                 # Support
│       │   ├── page.tsx             # Ticket queue
│       │   └── [id]/page.tsx        # Ticket detail
│       │
│       ├── leads/                   # Sales
│       │   ├── page.tsx             # Leads list
│       │   ├── create/page.tsx      # New lead
│       │   └── [id]/page.tsx        # Lead detail
│       │
│       ├── analytics/               # Reports
│       │   ├── page.tsx             # Overview
│       │   ├── revenue/page.tsx     # Financial
│       │   ├── usage/page.tsx       # Bandwidth
│       │   ├── customers/page.tsx   # Demographics
│       │   └── churn/page.tsx       # Retention
│       │
│       ├── networks/page.tsx        # Topology
│       ├── ads/page.tsx             # Hotspot ads
│       ├── fup/page.tsx             # Fair usage
│       ├── loyalty/page.tsx         # Rewards config
│       ├── sms/page.tsx             # Messaging
│       ├── logs/page.tsx            # Audit trail
│       ├── settings/page.tsx        # System config
│       └── usage/page.tsx           # Bandwidth monitor
│
├── components/
│   ├── auth-guard.tsx               # Route protection HOC
│   ├── theme-provider.tsx           # Dark/light mode
│   └── ui/                          # 50+ shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── ...
│
├── lib/
│   ├── api.ts                       # Customer API service
│   ├── admin-api.ts                 # Admin API service
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Utility functions
│
├── hooks/
│   ├── use-mobile.ts                # Responsive detection
│   └── use-toast.ts                 # Notifications
│
└── public/                          # Static assets
```

---

## Complete Routes Reference

### Public Routes (No Auth Required)

| Route | File | Component | Description |
|-------|------|-----------|-------------|
| `/` | `app/page.tsx` | LandingPage | Marketing homepage |
| `/login` | `app/login/page.tsx` | LoginPage | Customer email/password login |
| `/register` | `app/register/page.tsx` | RegisterPage | New customer signup |
| `/admin/login` | `app/admin/login/page.tsx` | AdminLoginPage | Staff login |

### Customer Portal Routes (Auth Required)

| Route | File | Component | Description |
|-------|------|-----------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | DashboardPage | Account overview |
| `/dashboard/recharge` | `app/dashboard/recharge/page.tsx` | RechargePage | Top-up balance |
| `/dashboard/invoices` | `app/dashboard/invoices/page.tsx` | InvoicesPage | Billing history |
| `/dashboard/usage-history` | `app/dashboard/usage-history/page.tsx` | UsagePage | Data consumption |
| `/dashboard/loyalty` | `app/dashboard/loyalty/page.tsx` | LoyaltyPage | Points & rewards |
| `/dashboard/support` | `app/dashboard/support/page.tsx` | SupportPage | Help tickets |
| `/dashboard/notifications` | `app/dashboard/notifications/page.tsx` | NotificationsPage | Alerts |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | ProfilePage | Personal info |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | SettingsPage | Preferences |

### Admin Panel Routes (Staff Auth Required)

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `app/admin/page.tsx` | Admin dashboard with KPIs |
| `/admin/users` | `app/admin/users/page.tsx` | Customer list (Hotspot/PPPoE/Static) |
| `/admin/users/[id]` | `app/admin/users/[id]/page.tsx` | Individual customer detail |
| `/admin/plans` | `app/admin/plans/page.tsx` | Service packages list |
| `/admin/plans/create` | `app/admin/plans/create/page.tsx` | Create new plan |
| `/admin/plans/[id]` | `app/admin/plans/[id]/page.tsx` | Edit plan |
| `/admin/plans/vouchers` | `app/admin/plans/vouchers/page.tsx` | Voucher management |
| `/admin/routers` | `app/admin/routers/page.tsx` | MikroTik devices |
| `/admin/routers/[id]` | `app/admin/routers/[id]/page.tsx` | Router configuration |
| `/admin/routers/sla` | `app/admin/routers/sla/page.tsx` | Uptime monitoring |
| `/admin/payments` | `app/admin/payments/page.tsx` | Transaction records |
| `/admin/tickets` | `app/admin/tickets/page.tsx` | Support queue |
| `/admin/tickets/[id]` | `app/admin/tickets/[id]/page.tsx` | Ticket resolution |
| `/admin/leads` | `app/admin/leads/page.tsx` | Sales pipeline |
| `/admin/leads/create` | `app/admin/leads/create/page.tsx` | New lead |
| `/admin/leads/[id]` | `app/admin/leads/[id]/page.tsx` | Lead details |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Analytics overview |
| `/admin/analytics/revenue` | `app/admin/analytics/revenue/page.tsx` | Revenue reports |
| `/admin/analytics/usage` | `app/admin/analytics/usage/page.tsx` | Bandwidth reports |
| `/admin/analytics/customers` | `app/admin/analytics/customers/page.tsx` | Customer insights |
| `/admin/analytics/churn` | `app/admin/analytics/churn/page.tsx` | Churn analysis |
| `/admin/networks` | `app/admin/networks/page.tsx` | Network topology |
| `/admin/ads` | `app/admin/ads/page.tsx` | Hotspot advertisements |
| `/admin/fup` | `app/admin/fup/page.tsx` | Fair Usage Policy |
| `/admin/loyalty` | `app/admin/loyalty/page.tsx` | Loyalty program config |
| `/admin/sms` | `app/admin/sms/page.tsx` | SMS campaigns |
| `/admin/logs` | `app/admin/logs/page.tsx` | Audit logs |
| `/admin/settings` | `app/admin/settings/page.tsx` | System settings |
| `/admin/usage` | `app/admin/usage/page.tsx` | Real-time bandwidth |

---

## Page Descriptions

### Customer Portal Pages

#### Dashboard Home (`/dashboard`)
The main customer landing page after login.

**Features:**
- Account balance display (KES)
- Current package name and speed
- Days until subscription expiry
- Expiry warning alert (< 7 days)
- Quick action buttons (Recharge, Invoices, Support)
- Package details card

**Data Required:**
```typescript
interface CustomerUser {
  full_name: string
  balance: string
  expiry_date: string
  package: {
    name: string
    speed_down: number
    speed_up: number
    price: string
  }
}
```

#### Recharge (`/dashboard/recharge`)
Top-up account balance.

**Features:**
- Quick amount buttons (100, 200, 500, 1000)
- Custom amount input
- M-Pesa STK Push integration
- Voucher code redemption
- Package upgrade options
- Transaction history

#### Invoices (`/dashboard/invoices`)
Billing history and downloads.

**Features:**
- Invoice list with status (Paid/Pending/Overdue)
- Date range filter
- PDF download
- Payment receipts
- Total spent summary

#### Usage History (`/dashboard/usage-history`)
Data consumption tracking.

**Features:**
- Daily/Weekly/Monthly usage charts
- Peak usage hours heatmap
- Download vs Upload breakdown
- Usage by day of week
- Data limit progress bar

#### Loyalty (`/dashboard/loyalty`)
Rewards program.

**Features:**
- Points balance display
- Points history (earned/redeemed)
- Available rewards catalog
- Referral program link
- Tier status (Bronze/Silver/Gold)

#### Support (`/dashboard/support`)
Customer help system.

**Features:**
- Create new ticket
- View existing tickets
- Ticket status tracking
- FAQ section
- Live chat widget (future)

---

### Admin Panel Pages

#### Admin Dashboard (`/admin`)
Main admin landing page with KPIs.

**Stats Cards:**
- Total customers
- Active subscriptions
- Online users (live)
- Today's revenue
- Pending tickets
- Network uptime %

**Charts:**
- Revenue trend (7 days)
- New signups (30 days)
- Connection type distribution
- Top routers by users

#### Users Management (`/admin/users`)
**The most important admin page** - Customer management hub.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Users Management                                     │
│ [Refresh] [Bulk Import] [Add User]                          │
├─────────────────────────────────────────────────────────────┤
│ Stats Cards (7):                                             │
│ [Total] [Online] [Active] [Expired] [Hotspot] [PPPoE] [Static]
├─────────────────────────────────────────────────────────────┤
│ Tabs: [All Users] [Hotspot] [PPPoE] [Static IP] [Online]    │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Search...] [Status ▼] [Export]                    │
│ Bulk Actions: [Send SMS] [Email] [Delete] (when selected)   │
├─────────────────────────────────────────────────────────────┤
│ Table:                                                       │
│ ☐ | User        | Type    | Status | Connection | Plan...   │
│ ☐ | John Doe    | PPPoE   | Active | Online     | Monthly   │
│ ☐ | Jane Smith  | Hotspot | Active | Offline    | Weekly    │
│ ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ Pagination: Page 1 of 5  [Previous] [Next]                  │
└─────────────────────────────────────────────────────────────┘
```

**User Types:**
| Type | Icon | Description |
|------|------|-------------|
| Hotspot | 📶 | Captive portal users (WiFi) |
| PPPoE | 🌐 | Point-to-Point Protocol (Broadband) |
| Static IP | 🖥️ | Fixed IP assignment (Business) |
| Fiber | 📡 | Fiber optic connections |
| Wireless | 📻 | Point-to-point radio links |

**User Statuses:**
| Status | Color | Meaning |
|--------|-------|---------|
| Active | 🟢 Green | Paid, service enabled |
| Expired | 🔴 Red | Subscription ended |
| Suspended | 🟡 Yellow | Temp disabled |
| Pending | 🟠 Orange | Awaiting activation |
| Inactive | ⚫ Gray | Disabled by admin |

**Per-User Actions (Dropdown):**
- View Details → Opens slide-out drawer
- Edit User → Edit form dialog
- Extend Subscription → Add days modal
- Disconnect → Terminate session (if online)
- Send SMS → Direct message
- Delete User → Confirmation dialog

**Bulk Actions (Select multiple):**
- Send Bulk SMS → Campaign dialog
- Send Email → Email composer
- Delete Selected → Bulk remove

**User Detail Drawer:**
When clicking "View Details", a side drawer opens showing:
1. Basic Info (name, email, phone, customer ID)
2. Connection Details (router, IP, MAC, status, speeds)
3. Subscription (plan, price, joined date, expiry)
4. Usage & Balance (data used, account balance, loyalty points)
5. Action buttons (Edit, Extend, SMS, Email, Disconnect)

#### Plans Management (`/admin/plans`)
Service package configuration.

**Features:**
- List all plans with pricing
- Create new plan wizard
- Edit existing plans
- Enable/disable plans
- Sort by popularity
- Voucher generation

**Plan Fields:**
```typescript
interface ServicePlan {
  name: string           // "Monthly 10Mbps"
  description: string
  price: number          // 1500
  validity_days: number  // 30
  speed_down: number     // 10 (Mbps)
  speed_up: number       // 5 (Mbps)
  data_limit?: number    // 100 (GB) or null for unlimited
  is_active: boolean
  plan_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}
```

#### Routers (`/admin/routers`)
MikroTik device management.

**Features:**
- Router list with status
- Connected users count
- Uptime percentage
- CPU/Memory usage
- Last sync time
- API connectivity status

#### Payments (`/admin/payments`)
Transaction records.

**Features:**
- Payment list with filters
- M-Pesa transaction search
- Date range filter
- Payment method breakdown
- Daily/monthly totals
- Export to CSV

#### Tickets (`/admin/tickets`)
Support queue management.

**Features:**
- Ticket list (Open/In Progress/Resolved/Closed)
- Priority levels (Low/Medium/High/Urgent)
- Assign to technician
- Internal notes
- Customer communication
- Resolution tracking

#### Analytics (`/admin/analytics/*`)
Business intelligence dashboards.

**Sub-pages:**
- **Revenue** - Income charts, payment methods, forecasts
- **Customers** - Growth rate, demographics, plan distribution
- **Usage** - Bandwidth trends, peak hours, top consumers
- **Churn** - Cancellation rate, at-risk customers, retention

---

## Customer User Flows

### Flow 1: New Customer Registration

```
┌──────────────────────────────────────────────────────────────────┐
│ CUSTOMER REGISTRATION FLOW                                        │
└──────────────────────────────────────────────────────────────────┘

Step 1: Visit Website
│
▼
Step 2: Click "Register" or "Get Started"
│
▼
Step 3: Fill Registration Form
├── Full Name
├── Email Address
├── Phone Number (+254...)
├── Password
└── Confirm Password
│
▼
Step 4: Submit Form
│
▼
Step 5: [Backend] Account Created (Pending Status)
│
▼
Step 6: [Admin] Reviews & Assigns Plan
│
▼
Step 7: Customer Receives Activation SMS
│
▼
Step 8: Customer Logs In → Dashboard
│
▼
Step 9: Make First Payment / Recharge
│
▼
Step 10: Internet Service Activated ✓
```

### Flow 2: Account Recharge (M-Pesa)

```
┌──────────────────────────────────────────────────────────────────┐
│ M-PESA RECHARGE FLOW                                              │
└──────────────────────────────────────────────────────────────────┘

Step 1: Login to Dashboard
│
▼
Step 2: Click "Recharge" Button
│
▼
Step 3: Select Amount or Enter Custom Amount
│
▼
Step 4: Click "Pay with M-Pesa"
│
▼
Step 5: Enter M-Pesa Phone Number
│
▼
Step 6: Submit → STK Push Sent to Phone
│
▼
Step 7: Enter M-Pesa PIN on Phone
│
▼
Step 8: [Backend] Payment Confirmed via Callback
│
▼
Step 9: Balance Updated on Dashboard
│
▼
Step 10: If Expired → Service Reactivated
│
▼
Step 11: Confirmation SMS Sent ✓
```

### Flow 3: Raise Support Ticket

```
┌──────────────────────────────────────────────────────────────────┐
│ SUPPORT TICKET FLOW                                               │
└──────────────────────────────────────────────────────────────────┘

Step 1: Login to Dashboard
│
▼
Step 2: Navigate to "Support"
│
▼
Step 3: Click "New Ticket"
│
▼
Step 4: Fill Form
├── Subject: "Internet not working"
├── Category: Technical / Billing / Other
├── Priority: Low / Medium / High
└── Description: Detailed issue
│
▼
Step 5: Submit Ticket
│
▼
Step 6: Ticket Created (Status: Open)
│
▼
Step 7: [Admin] Assigns to Technician
│
▼
Step 8: [Admin] Updates Ticket
│
▼
Step 9: Customer Receives Update SMS
│
▼
Step 10: Issue Resolved → Ticket Closed ✓
```

---

## Admin User Flows

### Flow 1: Onboard New Customer

```
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN: NEW CUSTOMER ONBOARDING                                    │
└──────────────────────────────────────────────────────────────────┘

Step 1: Admin Logs In → /admin
│
▼
Step 2: Navigate to Users → /admin/users
│
▼
Step 3: Click "Add User" Button
│
▼
Step 4: Fill Customer Form
├── Full Name
├── Email
├── Phone Number
├── Connection Type (Hotspot/PPPoE/Static)
├── Select Plan (Monthly 10Mbps)
└── Assign Router (Router-Nairobi-01)
│
▼
Step 5: Click "Create User"
│
▼
Step 6: [Backend] Account Created
│
▼
Step 7: [Backend] Router Configured (if PPPoE/Static)
│
▼
Step 8: SMS with Credentials Sent
│
▼
Step 9: Customer Appears in Users List ✓
```

### Flow 2: Handle Support Ticket

```
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN: TICKET RESOLUTION FLOW                                     │
└──────────────────────────────────────────────────────────────────┘

Step 1: Admin Logs In → /admin
│
▼
Step 2: Dashboard Shows "X Pending Tickets"
│
▼
Step 3: Navigate to Tickets → /admin/tickets
│
▼
Step 4: Click on Ticket Row
│
▼
Step 5: View Ticket Details → /admin/tickets/[id]
├── Customer Info
├── Issue Description
├── Timeline
└── Internal Notes
│
▼
Step 6: Investigate Issue
├── Check Customer Account Status
├── Check Router Logs
└── Contact Customer if Needed
│
▼
Step 7: Update Ticket Status → "In Progress"
│
▼
Step 8: Resolve Issue (e.g., Reset Connection)
│
▼
Step 9: Add Resolution Note
│
▼
Step 10: Change Status → "Resolved"
│
▼
Step 11: Customer Notified via SMS ✓
```

### Flow 3: Daily Operations Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN: DAILY WORKFLOW                                             │
└──────────────────────────────────────────────────────────────────┘

Morning Routine:
│
├─► Login → /admin
│
├─► Check Dashboard KPIs
│   ├── Online Users Count
│   ├── Revenue Today
│   └── Pending Tickets
│
├─► Review Open Tickets → /admin/tickets
│   └── Assign to Technicians
│
├─► Check Expiring Subscriptions → /admin/users (filter: expiring)
│   └── Send Renewal Reminders
│
├─► Monitor Network Health → /admin/routers
│   └── Check Router Uptime
│
Afternoon:
│
├─► Process Leads → /admin/leads
│   └── Follow up on Inquiries
│
├─► Review Payments → /admin/payments
│   └── Check Failed Transactions
│
Evening:
│
├─► Generate Daily Report → /admin/analytics/revenue
│
└─► Backup Check → /admin/logs
```

### Flow 4: Disconnect/Reconnect Customer

```
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN: DISCONNECT/RECONNECT FLOW                                  │
└──────────────────────────────────────────────────────────────────┘

Disconnect (e.g., Non-Payment):
│
├─► Navigate to /admin/users
├─► Find Customer
├─► Click Actions → "Disconnect"
├─► Confirm Dialog
└─► Customer Session Terminated ✓

Reconnect (After Payment):
│
├─► Navigate to /admin/users
├─► Find Customer
├─► View Details
├─► Check Balance is Positive
├─► Click "Activate Service"
└─► Customer Reconnected ✓
```

---

## Component Library

The project uses **shadcn/ui** components. Key components:

| Component | Usage |
|-----------|-------|
| `Button` | Actions, form submissions |
| `Card` | Content containers, stats cards |
| `Table` | Data grids (users, payments) |
| `Dialog` | Modal forms, confirmations |
| `Sheet` | Slide-out panels (user details) |
| `Tabs` | Tab navigation |
| `Badge` | Status indicators |
| `Select` | Dropdowns, filters |
| `Input` | Text inputs |
| `Checkbox` | Multi-select rows |
| `Progress` | Usage bars |
| `Skeleton` | Loading states |
| `Alert` | Warnings, errors |

---

## API Integration

### Customer API (`lib/api.ts`)

```typescript
import { api } from '@/lib/api'

// Authentication
await api.login(email, password)
await api.register(data)
await api.logout()
await api.getCurrentUser()

// Customer Data
await api.getInvoices()
await api.getUsageHistory()
await api.getLoyaltyPoints()
await api.getNotifications()
```

### Admin API (`lib/admin-api.ts`)

```typescript
import { adminApi } from '@/lib/admin-api'

// Authentication
await adminApi.login(username, password)
await adminApi.getCurrentAdmin()

// Customers
await adminApi.getCustomers({ page: 1, status: 'active' })
await adminApi.getCustomer(id)
await adminApi.createCustomer(data)
await adminApi.updateCustomer(id, data)
await adminApi.changeCustomerStatus(id, 'suspended')

// Dashboard
await adminApi.getDashboard()
await adminApi.getStats()
```

### Mock Mode

```env
# .env.local
NEXT_PUBLIC_USE_MOCK=true   # Use mock data
NEXT_PUBLIC_USE_MOCK=false  # Use real backend
```

---

## Authentication System

### Customer Auth Context

```typescript
// app/auth-context.tsx
const AuthContext = createContext<AuthContextType>()

interface AuthContextType {
  user: CustomerUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

// Usage in components
const { user, login, logout } = useAuth()
```

### Admin Auth Context

```typescript
// app/admin/admin-auth-context.tsx
const AdminAuthContext = createContext<AdminAuthContextType>()

interface AdminAuthContextType {
  admin: AdminUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// Usage in components
const { admin, login, logout } = useAdminAuth()
```

### Token Storage

- **Customer**: `localStorage.access_token`, `localStorage.refresh_token`
- **Admin**: `localStorage.adminToken`, `sessionStorage.adminToken`

---

## Connection Types Reference

| Type | Code | Description | Auth Method |
|------|------|-------------|-------------|
| Hotspot | `hotspot` | WiFi captive portal | MAC + Voucher/Password |
| PPPoE | `pppoe` | Broadband connection | Username + Password |
| Static IP | `static` | Fixed IP assignment | IP-based |
| Fiber | `fiber` | FTTH connections | PPPoE or DHCP |
| Wireless | `wireless` | P2P radio links | Pre-shared key |

---

## Status Definitions

### Customer Status
| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `active` | Account in good standing | Full access |
| `inactive` | Disabled by admin | Cannot login |
| `suspended` | Temporarily blocked | Limited access |
| `pending` | Awaiting activation | Cannot use service |
| `expired` | Subscription ended | Needs renewal |

### Connection Status
| Status | Description |
|--------|-------------|
| `online` | Currently connected to network |
| `offline` | Not connected |

---

*Documentation Version: 1.0*  
*Last Updated: December 29, 2025*
