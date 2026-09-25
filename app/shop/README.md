# Netily Shop — Enterprise Networking, ISP Hardware & Pro Tech

Welcome to **Netily Shop**, an ultra-refined, high-performance e-commerce platform built for Internet Service Providers (ISPs), network engineers, telecom contractors, and modern tech professionals.

---

## 🏛️ The Andalusia Luxury Design System

Netily Shop is built upon the **Andalusia design system**, characterized by editorial typography, sharp minimalist precision, and a stark luxury monochrome aesthetic:

1. **Typography**:
   - **Playfair Display** (`font-serif`, Google Fonts): Used for high-fashion / luxury technology editorial titles, product names, price tags, and milestone numbers.
   - **Inter** (`font-sans`, Google Fonts): Used for clean, crisp, modern UI elements, specs sheets, and body descriptions with wide letterspacing (`tracking-[0.2em]`, `tracking-[0.4em]`).
   - **Geist Mono** (`font-mono`): Used for product IDs, serial numbers, and technical attributes.

2. **Sharp Minimalist Precision**:
   - Border radius set strictly to `0rem` (`rounded-none`).
   - Stark monochrome palette: `#f9f9f9` light background with `#0a0a0a` deep black accents, and pure high-contrast dark mode.
   - Rectangular luxury buttons, clean `border-b` inputs, and subtle backdrop-blur navigation.

3. **Multi-Slide Interactive Hero Showcase**:
   - Auto-rotating showcase featuring high-impact ads of what Netily Shop offers in the exact Andalusia luxury editorial style:
     - **Carrier-Grade Routing**: MikroTik Cloud Core 100G/10G routers (CCR2116 / CCR2004)
     - **FTTH / GPON Fiber Infrastructure**: High-density OLTs, ONTs, & Signal Fire AI-9 6-motor fusion splicers
     - **Cat6A Heavy-Duty Cabling**: 100% Pure Bare Copper outdoor UV drums and keystones
     - **Pro Engineering Workstations**: Apple Silicon M3 Max, 5K Studio Displays & accessories
   - Features manual slide controls, slide timers, and the vertical floating scroll indicator line.

---

## 🌐 Routes Overview

| Route | Description | Backend Dependency |
|---|---|---|
| `/` | Landing page with Hero Ad banner, hardware categories, top sellers, and parallax expertise section | None (100% Standalone) |
| `/shop` | Filterable catalog by category, brand (MikroTik, Ubiquiti, Signal Fire, VSOL, etc.), search, and sorting | None (100% Standalone) |
| `/product/[id]` | Product detail page with technical hardware spec sheet, warranty badge, variant picker, and cart toast | None (100% Standalone) |
| `/checkout` | 2-step checkout with site delivery info, sample package quick-loader, and payment methods (B2B Proforma Net-30, M-Pesa, Card) | None (100% Standalone) |
| `/account/profile` | Engineer profile, company NOC details, role switcher | None (LocalStorage Fallback) |
| `/account/orders` | Equipment order tracking, status indicators, and simulated Proforma invoice PDF generator | None (LocalStorage Fallback) |
| `/account/addresses` | Tower site & NOC delivery location manager with interactive add/delete | None (LocalStorage Fallback) |
| `/account/settings` | Restock notifications, dispatch SMS alerts, and newsletter preferences | None (LocalStorage Fallback) |
| `/admin` | Admin dashboard with volume KPIs ($68,420), order queue, stock alerts, and Django API specification guide | None (LocalStorage Fallback) |
| `/login` | 1-Click demo login presets (ISP Engineer / Admin) | None (Demo Mode) |
| `/register` | Company registration for telecom providers & contractors | None (Demo Mode) |
| `/heritage` | Netily Shop story, engineering values, and regional delivery network | None (100% Standalone) |

---

## 🔌 Django REST Framework (DRF) Integration Guide

All API calls from the client flow through `lib/django-api.ts`. When your Django backend developer is ready to connect endpoints, configure the following environment variable:

```env
# .env.local
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
```

### Expected Django Endpoints:

| Frontend Method | Method | Django Endpoint | Payload / Response |
|---|---|---|---|
| `djangoApi.getProfile()` | `GET` | `/api/v1/auth/user/` | Returns `{ id, email, name, company, role, phone, ... }` |
| `djangoApi.updateProfile()` | `PATCH` | `/api/v1/auth/user/` | Body: Partial profile JSON |
| `djangoApi.getAddresses()` | `GET` | `/api/v1/addresses/` | Returns `DjangoAddress[]` list |
| `djangoApi.createAddress()` | `POST` | `/api/v1/addresses/` | Body: Address JSON |
| `djangoApi.getOrders()` | `GET` | `/api/v1/orders/` | Returns `DjangoOrder[]` with line items & tracking numbers |
| `djangoApi.createOrder()` | `POST` | `/api/v1/orders/` | Body: `{ items, shippingAddress, paymentMethod, total }` |
| `djangoApi.getProducts()` | `GET` | `/api/v1/products/` | Returns product list (matches `Product` interface in `lib/products.ts`) |

---

## 🛠️ Development & Production

```bash
# 1. Install dependencies
npm install

# 2. Run Next.js development server
npm run dev

# 3. Build for production (Verified 0 errors)
npm run build

# 4. Start production server
npm run start
```

---

© Netily Shop. Engineered for High-Throughput Networks.
