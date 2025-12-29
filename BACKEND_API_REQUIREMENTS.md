# Django Backend API Requirements for Netily v2.0

> Complete API specification for the Netily ISP Management System, inspired by Lipanet v2.1.1 architecture.

This document describes all the API endpoints that the Next.js frontend expects from the Django backend.

## Base Configuration

- **Base URL**: `http://localhost:8000/api`
- **Authentication**: JWT (JSON Web Tokens) using `djangorestframework-simplejwt`
- **Authorization Header**: `Authorization: Bearer <access_token>`
- **Content-Type**: `application/json`

## Required Django Packages

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
```

## CORS Configuration

Add to `settings.py`:

```python
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    # your apps...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # other middleware...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js frontend
]

CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

---

## Authentication Endpoints

### 1. User Login (JWT Token)

**Endpoint**: `POST /api/token/`

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "userpassword"
}
```

**Success Response** (200):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Implementation**: Use `TokenObtainPairView` from `rest_framework_simplejwt`

---

### 2. Token Refresh

**Endpoint**: `POST /api/token/refresh/`

**Request Body**:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Implementation**: Use `TokenRefreshView` from `rest_framework_simplejwt`

---

### 3. User Registration

**Endpoint**: `POST /api/register/`

**Request Body**:
```json
{
  "username": "user@example.com",
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "phone": "+254712345678",
  "address": "123 Main St, Nairobi"
}
```

**Success Response** (201):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Notes**:
- Create a new User and Customer record
- Automatically generate JWT tokens and return them
- Hash the password before saving

---

### 4. Get Current User Profile

**Endpoint**: `GET /api/users/me/`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "id": 1,
  "username": "user@example.com",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+254712345678",
  "address": "123 Main St, Nairobi",
  "balance": "5000.00",
  "expiry_date": "2024-12-31",
  "is_active": true,
  "package": {
    "id": 1,
    "name": "Premium Package",
    "price": "2000.00",
    "speed_down": 100,
    "speed_up": 50,
    "validity_days": 30
  }
}
```

**Notes**:
- Get the authenticated user's customer profile
- Include their active package details

---

## Admin Endpoints

### 5. Admin Login

**Endpoint**: `POST /api/auth/admin/login/`

**Request Body**:
```json
{
  "username": "admin",
  "password": "adminpassword"
}
```

**Success Response** (200):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@netily.com",
    "first_name": "Admin",
    "last_name": "User",
    "is_staff": true,
    "is_superuser": false,
    "is_active": true,
    "date_joined": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response** (403):
```json
{
  "detail": "Admin privileges required"
}
```

**Notes**:
- Only allow login if user has `is_staff=True` or `is_superuser=True`
- Return error if regular user tries to login

---

### 6. Get Admin Profile

**Endpoint**: `GET /api/auth/admin/me/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (200):
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@netily.com",
  "first_name": "Admin",
  "last_name": "User",
  "is_staff": true,
  "is_superuser": false,
  "is_active": true,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

---

### 7. Get Dashboard Statistics

**Endpoint**: `GET /api/admin/stats/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (200):
```json
{
  "total_users": 2847,
  "active_users": 1923,
  "expired_users": 924,
  "total_revenue": 3245780.00,
  "monthly_revenue": 125450.00,
  "bandwidth_usage": 45.6
}
```

**Notes**:
- Count all customers
- Count active customers (expiry_date > today)
- Count expired customers (expiry_date <= today)
- Sum all payments for revenue
- Calculate current month's revenue

---

### 8. Get All Customers (Admin)

**Endpoint**: `GET /api/admin/customers/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Query Parameters**:
- `page` (optional): Page number for pagination
- `search` (optional): Search by name, email, or phone
- `is_active` (optional): Filter by active status (true/false)

**Success Response** (200):
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/admin/customers/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com"
      },
      "full_name": "John Doe",
      "phone": "+254712345678",
      "address": "123 Main St",
      "balance": "5000.00",
      "expiry_date": "2024-12-31",
      "is_active": true,
      "package": {
        "id": 1,
        "name": "Premium",
        "price": "2000.00",
        "speed_down": 100,
        "speed_up": 50
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 9. Get Single Customer (Admin)

**Endpoint**: `GET /api/admin/customers/{id}/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (200): Same as single customer object above

