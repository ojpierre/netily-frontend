# Uganda Mobile Money rollout

## What is wired

- Tenant branding now supplies `country` and `base_currency` to signed-in dashboard users. The admin auth context fetches it once per session and falls back to Kenya if unavailable.
- Uganda tenants see an iotec gateway card instead of the Kenya gateway cards. The card can save, test, activate, deactivate, and delete a tenant-owned iotec configuration. The client secret is entered only when first saving or replacing it; it is never filled from an API response.
- Selfie tenant registration sends `company_country`. The backend derives currency.
- The hotspot portal reads `portal_config.country` and `portal_config.currency` for phone numbers, payment wording, plan prices, and reconnect. Kenya remains the fallback for missing or unknown country.
- The customer payment modal uses the iotec-capable billing payment endpoints and polls by `payment_id`. Customer balances, plans, invoices, payments, and receipts use the currency returned with tenant branding.

## Backend rollout requirements

Deploy the two read-only response additions in this change before the frontend: `country` and `base_currency` on `/core/branding/` and on the branding object from `/self-service/plans/`. These are needed for staff and PPPoE customer screens. Neither endpoint accepts country edits.

The checked-in `/self-service/` customer login still accepts only Kenyan local numbers, and the older `/self-service/payments/initiate/` path still validates `254` numbers. The new payment modal calls the iotec-capable `/billing/payments/initiate/` path, but Uganda customers may not reach it through the current login. The backend owner must confirm or fix Uganda login before enabling PPPoE checkout. Do not treat a successful hotspot payment as proof that customer login works.

## Checks before enabling live payments

1. Confirm a Uganda tenant's `/core/branding/` returns `country: UG` and `base_currency: UGX` for both admin and staff. Confirm a Kenya tenant still returns KE/KES.
2. Create an iotec sandbox config. Verify a malformed wallet ID is stopped in the form, an invalid secret produces a visible test error, and a valid test shows the wallet result. Confirm network responses never include `client_secret`.
3. Activate iotec and check `IOTEC_MOMO` is the sole active payment method. Deactivate and delete in separate tests; payment history must remain.
4. On the Uganda hotspot, verify `0772123456` becomes `256772123456`, the sandbox number `0111777771` is accepted, UGX has no decimals, and the Kenya cancellation notice is absent. On Kenya, verify the original M-Pesa labels and `254` normalization remain.
5. Test payment success, failure, late approval after the UI timer, Already paid? Reconnect, and TV purchase. Confirm only one purchase POST occurs per tap.
6. After backend login is country-aware, test Uganda PPPoE login, initiate, status polling, and receipt display. Check the backend's `payment_id` is used for status polling.

## Further admin localization

The admin app still contains Kenya-specific currency or provider copy in many older screens, especially analytics, invoices, payments, SMS, user details, and tenant subscription billing. Do not reinterpret Netily's own KES subscription charges as UGX without a backend contract. Localize tenant-operational money from each record's `currency` or the shared tenant locale in a follow-up review before claiming the whole dashboard is fully multi-currency.
