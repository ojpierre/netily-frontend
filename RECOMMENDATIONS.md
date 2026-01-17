# Netily - Recommended Pages & Features

---

## 🔴 BACKEND DEVELOPER - PRIORITY TASKS

> **Note to Backend Developer:** The frontend is ready and waiting for these endpoints. Please implement in order of priority.

### Priority 1: Router Management Module (BLOCKING)

The frontend router management pages are complete but the backend endpoints return 404. We need the following:

#### Required Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/network/routers/` | List all routers with pagination |
| POST | `/api/v1/network/routers/` | Create new router (only `name` required) |
| GET | `/api/v1/network/routers/{id}/` | Get router details |
| PATCH | `/api/v1/network/routers/{id}/` | Update router |
| DELETE | `/api/v1/network/routers/{id}/` | Delete router |
| GET | `/api/v1/network/routers/dashboard_stats/` | Get router stats summary |
| GET | `/api/v1/network/routers/{id}/events/` | Get router events log |
| GET | `/api/v1/network/routers/{id}/users/` | Get connected users |
| POST | `/api/v1/network/routers/{id}/test_connection/` | Test router connection |
| POST | `/api/v1/network/routers/{id}/reboot/` | Reboot router |
| POST | `/api/v1/network/routers/{id}/maintenance/` | Toggle maintenance mode |
| POST | `/api/v1/network/routers/{id}/sync_users/` | Sync users from router |
| POST | `/api/v1/network/routers/{id}/backup/` | Create backup |

#### Router Model Fields:
```python
class Router(models.Model):
    name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    mac_address = models.CharField(max_length=17, null=True, blank=True)
    api_port = models.IntegerField(default=8728)
    api_username = models.CharField(max_length=100, null=True, blank=True)
    api_password = models.CharField(max_length=255, null=True, blank=True)  # Encrypted
    router_type = models.CharField(max_length=50, choices=ROUTER_TYPES, default='mikrotik')
    model = models.CharField(max_length=100, null=True, blank=True)
    firmware_version = models.CharField(max_length=50, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    uptime = models.CharField(max_length=50, null=True, blank=True)
    uptime_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sla_target = models.DecimalField(max_digits=5, decimal_places=2, default=99.0)
    last_seen = models.DateTimeField(null=True, blank=True)
    tags = models.JSONField(default=list)
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Authentication fields (NEW - for router self-registration)
    auth_key = models.CharField(max_length=50, unique=True)  # Auto-generated
    is_authenticated = models.BooleanField(default=False)
    authenticated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

### Priority 2: Router Authentication System (NEW FEATURE)

This enables MikroTik routers to self-register by running a simple script.

#### Flow:
1. Admin creates router in dashboard (name only)
2. System generates unique `auth_key` (e.g., `RTR_0001_XY7K_AUTH`)
3. Admin copies script from frontend
4. Admin runs script on MikroTik router
5. Router calls our public endpoint
6. Backend validates key, captures router's IP, marks as authenticated

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/api/v1/routers/auth/?key=RTR_XXX` | **PUBLIC** | Router authentication |
| GET | `/api/v1/network/routers/{id}/auth-key/` | Admin | Get auth key |
| POST | `/api/v1/network/routers/{id}/regenerate-auth-key/` | Admin | Regenerate key |

#### Public Auth Endpoint Implementation:
```python
# views.py
class RouterAuthenticateView(APIView):
    permission_classes = []  # PUBLIC - no auth required
    
    def get(self, request):
        key = request.query_params.get('key')
        if not key:
            return Response({'error': 'Missing key'}, status=400)
        
        try:
            router = Router.objects.get(auth_key=key)
        except Router.DoesNotExist:
            return Response({'error': 'Invalid key'}, status=404)
        
        # Get router's IP from request
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Update router
        router.ip_address = ip
        router.is_authenticated = True
        router.authenticated_at = timezone.now()
        router.status = 'online'
        router.last_seen = timezone.now()
        router.save()
        
        return Response({
            'status': 'success',
            'message': f'Router {router.name} authenticated',
            'router_id': router.id
        })
```

#### Auth Key Generation:
```python
# models.py
def generate_auth_key():
    import secrets
    random_part = secrets.token_hex(4).upper()
    return f"RTR_{random_part}_AUTH"

# In Router model
auth_key = models.CharField(max_length=50, unique=True, default=generate_auth_key)
```

#### URL Pattern:
```python
# urls.py
urlpatterns = [
    # Public router auth (NO authentication required)
    path('routers/auth/', RouterAuthenticateView.as_view(), name='router-authenticate'),
    
    # Admin router management
    path('network/routers/', RouterViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('network/routers/<int:pk>/', RouterViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('network/routers/<int:pk>/auth-key/', RouterViewSet.as_view({'get': 'auth_key'})),
    path('network/routers/<int:pk>/regenerate-auth-key/', RouterViewSet.as_view({'post': 'regenerate_auth_key'})),
]
```

---

### Priority 3: Dashboard Stats Endpoint

The frontend calls `/api/v1/network/routers/dashboard_stats/` on page load.

#### Response Format:
```json
{
  "total_routers": 15,
  "online_routers": 12,
  "offline_routers": 1,
  "warning_routers": 1,
  "maintenance_routers": 1,
  "total_connected_users": 1250,
  "average_uptime": 99.5,
  "below_sla_count": 2
}
```

---

### Priority 4: Router Events Endpoint

Track router lifecycle events.

#### RouterEvent Model:
```python
class RouterEvent(models.Model):
    router = models.ForeignKey(Router, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50, choices=[
        ('up', 'Router Online'),
        ('down', 'Router Offline'),
        ('reboot', 'Router Rebooted'),
        ('config_change', 'Configuration Changed'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('maintenance', 'Maintenance Mode'),
    ])
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

---

### Priority 5: Optional - Heartbeat Endpoint

For routers to periodically check in (can be implemented later):

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/routers/heartbeat/` | **PUBLIC** | Periodic check-in |

```python
class RouterHeartbeatView(APIView):
    permission_classes = []
    
    def post(self, request):
        key = request.data.get('key')
        router = Router.objects.filter(auth_key=key).first()
        if router:
            router.last_seen = timezone.now()
            router.status = 'online'
            router.save(update_fields=['last_seen', 'status'])
            return Response({'status': 'ok'})
        return Response({'error': 'Invalid key'}, status=404)
```

---

## Testing the Integration

Once implemented, the frontend will:

1. **Routers List Page** (`/admin/routers`)
   - Display all routers from API
   - Navigate to router details

2. **Router Details Page** (`/admin/routers/{id}`)
   - Show router info from API
   - Display auth script with the router's `auth_key`
   - Show connected users
   - Show events log
   - Allow editing router details

3. **MikroTik Integration**
   - Admin copies script: `/tool fetch url="https://api.netily.io/api/v1/routers/auth?key=RTR_XXX" mode=https`
   - Runs on router
   - Router appears as "Authenticated" in dashboard

---

## 🔵 STAFF MANAGEMENT MODULE (NEW)

> **Status:** Frontend created at `/admin/staff`. Backend clarifications needed.

### Implemented Frontend Features

- **Staff List Page** - Table with search, role filtering, pagination
- **Create Staff Dialog** - Role selection cards, form validation, password strength indicator
- **Staff Roles Supported:** `staff`, `technician`, `accountant`, `support`
- **Navigation** - Added "Staff" link in admin sidebar

### Backend Clarifications Needed

Please confirm the following with the backend team:

#### 1. List Staff Endpoint

```
GET /api/v1/core/users/
```

**Questions:**
- Does it support query params for filtering? e.g., `?role=technician&is_active=true`
- What is the pagination format? (`page`, `page_size` or `limit`, `offset`?)
- Does it return ALL users or only the logged-in company's users?

