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

## 💳 PAYHERO PAYMENT INTEGRATION (CRITICAL)

> **Status:** Frontend is fully ready. Backend needs to implement PayHero endpoints for three payment use cases.

### Overview

The Netily platform requires PayHero integration for **three distinct payment scenarios**:

| Use Case | Who Pays | What For | Frontend Location |
|----------|----------|----------|-------------------|
| 1. ISP Subscription Billing | ISP Admin | Netily platform subscription | `/admin/settings/billing` |
| 2. Hotspot Access Payments | End-User (WiFi Customer) | WiFi access time/data | `/hotspot/[router_id]` (Captive Portal) |
| 3. User Account Recharge | ISP Subscriber | Their ISP service invoice | `/dashboard/recharge` |

---

### 🔴 Priority 6: ISP Subscription Billing (Netily Platform)

ISP admins pay Netily for their platform subscription (Starter, Professional, Enterprise).

#### Required Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/subscriptions/plans/` | List available subscription plans |
| GET | `/api/v1/subscriptions/current/` | Get company's current subscription |
| GET | `/api/v1/subscriptions/usage/` | Get usage stats (subscribers, routers, staff) |
| POST | `/api/v1/subscriptions/pay/` | **Initiate payment via PayHero** |
| GET | `/api/v1/subscriptions/payments/` | Payment history |
| GET | `/api/v1/subscriptions/payments/{id}/` | Poll payment status |
| POST | `/api/v1/subscriptions/cancel/` | Cancel subscription |
| POST | `/api/v1/webhooks/payhero/subscription/` | **PayHero callback (PUBLIC)** |

#### Payment Initiation Request:
```json
POST /api/v1/subscriptions/pay/
{
  "plan_id": "professional",
  "payment_method": "mpesa_stk",  // "mpesa_stk" | "mpesa_paybill" | "bank_transfer"
  "phone_number": "254712345678", // Required for mpesa_stk
  "billing_period": "monthly"     // "monthly" | "yearly"
}
```

#### Response - STK Push:
```json
{
  "status": "pending",
  "payment_id": 123,
  "checkout_request_id": "ws_CO_123456789",
  "message": "STK Push sent. Check your phone and enter your M-Pesa PIN."
}
```

#### Response - Paybill:
```json
{
  "status": "awaiting_payment",
  "payment_id": 123,
  "paybill_number": "247247",
  "account_number": "NETILY-PRO-123456",
  "amount": 7999,
  "message": "Use the Paybill details to complete payment"
}
```

#### Response - Bank Transfer:
```json
{
  "status": "awaiting_payment",
  "payment_id": 123,
  "bank_details": {
    "bank_name": "Equity Bank",
    "account_name": "Netily Technologies Ltd",
    "account_number": "0123456789012",
    "branch": "Westlands"
  },
  "amount": 7999,
  "reference": "NETILY-PRO-123456"
}
```

#### PayHero Webhook Handler:
```python
# views.py - MUST BE PUBLIC (no authentication)
class PayHeroSubscriptionWebhookView(APIView):
    permission_classes = []  # PUBLIC
    
    def post(self, request):
        # Verify PayHero signature (implement according to PayHero docs)
        signature = request.headers.get('X-PayHero-Signature')
        
        checkout_request_id = request.data.get('CheckoutRequestID')
        result_code = request.data.get('ResultCode')
        amount = request.data.get('Amount')
        mpesa_receipt = request.data.get('MpesaReceiptNumber')
        
        try:
            payment = SubscriptionPayment.objects.get(
                payhero_checkout_id=checkout_request_id
            )
        except SubscriptionPayment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)
        
        if result_code == 0:  # Success
            payment.status = 'completed'
            payment.mpesa_receipt = mpesa_receipt
            payment.completed_at = timezone.now()
            payment.save()
            
            # Activate/extend subscription
            subscription = payment.subscription
            subscription.status = 'active'
            subscription.extend_by_period()
            subscription.save()
            
            # Send confirmation SMS/email
            send_subscription_confirmation(subscription)
        else:
            payment.status = 'failed'
            payment.failure_reason = request.data.get('ResultDesc')
            payment.save()
        
        return Response({'status': 'received'})
```