---

### 10. Update Customer (Admin)

**Endpoint**: `PATCH /api/admin/customers/{id}/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Request Body** (all fields optional):
```json
{
  "full_name": "John Updated",
  "phone": "+254799999999",
  "address": "New Address",
  "balance": "10000.00",
  "is_active": true
}
```

**Success Response** (200): Updated customer object

---

### 11. Delete Customer (Admin)

**Endpoint**: `DELETE /api/admin/customers/{id}/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (204): No content

---

### 12. Activate Customer (Admin)

**Endpoint**: `POST /api/admin/customers/{id}/activate/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (200): Updated customer with `is_active=true`

---

### 13. Deactivate Customer (Admin)

**Endpoint**: `POST /api/admin/customers/{id}/deactivate/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Success Response** (200): Updated customer with `is_active=false`

---

## Customer Endpoints

### 14. Get Customer Profile

**Endpoint**: `GET /api/customers/me/`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "id": 1,
  "full_name": "John Doe",
  "phone": "+254712345678",
  "email": "user@example.com",
  "address": "123 Main St",
  "balance": "5000.00",
  "expiry_date": "2024-12-31",
  "is_active": true,
  "package": {
    "id": 1,
    "name": "Premium",
    "price": "2000.00",
    "speed_down": 100,
    "speed_up": 50,
    "validity_days": 30
  },
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com"
  }
}
```

---

### 15. Update Customer Profile

**Endpoint**: `PATCH /api/customers/me/`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body** (all optional):
```json
{
  "full_name": "John Updated",
  "phone": "+254799999999",
  "address": "New Address"
}
```

**Success Response** (200): Updated customer object

---

## Invoice Endpoints

### 16. Get User Invoices

**Endpoint**: `GET /api/invoices/`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "results": [
    {
      "id": 1,
      "amount": "2000.00",
      "invoice_date": "2024-01-01",
      "due_date": "2024-01-15",
      "paid": false,
      "paid_date": null
    }
  ]
}
```

---

## Payment Endpoints

### 17. Get User Payments

**Endpoint**: `GET /api/payments/`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "results": [
    {
      "id": 1,
      "amount": "2000.00",
      "payment_date": "2024-01-05",
      "payment_method": "M-Pesa"
    }
  ]
}
```

---

### 18. Create Payment

**Endpoint**: `POST /api/payments/`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "amount": "2000.00",
  "payment_method": "M-Pesa"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "amount": "2000.00",
  "payment_date": "2024-01-05T10:30:00Z",
  "payment_method": "M-Pesa"
}
```

---

### 19. Get All Payments (Admin)

**Endpoint**: `GET /api/admin/payments/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Query Parameters**:
- `page` (optional): Page number
- `customer` (optional): Filter by customer ID

**Success Response** (200):
```json
{
  "count": 500,
  "results": [
    {
      "id": 1,
      "customer": {
        "id": 1,
        "full_name": "John Doe"
      },
      "amount": "2000.00",
      "payment_date": "2024-01-05",
      "payment_method": "M-Pesa"
    }
  ]
}
```

---

## Package Endpoints

### 20. Get All Packages

**Endpoint**: `GET /api/packages/`

**Headers**: `Authorization: Bearer <access_token>` (optional for viewing)

**Success Response** (200):
```json
{
  "results": [
    {
      "id": 1,
      "name": "Basic Package",
      "price": "1000.00",
      "speed_down": 50,
      "speed_up": 25,
      "validity_days": 30,
      "description": "Perfect for home use"
    },
    {
      "id": 2,
      "name": "Premium Package",
      "price": "2000.00",
      "speed_down": 100,
      "speed_up": 50,
      "validity_days": 30,
      "description": "Best for streaming and gaming"
    }
  ]
}
```

---

### 21. Create Package (Admin)

**Endpoint**: `POST /api/packages/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Request Body**:
```json
{
  "name": "Enterprise Package",
  "price": "5000.00",
  "speed_down": 500,
  "speed_up": 250,
  "validity_days": 30,
  "description": "For business use"
}
```

