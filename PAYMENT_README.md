# Tuma Payment Handoff (Frontend -> Backend)

This document is the implementation handoff for payment channel propagation from frontend to backend.

Audience: Mark (backend) and QA.

Last updated: 2026-03-30

## 1) Scope and Intent

Frontend is already contract-ready for the initial Tuma channels:
- M-Pesa STK Push
- M-Pesa Paybill
- M-Pesa Till
- Airtel Money
- Bank Transfer
- Card Payments (Credit and Debit)

Goal: allow backend rollout without requiring additional frontend UI rework.

## 2) Where This Is Implemented (Frontend)

- Admin setup and handoff matrix: `/admin/payment-methods`
- Customer recharge selector (contract-ready visibility): `/dashboard/recharge`
- API normalization layer: `lib/admin-api.ts`
- Shared payment types: `lib/types.ts`
- Legal links/pages from registration flow: `/terms`, `/privacy`

## 3) Canonical Mapping

| Business Channel | Frontend `method_type` | Backend `method_type` | Notes |
|---|---|---|---|
| M-Pesa STK Push | `MPESA_STK` | `MPESA_STK` | Direct mapping |
| M-Pesa Paybill | `MPESA_PAYBILL` | `MPESA_PAYBILL` | Uses `config.shortcode` and account reference |
| M-Pesa Till | `MPESA_TILL` | `MPESA_TILL` | Uses `config.shortcode` and account reference |
| Airtel Money | `AIRTEL_MONEY` | `MOBILE_MONEY` | Frontend also sends `config.mobile_provider = AIRTEL` |
| Bank Transfer | `BANK_TRANSFER` | `BANK_TRANSFER` | Direct mapping |
| Credit Card | `CREDIT_CARD` | `CREDIT_CARD` | Direct mapping |
| Debit Card | `DEBIT_CARD` | `DEBIT_CARD` | Direct mapping |

### Legacy aliases still accepted by frontend UI

- `MPESA` -> normalized to `MPESA_STK`
- `BANK` -> normalized to `BANK_TRANSFER`
- `CARD` -> normalized to `CREDIT_CARD`

Backend can optionally continue tolerating these aliases during transition, but canonical values above should be persisted.

## 4) Payload Contract Sent by Frontend

Frontend sends CRUD payloads to `/billing/payment-methods/` with these normalized keys:

Top-level fields:
- `name`
- `code`
- `method_type` (already normalized for backend)
- `description`
- `is_active`
- `is_default`
- `is_payhero_enabled` (derived from frontend `use_payhero`)
- `channel_id` (derived from frontend `payhero_channel_id`)
- `config_json` (full method config object)

Mirrored convenience fields (when present in `config_json`):
- `bank_name`
- `account_number`
- `paybill_number`
- `till_number`

Fallback behavior already in frontend:
- If `config.shortcode` exists and channel is `MPESA_PAYBILL` with no explicit `paybill_number`, frontend mirrors shortcode into `paybill_number`.
- If `config.shortcode` exists and channel is `MPESA_TILL` with no explicit `till_number`, frontend mirrors shortcode into `till_number`.

## 5) Sample Requests by Channel

### 5.1 M-Pesa STK Push

```json
{
  "name": "M-Pesa STK",
  "code": "mpesa_stk",
  "method_type": "MPESA_STK",
  "is_active": true,
  "is_default": true,
  "is_payhero_enabled": true,
  "channel_id": 12,
  "config_json": {
    "shortcode": "174379",
    "passkey": "***",
    "consumer_key": "***",
    "consumer_secret": "***",
    "environment": "production"
  }
}
```

### 5.2 M-Pesa Paybill

```json
{
  "name": "M-Pesa Paybill",
  "code": "mpesa_paybill",
  "method_type": "MPESA_PAYBILL",
  "is_active": false,
  "config_json": {
    "shortcode": "123456",
    "account_reference": "NETILY"
  },
  "paybill_number": "123456"
}
```

### 5.3 M-Pesa Till

```json
{
  "name": "M-Pesa Till",
  "code": "mpesa_till",
  "method_type": "MPESA_TILL",
  "is_active": false,
  "config_json": {
    "shortcode": "654321",
    "account_reference": "NETILY"
  },
  "till_number": "654321"
}
```

### 5.4 Airtel Money

```json
{
  "name": "Airtel Money",
  "code": "airtel_money",
  "method_type": "MOBILE_MONEY",
  "is_active": false,
  "config_json": {
    "mobile_provider": "AIRTEL",
    "airtel_paybill": "778899",
    "airtel_merchant_code": "ATM-01"
  }
}
```

