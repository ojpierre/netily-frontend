# Netily v2.0 - Feature Roadmap & Implementation Guide

> Based on Lipanet v2.1.1 architecture analysis. This document outlines the complete feature set and implementation requirements for both frontend and backend developers.

## 📋 Table of Contents

1. [Current Status](#current-status)
2. [Complete Feature Map](#complete-feature-map)
3. [Information Architecture](#information-architecture)
4. [Phase 1: Core Features](#phase-1-core-features)
5. [Phase 2: Advanced Features](#phase-2-advanced-features)
6. [Phase 3: Premium Features](#phase-3-premium-features)
7. [Backend API Requirements](#backend-api-requirements)
8. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Current Status

### ✅ Already Implemented
- Admin Login with Django JWT authentication
- Admin Dashboard (basic stats)
- User Management (basic CRUD)
- Router Management (basic)
- Plans Management (basic)
- Payments Overview
- System Logs
- Settings
- Customer Dashboard
- Customer Authentication

### 🔲 To Be Implemented (Lipanet Feature Parity)
- Captive Portal Ads
- Loyalty Points System
- Router Uptime & SLA Monitoring
- Advanced Bandwidth Management
- PPPoE & Static IP Management (QoS)
- Bulk User Import
- Automatic MikroTik Backups
- Leads Management
- Ticketing System
- Advanced Analytics
- SMS Integration
- WhatsApp Integration

---

## Complete Feature Map

### Admin Portal Navigation Structure

```
MAIN MENU
├── Dashboard
├── Users
│   ├── Static Users
│   ├── Hotspot Users
│   ├── PPPoE Users
│   ├── Online Users
│   └── Active Users
├── Internet Plans
│   ├── Hotspot Plans
│   ├── PPPoE Plans
│   ├── Static Plans
│   └── Vouchers
├── Ads (NEW)
│   ├── Active Ads
│   ├── Inactive Ads
│   └── Create Ad
├── SMS
│   ├── SMS History
│   ├── Send SMS
│   └── Bulk Messaging
├── Loyalty Points (NEW)
├── Leads (NEW)
├── Support Tickets (NEW)
│
FINANCE
├── Transactions
├── Shares & Sales Team
│
ANALYTICS
├── Reports
├── Advanced Analytics (NEW)
│   ├── Revenue Forecast
│   ├── Customer Lifetime
│   └── Usage Patterns
│
NETWORKING
├── Routers
│   ├── Router List
│   ├── Uptime Monitoring
│   └── SLA Dashboard
├── Roaming
├── IPv4 Networks
├── FUP (Fair Usage Policy)
├── Hotspot Designs
│
ADMINISTRATOR
├── Admin Users
├── System Logs
└── Settings
    ├── General
    ├── Payment Gateways
    ├── SMS Settings
    ├── WhatsApp Settings
    └── Backup Settings
```

### Customer Portal Navigation Structure

```
CUSTOMER DASHBOARD
├── Overview
│   ├── Account Balance
│   ├── Plan Status
│   ├── Usage Summary
│   └── Loyalty Points
├── Recharge
├── Invoices
├── Usage History
├── Notifications
├── Support
│   └── My Tickets
├── Profile
└── Settings
```

---

## Information Architecture

### User Types

| Type | Description | Features |
|------|-------------|----------|
| **Hotspot** | WiFi users with time/data-based plans | Captive portal, vouchers, time limits |
| **PPPoE** | Dedicated connection users | Username/password auth, persistent sessions |
| **Static** | Fixed IP users | Static IP assignment, QoS priority |

### Connection Types

| Type | Auth Method | Speed Control | Use Case |
|------|-------------|--------------|----------|
| Hotspot | MAC + Password | Queue-based | Public WiFi, Hotels |
| PPPoE | Username/Password | Profile-based | Home users, Businesses |
| Static | IP Assignment | Parent Queue | Servers, Premium users |

---

## Phase 1: Core Features

### 1.1 Enhanced User Management

**Frontend Routes:**
```
/admin/users                    → User list with filters
/admin/users/hotspot           → Hotspot users
/admin/users/pppoe             → PPPoE users
/admin/users/static            → Static IP users
/admin/users/online            → Currently online users
/admin/users/[id]              → User details
/admin/users/[id]/edit         → Edit user
/admin/users/import            → Bulk import
```

**Backend Endpoints:**
```
GET    /api/admin/users/                    → List all users
GET    /api/admin/users/?type=hotspot       → Filter by type
GET    /api/admin/users/?status=online      → Filter by status
GET    /api/admin/users/{id}/               → User details
PATCH  /api/admin/users/{id}/               → Update user
DELETE /api/admin/users/{id}/               → Delete user
POST   /api/admin/users/{id}/disconnect/    → Force disconnect
POST   /api/admin/users/import/             → Bulk import CSV
GET    /api/admin/users/export/             → Export to CSV
```

**Django Models:**
```python
class Customer(models.Model):
    USER_TYPES = [
        ('hotspot', 'Hotspot'),
        ('pppoe', 'PPPoE'),
        ('static', 'Static IP'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    customer_type = models.CharField(max_length=20, choices=USER_TYPES)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expiry_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    package = models.ForeignKey('Package', on_delete=models.SET_NULL, null=True)
    router = models.ForeignKey('Router', on_delete=models.SET_NULL, null=True)
    
    # PPPoE specific
    pppoe_username = models.CharField(max_length=100, blank=True)
    pppoe_password = models.CharField(max_length=100, blank=True)
    
    # Static IP specific
    static_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Loyalty
    loyalty_points = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 1.2 Enhanced Plans Management

**Frontend Routes:**
```
/admin/plans                    → All plans
/admin/plans/hotspot           → Hotspot plans
/admin/plans/pppoe             → PPPoE plans
/admin/plans/static            → Static plans
/admin/plans/vouchers          → Voucher management
/admin/plans/create            → Create new plan
/admin/plans/[id]/edit         → Edit plan
```

**Backend Endpoints:**
```
GET    /api/admin/packages/                 → List packages
GET    /api/admin/packages/?type=hotspot    → Filter by type
POST   /api/admin/packages/                 → Create package
PATCH  /api/admin/packages/{id}/            → Update package
DELETE /api/admin/packages/{id}/            → Delete package
POST   /api/admin/vouchers/generate/        → Generate vouchers
GET    /api/admin/vouchers/                 → List vouchers
```

**Django Models:**
```python
class Package(models.Model):
    PACKAGE_TYPES = [
        ('hotspot', 'Hotspot'),
        ('pppoe', 'PPPoE'),
        ('static', 'Static IP'),
    ]
    
    VALIDITY_TYPES = [
        ('time', 'Time-based'),
        ('data', 'Data-based'),
        ('unlimited', 'Unlimited'),
    ]
    
    name = models.CharField(max_length=100)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPES)
    validity_type = models.CharField(max_length=20, choices=VALIDITY_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    speed_down = models.IntegerField()  # Mbps
    speed_up = models.IntegerField()    # Mbps
    validity_days = models.IntegerField(null=True, blank=True)
    validity_hours = models.IntegerField(null=True, blank=True)
    data_limit_mb = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    loyalty_points = models.IntegerField(default=0)  # Points earned on purchase
    created_at = models.DateTimeField(auto_now_add=True)


class Voucher(models.Model):
    code = models.CharField(max_length=20, unique=True)
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
```

### 1.3 Router Management & Monitoring

**Frontend Routes:**
```
/admin/routers                  → Router list
/admin/routers/create          → Add router
/admin/routers/[id]            → Router details + uptime
/admin/routers/[id]/edit       → Edit router
/admin/routers/[id]/backup     → Backup management
/admin/routers/sla             → SLA dashboard
```

**Backend Endpoints:**
```
GET    /api/admin/routers/                  → List routers
POST   /api/admin/routers/                  → Add router
GET    /api/admin/routers/{id}/             → Router details
PATCH  /api/admin/routers/{id}/             → Update router
DELETE /api/admin/routers/{id}/             → Remove router
GET    /api/admin/routers/{id}/status/      → Real-time status
GET    /api/admin/routers/{id}/uptime/      → Uptime history
POST   /api/admin/routers/{id}/backup/      → Create backup
GET    /api/admin/routers/{id}/backups/     → List backups
POST   /api/admin/routers/{id}/restore/     → Restore backup
GET    /api/admin/routers/sla/              → SLA overview
```

**Django Models:**
```python
class Router(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    api_port = models.IntegerField(default=8728)
    api_username = models.CharField(max_length=100)
    api_password = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class RouterUptime(models.Model):
    router = models.ForeignKey(Router, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField()
    latency_ms = models.IntegerField(null=True)
    cpu_usage = models.IntegerField(null=True)
    memory_usage = models.IntegerField(null=True)


class RouterBackup(models.Model):
    router = models.ForeignKey(Router, on_delete=models.CASCADE)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_automatic = models.BooleanField(default=False)
```

---

## Phase 2: Advanced Features

### 2.1 Support Ticketing System

**Frontend Routes:**
```
/admin/tickets                  → All tickets
/admin/tickets/[id]            → Ticket details
/dashboard/support              → Customer ticket view
/dashboard/support/new         → Create ticket
/dashboard/support/[id]        → View ticket
```

**Backend Endpoints:**
```
GET    /api/tickets/                        → List tickets (role-based)
POST   /api/tickets/                        → Create ticket
GET    /api/tickets/{id}/                   → Ticket details
PATCH  /api/tickets/{id}/                   → Update ticket
POST   /api/tickets/{id}/reply/             → Add reply
POST   /api/tickets/{id}/close/             → Close ticket
GET    /api/tickets/stats/                  → Ticket statistics
```

**Django Models:**
```python
class Ticket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    ticket_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)


class TicketReply(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.2 Leads Management

**Frontend Routes:**
```
/admin/leads                    → All leads
/admin/leads/create            → Add lead
/admin/leads/[id]              → Lead details
/admin/leads/[id]/convert      → Convert to customer
```

**Backend Endpoints:**
```
GET    /api/admin/leads/                    → List leads
POST   /api/admin/leads/                    → Create lead
GET    /api/admin/leads/{id}/               → Lead details
PATCH  /api/admin/leads/{id}/               → Update lead
POST   /api/admin/leads/{id}/convert/       → Convert to customer
DELETE /api/admin/leads/{id}/               → Delete lead
GET    /api/admin/leads/stats/              → Lead statistics
```

**Django Models:**
```python
class Lead(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    ]
    
    SOURCE_CHOICES = [
        ('website', 'Website'),
        ('referral', 'Referral'),
        ('walk_in', 'Walk-in'),
        ('phone', 'Phone Call'),
        ('social', 'Social Media'),
    ]
    
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    notes = models.TextField(blank=True)
    interested_package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    converted_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2.3 Loyalty Points System

**Frontend Routes:**
```
/admin/loyalty                  → Loyalty settings
/admin/loyalty/transactions    → Points history
/dashboard (widget)            → Customer points display
```

**Backend Endpoints:**
```
GET    /api/admin/loyalty/settings/         → Get settings
PATCH  /api/admin/loyalty/settings/         → Update settings
GET    /api/admin/loyalty/transactions/     → Points history
GET    /api/customers/me/loyalty/           → Customer's points
POST   /api/customers/me/loyalty/redeem/    → Redeem points
```

**Django Models:**
```python
class LoyaltySettings(models.Model):
    is_active = models.BooleanField(default=False)
    points_per_shilling = models.DecimalField(max_digits=10, decimal_places=2, default=0.1)
    min_redeem_points = models.IntegerField(default=100)
    points_to_shilling_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.5)


class LoyaltyTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('earned', 'Earned'),
        ('redeemed', 'Redeemed'),
        ('expired', 'Expired'),
        ('adjusted', 'Adjusted'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    points = models.IntegerField()
    description = models.CharField(max_length=255)
    related_payment = models.ForeignKey('Payment', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.4 Captive Portal Ads

**Frontend Routes:**
```
/admin/ads                      → Ad management
/admin/ads/create              → Create ad
/admin/ads/[id]/edit           → Edit ad
```

**Backend Endpoints:**
```
GET    /api/admin/ads/                      → List ads
POST   /api/admin/ads/                      → Create ad
GET    /api/admin/ads/{id}/                 → Ad details
PATCH  /api/admin/ads/{id}/                 → Update ad
DELETE /api/admin/ads/{id}/                 → Delete ad
POST   /api/admin/ads/{id}/toggle/          → Toggle active status
GET    /api/captive/ads/                    → Public: Get active ads for captive portal
```

**Django Models:**
```python
class Advertisement(models.Model):
    AD_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    title = models.CharField(max_length=255)
    ad_type = models.CharField(max_length=20, choices=AD_TYPES)
    media_url = models.URLField()
    link_url = models.URLField(blank=True)
    duration_seconds = models.IntegerField(default=5)  # For video/display time
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Phase 3: Premium Features

### 3.1 Advanced Analytics

**Frontend Routes:**
```
/admin/analytics                → Analytics dashboard
/admin/analytics/revenue       → Revenue forecast
/admin/analytics/customers     → Customer lifetime value
/admin/analytics/usage         → Usage patterns
/admin/analytics/churn         → Churn analysis
```

**Backend Endpoints:**
```
GET    /api/admin/analytics/dashboard/      → Overview stats
GET    /api/admin/analytics/revenue/        → Revenue data
GET    /api/admin/analytics/revenue/forecast/  → ML forecast
GET    /api/admin/analytics/clv/            → Customer lifetime value
GET    /api/admin/analytics/usage/          → Usage patterns
GET    /api/admin/analytics/churn/          → Churn analysis
GET    /api/admin/analytics/peak-hours/     → Peak usage hours
```

**Example Response - Revenue Forecast:**
```json
{
  "historical": [
    {"date": "2024-01", "revenue": 125000},
    {"date": "2024-02", "revenue": 132000}
  ],
  "forecast": [
    {"date": "2024-03", "predicted": 140000, "lower": 135000, "upper": 145000},
    {"date": "2024-04", "predicted": 148000, "lower": 140000, "upper": 156000}
  ],
  "model_accuracy": 0.92,
  "trend": "increasing",
  "growth_rate": 0.056
}
```

### 3.2 SMS Integration

**Frontend Routes:**
```
/admin/sms                      → SMS dashboard
/admin/sms/send                → Send SMS
/admin/sms/bulk                → Bulk messaging
/admin/sms/history             → Message history
/admin/sms/templates           → Message templates
```

**Backend Endpoints:**
```
POST   /api/admin/sms/send/                 → Send single SMS
POST   /api/admin/sms/bulk/                 → Send bulk SMS
GET    /api/admin/sms/history/              → Message history
GET    /api/admin/sms/balance/              → SMS balance
GET    /api/admin/sms/templates/            → List templates
POST   /api/admin/sms/templates/            → Create template
```

### 3.3 Advanced Bandwidth Management

**Features:**
- PCQ Queue Trees
- Time-based bandwidth boosts
- Contention ratio management
- Traffic prioritization
- Fair Usage Policy (FUP)

**Frontend Routes:**
```
/admin/networking/fup           → FUP settings
/admin/networking/qos           → QoS settings
/admin/networking/bandwidth     → Bandwidth policies
```

**Backend Endpoints:**
```
GET    /api/admin/fup/                      → FUP policies
POST   /api/admin/fup/                      → Create FUP policy
GET    /api/admin/qos/                      → QoS settings
POST   /api/admin/routers/{id}/apply-qos/   → Apply QoS to router
```

---

## Backend API Requirements

### Authentication

All endpoints except public ones require JWT authentication:

```
Authorization: Bearer <access_token>
```

### Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Success",
  "status": "success"
}
```

**Paginated:**
```json
{
  "count": 100,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

**Error:**
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "status": "error"
}
```

### Permission Classes

```python
# permissions.py

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff or request.user.is_superuser

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'customer')

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.customer.user == request.user
```

---

## Frontend Implementation Guide

### New Admin Pages to Create

```
app/admin/
├── users/
│   ├── page.tsx           (List with tabs: All, Hotspot, PPPoE, Static, Online)
│   ├── [id]/
│   │   ├── page.tsx       (User details)
│   │   └── edit/page.tsx  (Edit user)
│   └── import/page.tsx    (Bulk import)
├── plans/
│   ├── page.tsx           (List with tabs by type)
│   ├── create/page.tsx    (Create plan)
│   ├── [id]/edit/page.tsx (Edit plan)
│   └── vouchers/page.tsx  (Voucher management)
├── ads/
│   ├── page.tsx           (Ad list)
│   └── create/page.tsx    (Create ad)
├── sms/
│   ├── page.tsx           (SMS dashboard)
│   ├── send/page.tsx      (Send SMS)
│   ├── bulk/page.tsx      (Bulk messaging)
│   └── history/page.tsx   (History)
├── loyalty/
│   └── page.tsx           (Loyalty settings)
├── leads/
│   ├── page.tsx           (Leads list)
│   └── create/page.tsx    (Add lead)
├── tickets/
│   ├── page.tsx           (All tickets)
│   └── [id]/page.tsx      (Ticket details)
├── analytics/
│   ├── page.tsx           (Analytics dashboard)
│   ├── revenue/page.tsx   (Revenue forecast)
│   ├── customers/page.tsx (CLV analysis)
│   └── usage/page.tsx     (Usage patterns)
└── networking/
    ├── routers/
    │   ├── page.tsx       (Router list)
    │   ├── [id]/page.tsx  (Router details + uptime)
    │   └── sla/page.tsx   (SLA dashboard)
    ├── fup/page.tsx       (Fair Usage Policy)
    └── ipv4/page.tsx      (IP management)
```

### Customer Dashboard Enhancements

```
app/dashboard/
├── page.tsx               (Add loyalty points widget)
├── support/
│   ├── page.tsx           (My tickets list)
│   ├── new/page.tsx       (Create ticket)
│   └── [id]/page.tsx      (Ticket details)
└── loyalty/
    └── page.tsx           (Points history & redemption)
```

### API Service Updates

Add to `lib/admin-api.ts`:
```typescript
// Tickets
async getTickets(params?: TicketParams): Promise<PaginatedResponse<Ticket>>
async createTicket(data: CreateTicketData): Promise<Ticket>
async replyToTicket(id: number, message: string): Promise<TicketReply>

// Leads
async getLeads(params?: LeadParams): Promise<PaginatedResponse<Lead>>
async createLead(data: CreateLeadData): Promise<Lead>
async convertLead(id: number): Promise<Customer>

// Analytics
async getAnalyticsDashboard(): Promise<AnalyticsDashboard>
async getRevenueForecast(): Promise<RevenueForecast>
async getCustomerLifetime(): Promise<CLVData>

// SMS
async sendSMS(to: string, message: string): Promise<SMSResult>
async sendBulkSMS(data: BulkSMSData): Promise<BulkSMSResult>

// Loyalty
async getLoyaltySettings(): Promise<LoyaltySettings>
async updateLoyaltySettings(data: Partial<LoyaltySettings>): Promise<LoyaltySettings>
```

---

## Priority Implementation Order

### Sprint 1 (Week 1-2)
1. ✅ Enhanced User Management with tabs
2. ✅ Enhanced Plans Management with types
3. ✅ Router uptime monitoring

### Sprint 2 (Week 3-4)
4. Support Ticketing System
5. Leads Management
6. Basic Analytics Dashboard

### Sprint 3 (Week 5-6)
7. Loyalty Points System
8. Captive Portal Ads
9. SMS Integration basics

### Sprint 4 (Week 7-8)
10. Advanced Analytics (Revenue Forecast, CLV)
11. Bulk User Import
12. Router Backup System

### Sprint 5 (Week 9-10)
13. Advanced Bandwidth Management
14. FUP Implementation
15. WhatsApp Integration

---

## Testing Checklist

- [ ] User CRUD operations work for all types
- [ ] Plan creation works for all types
- [ ] Voucher generation and redemption
- [ ] Router connection and monitoring
- [ ] Ticket creation and lifecycle
- [ ] Lead conversion flow
- [ ] Loyalty points earn/redeem
- [ ] SMS sending (single & bulk)
- [ ] Analytics data accuracy
- [ ] Permission-based access control

---

## Notes for Backend Developer

1. **MikroTik Integration**: Use `librouteros` Python library for RouterOS API
2. **Celery Tasks**: Use for background jobs (uptime checks, backups, SMS)
3. **Redis**: Required for real-time updates and caching
4. **Django Channels**: For WebSocket support (live router status)
5. **Machine Learning**: Use `scikit-learn` for revenue forecasting

---

*Document Version: 1.0*
*Last Updated: December 28, 2025*
