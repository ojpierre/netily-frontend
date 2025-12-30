# API Alignment Changelog

**Date:** December 29, 2025  
**Purpose:** Align Next.js frontend with Django backend API structure (Swagger documented)

---

## Overview

The frontend was previously using placeholder API endpoints that didn't match the actual Django backend structure. This update restructures all API calls to match the Swagger-documented endpoints.

**Backend Base URL:** `http://127.0.0.1:8000/api/v1`

---

## ✅ Completed Changes

### 1. TypeScript API Types (`lib/types.ts`)
**Status:** ✅ NEW FILE CREATED

Created comprehensive TypeScript interfaces matching the Django backend models:

| Type | Description |
|------|-------------|
| `User` | Core user model with `is_staff`, `is_superuser` fields |
| `UserProfile` | Extended profile with phone, avatar, timezone |
| `LoginRequest/Response` | Auth request/response with JWT tokens |
| `RegisterRequest/Response` | Registration with email, password, phone |
| `Customer` | ISP customer with `customer_number`, `status`, `balance` |
| `CustomerService` | Service subscription with `service_type`, `plan`, connection details |
| `CustomerAddress` | Address with geolocation support |
| `CustomerDocument` | Document uploads with verification |
| `CustomerNote` | Notes with follow-up tracking |
| `NextOfKin` | Emergency contact information |
| `ServicePlan` | Package plans with pricing and limits |
| `Invoice` | Billing invoices |
| `Payment` | Payment records with M-Pesa support |
| `DashboardStats` | Admin dashboard statistics |
| `AuditLog` | System audit trail |

---

### 2. Main API Service (`lib/api.ts`)
**Status:** ✅ COMPLETELY REWRITTEN

**Endpoint Mappings:**

| Feature | Old Endpoint | New Endpoint |
|---------|--------------|--------------|
| Login | `/auth/login` | `/core/auth/login/` |
| Register | `/auth/register` | `/core/auth/register/` |
| Logout | `/auth/logout` | `/core/auth/logout/` |
| Token Refresh | - | `/core/auth/token/refresh/` |
| Current User | `/users/me` | `/core/users/me/` |
| User Profile | - | `/core/profile/` |
| Customers | `/users` | `/customers/` |
| Customer Services | - | `/customers/{id}/services/` |
| Customer Addresses | - | `/customers/{id}/addresses/` |
| Customer Documents | - | `/customers/{id}/documents/` |
| Customer Notes | - | `/customers/{id}/notes/` |
| Next of Kin | - | `/customers/{id}/next-of-kin/` |

**Key Features:**
- JWT token-based authentication
- Automatic token refresh
- Mock data fallback when backend unavailable
- Configurable via environment variables

---

### 3. Admin API Service (`lib/admin-api.ts`)
**Status:** ✅ COMPLETELY REWRITTEN

**New Methods:**

```typescript
// Authentication
login(username, password) → AdminLoginResponse
refreshToken(refresh) → { access: string }
logout() → void
getCurrentAdmin() → AdminUser

// Dashboard
getStats() → AdminStats
getDashboard() → DashboardStats

// Staff Management
getStaffUsers(params?) → PaginatedResponse<User>
getStaffUser(id) → User
createStaffUser(data) → User
updateStaffUser(id, data) → User
deleteStaffUser(id) → void

// Customer Management
getCustomers(params?) → PaginatedResponse<Customer>
getCustomer(id) → Customer
createCustomer(data) → Customer
updateCustomer(id, data) → Customer
deleteCustomer(id) → void
changeCustomerStatus(id, status) → Customer

// Customer Services
getCustomerServices(customerId) → CustomerService[]
activateService(customerId, serviceId) → CustomerService
suspendService(customerId, serviceId) → CustomerService

// Audit Logs
getAuditLogs(params?) → PaginatedResponse<AuditLog>
```

---

### 4. Customer Auth Context (`app/auth-context.tsx`)
**Status:** ✅ COMPLETELY REWRITTEN

**Changes:**
- Added `USE_MOCK_AUTH` toggle for development
- Created `CustomerUser` interface with proper fields:
  - `full_name`, `email`, `phone`, `address`
  - `balance`, `expiry_date`, `status`
  - `package` object with `name`, `speed_down`, `speed_up`, `price`
- Mock user fallback: "Demo User" with sample data
- Login/Register functions with API integration
- Auto-redirect on authentication state change

---

### 5. Admin Auth Context (`app/admin/admin-auth-context.tsx`)
**Status:** ✅ COMPLETELY REWRITTEN

**Changes:**
- Added `login(username, password)` function to context (was missing)
- Mock admin fallback: "Admin User" with `is_staff: true`
- Proper `is_staff` / `is_superuser` verification
- Token storage in localStorage/sessionStorage
- Loading state management