---

### 🔴 Priority 7: Hotspot Access Payments (Captive Portal)

End-users pay for WiFi access via the captive portal (no authentication required).

#### Required Endpoints (ALL PUBLIC - NO AUTH):

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/hotspot/routers/{router_id}/plans/` | **PUBLIC** | Get hotspot plans for router |
| POST | `/api/v1/hotspot/purchase/` | **PUBLIC** | Initiate hotspot purchase via PayHero |
| GET | `/api/v1/hotspot/purchase/{session_id}/status/` | **PUBLIC** | Poll purchase/payment status |
| POST | `/api/v1/webhooks/payhero/hotspot/` | **PUBLIC** | PayHero callback for hotspot |

#### Get Hotspot Plans:
```json
GET /api/v1/hotspot/routers/5/plans/

Response:
{
  "router": {
    "id": 5,
    "name": "Coffee Shop Hotspot",
    "location": "Westlands Mall"
  },
  "plans": [
    {
      "id": 1,
      "name": "1 Hour",
      "price": 50,
      "duration_minutes": 60,
      "data_limit_mb": null,
      "speed_limit": "5Mbps",
      "description": "Quick browsing session"
    },
    {
      "id": 2,
      "name": "Daily Pass",
      "price": 200,
      "duration_minutes": 1440,
      "data_limit_mb": 2000,
      "speed_limit": "10Mbps",
      "description": "Full day access with 2GB data"
    },
    {
      "id": 3,
      "name": "Weekly Pass",
      "price": 500,
      "duration_minutes": 10080,
      "data_limit_mb": 10000,
      "speed_limit": "15Mbps",
      "description": "7 days unlimited browsing"
    }
  ],
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#3B82F6",
    "company_name": "FastNet ISP"
  }
}
```

#### Initiate Hotspot Purchase:
```json
POST /api/v1/hotspot/purchase/
{
  "router_id": 5,
  "plan_id": 2,
  "phone_number": "254712345678",
  "mac_address": "AA:BB:CC:DD:EE:FF",  // User's device MAC
  "payment_method": "mpesa_stk"  // Only STK for hotspot (instant)
}
```

#### Response:
```json
{
  "status": "pending",
  "session_id": "HS_1737200000_ABCD",
  "checkout_request_id": "ws_CO_123456789",
  "message": "STK Push sent to 0712345678. Enter your M-Pesa PIN.",
  "expires_in": 120  // Seconds before STK expires
}
```

#### Poll Purchase Status:
```json
GET /api/v1/hotspot/purchase/HS_1737200000_ABCD/status/

Response (Pending):
{
  "status": "pending",
  "message": "Waiting for payment confirmation..."
}

Response (Success):
{
  "status": "success",
  "message": "Payment received! You are now connected.",
  "access_code": "WIFI-1234",  // Optional: display access code
  "expires_at": "2026-01-19T10:30:00Z",
  "data_remaining_mb": 2000,
  "speed": "10Mbps"
}

Response (Failed):
{
  "status": "failed",
  "message": "Payment was cancelled or failed. Please try again."
}
```

#### Backend Implementation Flow:
```python
# models.py
class HotspotSession(models.Model):
    session_id = models.CharField(max_length=50, unique=True)
    router = models.ForeignKey(Router, on_delete=models.CASCADE)
    plan = models.ForeignKey(HotspotPlan, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15)
    mac_address = models.CharField(max_length=17)
    payhero_checkout_id = models.CharField(max_length=100, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending Payment'),
        ('paid', 'Paid - Activating'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('failed', 'Payment Failed'),
    ], default='pending')
    access_code = models.CharField(max_length=20, null=True)
    expires_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

