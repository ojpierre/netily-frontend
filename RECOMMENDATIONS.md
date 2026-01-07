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
   - Allow adding new router (name only)
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

See `BACKEND_API_REQUIREMENTS.md` for complete API documentation including request/response formats.

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
