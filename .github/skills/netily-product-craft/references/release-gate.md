# Full-stack and release gate

Use this reference for connected frontend/backend features, production-bound changes, “finish/polish” requests, and skeptical reviews.

## Stabilize scope

Identify the exact diff or requested flow. Exclude generated output, lockfiles, vendored code, and unrelated dirty files, and name the exclusions. Read both added and removed lines; regressions often hide in behavior that disappeared.

Expand from changed files to the rendered surfaces and direct consumers. For shared tokens, components, API clients, and schemas, inspect the next consumer layer because one local change can alter many screens.

## Trace the contract

For every user-facing operation, trace:

1. Persistence/model and migration.
2. Validation and normalization.
3. Tenant/role permission and object scope.
4. Transaction, idempotency, and retry behavior.
5. Endpoint, serializer, pagination, and error shape.
6. Frontend client type and request behavior.
7. UI default/loading/empty/error/disabled/success state.
8. Audit trail, notifications, provider accounting, and observability where applicable.
9. Tests and rollout/deployment requirements.

Confirm both sides use the same names, nullability, status values, money units, dates/time zones, pagination shape, and authorization assumptions.

## Adversarial scenarios

Assume the change is broken and try concrete inputs or sequences:

- Empty, missing, malformed, oversized, Unicode, and duplicate input.
- Double-click, refresh, retry, delayed callback, partial provider failure, and network loss after a write.
- Stale client state, overlapping requests, unmounted components, and Strict Mode double invocation.
- Wrong tenant, insufficient role, inactive user, expired subscription, paid invoice, cancelled order, missing contact, and depleted stock/wallet.
- Migration applied twice, partially deployed frontend/backend, rollback, and old records with null/default values.
- Narrow viewport, keyboard-only flow, reduced motion, zoom, long labels, and translated text growth.

Each finding needs a reproducible sequence, bad outcome, and source location. Refute the finding before reporting or fixing it: look for existing guards, confirm reachability, and reduce inflated severity.

## Verification evidence

Choose checks proportional to risk:

- Syntax/type/lint checks for touched files.
- Migration consistency and import/system checks.
- Focused unit tests for rules and state transitions.
- Integration tests across the API boundary.
- Browser walkthrough of primary and recovery flows.
- Screenshots at desktop, tablet, and mobile for visual work.
- Console/network inspection for runtime errors and duplicate requests.
- Production workflow status when deployment is requested.

Repository-wide failures do not automatically block a scoped change, but distinguish pre-existing failures from introduced ones with evidence. Do not hide an introduced failure inside a noisy baseline.

## Release verdict

Use one verdict:

- **Ready:** intended flow and material failure paths are verified; no unresolved high-risk finding.
- **Ready with follow-up:** safe to ship, with a named non-blocking gap and owner/action.
- **Blocked:** a reproducible correctness, data, security, permission, migration, accessibility, or task-completion failure remains.
- **Unverified:** the necessary environment or evidence was unavailable; do not translate absence of evidence into approval.

Report what was not checked. “No findings” is credible only when the attempted failure scenarios and verification evidence are named.