# views.py
class HotspotPurchaseView(APIView):
    permission_classes = []  # PUBLIC - no auth
    
    def post(self, request):
        router_id = request.data.get('router_id')
        plan_id = request.data.get('plan_id')
        phone = request.data.get('phone_number')
        mac = request.data.get('mac_address')
        
        router = Router.objects.get(id=router_id)
        plan = HotspotPlan.objects.get(id=plan_id, router=router)
        
        # Generate unique session ID
        session_id = f"HS_{int(timezone.now().timestamp())}_{secrets.token_hex(2).upper()}"
        
        # Create pending session
        session = HotspotSession.objects.create(
            session_id=session_id,
            router=router,
            plan=plan,
            phone_number=phone,
            mac_address=mac,
            status='pending'
        )
        
        # Call PayHero STK Push
        payhero_response = payhero_client.stk_push(
            phone_number=phone,
            amount=plan.price,
            reference=session_id,
            callback_url='https://api.netily.io/api/v1/webhooks/payhero/hotspot/'
        )
        
        session.payhero_checkout_id = payhero_response['checkout_request_id']
        session.save()
        
        return Response({
            'status': 'pending',
            'session_id': session_id,
            'checkout_request_id': payhero_response['checkout_request_id'],
            'message': f'STK Push sent to {phone[-4:].rjust(10, "*")}',
            'expires_in': 120
        })

class PayHeroHotspotWebhookView(APIView):
    permission_classes = []  # PUBLIC
    
    def post(self, request):
        checkout_id = request.data.get('CheckoutRequestID')
        result_code = request.data.get('ResultCode')
        
        session = HotspotSession.objects.filter(
            payhero_checkout_id=checkout_id
        ).first()
        
        if not session:
            return Response({'error': 'Session not found'}, status=404)
        
        if result_code == 0:  # Success
            session.status = 'paid'
            session.save()
            
            # Activate on MikroTik router
            access_code = activate_hotspot_user(session)
            
            session.access_code = access_code
            session.status = 'active'
            session.expires_at = timezone.now() + timedelta(
                minutes=session.plan.duration_minutes
            )
            session.save()
        else:
            session.status = 'failed'
            session.save()
        
        return Response({'status': 'received'})

def activate_hotspot_user(session):
    """Connect to MikroTik router and create hotspot user"""
    router = session.router
    
    # Generate random access code
    access_code = f"WIFI-{secrets.token_hex(2).upper()}"
    
    # Connect to MikroTik API
    mikrotik = RouterOSAPI(
        host=router.ip_address,
        port=router.api_port,
        username=router.api_username,
        password=router.api_password
    )
    
    # Create hotspot user
    mikrotik.execute('/ip/hotspot/user/add', {
        'name': access_code,
        'password': access_code,
        'profile': session.plan.mikrotik_profile,
        'limit-uptime': f"{session.plan.duration_minutes}m",
        'mac-address': session.mac_address,
    })
    
    return access_code
```

---

### 🔴 Priority 8: User Account Recharge (Customer Payments)

ISP subscribers pay their invoices via the customer dashboard.

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/billing/invoices/` | User JWT | Get user's invoices |
| GET | `/api/v1/billing/payment-methods/` | User JWT | Get available payment methods |
| POST | `/api/v1/billing/payments/initiate/` | User JWT | **Initiate payment via PayHero** |
| GET | `/api/v1/billing/payments/{id}/` | User JWT | Poll payment status |
| POST | `/api/v1/webhooks/payhero/billing/` | **PUBLIC** | PayHero callback for billing |

#### Initiate Customer Payment:
```json
POST /api/v1/billing/payments/initiate/
Authorization: Bearer {user_token}
{
  "amount": 2000,
  "phone_number": "254712345678",
  "invoice_id": 456,  // Optional: pay specific invoice
  "channel_id": 1     // Optional: force specific payment method
}
```

#### Response - STK Push:
```json
{
  "status": "pending",
  "payment_id": 789,
  "payhero_response": {
    "status": "pending",
    "checkout_request_id": "ws_CO_123456789",
    "message": "STK Push sent to your phone"
  }
}
```