### 5.5 Bank Transfer

```json
{
  "name": "Bank Transfer",
  "code": "bank_transfer",
  "method_type": "BANK_TRANSFER",
  "is_active": false,
  "config_json": {
    "bank_name": "KCB",
    "account_number": "1234567890",
    "account_name": "Netily Ltd",
    "branch": "Westlands"
  },
  "bank_name": "KCB",
  "account_number": "1234567890"
}
```

### 5.6 Card Payments

```json
{
  "name": "Card Gateway",
  "code": "card_gateway",
  "method_type": "CREDIT_CARD",
  "is_active": false,
  "config_json": {
    "card_provider": "visa_mastercard",
    "merchant_id": "MID-4455",
    "public_key": "pk_live_xxx"
  }
}
```

## 6) Response Shape Expectations

Frontend can consume payment methods from backend whether config is returned as:
- `config_json`
- or `config`

Frontend also tolerates these backend fields:
- `is_payhero_enabled` or `use_payhero`
- `channel_id` or `payhero_channel_id`
- `is_active` boolean, or status fallback where `status == ACTIVE`

Recommended backend response convention (target):
- Keep `config_json` as canonical config object
- Return explicit `is_active` boolean
- Return canonical `method_type`

## 7) Backend Work Required (Mark Checklist)

### Required for v1 rollout

1. Ensure serializer/model accepts all canonical `method_type` values listed in Section 3.
2. Persist `config_json` and preserve unknown keys for forward compatibility.
3. Keep mirrored columns (`paybill_number`, `till_number`, `bank_name`, `account_number`) in sync when sent.
4. Validate required fields by channel.
5. Expose active methods in customer recharge/payment initiation endpoints.
6. Support Airtel routing decision using `config_json.mobile_provider = AIRTEL`.
7. Maintain backward compatibility for legacy aliases during migration window.

### Validation rules (recommended)

- `MPESA_STK`: require channel credentials (`shortcode`, `passkey`, integration credentials)
- `MPESA_PAYBILL`: require one of `paybill_number` or `config_json.shortcode`; require `account_reference`
- `MPESA_TILL`: require one of `till_number` or `config_json.shortcode`; require `account_reference`
- `MOBILE_MONEY` with Airtel provider: require `config_json.mobile_provider = AIRTEL` and `config_json.airtel_paybill`
- `BANK_TRANSFER`: require `config_json.bank_name`, `config_json.account_number`
- `CREDIT_CARD`/`DEBIT_CARD`: require `config_json.merchant_id`

## 8) Customer Recharge Rollout Behavior

Current frontend behavior is intentionally staged:
- STK path is live-capable in UI.
- Non-STK channels are visible as contract-ready with "Pending Backend" UX messaging.

Expected backend rollout order:
1. Harden `payment-methods` CRUD validation and enum support.
2. Enable Paybill and Till payment capture.
3. Enable Airtel Money provider routing.
4. Enable bank reconciliation flow.
5. Enable card gateway processing and callback verification.

## 9) QA and UAT Matrix

| Scenario | Expected Result |
|---|---|
| Create STK method with full config | Saves successfully and can be toggled active |
| Create Paybill without shortcode/paybill | Validation error |
| Create Till without account reference | Validation error |
| Create Airtel without mobile_provider | Validation error |
| Fetch methods where backend returns `config_json` | Frontend renders values correctly |
| Fetch methods where backend returns `config` | Frontend renders values correctly |
| Toggle active state | Method state updates without page break |
| Recharge page with non-STK method selected | Shows pending message until backend enabled |

## 10) Risks and Open Items

- Card gateway provider selection not finalized (single vs multi-gateway).
- Bank transfer confirmation flow (manual approval vs automated reconciliation) needs explicit backend policy.
- Airtel settlement and callback schema still dependent on provider contract.
- Webhook idempotency and signature verification should be mandatory before production cutover.

## 11) Definition of Done (Backend)

Backend handoff is complete when all are true:
1. All canonical method enums are accepted and persisted.
2. Method-specific validations are enforced server-side.
3. Customer recharge endpoints can initiate/track at least STK + one additional channel.
4. Admin can create, update, toggle, and test all channels without serializer errors.
5. QA matrix in Section 9 passes in staging.

## 12) Quick References

- Frontend admin API mapping: `lib/admin-api.ts`
- Frontend payment method page: `app/admin/payment-methods/page.tsx`
- Frontend recharge page: `app/dashboard/recharge/page.tsx`
- Frontend payment types: `lib/types.ts`
