# Internetily Academy: Frontend and Backend Handover

## Where We Are

The academy is a frontend preview, not a live learning or payment service. There are seven public course pages, a saved cart, learner sign-in and registration screens, a checkout with M-Pesa payment states, a learner workspace, and academy management inside superadmin.

No backend was added for this work. No Daraja credentials are used in the browser. The preview does not send an STK request, collect money, verify passwords, or send password recovery emails. The payment screen says this clearly.

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/academy` | Academy introduction and course discovery | Public |
| `/academy/courses` | Search and category, level, format, and price filters | Public |
| `/academy/courses/[slug]` | Photo hero, outcomes, lessons, requirements, price, and cart action | Public |
| `/academy/cart` | Add/remove courses and review the total | Public |
| `/academy/enrollment?course=[slug]` | Legacy link into the cart | Public, noindex |
| `/academy/login` | Learner sign-in; returns to a safe academy destination | Public, noindex |
| `/academy/register` | Name, email, password, confirmation, and terms | Public, noindex |
| `/academy/forgot-password` | Password recovery screen | Public, noindex |
| `/academy/checkout` | Learner details, M-Pesa number, payment feedback, order summary | Learner session, noindex |
| `/academy/account` | Purchased course library and sign-out | Learner session, noindex |
| `/academy/learn/[slug]` | Lesson selection, lesson text, and completion progress | Enrolled learner, noindex |
| `/academy/become-an-instructor` | Instructor enquiry | Public |
| `/superadmin/academy` | Course drafts, orders, learners, review layout, and settings | Existing superadmin session |

The superadmin sidebar links to academy management. Keep the public catalog separate from protected learner and administration data. Only public course pages belong in the sitemap.

## Frontend Files

- `lib/academy-data.ts`: seven course definitions and metadata.
- `lib/academy-curriculum.ts`: lesson outlines, durations, and requirements.
- `lib/academy-preview.ts`: isolated preview identity, orders, phone normalization, and safe return destinations.
- `lib/academy-review-fixtures.ts`: five private layout samples per course. Not public reviews.
- `app/academy/academy-cart.tsx`: course cart and pricing display helpers.
- `app/academy/auth-form.tsx`: sign-in, registration, and password recovery screens.
- `app/academy/checkout-content.tsx`: checkout details and payment state machine.
- `app/academy/account/learner-workspace.tsx`: learner library and progress.
- `app/superadmin/academy/page.tsx`: management workspace.
- `public/academy/*.webp`: responsive photographs; prompts recorded in `docs/academy-visual-assets.md`.

## Preview Storage

| Key | Contents |
| --- | --- |
| `internetily-academy-cart-v1` | Selected course slugs |
| `internetily-academy-preview-session` | Name/email in session storage; no password or real token |
| `internetily-academy-preview-orders` | Browser-local preview orders, buyer details, and payment outcomes; use sample data |
| `academy-progress:[email]:[slug]` | Completed lesson indexes |
| `internetily-academy-management-drafts` | Course editor drafts |
| `academy-preview-support` | Support email draft |

These keys are not production authentication or financial evidence. Draft changes do not publish to the server-rendered public catalog. Replace storage with API-backed records; never import sample reviews or preview payment results into production.

## Accounts and Permissions

Implement separate learner authentication with secure server-managed sessions or the project's established token flow. Do not reuse tenant admin privileges for a learner.

Registration needs name, email, password confirmation, and terms acceptance. Validate email ownership, normalize email consistently, hash passwords, rate-limit sign-in and recovery, and return a generic recovery response without revealing whether an account exists. Optional Google sign-in can follow once OAuth is configured; it is not currently wired.

Learners may read only their own orders, enrollments, and progress. The server must check enrollment on every lesson request. A local storage flag must never unlock protected course media.

Superadmins use the existing platform identity. Future academy staff roles can separate course editing, order support, and review moderation. Record who changed prices, published lessons, approved refunds, or moderated a review.

## Recommended API Contract

These are proposed endpoints, not existing backend routes. Use the normal `/api/v1/` base and shared API client when implementing them.

| Method and endpoint | Response or action |
| --- | --- |
| GET `/academy/courses/` | Published catalog, filters, pagination, prices, and metadata |
| GET `/academy/courses/[slug]/` | Public outcomes and preview curriculum; no paid media secrets |
| POST `/academy/auth/register/` | Create learner and start verification |
| POST `/academy/auth/login/` | Authenticate learner |
| POST `/academy/auth/logout/` | Invalidate learner session |
| POST `/academy/auth/password-reset/` | Generic recovery response |
| POST `/academy/auth/password-reset/confirm/` | Validate expiring single-use token and replace password |
| GET/PATCH `/academy/me/` | Current learner profile |
| POST `/academy/orders/` | Server-priced order; idempotent request |
| GET `/academy/orders/[id]/` | Owner-scoped order, totals, and payment state |
| POST `/academy/orders/[id]/payments/mpesa/` | Initiate STK on the server |
| GET `/academy/payments/[id]/status/` | Pending, completed, failed, cancelled, or expired |
| POST `/webhooks/academy/mpesa/` | Provider callback; validate and reconcile |
| GET `/academy/enrollments/` | Learner's course library and progress |
| GET `/academy/courses/[slug]/lessons/[id]/` | Authorized lesson and signed media URL |
| PUT `/academy/progress/[lesson-id]/` | Idempotently save progress |
| POST `/academy/courses/[slug]/reviews/` | Verified learner submits feedback |
| GET `/academy/courses/[slug]/reviews/` | Approved genuine feedback and pagination |
| GET/POST/PATCH `/superadmin/academy/courses/` | Drafting, revisions, publishing, and archive |
| GET `/superadmin/academy/orders/` | Searchable orders, payments, and reconciliation |
| GET `/superadmin/academy/learners/` | Learner lookup and enrollment support |
| GET/PATCH `/superadmin/academy/reviews/` | Moderation queue |
| GET/PATCH `/superadmin/academy/settings/` | Support, checkout, and notification settings |

Detail edits should use stable record IDs, pagination should use the existing API convention, and failures should return JSON with a helpful message and field errors.

## Checkout and Payment Lifecycle

The form collects full name, email, contact phone, country, optional company, M-Pesa number, and terms consent. Keep buyer contact details separate from the phone paying for the order. The current gateway accepts Kenyan M-Pesa numbers; learners may live elsewhere.

The browser submits course IDs and buyer details. The server resolves current prices, rejects unpublished courses, prevents accidental repeat purchase of an enrolled course, and stores immutable line-item price snapshots. Never accept the browser total as authoritative. The frontend preview resumes a matching pending order after reload and reuses its order ID on retry; live idempotency and provider status checks still belong on the server.

Create an order before requesting STK. Return an order ID, payment ID, checkout request ID, amount, currency, status, and a human-readable next step. Use decimal money, not binary floating-point arithmetic.

The live UI should show a phone prompt, poll status without caching every few seconds, and stop its blocking loader after 30 seconds. Timeout means confirmation is still unknown, not payment failed. Keep a check-status action and the same order available; do not encourage another charge while one is pending. Resume pending order status after reload or reconnect.

Only a trusted server callback or successful provider reconciliation can mark payment completed. In one transaction, record the receipt, complete the order, and create each enrollment once. Handle duplicate callbacks and late callbacks safely with unique provider references and idempotency keys.

The learner should see a clear success message and a working link to My learning without needing a manual refresh. Failures need a plain reason and a safe retry. Never ask for an M-Pesa PIN on the website.

Use a scheduled reconciliation worker for payments that remain pending. Audit disputed callbacks, reconcile exact amounts, and alert support about unresolved payments. Do not borrow tenant subscription callbacks or alter tenant billing cycles.

## Management and Learning Data

Course records need stable ID/slug, title, category, level, overview, outcomes, requirements, audience, duration, currency/price, image/alt text, SEO metadata, draft/published/archived state, and version timestamps.

Lessons need stable IDs, ordering, sections, duration, preview flag, lesson text, private video/resource storage, and publish state. The current workspace uses written outlines, not a hosted video library or certificates.

Enrollment needs learner, course, order line, access state, and grant/revoke timestamps. Progress must survive device changes and may not trust arbitrary lesson completion indexes.

Order records need buyer details, learner owner, price snapshots, payment attempts, receipt, status history, and notifications. Refunds must be authorized and audited separately from a simple frontend status change.

Reviews should come from eligible enrolled learners. Support moderation, one review per learner/course, edits, and an accurate aggregate of published genuine reviews. The five private samples in superadmin are for layout checks only.

## Shop Separation

`/superadmin/shop` and `/superadmin/academy` are two separate management workspaces inside the same protected superadmin shell. They should share platform authentication and common infrastructure, but not order totals, access rights, or fulfillment logic.

Shop orders buy physical items and may need delivery and stock reservation. Academy orders buy course access and need enrollment. Separate tables or an explicit typed commerce domain can work; callbacks must resolve the correct domain. Tenant subscription payments remain a third, separate billing flow.

## Before Production

1. Add learner authentication, validation, and recovery.
2. Add published course APIs and protected lesson delivery.
3. Replace local management drafts with backend CRUD and publish controls.
4. Add server-priced orders, STK initiation, verified callbacks, and reconciliation.
5. Replace preview success controls with real payment polling.
6. Add enrollment, cross-device progress, and owner-scoped order history.
7. Add genuine reviews and moderation; do not seed fictional testimonials.
8. Add email/SMS receipts, opt-in notices, audit logs, and support tools.
9. Test failure, timeout, duplicate callback, late callback, reload, and cross-account access.
10. Remove preview authentication and payment adapters before accepting real customers.

Launch checks should cover 360px mobile, tablet, desktop, light/dark appearance, keyboard use, screen-reader payment feedback, and paid-content authorization. Store secrets on the backend only.

## Frontend Verification

Run `node --test tests/academy-preview.test.cjs` for phone validation, safe return destinations, isolated identity storage, malformed data handling, and updating an existing order without duplicating it.

Browser checks covered 360, 390, 768, 1024, and 1440px layouts; course filtering; registration validation; sign-in returning to checkout; payment success, failure, cancellation, and a 30-second timeout; pending-order recovery after reload; learning progress; and both management workspaces. These are preview checks, not evidence of a live provider callback or secure backend authentication.