#### Response - Paybill:
```json
{
  "status": "awaiting_payment",
  "payment_id": 789,
  "payhero_response": {
    "paybill_number": "123456",
    "account_number": "INV-456",
    "amount": 2000
  }
}
```

#### Frontend Integration (Already Implemented):
The frontend at `/dashboard/recharge` calls:
```typescript
// lib/api.ts - Already implemented
api.initiatePayment({
  amount: 2000,
  phone_number: "254712345678",
  invoice_id: 456
})
```

#### PayHero Billing Webhook:
```python
class PayHeroBillingWebhookView(APIView):
    permission_classes = []  # PUBLIC
    
    def post(self, request):
        checkout_id = request.data.get('CheckoutRequestID')
        result_code = request.data.get('ResultCode')
        amount = request.data.get('Amount')
        mpesa_receipt = request.data.get('MpesaReceiptNumber')
        
        payment = Payment.objects.filter(
            payhero_checkout_id=checkout_id
        ).first()
        
        if not payment:
            return Response({'error': 'Payment not found'}, status=404)
        
        if result_code == 0:  # Success
            payment.status = 'completed'
            payment.mpesa_receipt = mpesa_receipt
            payment.paid_at = timezone.now()
            payment.save()
            
            # Apply to customer balance/invoice
            customer = payment.customer
            if payment.invoice:
                payment.invoice.mark_as_paid(payment)
            else:
                customer.balance += payment.amount
                customer.save()
            
            # Check and restore service if suspended
            if customer.status == 'suspended':
                restore_customer_service(customer)
            
            # Send confirmation SMS
            send_payment_confirmation_sms(payment)
        else:
            payment.status = 'failed'
            payment.failure_reason = request.data.get('ResultDesc')
            payment.save()
        
        return Response({'status': 'received'})
```

---

### 🔧 PayHero Configuration Requirements

The backend needs to store PayHero credentials:

```python
# settings.py or environment variables
PAYHERO_API_KEY = 'your_payhero_api_key'
PAYHERO_API_SECRET = 'your_payhero_secret'
PAYHERO_MERCHANT_ID = 'your_merchant_id'
PAYHERO_CALLBACK_BASE_URL = 'https://api.netily.io/api/v1/webhooks/payhero'

# Per-ISP PayHero (for multi-tenant)
# Each ISP company can configure their own PayHero account
class CompanyPaymentConfig(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE)
    payhero_api_key = models.CharField(max_length=255)
    payhero_secret = models.CharField(max_length=255)
    payhero_merchant_id = models.CharField(max_length=100)
    default_payment_method = models.CharField(max_length=50, default='mpesa_stk')
    is_active = models.BooleanField(default=True)
```

### PayHero API Client:
```python
# services/payhero.py
import requests
import hashlib
import hmac

class PayHeroClient:
    BASE_URL = 'https://api.payhero.co.ke/api/v1'
    
    def __init__(self, api_key, secret, merchant_id):
        self.api_key = api_key
        self.secret = secret
        self.merchant_id = merchant_id
    
    def stk_push(self, phone_number, amount, reference, callback_url):
        """Initiate M-Pesa STK Push"""
        payload = {
            'merchant_id': self.merchant_id,
            'phone_number': phone_number,
            'amount': amount,
            'reference': reference,
            'callback_url': callback_url,
        }
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }
        
        response = requests.post(
            f'{self.BASE_URL}/stk/push',
            json=payload,
            headers=headers
        )
        
        return response.json()
    
    def verify_webhook_signature(self, payload, signature):
        """Verify PayHero webhook signature"""
        expected = hmac.new(
            self.secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
```

---

### 📋 Summary: Frontend Ready, Backend Required

