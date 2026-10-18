# Uganda Mobile Money and Marketing Motion Implementation

## Summary

The frontend now supports Uganda tenants using iotec Mobile Money for MTN MoMo and Airtel Money. Kenya remains the safe default when a tenant country is missing or unknown.

The new Internetily homepage and its nested marketing pages also share a consistent animation system with accessibility support.

## Completed admin dashboard work

- Added `IOTEC_MOMO` to the payment-method types.
- Added frontend types for iotec configuration, creation, updates, validation, and connection testing.
- Added API methods to list, create, update, delete, test, activate, and deactivate iotec configurations.
- Preserved `iotec_configuration` when reading payment methods.
- Prevented `iotec_configuration` from being sent in payment-method create or update payloads.
- Added tenant country and base currency to the shared admin authentication context.
- Country and currency are fetched once after login and reused across the dashboard.
- Missing or unsupported country data falls back to Kenya and KES.

### Payment Methods page

- Uganda tenants see only the iotec Mobile Money card.
- Kenya tenants continue to see the existing Kenya payment gateways.
- Other countries retain their existing behaviour and do not see iotec.
- Gateway and connected counts are calculated from the cards visible to that tenant.
- The loading skeleton matches the number of visible gateway cards.
- Only tenant administrators and superusers can manage iotec settings.
- Non-admin staff can view the page without receiving raw permission errors.

### iotec configuration experience

- Added fields for display name, client ID, client secret, wallet ID, environment, fee handling, and activation.
- New configurations default to Sandbox and `ChargeWallet`.
- Wallet IDs are validated as UUIDs before submission.
- Client secrets are write-only and are never filled from an API response.
- Existing secrets appear only as a `Secret saved` placeholder.
- An unchanged secret is not included in update requests.
- Secret form state is cleared after saving or closing the dialog.
- Connection tests show success, failure, and wallet balance data defensively.
- Activation refreshes the payment methods, iotec configuration, and payment statistics.
- Deleting a configuration requires confirmation and explains that payment history remains available.

## Tenant onboarding and plans

- Added a required country selector to tenant registration.
- Supported countries are Kenya, Ghana, Nigeria, Tanzania, and Uganda.
- Registration sends `company_country`; the backend derives the currency.
- Phone placeholders follow the selected registration country.
- Uganda hotspot plans below UGX 500 are blocked.
- The UGX 500 minimum is enforced in the dedicated create page, legacy plan form, preset flow, custom hotspot dialog, and edit flow.
- Plan prices and labels use the tenant base currency where these flows were updated.
- The onboarding walkthrough directs Uganda tenants to iotec instead of Daraja.

## Hotspot captive portal

- Added optional `country` and `currency` fields to the captive portal configuration.
- Added one shared locale helper for provider labels, phone placeholders, dial codes, validation, and currency formatting.
- Uganda local numbers such as `0772123456` are normalized to `256772123456`.
- Uganda sandbox numbers such as `0111777771` are accepted by structural validation.
- Kenya numbers continue to use the existing `254` rules.
- Uganda uses `Mobile Money` wording instead of M-Pesa or Safaricom wording.
- The waiting screen asks Uganda users to approve the Mobile Money request and enter their PIN.
- The Safaricom cancellation warning is hidden for Uganda.
- UGX amounts use thousands separators and no decimal places.
- Plan currency takes priority, followed by portal currency, then the Kenya fallback.
- Reconnect, chat, payment modal, plan cards, TV purchases, and synthetic reward plans use the shared locale behaviour.
- The timeout state directs customers who already approved payment to the reconnect flow.
- Purchase buttons remain disabled during initiation to prevent duplicate payment requests.
- Smart TV pairing copy is now provider-neutral.

## PPPoE customer portal

- Added a shared customer locale hook backed by the public plans branding response.
- Customer login accepts and normalizes Uganda phone numbers on the frontend.
- Payment initiation uses the iotec-capable billing payment endpoint.
- Payment status polling uses the numeric payment ID returned by the backend.
- Backend payment messages are displayed directly while processing.
- Payment references fall back when an M-Pesa receipt is unavailable.
- Dashboard, plans, invoices, payments, receipts, and profile displays use tenant-aware currency formatting where updated.
- Saved customer payment numbers are scoped to the current hostname.

## Backend response additions

Two read-only locale additions were added to support the frontend:

- `/core/branding/` returns `country` and `base_currency` to signed-in dashboard users.
- `/self-service/plans/` includes `country` and `base_currency` in its branding object.

These fields are read-only and cannot be used to change a tenant country through branding requests.

## Internetily homepage animations

- Added one shared motion layer to the marketing layout.
- The main homepage and nested marketing routes receive the same route transition.
- Section headings, feature cards, workflow steps, editorial images, pricing blocks, contact sections, and calls to action reveal as they enter the viewport.
- Repeated elements use short staggered delays.
- Cards lift slightly on hover and directional icons move with their links.
- Buttons have subtle hover and pressed feedback.
- Animation does not change page dimensions or cause layout shifts.
- `prefers-reduced-motion` disables route, reveal, and interaction movement.
- No looping decorative animation was added.

## Main frontend files

- `app/admin/admin-auth-context.tsx`
- `app/admin/payment-methods/page.tsx`
- `app/admin/payment-methods/iotec-settings-dialog.tsx`
- `app/admin/plans/page.tsx`
- `app/admin/plans/create/page.tsx`
- `app/admin/selfie/page.tsx`
- `app/customer/login/page.tsx`
- `components/mpesa-payment-modal.tsx`
- `app/hotspot/[router_id]/HotspotClientView.tsx`
- `app/hotspot/[router_id]/PaymentModal.tsx`
- `app/hotspot/[router_id]/PhoneReconnectModal.tsx`
- `lib/tenant-locale.ts`
- `lib/admin-api.ts`
- `lib/customer-api.ts`
- `lib/types.ts`
- `components/marketing/motion.tsx`
- `components/marketing/layout.tsx`
- `components/marketing/marketing.module.css`

## Verification completed

- The production frontend build completed successfully with all 267 routes generated.
- Focused TypeScript checks found no errors in the new iotec, locale, portal, customer payment, plan, or marketing motion code.
- Backend Python files compile successfully.
- `git diff --check` passes in both repositories.
- Locale helper checks confirmed Uganda and Kenya phone normalization and UGX formatting.
- Generated service-worker output was removed from the source changes.

## Deployment order

1. Deploy the backend locale response additions.
2. Confirm `/core/branding/` returns `UG` and `UGX` for Uganda tenants.
3. Confirm `/self-service/plans/` exposes the same locale to the customer portal.
4. Confirm the deployed customer login accepts normalized `256...` numbers.
5. Deploy the frontend.
6. Configure a Uganda tenant using iotec Sandbox credentials.
7. Test connection before activation.
8. Run payment success, failure, pending, timeout, reconnect, and late-confirmation tests.
9. Repeat the core payment test with a Kenya tenant to confirm there is no regression.

## Remaining rollout checks

- The checked-in customer-login backend still appears Kenya-specific. Confirm that the separately deployed backend includes Uganda customer-login normalization before enabling Uganda PPPoE payments.
- Complete a browser-based visual review on desktop and mobile after deployment. Playwright is not currently installed in this frontend workspace.
- Some older admin pages still contain Kenya-specific labels. Netily's own subscription charges must remain KES, while tenant-operational revenue should use the tenant or payment-record currency. Review those older screens separately before describing the entire legacy dashboard as fully multi-country.