**Expected Response:**
```json
{
  "count": 25,
  "next": "http://api.example.com/api/v1/core/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 7,
      "email": "staff@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "role": "technician",
      "phone_number": "+254712345678",
      "id_number": "12345678",
      "gender": "female",
      "date_of_birth": "1990-01-01",
      "is_active": true,
      "is_verified": false,
      "is_staff": true,
      "date_joined": "2026-01-18T10:00:00Z",
      "last_login": "2026-01-18T12:30:00Z",
      "company": {
        "id": 2,
        "name": "Your ISP Name",
        "email": "info@yourisp.com"
      }
    }
  ]
}
```

---

#### 2. Update Staff Endpoint

```
PATCH /api/v1/core/users/{id}/
```

**Questions:**
- Which fields can be updated? (role, phone_number, is_active, etc.)
- Can password be changed via PATCH, or is there a separate endpoint?
- Can an admin change another staff member's role?

**Expected Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "accountant",
  "phone_number": "+254712345678",
  "is_active": false
}
```

**Expected Response:**
```json
{
  "id": 7,
  "email": "staff@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "accountant",
  "phone_number": "+254712345678",
  "is_active": false,
  ...
}
```

---

#### 3. Delete vs Deactivate Staff

```
DELETE /api/v1/core/users/{id}/
```

**Questions:**
- Is this a **hard delete** (permanently removes from database)?
- Or is it a **soft delete** (sets `is_deleted=true` but keeps record)?
- Should frontend use `PATCH` with `is_active: false` for deactivation instead?

**Recommendation:** 
Prefer soft delete/deactivation for audit trail and data integrity.

---

#### 4. Password Reset for Staff

**Questions:**
- Is there an admin-initiated password reset endpoint?
  ```
  POST /api/v1/core/users/{id}/reset-password/
  ```
- Or should staff use the standard "Forgot Password" email flow?
- Can admin set a temporary password for a staff member?

**Suggested Endpoint:**
```
POST /api/v1/core/users/{id}/reset-password/
Authorization: Bearer <admin-token>

Response (Option A - Email sent):
{
  "message": "Password reset email sent to staff@example.com"
}

Response (Option B - Temporary password):
{
  "temporary_password": "TempPass123!",
  "message": "Staff must change password on next login"
}
```

---

#### 5. Role-Based Permissions (Future Enhancement)

**Questions:**
- Do different roles have different dashboard access?
- Should `technician` only see Dispatch/ONU/Router sections?
- Should `accountant` only see Finance sections?
- Is this enforced on backend or frontend?

**Suggested Permission Matrix:**

| Role | Dashboard | Users | Network | Finance | Dispatch | Settings |
|------|-----------|-------|---------|---------|----------|----------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| staff | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| technician | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| accountant | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| support | ✅ | ✅ (read) | ❌ | ❌ | ❌ | ❌ |

---

### Frontend Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Staff list page | ✅ Done | `/admin/staff` |
| Create staff dialog | ✅ Done | With role selection, validation |
| Staff types defined | ✅ Done | In `lib/types.ts` |
| API methods | ✅ Done | `getStaffUsers`, `createStaffUser`, etc. |
| Navigation link | ✅ Done | Added to admin sidebar |
| Edit staff page | ⚪ Pending | Waiting for PATCH endpoint confirmation |
| View staff details | ⚪ Pending | `/admin/staff/{id}` |
| Password reset | ⚪ Pending | Waiting for endpoint |
| Role permissions | ⚪ Future | Backend-driven |

---

## 📋 Summary Checklist

| Task | Status | Notes |
|------|--------|-------|
| Router CRUD endpoints | 🔴 Not Started | Currently returning 404 |
| Dashboard stats endpoint | 🔴 Not Started | Currently returning 404 |
| Router events endpoint | 🔴 Not Started | Currently returning 404 |
| Router users endpoint | 🔴 Not Started | Currently returning 404 |
| Router auth endpoint (public) | 🔴 Not Started | New feature |
| Auth key generation | 🔴 Not Started | New feature |
| Heartbeat endpoint | ⚪ Optional | Nice to have |
| User profile update | 🔴 Not Started | PATCH /core/users/me/ |
| Change password endpoint | 🔴 Not Started | POST /core/auth/change-password/ |
| System settings endpoint | 🔴 Not Started | GET/PATCH /core/settings/ |
| Plans CRUD endpoints | 🟡 Verify | /billing/plans/ - may already exist |
| Plans dashboard_stats | 🔴 Not Started | GET /billing/plans/dashboard_stats/ |
| Plans toggle_active | 🔴 Not Started | POST /billing/plans/{id}/toggle_active/ |
| Plans public endpoint | 🔴 Not Started | GET /billing/plans/public/ |

---

### Priority 6: User Account Management (NEW)

The frontend Settings page now has an Account tab for users to manage their profile and password.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/core/users/me/` | Admin | Get current user profile ✅ (exists) |
| PATCH | `/api/v1/core/users/me/` | Admin | Update profile (first_name, last_name, email, phone_number) |
| POST | `/api/v1/core/auth/change-password/` | Admin | Change password |

#### Update Profile Request:
```json
PATCH /api/v1/core/users/me/
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+254712345678"
}
```