| Component | Frontend Status | Backend Required |
|-----------|----------------|------------------|
| ISP Subscription Billing | ✅ Complete (`/admin/settings/billing`) | ❌ `/api/v1/subscriptions/` endpoints |
| Hotspot Captive Portal | ✅ Complete (`/hotspot/[router_id]`) | ❌ `/api/v1/hotspot/` endpoints |
| User Account Recharge | ✅ Complete (`/dashboard/recharge`) | ❌ `/api/v1/billing/payments/initiate/` |
| PayHero Webhooks | N/A | ❌ `/api/v1/webhooks/payhero/*` |
| ISP PayHero Config | ✅ Complete (`/admin/settings` → M-Pesa tab) | ❌ `/api/v1/core/payment-config/` |

---

### 🔴 Priority 9: ISP PayHero Configuration Endpoints

Each ISP needs to configure their own PayHero account to receive payments from their customers.

#### Where PayHero Credentials Are Stored:

| Payment Type | Whose PayHero Account | Where Stored |
|--------------|----------------------|--------------|
| ISP pays Netily (subscription) | **Netily's** PayHero account | Backend `.env` file |
| Users pay ISP (hotspot/recharge) | **Each ISP's** PayHero account | Database via Admin Settings |

#### Required Endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/core/payment-config/` | Admin | Get ISP's PayHero configuration |
| PATCH | `/api/v1/core/payment-config/` | Admin | Update PayHero configuration |
| POST | `/api/v1/core/payment-config/test/` | Admin | Test PayHero connection |

#### Get/Update PayHero Config:
```json
GET /api/v1/core/payment-config/
Authorization: Bearer {admin_token}

Response:
{
  "id": 1,
  "payhero_enabled": true,
  "payhero_environment": "sandbox",  // "sandbox" | "production"
  "payhero_api_key": "ph_xxx...xxx",  // Partially masked
  "payhero_api_key_set": true,  // Boolean flag (don't return full key)
  "payhero_merchant_id": "MERCHANT123",
  "payhero_callback_url": "https://api.netily.io/api/v1/webhooks/payhero/billing/",
  "default_payment_method": "mpesa_stk",
  "updated_at": "2026-01-18T10:00:00Z"
}
```

#### Update Config:
```json
PATCH /api/v1/core/payment-config/
Authorization: Bearer {admin_token}
{
  "payhero_enabled": true,
  "payhero_environment": "production",
  "payhero_api_key": "new_api_key_here",
  "payhero_api_secret": "new_secret_here",
  "payhero_merchant_id": "MERCHANT123"
}
```

#### Test Connection:
```json
POST /api/v1/core/payment-config/test/
Authorization: Bearer {admin_token}
{}

Response (Success):
{
  "status": "success",
  "message": "PayHero connection successful",
  "account_name": "FastNet ISP",
  "environment": "production"
}

Response (Failed):
{
  "status": "error",
  "message": "Invalid API credentials"
}
```

#### Backend Model:
```python
class CompanyPaymentConfig(models.Model):
    company = models.OneToOneField('Company', on_delete=models.CASCADE)
    
    # PayHero Settings
    payhero_enabled = models.BooleanField(default=False)
    payhero_environment = models.CharField(max_length=20, default='sandbox')
    payhero_api_key = models.CharField(max_length=255, blank=True)  # Encrypted
    payhero_api_secret = models.CharField(max_length=255, blank=True)  # Encrypted
    payhero_merchant_id = models.CharField(max_length=100, blank=True)
    default_payment_method = models.CharField(max_length=50, default='mpesa_stk')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Payment Configuration"
```

#### How It Works After Backend Implementation:

1. **ISP Admin goes to Settings → M-Pesa/PayHero tab**
2. **Enters their PayHero API credentials** (from their PayHero dashboard)
3. **Clicks "Test Connection"** → Frontend calls `/api/v1/core/payment-config/test/`
4. **Saves configuration** → Frontend calls `PATCH /api/v1/core/payment-config/`
5. **Backend stores encrypted credentials** in `CompanyPaymentConfig` table
6. **When customer pays:**
   - Hotspot/Recharge frontend initiates payment
   - Backend looks up ISP's PayHero config from database
   - Backend calls PayHero API with ISP's credentials
   - Payment goes to ISP's M-Pesa account

