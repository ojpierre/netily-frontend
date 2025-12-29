# Netily - ISP Management System

> A modern, feature-rich ISP (Internet Service Provider) management platform built with Next.js 15 and Django REST Framework.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Django](https://img.shields.io/badge/Django-5.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Features

### Customer Portal
- **Dashboard** - Account overview, balance, plan status
- **Recharge** - Top-up account balance via M-Pesa, Card, etc.
- **Invoices** - View and download invoices
- **Usage History** - Track bandwidth and connection usage
- **Support Tickets** - Create and track support requests
- **Notifications** - Important account updates
- **Profile & Settings** - Manage account details

### Admin Portal
- **Dashboard** - Real-time statistics and KPIs
- **User Management** - Manage Hotspot, PPPoE, and Static IP users
- **Internet Plans** - Create and manage service packages
- **Captive Portal Ads** - Run ads on hotspot login pages
- **Loyalty Points** - Customer rewards system
- **Leads Management** - Track potential customers
- **Support Tickets** - Customer support ticketing system
- **Transactions** - Payment history and reports
- **Advanced Analytics** - Revenue forecast, CLV, usage patterns
- **Router Management** - MikroTik router integration with uptime monitoring
- **SMS Integration** - Customer notifications
- **System Settings** - Platform configuration

## 📋 Requirements

### Frontend
- Node.js 18+
- pnpm (recommended) or npm

### Backend
- Python 3.10+
- Django 5.x
- PostgreSQL 14+
- Redis (for caching and Celery)

## 🛠️ Installation

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/ojpierre/netily-frontend.git
cd netily-frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Update environment variables
# Edit .env.local with your API URL

# Start development server
pnpm dev
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8000/api
```

### Backend Setup (Django)

See [BACKEND_API_REQUIREMENTS.md](./BACKEND_API_REQUIREMENTS.md) for complete API documentation.

```bash
# Clone backend repository
git clone https://github.com/your-org/netily-backend.git
cd netily-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## 📁 Project Structure

```
netily/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin portal pages
│   │   ├── login/               # Admin authentication
│   │   ├── users/               # User management
│   │   ├── plans/               # Plan management
│   │   ├── routers/             # Router management
│   │   ├── payments/            # Payment overview
│   │   ├── logs/                # System logs
│   │   ├── settings/            # Admin settings
│   │   └── page.tsx             # Admin dashboard
│   ├── dashboard/                # Customer portal
│   │   ├── invoices/            # Customer invoices
│   │   ├── recharge/            # Account recharge
│   │   ├── support/             # Support tickets
│   │   ├── notifications/       # Notifications
│   │   ├── profile/             # User profile
│   │   ├── settings/            # User settings
│   │   └── page.tsx             # Customer dashboard
│   ├── login/                    # Customer login
│   ├── register/                 # Customer registration
│   ├── auth-context.tsx          # Authentication context
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   └── auth-guard.tsx            # Route protection
├── lib/                          # Utilities
│   ├── api.ts                    # Customer API service
│   ├── admin-api.ts              # Admin API service
│   └── utils.ts                  # Helper functions
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── styles/                       # Global styles
├── BACKEND_API_REQUIREMENTS.md   # Backend API documentation
├── FEATURE_ROADMAP.md            # Feature implementation roadmap
└── README.md                     # This file
```

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

- **Customer Login**: Email/password → JWT tokens
- **Admin Login**: Username/password → JWT tokens with admin privileges
- **Token Refresh**: Automatic token refresh before expiry
- **Protected Routes**: Middleware-based route protection

### Test Credentials (Development)

**Customer Portal:**
- Email: `demo@netily.com`
- Password: `demo123`

**Admin Portal:**
- Username: `admin`
- Password: `admin123`

## 📖 Documentation

- [Backend API Requirements](./BACKEND_API_REQUIREMENTS.md) - Complete API endpoint documentation
- [Feature Roadmap](./FEATURE_ROADMAP.md) - Planned features and implementation guide

## 🗺️ Roadmap

### Phase 1 ✅ (Completed)
- [x] Authentication system
- [x] Customer dashboard
- [x] Admin dashboard
- [x] Basic user management
- [x] Basic plan management
- [x] Router management

### Phase 2 🔄 (In Progress)
- [ ] Enhanced user management (Hotspot/PPPoE/Static tabs)
- [ ] Support ticketing system
- [ ] Leads management
- [ ] Router uptime monitoring

### Phase 3 📋 (Planned)
- [ ] Loyalty points system
- [ ] Captive portal ads
- [ ] SMS integration
- [ ] Advanced analytics
- [ ] Bulk user import
- [ ] MikroTik automatic backups

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for detailed implementation plan.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django, Django REST Framework, PostgreSQL, Redis

## 🆘 Support

For support, please:
1. Check the [documentation](./BACKEND_API_REQUIREMENTS.md)
2. Open an [issue](https://github.com/ojpierre/netily-frontend/issues)
3. Contact the development team

---

Built with ❤️ by the Netily Team