#### Change Password Request:
```json
POST /api/v1/core/auth/change-password/
{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

#### Change Password Response:
```json
{
  "message": "Password changed successfully"
}
```

#### Implementation:
```python
# views.py
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password changed successfully'})
```

#### URL Pattern:
```python
path('core/auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
```

---

### Priority 7: System Settings Endpoint (NEW)

The Settings page loads and saves various system configurations.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/core/settings/` | Admin | Get all system settings |
| PATCH | `/api/v1/core/settings/` | Admin | Update system settings |

#### Settings Model:
```python
class SystemSettings(models.Model):
    # RADIUS Settings
    primary_server = models.CharField(max_length=255, blank=True)
    primary_port = models.IntegerField(default=1812)
    primary_secret = models.CharField(max_length=255, blank=True)
    secondary_server = models.CharField(max_length=255, blank=True)
    secondary_port = models.IntegerField(default=1812)
    secondary_secret = models.CharField(max_length=255, blank=True)
    accounting_port = models.IntegerField(default=1813)
    timeout = models.IntegerField(default=5)
    retries = models.IntegerField(default=3)
    
    # Automation Settings
    auto_renew = models.BooleanField(default=True)
    auto_expiry = models.BooleanField(default=True)
    auto_notifications = models.BooleanField(default=True)
    auto_backup = models.BooleanField(default=False)
    auto_reports = models.BooleanField(default=True)
    grace_period = models.IntegerField(default=3)
    backup_frequency = models.CharField(max_length=20, default='daily')
    report_frequency = models.CharField(max_length=20, default='weekly')
    
    # Notification Settings
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    expiry_notifications = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    admin_email = models.EmailField(blank=True)
    sms_gateway = models.CharField(max_length=50, default='africastalking')
    
    class Meta:
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'
```

#### Note:
Use a singleton pattern - there should only be one SystemSettings record. Create it on first access if it doesn't exist:

```python
# views.py
class SystemSettingsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get_settings(self):
        settings, _ = SystemSettings.objects.get_or_create(pk=1)
        return settings
    
    def get(self, request):
        settings = self.get_settings()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)
    
    def patch(self, request):
        settings = self.get_settings()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
```

---

### Priority 8: Token Refresh Error Handling (BUG FIX)

When token refresh fails because the user no longer exists, the backend returns 500 instead of 401.

#### Current Behavior:
```
ERROR Internal Server Error: /api/v1/core/auth/token/refresh/
apps.core.models.User.DoesNotExist: User matching query does not exist.
```

#### Fix:
Override the TokenRefreshSerializer to handle missing users gracefully:

```python
# serializers.py
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist:
            raise InvalidToken('User no longer exists')
```

```python
# views.py
from rest_framework_simplejwt.views import TokenRefreshView

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer
```

```python
# urls.py
path('core/auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
```

---

### Priority 9: Plans Management Module (BILLING)

The frontend Plans Management page is complete and connected to the API. Please ensure the following endpoints are working:

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/billing/plans/` | Admin | List all plans with pagination |
| POST | `/api/v1/billing/plans/` | Admin | Create new plan |
| GET | `/api/v1/billing/plans/{id}/` | Admin | Get plan details |
| PATCH | `/api/v1/billing/plans/{id}/` | Admin | Update plan |
| DELETE | `/api/v1/billing/plans/{id}/` | Admin | Delete plan |
| POST | `/api/v1/billing/plans/{id}/toggle_active/` | Admin | Toggle plan active status |
| GET | `/api/v1/billing/plans/public/` | Public | Get public plans (for customer portal) |
| GET | `/api/v1/billing/plans/dashboard_stats/` | Admin | Get plans statistics |

#### Plan Model:
```python
class Plan(models.Model):
    PLAN_TYPE_CHOICES = [
        ('INTERNET', 'Internet'),
        ('ADDON', 'Add-on'),
        ('BUNDLE', 'Bundle'),
        ('TOPUP', 'Top-up'),
        ('PPPOE', 'PPPoE'),
        ('HOTSPOT', 'Hotspot'),
        ('STATIC', 'Static IP'),
    ]
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True)  # Auto-generate if empty
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES, default='PPPOE')
    description = models.TextField(blank=True, null=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2)  # In KES
    setup_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Speed & Data
    download_speed = models.IntegerField(null=True, blank=True)  # Mbps
    upload_speed = models.IntegerField(null=True, blank=True)    # Mbps
    data_limit = models.IntegerField(null=True, blank=True)       # GB, null = unlimited
    
    # Validity
    duration_days = models.IntegerField(default=30)  # Plan validity
    validity_hours = models.IntegerField(null=True, blank=True)  # For hourly plans
    
    # Fair Usage Policy
    fup_limit = models.IntegerField(null=True, blank=True)  # GB before throttle
    fup_speed = models.IntegerField(null=True, blank=True)  # Reduced speed in Mbps
    
    # Visibility & Status
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)  # Visible in customer portal
    is_popular = models.BooleanField(default=False)  # Featured plan
    
    # Features (stored as JSON array of strings)
    features = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Auto-generate code from name
            self.code = slugify(self.name).upper().replace('-', '_')
        super().save(*args, **kwargs)
    
    @property
    def price(self):
        """Alias for base_price for frontend compatibility"""
        return self.base_price
    
    @property
    def validity_days(self):
        """Alias for duration_days for frontend compatibility"""
        return self.duration_days
    
    @property
    def subscriber_count(self):
        """Count of active subscribers on this plan"""
        return self.subscriptions.filter(status='ACTIVE').count()
```

#### Create Plan Request:
```json
POST /api/v1/billing/plans/
{
  "name": "Home Basic 10Mbps",
  "plan_type": "PPPOE",
  "description": "Perfect for small households",
  "base_price": "2500.00",
  "setup_fee": "500.00",
  "download_speed": 10,
  "upload_speed": 5,
  "data_limit": null,
  "duration_days": 30,
  "is_active": true,
  "is_public": true,
  "is_popular": false,
  "features": [
    "Unlimited Data",
    "24/7 Support",
    "Free Installation"
  ]
}
```

#### Plan Response:
```json
{
  "id": 1,
  "name": "Home Basic 10Mbps",
  "code": "HOME_BASIC_10MBPS",
  "plan_type": "PPPOE",
  "description": "Perfect for small households",
  "base_price": "2500.00",
  "price": "2500.00",
  "setup_fee": "500.00",
  "download_speed": 10,
  "upload_speed": 5,
  "data_limit": null,
  "duration_days": 30,
  "validity_days": 30,
  "validity_hours": null,
  "fup_limit": null,
  "fup_speed": null,
  "is_active": true,
  "is_public": true,
  "is_popular": false,
  "features": [
    "Unlimited Data",
    "24/7 Support",
    "Free Installation"
  ],
  "subscriber_count": 42,
  "subscribers_count": 42,
  "created_at": "2026-01-08T10:00:00Z",
  "updated_at": "2026-01-08T10:00:00Z"
}
```

#### Dashboard Stats Response:
```json
GET /api/v1/billing/plans/dashboard_stats/
{
  "total_plans": 15,
  "active_plans": 12,
  "inactive_plans": 3,
  "hotspot_plans": 5,
  "pppoe_plans": 6,
  "static_plans": 4,
  "total_subscribers": 1250,
  "popular_plans": 3
}
```

#### Toggle Active Response:
```json
POST /api/v1/billing/plans/{id}/toggle_active/
{
  "id": 1,
  "is_active": false,
  "message": "Plan deactivated successfully"
}
```

#### Filter Parameters:
```
GET /api/v1/billing/plans/?plan_type=PPPOE&is_active=true&ordering=-created_at
```

#### Serializer:
```python
class PlanSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(source='base_price', max_digits=10, decimal_places=2, read_only=True)
    validity_days = serializers.IntegerField(source='duration_days', read_only=True)
    subscriber_count = serializers.IntegerField(read_only=True)
    subscribers_count = serializers.IntegerField(source='subscriber_count', read_only=True)
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'code', 'plan_type', 'description',
            'base_price', 'price', 'setup_fee',
            'download_speed', 'upload_speed', 'data_limit',
            'duration_days', 'validity_days', 'validity_hours',
            'fup_limit', 'fup_speed',
            'is_active', 'is_public', 'is_popular',
            'features', 'subscriber_count', 'subscribers_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'subscriber_count', 'created_at', 'updated_at']
```

#### ViewSet:
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    filterset_fields = ['plan_type', 'is_active', 'is_public', 'is_popular']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'base_price', 'created_at', 'subscriber_count']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        plans = Plan.objects.all()
        return Response({
            'total_plans': plans.count(),
            'active_plans': plans.filter(is_active=True).count(),
            'inactive_plans': plans.filter(is_active=False).count(),
            'hotspot_plans': plans.filter(plan_type='HOTSPOT').count(),
            'pppoe_plans': plans.filter(plan_type='PPPOE').count(),
            'static_plans': plans.filter(plan_type='STATIC').count(),
            'total_subscribers': sum(p.subscriber_count for p in plans),
            'popular_plans': plans.filter(is_popular=True).count(),
        })
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def public(self, request):
        """Public endpoint for customer-facing plan listing"""
        plans = Plan.objects.filter(is_active=True, is_public=True)
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        plan = self.get_object()
        plan.is_active = not plan.is_active
        plan.save()
        return Response({
            'id': plan.id,
            'is_active': plan.is_active,
            'message': f'Plan {"activated" if plan.is_active else "deactivated"} successfully'
        })
```

#### URL Configuration:
```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'billing/plans', PlanViewSet, basename='plan')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
```

---

### Priority 10: Analytics Dashboard Module (READ-ONLY)