#### Security Notes:
- **NEVER return full API keys/secrets** to frontend - use masked values
- **Store secrets encrypted** in database (use Django's `Fernet` or similar)
- **Use `payhero_api_key_set: true/false`** to indicate if key is configured
- **Validate credentials** on save with a test API call

**All three PayHero use cases are fully implemented on the frontend. The backend team needs to implement the endpoints above to enable payments.**

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

## � STAFF MANAGEMENT MODULE (CONFIRMED)

> **Status:** Frontend created at `/admin/staff`. Backend endpoints confirmed and working.

### Implemented Frontend Features

- **Staff List Page** - Table with search, role filtering, pagination
- **Create Staff Dialog** - Role selection cards, form validation, password strength indicator
- **Staff Roles Supported:** `staff`, `technician`, `accountant`, `support`
- **Navigation** - Added "Staff" link in admin sidebar

### Backend Endpoint Confirmation (2026-01-18)

#### 1. List Staff Endpoint ✅ CONFIRMED

```
GET /api/v1/core/users/
```

**Supported Query Parameters:**
- `?role=technician` → Filter by role
- `?is_active=true` → Filter by active status
- `?role__in=staff,technician` → Multiple roles
- `?search=jane` → Search first_name, last_name, email, phone
- `?page=2&page_size=50` → Pagination (default 20, max 100)

**Scoping:** Returns only the logged-in company's users (superusers see all).

**Response Format:** Standard DRF PageNumberPagination - ✅ Frontend compatible.

---

#### 2. Update Staff Endpoint ✅ CONFIRMED

```
PATCH /api/v1/core/users/{id}/
```

**Editable Fields:** `first_name`, `last_name`, `phone_number`, `id_number`, `gender`, `date_of_birth`, `role`, `is_active`, `is_verified`, `is_staff`

**Password:** Cannot be changed via PATCH (security best practice) - use separate endpoint.

**Permissions:** Only ISP admins (role='admin') can change staff roles. Others get 403.

---

#### 3. Delete vs Deactivate ✅ CONFIRMED

```
DELETE /api/v1/core/users/{id}/
```

**Current Behavior:** Hard delete (permanently removes user).

**Frontend Approach:** Use `PATCH` with `"is_active": false` for deactivation (safer, reversible).

---

#### 4. Password Reset 🔴 PENDING

**Current Status:** No admin-initiated reset endpoint yet.

**Backend to Implement:**
```
POST /api/v1/core/users/{id}/reset-password/
Authorization: Bearer <admin-token>
Body: {}
```

**Options:**
- Option A (Recommended): Send password reset email to staff
- Option B: Return temporary password (for dev/testing)

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

## � ISP SUBSCRIPTION & BILLING MODULE (NEW)

> **Status:** Frontend created at `/admin/settings/billing`. Backend implementation required.

### Overview

This module handles **Netily's own billing** - i.e., how ISP companies pay for their Netily subscription. This is separate from the billing module that ISPs use to bill their customers.

### Frontend Implementation

**Location:** `/admin/settings/billing`

**Features:**
- Three pricing tiers (Starter, Professional, Enterprise)
- PayHero integration for payments (M-Pesa STK, Paybill, Bank Transfer)
- Trial countdown integration
- Usage tracking (subscribers, routers, staff limits)
- Payment history

### Required Backend Endpoints

#### 1. Subscription Plans (Netily's Plans)

```
GET /api/v1/subscriptions/plans/
```

**Description:** Fetch available Netily subscription plans (not customer plans)

**Response:**
```json
{
  "results": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 2999,
      "currency": "KES",
      "period": "monthly",
      "description": "Perfect for small ISPs getting started",
      "features": [
        "Up to 100 subscribers",
        "3 Routers",
        "2 Staff accounts",
        "Basic billing & invoicing",
        "Email support",
        "M-Pesa integration"
      ],
      "limits": {
        "max_subscribers": 100,
        "max_routers": 3,
        "max_staff": 2
      },
      "is_popular": false
    },
    {
      "id": "professional",
      "name": "Professional",
      "price": 7999,
      "currency": "KES",
      "period": "monthly",
      "description": "For growing ISP businesses",
      "features": ["..."],
      "limits": {
        "max_subscribers": 500,
        "max_routers": 10,
        "max_staff": 10
      },
      "is_popular": true
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": 19999,
      "currency": "KES",
      "period": "monthly",
      "description": "For large-scale operations",
      "features": ["..."],
      "limits": {
        "max_subscribers": null,  // unlimited
        "max_routers": null,
        "max_staff": null
      },
      "is_popular": false
    }
  ]
}
```

---

#### 2. Company Subscription Status

```
GET /api/v1/subscriptions/current/
```

**Description:** Get the logged-in company's current subscription

**Response:**
```json
{
  "id": 1,
  "company": {
    "id": 2,
    "name": "Acme ISP"
  },
  "plan": {
    "id": "professional",
    "name": "Professional",
    "price": 7999
  },
  "status": "trial",  // "trial" | "active" | "expired" | "cancelled" | "past_due"
  "current_period_start": "2026-01-18T00:00:00Z",
  "current_period_end": "2026-02-01T00:00:00Z",
  "trial_end": "2026-02-01T00:00:00Z",
  "cancel_at_period_end": false,
  "created_at": "2026-01-18T00:00:00Z"
}
```

**Status Values:**
- `trial` - 14-day free trial period
- `active` - Paid and active subscription
- `expired` - Subscription ended, no payment
- `cancelled` - User cancelled, will expire at period end
- `past_due` - Payment failed, grace period

---

#### 3. Usage Statistics

```
GET /api/v1/subscriptions/usage/
```

**Description:** Get current usage against plan limits

**Response:**
```json
{
  "subscribers": {
    "used": 45,
    "limit": 500,  // null if unlimited
    "percentage": 9
  },
  "routers": {
    "used": 3,
    "limit": 10,
    "percentage": 30
  },
  "staff": {
    "used": 2,
    "limit": 10,
    "percentage": 20
  }
}
```

---

#### 4. Initiate Subscription Payment (PayHero)

```
POST /api/v1/subscriptions/pay/
```

**Description:** Initiate payment for a subscription plan using PayHero

**Request:**
```json
{
  "plan_id": "professional",
  "payment_method": "mpesa_stk",  // "mpesa_stk" | "mpesa_paybill" | "bank_transfer"
  "phone_number": "0712345678",   // Required for mpesa_stk
  "billing_period": "monthly"     // "monthly" | "yearly"
}
```

**Response (STK Push):**
```json
{
  "status": "pending",
  "payment_id": 123,
  "message": "STK Push sent. Check your phone.",
  "checkout_request_id": "ws_CO_123456789"
}
```

**Response (Paybill):**
```json
{
  "status": "awaiting_payment",
  "payment_id": 123,
  "paybill_number": "247247",
  "account_number": "NETILY-PRO-123456",
  "amount": 7999,
  "message": "Use the details below to pay via M-Pesa Paybill"
}
```

**Response (Bank Transfer):**
```json
{
  "status": "awaiting_payment",
  "payment_id": 123,
  "bank_details": {
    "bank_name": "Equity Bank",
    "account_name": "Netily Technologies Ltd",
    "account_number": "0123456789012",
    "branch": "Westlands"
  },
  "amount": 7999,
  "reference": "NETILY-PRO-123456",
  "message": "Use the bank details below to make your payment"
}
```

---

#### 5. Payment History

```
GET /api/v1/subscriptions/payments/
```

**Description:** Get company's subscription payment history

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "date": "2026-01-18T10:30:00Z",
      "amount": 7999,
      "currency": "KES",
      "status": "completed",  // "completed" | "pending" | "failed" | "refunded"
      "payment_method": "M-Pesa STK",
      "reference": "PAY-123456789",
      "plan": "Professional",
      "invoice_url": "https://api.netily.io/invoices/INV-001.pdf"
    }
  ]
}
```

---

#### 6. Poll Payment Status

```
GET /api/v1/subscriptions/payments/{id}/
```

**Description:** Check status of a pending payment (for polling after STK Push)

**Response:**
```json
{
  "id": 123,
  "status": "completed",  // "pending" | "completed" | "failed"
  "message": "Payment received successfully",
  "completed_at": "2026-01-18T10:35:00Z"
}
```

---

#### 7. Cancel Subscription

```
POST /api/v1/subscriptions/cancel/
```

**Description:** Cancel subscription at end of billing period

**Request:**
```json
{
  "reason": "Too expensive",  // Optional feedback
  "cancel_immediately": false  // true = cancel now, false = at period end
}
```

**Response:**
```json
{
  "message": "Subscription will be cancelled on 2026-02-01",
  "cancel_at_period_end": true,
  "current_period_end": "2026-02-01T00:00:00Z"
}
```

---

### PayHero Integration Notes

The backend should use PayHero's API to process payments:

1. **STK Push Flow:**
   - Backend calls PayHero STK Push API
   - PayHero sends push to customer phone
   - Customer enters PIN
   - PayHero sends callback to backend webhook
   - Backend updates payment status
   - Frontend polls for completion

2. **Paybill/Bank Transfer Flow:**
   - Backend generates unique account number
   - Customer pays manually
   - PayHero sends payment confirmation callback
   - Backend matches payment to pending subscription
   - Subscription activated

3. **Webhook Endpoint:**
   ```
   POST /api/v1/webhooks/payhero/subscription/
   ```
   - Receives payment confirmations from PayHero
   - Updates subscription status
   - Sends confirmation SMS/email to company

---

### Subscription Model (Django)

```python
class SubscriptionPlan(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # 'starter', 'professional', 'enterprise'
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    period = models.CharField(max_length=20, choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')])
    description = models.TextField()
    features = models.JSONField(default=list)
    max_subscribers = models.IntegerField(null=True, blank=True)  # null = unlimited
    max_routers = models.IntegerField(null=True, blank=True)
    max_staff = models.IntegerField(null=True, blank=True)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    

class CompanySubscription(models.Model):
    company = models.OneToOneField('Company', on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=[
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'),
    ], default='trial')
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    trial_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

class SubscriptionPayment(models.Model):
    subscription = models.ForeignKey(CompanySubscription, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ])
    reference = models.CharField(max_length=100, unique=True)
    payhero_checkout_id = models.CharField(max_length=100, null=True, blank=True)
    invoice_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

---

### Trial to Paid Flow

1. **New Company Registers:**
   - Create Company with `status='trial'`
   - Set `trial_end` to 14 days from now
   - Create CompanySubscription with Professional plan (trial)

2. **Trial Expiry Handling:**
   - Cron job checks for expired trials daily
   - If `trial_end < now` and no payment: `status='expired'`
   - Frontend shows lockout screen

3. **Payment Received:**
   - PayHero callback confirms payment
   - Update `status='active'`
   - Set `current_period_end` to 30 days from now
   - Clear trial flags

4. **Renewal:**
   - Cron job sends reminder 3 days before expiry
   - If no payment by expiry: `status='expired'`
   - If payment received: extend `current_period_end`

---

### Frontend Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Billing page | ✅ Done | `/admin/settings/billing` |
| Pricing cards | ✅ Done | 3 tiers with features |
| Payment dialog | ✅ Done | STK Push, Paybill, Bank Transfer |
| Trial countdown | ✅ Done | In navbar |
| Account lockout | ✅ Done | Shows upgrade page |
| Payment history tab | ✅ Done | Table with download |
| Usage tracking tab | ✅ Done | Progress bars |
| API integration | ⚪ Pending | Using mock data, waiting for endpoints |

---

## �📋 Summary Checklist

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
