# Netily Shop Frontend Backend Outline

This document explains what the current shop frontend already covers and what the backend needs to provide so the shop can move from preview data to production data.

## Current Frontend Routes

Public shop:

- `/shop` opens the catalog-first shop homepage.
- `/shop/catalog` shows products, filters, search, and the offer slider.
- `/shop/product/[id]` shows product details and add-to-cart actions.
- `/shop/cart` is handled through the mini cart drawer.
- `/shop/checkout` requires a customer session before order submission and supports card or M-Pesa STK payment only.
- `/shop/login` uses the customer-friendly split-panel design, signs in a customer, and returns to the requested route.
- `/shop/register` uses the customer-friendly split-panel design, creates a customer preview account, and returns to the requested route.
- `/shop/account/profile` shows customer and organization details.
- `/shop/account/orders` shows customer order history and invoice tracking.
- `/shop/account/quotes` shows bulk quote and proforma requests.
- `/shop/account/addresses` shows delivery sites and warehouses.
- `/shop/account/warranty` shows warranty cover and claim tracking.
- `/shop/account/support` shows shop support tickets and conversations.
- `/shop/account/settings` shows customer notification and security preferences.

Admin shop:

- `/shop/admin` is protected by the shop admin preview session.
- `/shop/admin/login` is the first screen for the admin route.
- The admin workspace has side navigation for products, adding products, hero offers, orders, inventory, fulfillment, SMS reminders, settings, and overview.
- The shop support widget appears across shop routes and should connect to support conversations when the backend is ready.
- `/superadmin/shop` now opens the same shop management workspace inside the existing protected superadmin shell.
- Both entry points reuse `shop-ui/components/shop-management.tsx`. Products, offers, orders, inventory, fulfillment, SMS, settings, and overview are not duplicated.
- The platform entry uses platform authentication; it does not create or overwrite a separate shop admin preview session, and it does not offer shop sign-out within the platform shell.

## Central Platform Management

The superadmin sidebar now has Shop and Academy entries. Shop management is at `/superadmin/shop`; academy management is at `/superadmin/academy`. The academy handover is in `docs/academy-frontend-backend-outline.md`.

Both shop entry points currently share browser-local product and offer stores. Changes apply in that browser, not across devices. The backend should make them two authorized views of the same catalog and orders, not two independent shops.

Keep the existing platform superadmin identity separate from shop customer and shop staff identities. The server must check permissions on every management endpoint; the embedded frontend prop is not an authorization boundary. Add platform-only shop management endpoints under `/api/v1/superadmin/shop/`, or enforce equivalent permissions on the shared shop management APIs.

Suggested platform endpoints: products and categories CRUD, hero offers CRUD, orders with search and pagination, inventory movements, fulfillment updates, SMS templates and delivery logs, settings, and audit history. Use stable record IDs for detail routes and the project's standard JSON error shape.

Keep physical-product checkout and course checkout separate. Shop orders need stock reservations, shipping, and fulfillment; academy orders need verified enrollment. Neither should change tenant subscription billing or draw from a tenant's SMS wallet without an explicit approved design.

This update remains frontend-only. The existing mock orders and preview SMS controls are not evidence of live fulfillment, delivery, or messages being sent. Keep the same callback verification, idempotency, payment reconciliation, and ownership checks described below when connecting the backend.

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

- Register customer account using buyer-friendly fields: full name, optional business or organization, email, phone number, and password.
- Login customer account.
- Logout customer account.
- Session refresh.
- Password reset.
- Customer profile update.
- Customer delivery addresses.
- Customer order history.
- Customer quote requests.
- Customer warranty claims.
- Customer support conversations.

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

Checkout copy is intentionally simple and should work for any buyer, not only ISP operators. Delivery fields should be friendly to home buyers, offices, schools, shops, organizations, and larger network rollout buyers.

The backend should support:

- Create checkout session.
- Validate product availability.
- Calculate totals.
- Apply delivery fee.
- Apply tax when needed.
- Save delivery details: name, optional business or organization, email, phone, street address, optional apartment or landmark, city, country, and any future delivery notes.
- Create order.
- Start payment by card or M-Pesa STK Push.
- Return payment status.