**Success Response** (201): Created package object

---

## System Logs (Admin)

### 22. Get System Logs

**Endpoint**: `GET /api/admin/logs/`

**Headers**: `Authorization: Bearer <admin_access_token>`

**Query Parameters**:
- `page` (optional): Page number
- `level` (optional): Filter by log level (info, warning, error)

**Success Response** (200):
```json
{
  "count": 1000,
  "results": [
    {
      "id": 1,
      "timestamp": "2024-01-05T10:30:00Z",
      "level": "info",
      "message": "User login successful",
      "user": "john@example.com"
    }
  ]
}
```

---

## Error Response Format

All endpoints should return errors in this format:

```json
{
  "detail": "Error message here"
}
```

Or for field-specific errors:

```json
{
  "field_name": ["Error message for this field"]
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `204` - No Content (for DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Django Models Reference

You'll need these models:

### User Model
```python
from django.contrib.auth.models import AbstractUser
# Use Django's default User or extend it
```

### Customer Model
```python
class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expiry_date = models.DateField()
    is_active = models.BooleanField(default=True)
    package = models.ForeignKey('Package', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Package Model
```python
class Package(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    speed_down = models.IntegerField()  # Mbps
    speed_up = models.IntegerField()    # Mbps
    validity_days = models.IntegerField()
    description = models.TextField(blank=True)
```

### Invoice Model
```python
class Invoice(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid = models.BooleanField(default=False)
    paid_date = models.DateTimeField(null=True, blank=True)
```

### Payment Model
```python
class Payment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50)
```

---

## Quick Start URLs Configuration

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'admin/customers', views.CustomerViewSet, basename='admin-customers')
router.register(r'admin/packages', views.PackageViewSet, basename='admin-packages')
router.register(r'admin/routers', views.RouterViewSet, basename='admin-routers')
router.register(r'admin/tickets', views.TicketViewSet, basename='admin-tickets')
router.register(r'admin/leads', views.LeadViewSet, basename='admin-leads')
router.register(r'admin/ads', views.AdvertisementViewSet, basename='admin-ads')

