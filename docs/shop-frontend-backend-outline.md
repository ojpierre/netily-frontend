# Netily Shop Frontend Backend Outline

This document explains what the current shop frontend already covers and what the backend needs to provide so the shop can move from preview data to production data.

## Current Frontend Routes

Public shop:

- `/shop` opens the catalog-first shop homepage.
- `/shop/catalog` shows products, filters, search, and the offer slider.
- `/shop/product/[id]` shows product details and add-to-cart actions.
- `/shop/cart` is handled through the mini cart drawer.
- `/shop/checkout` requires a customer session before order submission.
- `/shop/login` signs in a customer and returns to the requested route.
- `/shop/register` creates a customer preview account and returns to the requested route.
- `/shop/account/profile` shows the customer account area.

Admin shop:

- `/shop/admin` is protected by the shop admin preview session.
- `/shop/admin/login` is the first screen for the admin route.
- The admin workspace has side navigation for products, adding products, hero offers, orders, inventory, fulfillment, settings, and overview.

## Current Frontend State

The frontend currently uses local browser storage and mock data:

- Products are read and saved through `netily_shop_products_catalog`.
- Hero offer slides are read and saved through `netily_shop_offer_slides`.
- Customer preview sessions use `netily_shop_customer_session`.
- Admin preview sessions use `netily_shop_admin_session`.
- Orders currently use mock data from the shop UI library.

The backend should replace these preview stores with authenticated API calls.

## Authentication

Customer authentication should support:

- Register customer account.
- Login customer account.
- Logout customer account.
- Session refresh.
- Password reset.
- Customer profile update.
- Customer delivery addresses.
- Customer order history.

Admin authentication should support:

- Shop admin login.
- Shop admin logout.
- Role-based permissions.
- Session expiry.
- Audit logs for product, order, payment, stock, and offer changes.

Suggested roles:

- `shop_owner`: full shop access.
- `catalog_manager`: products, categories, offers, and inventory.
- `order_manager`: orders, fulfillment, tracking, and customer communication.
- `viewer`: read-only access.

## Catalog Management

The backend should provide products with:

- Product ID.
- Name.
- Slug.
- Brand.
- Category.
- Description.
- Long description.
- Price.
- Currency.
- Stock status.
- Stock quantity.
- Images.
- Warranty details.
- Specifications.
- Featured flag.
- Active or hidden status.

Recommended endpoints:

- `GET /api/shop/products/`
- `POST /api/shop/products/`
- `GET /api/shop/products/{id}/`
- `PATCH /api/shop/products/{id}/`
- `DELETE /api/shop/products/{id}/`
- `GET /api/shop/categories/`
- `POST /api/shop/categories/`

## Hero Offers

The offer slider needs admin-managed artwork and campaign copy.

Offer fields:

- Eyebrow.
- Badge.
- Title.
- Description.
- Image.
- CTA label.
- CTA link.
- Sort order.
- Active status.
- Start and end dates.

Recommended endpoints:

- `GET /api/shop/offers/`
- `POST /api/shop/offers/`
- `PATCH /api/shop/offers/{id}/`
- `DELETE /api/shop/offers/{id}/`

## Cart And Checkout

The frontend redirects checkout users to login when no customer session exists. After login or registration, the customer returns to `/shop/checkout`.

The backend should support:

- Create checkout session.
- Validate product availability.
- Calculate totals.
- Apply delivery fee.
- Apply tax when needed.
- Save shipping details.
- Create order.
- Start payment.
- Return payment status.

Recommended endpoints:

- `POST /api/shop/checkout/session/`
- `POST /api/shop/orders/`
- `GET /api/shop/orders/{id}/`
- `POST /api/shop/payments/initiate/`
- `GET /api/shop/payments/{id}/status/`

## Order Management

Admin order handling should support:

- View all orders.
- Filter by status, payment status, date, customer, and delivery region.
- Open order details.
- Update order status.
- Add tracking number.
- Add internal order notes.
- Mark order as dispatched.
- Mark order as delivered.
- Cancel order.
- Refund or reverse payment where supported.

Suggested statuses:

- `pending`
- `confirmed`
- `processing`
- `ready_for_dispatch`
- `dispatched`
- `delivered`
- `cancelled`
- `refunded`

## Inventory And Fulfillment

The admin inventory page currently toggles stock availability. The backend should make this reliable with a stock ledger.

Inventory needs:

- Stock quantity.
- Reserved quantity.
- Available quantity.
- Reorder level.
- Stock adjustment history.
- Supplier reference.
- Warehouse or pickup location.

Fulfillment needs:

- Dispatch method.
- Tracking number.
- Courier name.
- Delivery address.
- Delivery contact.
- Delivery notes.
- Delivery proof when available.

## Customer Account

Customer account pages should eventually show:

- Profile details.
- Saved addresses.
- Order history.
- Quotes and proforma invoices.
- Receipts.
- Support or warranty claims.

## Payments

The shop should support payment methods that match the business flow:

- M-Pesa STK Push.
- Manual bank transfer confirmation.
- Card payment if later required.
- Pay on quote if large enterprise orders need approval first.

Payment records should link to:

- Customer.
- Order.
- Payment method.
- Reference.
- Amount.
- Currency.
- Status.
- Callback payload.
- Created date.
- Confirmed date.

## Admin Settings

The shop admin settings area should eventually control:

- Store contact details.
- Default currency.
- Delivery regions.
- Delivery pricing.
- Tax rules.
- Payment methods.
- Notification channels.
- Admin roles.
- Order status automation.

## Security And Audit

The backend should record audit logs for:

- Admin login.
- Product creation and edits.
- Product deletion.
- Stock changes.
- Offer slide changes.
- Order status changes.
- Payment status changes.
- Refunds and cancellations.

Every audit log should include actor, action, target, timestamp, IP address, and the before or after values where safe.

## Suggested Implementation Order

1. Add shop customer and admin authentication.
2. Connect catalog products and categories to the backend.
3. Connect hero offer slider management.
4. Connect checkout and order creation.
5. Add payment initiation and payment status polling.
6. Add admin order management and fulfillment.
7. Add inventory quantities and stock adjustment history.
8. Add audit logs and role-based permissions.
9. Add customer order history, receipts, and support claims.