Payment UX requirements:

- Card payment should collect name on card, card number, expiry, and CVC through a secure payment provider field or tokenized widget.
- M-Pesa STK Push should collect the M-Pesa phone number and return a clear pending, success, or failed payment state.
- Manual invoice, bank transfer, and pay-on-quote are not part of the checkout payment options for this frontend journey.

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

## SMS And Customer Communication

The shop admin SMS tab should track operational messages for order events and quote follow-ups.

SMS features needed:

- Message templates for order placed, payment received, dispatch, delivery, warranty update, and quote follow-up.
- Queue view for pending messages.
- Delivery status for sent, queued, failed, and retried messages.
- Link each message to customer, order, quote, or warranty claim.
- Manual resend when a message fails.
- Admin audit log for template edits and manual sends.

Recommended endpoints:

- `GET /api/shop/messages/`
- `POST /api/shop/messages/send/`
- `GET /api/shop/messages/templates/`
- `POST /api/shop/messages/templates/`
- `PATCH /api/shop/messages/templates/{id}/`
- `POST /api/shop/messages/{id}/retry/`

Suggested automated events:

- Order placed.
- Payment received.
- Order dispatched.
- Delivery reminder.
- Delivery completed.
- Quote ready.
- Warranty claim update.

## Support Chat

The floating support widget is present across shop routes. It currently captures preview messages in the frontend. The backend should connect it to a real support inbox.

Support chat needs:

- Create conversation.
- Send customer message.
- Send admin reply.
- Attach conversation to customer when logged in.
- Attach conversation to order, quote, warranty claim, or product when known.
- Track read and unread state.
- Allow admin assignment.
- Keep history visible on `/shop/account/support`.

Recommended endpoints:

- `GET /api/shop/support/conversations/`
- `POST /api/shop/support/conversations/`
- `GET /api/shop/support/conversations/{id}/`
- `POST /api/shop/support/conversations/{id}/messages/`
- `PATCH /api/shop/support/conversations/{id}/`

## Customer Account

Customer account pages should support:

- Profile details.
- Saved addresses.
- Order history.
- Quotes and proforma invoices.
- Receipts.
- Warranty cover and claims.
- Support conversations.
- Notification preferences.
- Security preferences.

Recommended endpoints:

- `GET /api/shop/account/profile/`
- `PATCH /api/shop/account/profile/`
- `GET /api/shop/account/orders/`
- `GET /api/shop/account/quotes/`
- `POST /api/shop/account/quotes/`
- `GET /api/shop/account/addresses/`
- `POST /api/shop/account/addresses/`
- `PATCH /api/shop/account/addresses/{id}/`
- `GET /api/shop/account/warranty/`
- `POST /api/shop/account/warranty/claims/`
- `GET /api/shop/account/support/`
- `GET /api/shop/account/preferences/`
- `PATCH /api/shop/account/preferences/`

## Payments

The checkout should support only these payment methods:

- Card payment.
- M-Pesa STK Push.

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

Payment provider requirements:

- Card payments should be tokenized and should never store raw card numbers, CVC, or sensitive card data in the Netily database.
- M-Pesa STK payments should store checkout request ID, merchant request ID, phone number, receipt number when confirmed, result code, result description, and callback payload.
- Both payment methods should expose a status endpoint so the checkout UI can show friendly feedback while payment is pending.

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
- SMS templates.
- Support routing and assignment rules.

## Security And Audit

The backend should record audit logs for:

- Admin login.
- Product creation and edits.
- Product deletion.
- Stock changes.
- Offer slide changes.
- Order status changes.
- SMS template and reminder changes.
- Support conversation assignment and replies.
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
8. Add SMS templates, reminder logs, and retry handling.
9. Add support chat conversations and admin assignment.
10. Add audit logs and role-based permissions.
11. Add customer order history, receipts, quotes, warranty, support, and preferences.