---

### 6. Admin Login Page (`app/admin/login/page.tsx`)
**Status:** ✅ COMPLETELY REWRITTEN

**Changes:**
- Now uses `useAdminAuth()` hook properly
- Form submission calls `login()` from context
- Auto-redirect if already logged in
- Error handling with toast notifications

---

### 7. Users Management Page (`app/admin/users/page.tsx`)
**Status:** ✅ UPDATED

**Changes:**
- Added imports: `adminApi`, `Customer`, `CustomerService`, `CustomerStatus`
- Added `USE_MOCK_DATA` toggle
- Created `mapCustomerToUser()` function to transform backend Customer → frontend User display
- Updated `loadUsers()` to:
  1. Check mock mode
  2. Call `adminApi.getCustomers()` if real mode
  3. Map results using `mapCustomerToUser()`
  4. Fall back to mock data on API failure
- Extended `UserType` to include `fiber` and `wireless`
- Extended `UserStatus` to include `inactive` and `pending`
- Updated badge configs with proper typing

---

### 8. Environment Configuration (`.env.local`)
**Status:** ✅ UPDATED

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_USE_MOCK=true
```

---

## 🔄 Pending Tasks

### 1. Test Backend Connectivity
**Priority:** HIGH

When Django backend is running:
1. Set `NEXT_PUBLIC_USE_MOCK=false` in `.env.local`
2. Restart Next.js dev server
3. Test all endpoints:
   - [ ] Admin login at `/admin/login`
   - [ ] Customer login at `/login`
   - [ ] Dashboard data loading
   - [ ] Users list fetching from `/customers/`
   - [ ] Customer status changes
   - [ ] Token refresh flow

### 2. Additional Pages to Update (Optional)
These pages may need updates when backend features are implemented:

| Page | Current State | Backend Endpoint |
|------|---------------|------------------|
| `/admin/plans` | Mock data | `/billing/plans/` |
| `/admin/payments` | Mock data | `/billing/payments/` |
| `/admin/tickets` | Mock data | `/support/tickets/` |
| `/admin/routers` | Mock data | `/network/routers/` |
| `/admin/logs` | Mock data | `/core/audit-logs/` |
| `/dashboard/invoices` | Mock data | `/billing/invoices/` |
| `/dashboard/usage-history` | Mock data | `/customers/{id}/usage/` |

### 3. Real-time Features (Future)
- WebSocket integration for live connection status
- Push notifications for service expiry
- Real-time bandwidth monitoring

---

## Configuration Guide

### Switching Between Mock and Real Backend

**For Development (Mock Data):**
```env
# .env.local
NEXT_PUBLIC_USE_MOCK=true
```

**For Testing with Backend:**
```env
# .env.local
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

**For Production:**
```env
# .env.production
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## File Changes Summary

| File | Action | Lines |
|------|--------|-------|
| `lib/types.ts` | Created | ~480 |
| `lib/api.ts` | Rewritten | ~650 |
| `lib/admin-api.ts` | Rewritten | ~380 |
| `app/auth-context.tsx` | Rewritten | ~280 |
| `app/admin/admin-auth-context.tsx` | Rewritten | ~180 |
| `app/admin/login/page.tsx` | Rewritten | ~120 |
| `app/admin/users/page.tsx` | Modified | ~1130 |
| `.env.local` | Updated | 2 |

---

## API Endpoint Reference (Backend)

### Core Module (`/core/`)
```
POST   /core/auth/login/           # User login
POST   /core/auth/register/        # User registration
POST   /core/auth/logout/          # User logout
POST   /core/auth/token/refresh/   # Refresh JWT token
GET    /core/users/                # List staff users
GET    /core/users/me/             # Current user details
GET    /core/profile/              # User profile
PATCH  /core/profile/              # Update profile
GET    /core/dashboard/            # Admin dashboard stats
GET    /core/settings/             # System settings
GET    /core/settings/public/      # Public settings
GET    /core/audit-logs/           # Audit trail
```

### Customer Module (`/customers/`)
```
GET    /customers/                        # List customers
POST   /customers/                        # Create customer
GET    /customers/{id}/                   # Get customer
PATCH  /customers/{id}/                   # Update customer
DELETE /customers/{id}/                   # Delete customer
POST   /customers/{id}/change_status/     # Change status
GET    /customers/{id}/services/          # Customer services
POST   /customers/{id}/services/          # Add service
GET    /customers/{id}/addresses/         # Customer addresses
GET    /customers/{id}/documents/         # Customer documents
GET    /customers/{id}/notes/             # Customer notes
GET    /customers/{id}/next-of-kin/       # Next of kin
```

---

*Last Updated: December 29, 2025*