urlpatterns = [
    # Auth
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.RegisterView.as_view(), name='register'),
    path('api/users/me/', views.CurrentUserView.as_view(), name='current_user'),
    
    # Admin Auth
    path('api/auth/admin/login/', views.AdminLoginView.as_view(), name='admin_login'),
    path('api/auth/admin/me/', views.AdminProfileView.as_view(), name='admin_profile'),
    
    # Admin Dashboard
    path('api/admin/stats/', views.AdminStatsView.as_view(), name='admin_stats'),
    path('api/admin/logs/', views.SystemLogsView.as_view(), name='system_logs'),
    
    # Analytics
    path('api/admin/analytics/dashboard/', views.AnalyticsDashboardView.as_view()),
    path('api/admin/analytics/revenue/', views.RevenueAnalyticsView.as_view()),
    path('api/admin/analytics/revenue/forecast/', views.RevenueForecastView.as_view()),
    path('api/admin/analytics/clv/', views.CustomerLifetimeValueView.as_view()),
    path('api/admin/analytics/usage/', views.UsagePatternsView.as_view()),
    path('api/admin/analytics/churn/', views.ChurnAnalysisView.as_view()),
    
    # Router Monitoring
    path('api/admin/routers/<int:pk>/status/', views.RouterStatusView.as_view()),
    path('api/admin/routers/<int:pk>/uptime/', views.RouterUptimeView.as_view()),
    path('api/admin/routers/<int:pk>/backup/', views.RouterBackupView.as_view()),
    path('api/admin/routers/<int:pk>/backups/', views.RouterBackupListView.as_view()),
    path('api/admin/routers/sla/', views.SLADashboardView.as_view()),
    
    # Loyalty Points
    path('api/admin/loyalty/settings/', views.LoyaltySettingsView.as_view()),
    path('api/admin/loyalty/transactions/', views.LoyaltyTransactionsView.as_view()),
    
    # SMS
    path('api/admin/sms/send/', views.SendSMSView.as_view()),
    path('api/admin/sms/bulk/', views.BulkSMSView.as_view()),
    path('api/admin/sms/history/', views.SMSHistoryView.as_view()),
    path('api/admin/sms/balance/', views.SMSBalanceView.as_view()),
    
    # Vouchers
    path('api/admin/vouchers/', views.VoucherListView.as_view()),
    path('api/admin/vouchers/generate/', views.GenerateVouchersView.as_view()),
    
    # Bulk Import
    path('api/admin/users/import/', views.BulkUserImportView.as_view()),
    path('api/admin/users/export/', views.UserExportView.as_view()),
    
    # Customer Portal
    path('api/customers/me/', views.CustomerProfileView.as_view(), name='customer_profile'),
    path('api/customers/me/loyalty/', views.CustomerLoyaltyView.as_view()),
    path('api/customers/me/loyalty/redeem/', views.RedeemPointsView.as_view()),
    
    # Tickets (Customer)
    path('api/tickets/', views.CustomerTicketListView.as_view()),
    path('api/tickets/<int:pk>/', views.CustomerTicketDetailView.as_view()),
    path('api/tickets/<int:pk>/reply/', views.TicketReplyView.as_view()),
    
    # Invoices
    path('api/invoices/', views.InvoiceListView.as_view(), name='invoices'),
    
    # Payments
    path('api/payments/', views.PaymentListCreateView.as_view(), name='payments'),
    
    # Packages
    path('api/packages/', views.PackageListView.as_view(), name='packages'),
    
    # Captive Portal (Public)
    path('api/captive/ads/', views.CaptivePortalAdsView.as_view()),
    
    # Router API endpoints
    path('api/', include(router.urls)),
]
```

---

## Additional Required Packages

```bash
# Core
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers

# Background Tasks
pip install celery
pip install redis

# MikroTik Integration
pip install librouteros

# Analytics & ML
pip install pandas
pip install numpy
pip install scikit-learn

# SMS (choose one)
pip install africastalking  # For Africa's Talking
pip install twilio          # For Twilio

# File handling
pip install openpyxl        # Excel export
pip install python-csv      # CSV processing

# WebSocket (optional, for real-time)
pip install channels
pip install channels-redis
```

---

## Celery Configuration

For background tasks (uptime monitoring, backups, SMS):

```python
# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

# celery.py
from celery import Celery
from celery.schedules import crontab

app = Celery('netily')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    'check-router-uptime': {
        'task': 'core.tasks.check_router_uptime',
        'schedule': 60.0,  # Every minute
    },
    'backup-routers': {
        'task': 'core.tasks.backup_all_routers',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'expire-subscriptions': {
        'task': 'core.tasks.check_subscription_expiry',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

---

## Testing

Test all endpoints with:
- **Postman** or **Thunder Client** (VS Code extension)
- Use the mock credentials in development:
  - Regular user: `user@example.com` / `password123`
  - Admin: `admin` / `admin123`

The frontend will automatically switch between Django backend and mock data based on availability.

---

## Implementation Priority

### Phase 1 (Essential)
1. Authentication (JWT)
2. User CRUD with types (Hotspot, PPPoE, Static)
3. Package management
4. Router management
5. Payment processing

### Phase 2 (Important)
6. Support tickets
7. Leads management
8. Router uptime monitoring
9. Basic analytics

### Phase 3 (Advanced)
10. Loyalty points system
11. Captive portal ads
12. SMS integration
13. Advanced analytics (ML)
14. Bulk import/export

---

## Questions?

Contact the frontend team if you need clarification on any endpoint or response format.

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for complete feature specifications.