The frontend Analytics Dashboard is complete and ready to consume API data. The page displays KPIs, revenue trends, user growth, plan performance, location analytics, router metrics, and payment method breakdowns.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/analytics/dashboard/` | Admin | Get complete dashboard data (recommended) |
| GET | `/api/v1/analytics/kpis/` | Admin | Get key performance indicators |
| GET | `/api/v1/analytics/revenue/` | Admin | Get revenue trend data |
| GET | `/api/v1/analytics/user-growth/` | Admin | Get user growth/churn data |
| GET | `/api/v1/analytics/plans/` | Admin | Get plan performance analytics |
| GET | `/api/v1/analytics/locations/` | Admin | Get location-based analytics |
| GET | `/api/v1/analytics/routers/` | Admin | Get router performance analytics |
| GET | `/api/v1/analytics/payment-methods/` | Admin | Get payment method breakdown |
| GET | `/api/v1/analytics/payment-stats/` | Admin | Get payment statistics |
| GET | `/api/v1/analytics/user-distribution/` | Admin | Get user type distribution |
| GET | `/api/v1/analytics/revenue-by-type/` | Admin | Get revenue by connection type |
| GET | `/api/v1/analytics/revenue-forecast/` | Admin | Get 3-month revenue forecast |
| GET | `/api/v1/analytics/revenue-target/` | Admin | Get revenue target progress |
| GET | `/api/v1/analytics/network-stats/` | Admin | Get network statistics summary |
| GET | `/api/v1/analytics/export/` | Admin | Export analytics report (CSV/PDF) |

All endpoints accept `?time_range=` parameter: `7d`, `30d`, `90d`, `12m`, `ytd`

#### Option 1: Single Dashboard Endpoint (Recommended)

Return all analytics data in one request for efficiency:

```python
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAdminUser]
    
    def get_date_range(self, time_range):
        now = datetime.now()
        ranges = {
            '7d': now - timedelta(days=7),
            '30d': now - timedelta(days=30),
            '90d': now - timedelta(days=90),
            '12m': now - relativedelta(months=12),
            'ytd': datetime(now.year, 1, 1),
        }
        return ranges.get(time_range, ranges['30d'])
    
    def get(self, request):
        time_range = request.query_params.get('time_range', '30d')
        start_date = self.get_date_range(time_range)
        
        # Build comprehensive analytics response
        return Response({
            'kpis': self.get_kpis(start_date),
            'revenue_data': self.get_revenue_data(start_date),
            'user_growth_data': self.get_user_growth_data(start_date),
            'plan_performance': self.get_plan_performance(start_date),
            'location_analytics': self.get_location_analytics(start_date),
            'router_analytics': self.get_router_analytics(),
            'payment_methods': self.get_payment_methods(start_date),
            'payment_stats': self.get_payment_stats(start_date),
            'user_distribution': self.get_user_distribution(),
            'revenue_by_type': self.get_revenue_by_type(start_date),
            'revenue_forecast': self.get_revenue_forecast(),
            'revenue_target': self.get_revenue_target(),
            'network_stats': self.get_network_stats(),
            'time_range': time_range,
        })
    
    def get_kpis(self, start_date):
        payments = Payment.objects.filter(created_at__gte=start_date, status='COMPLETED')
        customers = Customer.objects.filter(is_active=True)
        new_customers = Customer.objects.filter(created_at__gte=start_date)
        churned = Customer.objects.filter(
            is_active=False, 
            updated_at__gte=start_date
        )
        
        total_revenue = payments.aggregate(Sum('amount'))['amount__sum'] or 0
        total_users = customers.count()
        
        return {
            'total_revenue': float(total_revenue),
            'total_users': total_users,
            'new_users': new_customers.count(),
            'arpu': float(total_revenue / total_users) if total_users else 0,
            'churn_rate': round((churned.count() / total_users) * 100, 2) if total_users else 0,
            'conversion_rate': 23.5,  # Calculate from leads if available
            'revenue_change': 12.5,   # Compare with previous period
            'users_change': 8.3,
            'new_users_change': 15.0,
            'churn_change': -2.1,
        }
    
    def get_revenue_data(self, start_date):
        payments = Payment.objects.filter(
            created_at__gte=start_date, 
            status='COMPLETED'
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            revenue=Sum('amount'),
            users=Count('customer', distinct=True)
        ).order_by('month')
        
        # Add target (can be from settings or calculated)
        return [{
            'month': p['month'].strftime('%b'),
            'revenue': float(p['revenue']),
            'target': float(p['revenue']) * 0.95,  # Example target calculation
            'users': p['users'],
        } for p in payments]
    
    def get_user_growth_data(self, start_date):
        # Monthly new users and churn
        from django.db.models.functions import TruncMonth
        
        months = []
        current = start_date.replace(day=1)
        while current <= datetime.now():
            month_end = (current + relativedelta(months=1)) - timedelta(days=1)
            new_users = Customer.objects.filter(
                created_at__gte=current, 
                created_at__lte=month_end
            ).count()
            churned = Customer.objects.filter(
                is_active=False,
                updated_at__gte=current,
                updated_at__lte=month_end
            ).count()
            
            months.append({
                'month': current.strftime('%b'),
                'new_users': new_users,
                'churn': churned,
                'net_growth': new_users - churned,
            })
            current += relativedelta(months=1)
        
        return months
    
    def get_plan_performance(self, start_date):
        plans = Plan.objects.filter(is_active=True).annotate(
            user_count=Count('subscriptions', filter=Q(subscriptions__status='ACTIVE')),
            total_revenue=Sum(
                'subscriptions__payments__amount',
                filter=Q(subscriptions__payments__status='COMPLETED')
            )
        )
        
        total_users = sum(p.user_count for p in plans)
        
        return [{
            'id': p.id,
            'name': p.name,
            'type': p.plan_type.lower(),
            'users': p.user_count,
            'revenue': float(p.total_revenue or 0),
            'arpu': float(p.total_revenue / p.user_count) if p.user_count else 0,
            'share': round((p.user_count / total_users) * 100, 1) if total_users else 0,
        } for p in plans]
    
    def get_location_analytics(self, start_date):
        # Group by customer location
        locations = Customer.objects.filter(
            is_active=True
        ).values('location').annotate(
            users=Count('id'),
            revenue=Sum('payments__amount', filter=Q(payments__status='COMPLETED'))
        ).order_by('-revenue')[:10]
        
        total_revenue = sum(l['revenue'] or 0 for l in locations)
        
        return [{
            'id': idx,
            'name': loc['location'] or 'Unknown',
            'users': loc['users'],
            'revenue': float(loc['revenue'] or 0),
            'growth': 10.0,  # Calculate from historical data
            'share': round((loc['revenue'] / total_revenue) * 100, 1) if total_revenue else 0,
        } for idx, loc in enumerate(locations, 1)]
    
    def get_router_analytics(self):
        routers = Router.objects.filter(is_active=True)
        return [{
            'id': r.id,
            'name': r.name,
            'users': r.active_users,
            'uptime': float(r.uptime_percentage),
            'bandwidth': 70,  # Calculate from metrics
            'status': 'healthy' if r.uptime_percentage >= 99 else 'warning',
        } for r in routers]
    
    def get_payment_methods(self, start_date):
        methods = Payment.objects.filter(
            created_at__gte=start_date,
            status='COMPLETED'
        ).values('payment_method').annotate(
            transactions=Count('id'),
            amount=Sum('amount')
        ).order_by('-amount')
        
        total = sum(m['amount'] for m in methods)
        
        return [{
            'method': m['payment_method'] or 'Other',
            'transactions': m['transactions'],
            'amount': float(m['amount']),
            'percentage': round((m['amount'] / total) * 100) if total else 0,
        } for m in methods]
    
    def get_payment_stats(self, start_date):
        payments = Payment.objects.filter(created_at__gte=start_date)
        successful = payments.filter(status='COMPLETED')
        failed = payments.filter(status='FAILED')
        
        total = payments.count()
        return {
            'success_rate': round((successful.count() / total) * 100, 1) if total else 0,
            'failure_rate': round((failed.count() / total) * 100, 1) if total else 0,
            'total_transactions': total,
            'average_transaction': float(
                successful.aggregate(Avg('amount'))['amount__avg'] or 0
            ),
            'highest_transaction': float(
                successful.aggregate(Max('amount'))['amount__max'] or 0
            ),
            'collection_rate': 94.2,  # Calculate based on invoices paid
        }
    
    def get_user_distribution(self):
        customers = Customer.objects.filter(is_active=True)
        total = customers.count()
        
        hotspot = customers.filter(connection_type='HOTSPOT').count()
        pppoe = customers.filter(connection_type='PPPOE').count()
        static = customers.filter(connection_type='STATIC').count()
        
        return {
            'hotspot_users': hotspot,
            'pppoe_users': pppoe,
            'static_users': static,
            'hotspot_percentage': round((hotspot / total) * 100) if total else 0,
            'pppoe_percentage': round((pppoe / total) * 100) if total else 0,
            'static_percentage': round((static / total) * 100) if total else 0,
        }
    
    def get_revenue_by_type(self, start_date):
        # Revenue grouped by connection type
        payments = Payment.objects.filter(
            created_at__gte=start_date,
            status='COMPLETED'
        )
        
        hotspot = payments.filter(
            customer__connection_type='HOTSPOT'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        pppoe = payments.filter(
            customer__connection_type='PPPOE'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        static = payments.filter(
            customer__connection_type='STATIC'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total = hotspot + pppoe + static
        
        return {
            'hotspot_revenue': float(hotspot),
            'pppoe_revenue': float(pppoe),
            'static_revenue': float(static),
            'hotspot_percentage': round((hotspot / total) * 100) if total else 0,
            'pppoe_percentage': round((pppoe / total) * 100) if total else 0,
            'static_percentage': round((static / total) * 100) if total else 0,
        }
    
    def get_revenue_forecast(self):
        # Simple projection based on recent trends
        now = datetime.now()
        return [
            {
                'month': (now + relativedelta(months=i)).strftime('%B %Y'),
                'projected_revenue': 1900000 + (i * 150000),
                'growth_rate': 6.5 + (i * 0.5),
            }
            for i in range(1, 4)
        ]
    
    def get_revenue_target(self):
        # Get from settings or calculate
        return {
            'current_revenue': 9000000,
            'target_revenue': 10000000,
            'progress_percentage': 90,
            'monthly_average': 1500000,
            'best_month_revenue': 1780000,
            'projected_annual': 18000000,
        }
    
    def get_network_stats(self):
        routers = Router.objects.filter(is_active=True)
        return {
            'avg_uptime': float(
                routers.aggregate(Avg('uptime_percentage'))['uptime_percentage__avg'] or 0
            ),
            'active_routers': routers.filter(status='online').count(),
            'avg_bandwidth': 72,  # Calculate from metrics
            'warning_count': routers.filter(uptime_percentage__lt=99).count(),
        }
```

#### Response Format (Dashboard Endpoint):
```json
GET /api/v1/analytics/dashboard/?time_range=30d
{
  "kpis": {
    "total_revenue": 9000000,
    "total_users": 2237,
    "new_users": 717,
    "arpu": 4023.24,
    "churn_rate": 4.5,
    "conversion_rate": 23.5,
    "revenue_change": 12.5,
    "users_change": 8.3,
    "new_users_change": 15.0,
    "churn_change": -2.1
  },
  "revenue_data": [
    {"month": "Jan", "revenue": 1250000, "target": 1200000, "users": 890},
    {"month": "Feb", "revenue": 1380000, "target": 1300000, "users": 920}
  ],
  "user_growth_data": [
    {"month": "Jan", "new_users": 85, "churn": 12, "net_growth": 73},
    {"month": "Feb", "new_users": 92, "churn": 15, "net_growth": 77}
  ],
  "plan_performance": [
    {"id": 1, "name": "Home Basic", "type": "pppoe", "users": 345, "revenue": 517500, "arpu": 1500, "share": 15.4}
  ],
  "location_analytics": [
    {"id": 1, "name": "Nairobi CBD", "users": 450, "revenue": 675000, "growth": 12.5, "share": 25.6}
  ],
  "router_analytics": [
    {"id": 1, "name": "Router-Nairobi-01", "users": 320, "uptime": 99.9, "bandwidth": 85, "status": "healthy"}
  ],
  "payment_methods": [
    {"method": "M-Pesa", "transactions": 4520, "amount": 1350000, "percentage": 68}
  ],
  "payment_stats": {
    "success_rate": 98.5,
    "failure_rate": 1.5,
    "total_transactions": 6180,
    "average_transaction": 1250,
    "highest_transaction": 8000,
    "collection_rate": 94.2
  },
  "user_distribution": {
    "hotspot_users": 1479,
    "pppoe_users": 635,
    "static_users": 123,
    "hotspot_percentage": 62,
    "pppoe_percentage": 27,
    "static_percentage": 11
  },
  "revenue_by_type": {
    "hotspot_revenue": 1118100,
    "pppoe_revenue": 1550500,
    "static_revenue": 566500,
    "hotspot_percentage": 35,
    "pppoe_percentage": 49,
    "static_percentage": 16
  },
  "revenue_forecast": [
    {"month": "July 2024", "projected_revenue": 1900000, "growth_rate": 6.7}
  ],
  "revenue_target": {
    "current_revenue": 9000000,
    "target_revenue": 10000000,
    "progress_percentage": 90,
    "monthly_average": 1500000,
    "best_month_revenue": 1780000,
    "projected_annual": 18000000
  },
  "network_stats": {
    "avg_uptime": 99.5,
    "active_routers": 12,
    "avg_bandwidth": 72,
    "warning_count": 2
  },
  "time_range": "30d"
}
```

#### Export Endpoint:
```python
from django.http import HttpResponse
import csv
from io import StringIO

class AnalyticsExportView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        time_range = request.query_params.get('time_range', '30d')
        format_type = request.query_params.get('format', 'csv')
        
        # Get analytics data
        dashboard_view = AnalyticsDashboardView()
        data = dashboard_view.get(request).data
        
        if format_type == 'csv':
            return self.export_csv(data, time_range)
        elif format_type == 'pdf':
            return self.export_pdf(data, time_range)
        else:
            return Response({'error': 'Unsupported format'}, status=400)
    
    def export_csv(self, data, time_range):
        output = StringIO()
        writer = csv.writer(output)
        
        # Write KPIs
        writer.writerow(['Analytics Report', time_range])
        writer.writerow([])
        writer.writerow(['KPIs'])
        for key, value in data['kpis'].items():
            writer.writerow([key, value])
        
        # Write revenue data
        writer.writerow([])
        writer.writerow(['Revenue Data'])
        writer.writerow(['Month', 'Revenue', 'Target', 'Users'])
        for item in data['revenue_data']:
            writer.writerow([item['month'], item['revenue'], item['target'], item['users']])
        
        output.seek(0)
        response = HttpResponse(output, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename=analytics_{time_range}.csv'
        return response
```

#### URL Configuration:
```python
urlpatterns = [
    # Analytics endpoints
    path('api/v1/analytics/dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('api/v1/analytics/kpis/', AnalyticsKPIsView.as_view(), name='analytics-kpis'),
    path('api/v1/analytics/revenue/', AnalyticsRevenueView.as_view(), name='analytics-revenue'),
    path('api/v1/analytics/user-growth/', AnalyticsUserGrowthView.as_view(), name='analytics-user-growth'),
    path('api/v1/analytics/plans/', AnalyticsPlanPerformanceView.as_view(), name='analytics-plans'),
    path('api/v1/analytics/locations/', AnalyticsLocationsView.as_view(), name='analytics-locations'),
    path('api/v1/analytics/routers/', AnalyticsRoutersView.as_view(), name='analytics-routers'),
    path('api/v1/analytics/payment-methods/', AnalyticsPaymentMethodsView.as_view(), name='analytics-payment-methods'),
    path('api/v1/analytics/payment-stats/', AnalyticsPaymentStatsView.as_view(), name='analytics-payment-stats'),
    path('api/v1/analytics/user-distribution/', AnalyticsUserDistributionView.as_view(), name='analytics-user-distribution'),
    path('api/v1/analytics/revenue-by-type/', AnalyticsRevenueByTypeView.as_view(), name='analytics-revenue-by-type'),
    path('api/v1/analytics/revenue-forecast/', AnalyticsRevenueForecastView.as_view(), name='analytics-revenue-forecast'),
    path('api/v1/analytics/revenue-target/', AnalyticsRevenueTargetView.as_view(), name='analytics-revenue-target'),
    path('api/v1/analytics/network-stats/', AnalyticsNetworkStatsView.as_view(), name='analytics-network-stats'),
    path('api/v1/analytics/export/', AnalyticsExportView.as_view(), name='analytics-export'),
]
```

---

See `BACKEND_API_REQUIREMENTS.md` for complete API documentation including request/response formats.

---

### Priority 11: Voucher Management Module (VERIFY)

The frontend Voucher Management is complete and uses the API. Verify these endpoints exist and work correctly.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/billing/voucher-batches/` | Admin | List all voucher batches |
| POST | `/api/v1/billing/voucher-batches/` | Admin | Create voucher batch |
| GET | `/api/v1/billing/voucher-batches/{id}/` | Admin | Get batch details with vouchers |
| PATCH | `/api/v1/billing/voucher-batches/{id}/` | Admin | Update batch |
| DELETE | `/api/v1/billing/voucher-batches/{id}/` | Admin | Delete batch |
| POST | `/api/v1/billing/voucher-batches/{id}/generate/` | Admin | Generate vouchers for batch |
| GET | `/api/v1/billing/voucher-batches/{id}/stats/` | Admin | Get batch statistics |
| GET | `/api/v1/billing/voucher-batches/stats/` | Admin | Get overall voucher stats |
| GET | `/api/v1/billing/vouchers/` | Admin | List all vouchers (filterable) |
| POST | `/api/v1/billing/vouchers/{id}/activate/` | Admin | Activate voucher |
| POST | `/api/v1/billing/vouchers/{id}/deactivate/` | Admin | Deactivate voucher |
| POST | `/api/v1/billing/vouchers/{id}/sell/` | Admin | Mark voucher as sold |
| POST | `/api/v1/billing/vouchers/{id}/redeem/` | Admin | Redeem voucher for customer |
| GET | `/api/v1/billing/vouchers/validate/{code}/` | Public | Validate voucher code |

#### Voucher Batch Model:
```python
class VoucherBatch(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    plan = models.ForeignKey('Plan', on_delete=models.SET_NULL, null=True, blank=True)
    voucher_type = models.CharField(max_length=20, choices=[
        ('time', 'Time-based'),
        ('data', 'Data-based'),
        ('credit', 'Credit/Amount'),
        ('hybrid', 'Hybrid'),
    ], default='credit')
    credit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    validity_days = models.IntegerField(default=30)
    prefix = models.CharField(max_length=10, default='VCR')
    total_vouchers = models.IntegerField(default=0)
    used_vouchers = models.IntegerField(default=0)
    active_vouchers = models.IntegerField(default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('active', 'Active'),
        ('depleted', 'Depleted'),
        ('expired', 'Expired'),
    ], default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Voucher Model:
```python
class Voucher(models.Model):
    batch = models.ForeignKey('VoucherBatch', on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=20, unique=True)
    pin = models.CharField(max_length=6, null=True, blank=True)  # Optional PIN
    status = models.CharField(max_length=20, choices=[
        ('available', 'Available'),
        ('sold', 'Sold'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('disabled', 'Disabled'),
    ], default='available')
    sold_to = models.CharField(max_length=100, null=True, blank=True)  # Reseller/agent name
    sold_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey('Customer', on_delete=models.SET_NULL, null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

### Priority 12: Support Tickets Module (NEW)

The frontend Support Tickets management is complete and ready to consume API data. The page displays ticket lists, stats, messages, and supports creating/replying to tickets.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/support/tickets/` | Admin | List all tickets with filters |
| POST | `/api/v1/support/tickets/` | Admin/Customer | Create new ticket |
| GET | `/api/v1/support/tickets/{id}/` | Admin/Owner | Get ticket details with messages |
| PATCH | `/api/v1/support/tickets/{id}/` | Admin | Update ticket |
| DELETE | `/api/v1/support/tickets/{id}/` | Admin | Delete ticket |
| POST | `/api/v1/support/tickets/{id}/assign/` | Admin | Assign ticket to agent |
| POST | `/api/v1/support/tickets/{id}/status/` | Admin | Update ticket status |
| POST | `/api/v1/support/tickets/{id}/reply/` | Admin/Owner | Reply to ticket |
| POST | `/api/v1/support/tickets/{id}/escalate/` | Admin | Escalate ticket |
| GET | `/api/v1/support/tickets/{id}/messages/` | Admin/Owner | Get ticket messages |
| GET | `/api/v1/support/tickets/stats/` | Admin | Get ticket statistics |
| GET | `/api/v1/support/tickets/my/` | Customer | Get customer's tickets |

All list endpoints support query parameters: `?status=`, `?priority=`, `?category=`, `?search=`, `?assigned_to=`

#### Support Ticket Model:
```python
class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('billing', 'Billing'),
        ('account', 'Account'),
        ('service', 'Service'),
        ('other', 'Other'),
    ]
    
    ticket_number = models.CharField(max_length=20, unique=True)  # Auto-generated: TKT-1001
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='technical')
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='tickets')
    assigned_to = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True)
    sla_breached = models.BooleanField(default=False)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            last = SupportTicket.objects.order_by('-id').first()
            num = (last.id + 1) if last else 1
            self.ticket_number = f'TKT-{1000 + num}'
        super().save(*args, **kwargs)
```

#### Support Ticket Message Model:
```python
class SupportTicketMessage(models.Model):
    SENDER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('agent', 'Agent'),
        ('system', 'System'),
    ]
    
    ticket = models.ForeignKey('SupportTicket', on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    sender = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    message = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal notes not visible to customer
    attachments = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Response Formats:

**GET /api/v1/support/tickets/**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1001,
      "ticket_number": "TKT-1001",
      "subject": "Internet connection keeps dropping",
      "description": "Detailed description...",
      "status": "open",
      "priority": "high",
      "category": "technical",
      "customer_id": 123,
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+254712345678",
      "customer_plan": "Premium Weekly",
      "assigned_to": 5,
      "assigned_to_name": "Support Agent",
      "sla_breached": false,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T14:00:00Z",
      "messages": [
        {
          "id": 1,
          "ticket_id": 1001,
          "sender_type": "customer",
          "sender_id": 123,
          "sender_name": "John Doe",
          "message": "Hi, I'm having an issue...",
          "is_internal": false,
          "created_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

**GET /api/v1/support/tickets/stats/**
```json
{
  "total": 25,
  "open": 8,
  "in_progress": 6,
  "pending": 4,
  "resolved": 5,
  "closed": 2,
  "avg_response_time": "2.5 hrs",
  "avg_resolution_time": "18 hrs",
  "sla_compliance_rate": 94.5,
  "tickets_today": 3,
  "tickets_this_week": 12
}
```

**POST /api/v1/support/tickets/{id}/reply/**
```json
// Request
{
  "message": "Thank you for contacting us...",
  "is_internal": false
}

// Response
{
  "id": 2,
  "ticket_id": 1001,
  "sender_type": "agent",
  "sender_id": 5,
  "sender_name": "Support Agent",
  "message": "Thank you for contacting us...",
  "is_internal": false,
  "created_at": "2024-01-15T14:30:00Z"
}
```

---

### Priority 13: SMS Messaging Module (NEW)

The frontend SMS Management is complete and ready to consume API data. The page supports sending single/bulk SMS, managing templates, and running campaigns.

#### Required Endpoints:

**SMS Messages:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/messaging/sms/` | Admin | List all SMS messages |
| POST | `/api/v1/messaging/sms/` | Admin | Send single SMS |
| GET | `/api/v1/messaging/sms/{id}/` | Admin | Get message details |
| POST | `/api/v1/messaging/sms/{id}/retry/` | Admin | Retry failed message |
| POST | `/api/v1/messaging/sms/bulk/` | Admin | Send bulk SMS |
| GET | `/api/v1/messaging/sms/stats/` | Admin | Get SMS statistics |
| GET | `/api/v1/messaging/sms/balance/` | Admin | Get SMS balance/credits |

**SMS Templates:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/messaging/templates/` | Admin | List all templates |
| POST | `/api/v1/messaging/templates/` | Admin | Create template |
| GET | `/api/v1/messaging/templates/{id}/` | Admin | Get template |
| PATCH | `/api/v1/messaging/templates/{id}/` | Admin | Update template |
| DELETE | `/api/v1/messaging/templates/{id}/` | Admin | Delete template |

**SMS Campaigns:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/messaging/campaigns/` | Admin | List all campaigns |
| POST | `/api/v1/messaging/campaigns/` | Admin | Create campaign |
| GET | `/api/v1/messaging/campaigns/{id}/` | Admin | Get campaign details |
| PATCH | `/api/v1/messaging/campaigns/{id}/` | Admin | Update campaign |
| DELETE | `/api/v1/messaging/campaigns/{id}/` | Admin | Delete campaign |
| POST | `/api/v1/messaging/campaigns/{id}/start/` | Admin | Start campaign |
| POST | `/api/v1/messaging/campaigns/{id}/cancel/` | Admin | Cancel campaign |

#### SMS Message Model:
```python
class SMSMessage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    TYPE_CHOICES = [
        ('single', 'Single'),
        ('bulk', 'Bulk'),
        ('automated', 'Automated'),
        ('campaign', 'Campaign'),
    ]
    
    recipient = models.CharField(max_length=20)  # Phone number
    recipient_name = models.CharField(max_length=100, null=True, blank=True)
    customer = models.ForeignKey('Customer', on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='single')
    template = models.ForeignKey('SMSTemplate', on_delete=models.SET_NULL, null=True, blank=True)
    campaign = models.ForeignKey('SMSCampaign', on_delete=models.SET_NULL, null=True, blank=True)
    provider = models.CharField(max_length=50, default='africastalking')
    provider_message_id = models.CharField(max_length=100, null=True, blank=True)
    cost = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    error_message = models.TextField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### SMS Template Model:
```python
class SMSTemplate(models.Model):
    name = models.CharField(max_length=100)
    content = models.TextField()  # Use {variable} for placeholders
    variables = models.JSONField(default=list)  # ['amount', 'expiry_date']
    usage_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### SMS Campaign Model:
```python
class SMSCampaign(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=100)
    message = models.TextField()
    template = models.ForeignKey('SMSTemplate', on_delete=models.SET_NULL, null=True, blank=True)
    recipient_filter = models.JSONField(default=dict)  # Filter criteria for recipients
    recipient_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Response Formats:

**GET /api/v1/messaging/sms/stats/**
```json
{
  "total_sent": 5847,
  "delivered": 5620,
  "pending": 127,
  "failed": 100,
  "delivery_rate": 96.1,
  "total_cost": 2923.50,
  "messages_today": 156,
  "messages_this_week": 892
}
```

**GET /api/v1/messaging/sms/balance/**
```json
{
  "balance": 15000,
  "currency": "KES",
  "unit_cost": 0.50,
  "units_remaining": 30000,
  "provider": "africastalking",
  "last_updated": "2024-01-15T12:00:00Z"
}
```

**POST /api/v1/messaging/sms/**
```json
// Request
{
  "recipient": "+254712345678",
  "message": "Your payment has been received",
  "template_id": 1  // Optional
}

// Response
{
  "id": 5848,
  "recipient": "+254712345678",
  "recipient_name": "John Doe",
  "message": "Your payment has been received",
  "status": "pending",
  "type": "single",
  "cost": 0.50,
  "provider": "africastalking",
  "sent_at": "2024-01-15T14:30:00Z",
  "created_at": "2024-01-15T14:30:00Z"
}
```

**POST /api/v1/messaging/sms/bulk/**
```json
// Request
{
  "recipients": ["+254712345678", "+254723456789", "+254734567890"],
  "message": "Network maintenance scheduled for tomorrow",
  "template_id": 4  // Optional
}

// Response
{
  "queued": 3,
  "total_cost": 1.50,
  "messages": [
    {"id": 5849, "recipient": "+254712345678", "status": "pending"},
    {"id": 5850, "recipient": "+254723456789", "status": "pending"},
    {"id": 5851, "recipient": "+254734567890", "status": "pending"}
  ]
}
```

#### SMS Provider Integration (Africa's Talking):
```python
import africastalking

class SMSService:
    def __init__(self):
        africastalking.initialize(
            username=settings.AT_USERNAME,
            api_key=settings.AT_API_KEY
        )
        self.sms = africastalking.SMS
    
    def send(self, recipient, message):
        try:
            response = self.sms.send(message, [recipient])
            return {
                'success': True,
                'message_id': response['SMSMessageData']['Recipients'][0]['messageId'],
                'cost': response['SMSMessageData']['Recipients'][0]['cost'],
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_balance(self):
        try:
            balance = africastalking.Application.fetch_application_data()
            return float(balance['UserData']['balance'].replace('KES ', ''))
        except Exception as e:
            return 0
```

---
---

## ✅ Completed Pages

### 1. **Usage History** (`/dashboard/usage-history`)
- Track connection history and activity
- View total usage hours
- Filter by date and activity type
- Summary cards with key metrics
- Connection timeline with durations

### 2. **Notifications** (`/dashboard/notifications`)
- Real-time notification center
- Unread badge and counter
- Mark as read functionality
- Notification preferences (Email, SMS, Push)
- Categorized notifications (Payment, Plan, Reminder, Promotion, System)

### 3. **Settings** (`/dashboard/settings`)
- Complete profile management
- Security settings (password, 2FA)
- Notification preferences
- Payment method management
- Account deletion (danger zone)

---

## 🚀 Recommended Additional Pages

### 4. **Referral Program** (`/dashboard/referrals`)
**Purpose:** Grow user base through word-of-mouth
**Features:**
- Unique referral code for each user
- Track referred friends
- Rewards system (e.g., "Refer 3 friends, get 1 month free")
- Social sharing buttons
- Referral leaderboard
- Reward redemption history

**Benefits:**
- Viral growth mechanism
- Customer acquisition at lower cost
- Increased user engagement

---

### 5. **Speed Test** (`/dashboard/speed-test`)
**Purpose:** Let users test their connection quality
**Features:**
- One-click speed test
- Download/Upload speed measurement
- Ping and latency check
- Historical speed test results
- Compare with plan speed
- Share results
- Report issues if speed is below expected

**Benefits:**
- Build trust through transparency
- Proactive issue identification
- User satisfaction

---

### 6. **Auto-Recharge** (`/dashboard/auto-recharge`)
**Purpose:** Never run out of internet
**Features:**
- Enable/disable auto-renewal
- Set recharge date (e.g., 3 days before expiry)
- Choose payment method
- Set spending limits
- Notification before auto-charge
- Transaction history
- Pause/resume functionality

**Benefits:**
- Predictable revenue stream
- Reduced churn
- Better user experience

---

### 7. **Family/Team Management** (`/dashboard/family`)
**Purpose:** Manage multiple users under one account
**Features:**
- Add family members/team members
- Set data limits per user (optional)
- View individual usage
- Parental controls (if applicable)
- Manage permissions
- Split billing options

**Benefits:**
- Higher ARPU (Average Revenue Per User)
- Reduced account sharing issues
- Better for SMBs

---

### 8. **Network Status** (`/dashboard/network-status`)
**Purpose:** Real-time network information
**Features:**
- Live network uptime status
- Scheduled maintenance calendar
- Outage notifications
- Service areas map
- Coverage checker by address
- Historical uptime stats
- Subscribe to status updates

**Benefits:**
- Transparency builds trust
- Reduce support inquiries
- Proactive communication

---

### 9. **Rewards & Loyalty** (`/dashboard/rewards`)
**Purpose:** Gamify the experience and increase retention
**Features:**
- Points for actions (recharge, referral, review)
- Tier system (Bronze, Silver, Gold, Platinum)
- Redeem points for discounts/upgrades
- Exclusive perks per tier
- Progress tracking
- Special birthday rewards
- Streak bonuses (consecutive months)

**Benefits:**
- Increased retention
- Higher engagement
- Customer lifetime value growth

---

### 10. **Data Saver Tips** (`/dashboard/tips`)
**Purpose:** Help users optimize their experience
**Features:**
- Tips to improve connection quality
- Router placement suggestions
- Device management recommendations
- Security best practices
- Troubleshooting guides
- Video tutorials
- FAQ section

**Benefits:**
- Reduced support tickets
- Educated users
- Better experience

---

### 11. **Plan Comparison Tool** (`/dashboard/compare-plans`)
**Purpose:** Help users choose the right plan
**Features:**
- Side-by-side plan comparison
- "Recommend a plan" quiz
- Usage calculator
- Cost savings calculator (monthly vs quarterly)
- Easy upgrade/downgrade
- Plan change preview
- Proration calculator

**Benefits:**
- Upsell opportunities
- Self-service upgrades
- Informed decisions

---

### 12. **Transaction History** (`/dashboard/transactions`)
**Purpose:** Detailed financial records
**Features:**
- Complete payment history
- Export to CSV/PDF
- Filter by date range, type, status
- Failed transaction details
- Refund requests
- Receipt downloads
- Annual spending summary

**Benefits:**
- Financial transparency
- Tax documentation
- Dispute resolution

---

### 13. **Community Forum** (`/community`)
**Purpose:** Build community and reduce support load
**Features:**
- User-to-user support
- Tips and tricks sharing
- Feature requests
- Vote on features
- Category tags
- Moderators (staff)
- Reputation system

**Benefits:**
- Community engagement
- Free support from users
- Feature ideas

---

### 14. **Device Management** (`/dashboard/devices`)
**Purpose:** Manage connected devices
**Features:**
- List all connected devices
- Device names and types
- Last connected timestamp
- Block/unblock devices
- Bandwidth usage per device
- Device limit alerts
- Security alerts for unknown devices

**Benefits:**
- Security enhancement
- Better control
- Network optimization

---

### 15. **Support Ticket System** (`/dashboard/tickets`)
**Purpose:** Structured support management
**Features:**
- Create support tickets
- Track ticket status
- Priority levels
- File attachments
- Ticket history
- Response notifications
- Resolution time tracking
- Satisfaction rating

**Benefits:**
- Organized support
- Accountability
- Quality metrics

---

### 16. **Promotional Hub** (`/dashboard/offers`)
**Purpose:** Showcase offers and discounts
**Features:**
- Active promotions
- Limited-time offers
- Coupon code redemption
- Seasonal deals
- Upgrade incentives
- Partner offers
- Terms and conditions

**Benefits:**
- Increased revenue
- Marketing channel
- User excitement

---

### 17. **Offline Mode Info** (`/dashboard/offline`)
**Purpose:** Help users when connection is down
**Features:**
- Cached information
- Troubleshooting steps
- Emergency contact info
- Service status (cached)
- Quick recharge options (saved)
- Download account info

**Benefits:**
- Support during outages
- User confidence
- Reduced panic

---

## 📱 Additional Feature Recommendations

### Mobile App
- Native iOS and Android apps
- Push notifications
- Biometric authentication
- Quick recharge widget
- Data usage widget
- Offline mode

### Integration Features
- **Calendar Integration:** Add expiry dates to calendar
- **Voice Assistants:** "Alexa, recharge my Netily plan"
- **Chatbot:** AI-powered support assistant
- **WhatsApp Integration:** Recharge via WhatsApp
- **USSD Code:** Quick recharge for feature phones

### Analytics for Users
- Monthly usage reports
- Cost analysis
- Peak usage times
- Device breakdown
- Comparative analysis (vs previous months)

### Social Features
- Share milestones ("1 year with Netily!")
- Social login options
- Share speed test results
- Friend comparisons (opt-in)

---

## 🎨 UX Improvements

1. **Onboarding Flow**
   - Interactive tutorial for new users
   - Guided setup wizard
   - Welcome video
   - First-time user discounts

2. **Quick Actions**
   - Floating action button
   - Keyboard shortcuts
   - Swipe gestures (mobile)
   - One-click recharge

3. **Dark Mode**
   - System preference detection
   - Manual toggle
   - Scheduled dark mode

4. **Accessibility**
   - Screen reader support
   - High contrast mode
   - Font size controls
   - Keyboard navigation

5. **Progressive Web App (PWA)**
   - Install to home screen
   - Offline functionality
   - App-like experience

---

## 🔧 Technical Enhancements

1. **Backend Integration**
   - REST API or GraphQL
   - Real payment gateway integration
   - Database (PostgreSQL/MongoDB)
   - Redis for caching
   - WebSocket for real-time updates

2. **Authentication**
   - JWT tokens
   - OAuth (Google, Facebook)
   - Session management
   - Password reset flow
   - Email verification

3. **Performance**
   - Code splitting
   - Image optimization
   - Lazy loading
   - CDN integration
   - Server-side rendering

4. **Monitoring**
   - Error tracking (Sentry)
   - Analytics (Google Analytics, Mixpanel)
   - Performance monitoring
   - User behavior tracking

---

## 🎯 Priority Implementation Order

### Phase 1 (Immediate - Core Functionality)
1. Backend API integration
2. Real payment processing
3. Speed Test page
4. Auto-Recharge feature
5. Transaction History

### Phase 2 (High Value - Retention)
6. Rewards & Loyalty program
7. Referral Program
8. Device Management
9. Network Status page
10. Support Ticket System

### Phase 3 (Enhancement - Growth)
11. Family/Team Management
12. Community Forum
13. Promotional Hub
14. Plan Comparison Tool
15. Mobile App development

### Phase 4 (Nice to Have - Optimization)
16. Data Saver Tips
17. Offline Mode
18. Voice Assistant integration
19. Social features
20. Advanced Analytics

---

## 💡 Revenue Optimization Ideas

1. **Tiered Pricing:** More granular plan options
2. **Add-ons:** Static IP, extra speed, priority support
3. **Business Plans:** Dedicated plans for SMBs
4. **Annual Plans:** Discounted yearly subscriptions
5. **Bundle Offers:** Internet + streaming services
6. **Gift Cards:** Sellable vouchers
7. **Corporate Partnerships:** B2B deals

---

## 📊 Metrics to Track

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Churn Rate
- Average Revenue Per User (ARPU)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Net Promoter Score (NPS)
- Support Ticket Resolution Time
- Payment Success Rate
- Referral Conversion Rate

---

This document serves as a roadmap for expanding Netily into a comprehensive, feature-rich platform that delights users and drives business growth.
