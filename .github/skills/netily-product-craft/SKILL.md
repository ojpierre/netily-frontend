---
name: netily-product-craft
description: Build or review polished Internetily/Netily product experiences across frontend and connected backend flows. Use for public pages, shop and academy surfaces, dashboards, admin screens, UX copy, or full-stack features whose loading, empty, error, permission, payment, or operational states affect users. Do not use for backend-only refactors with no user-facing contract change.
---

# Netily Product Craft

Produce work that feels specific to Internetily, complete in real operation, and verified in the rendered product. Avoid replacing the existing system with a fashionable one.

## Start with truth

Before changing code:

1. Read the relevant parts of [`DESIGN.md`](../../../DESIGN.md).
2. Inspect nearby screens, shared components, tokens, terminology, API clients, backend serializers/views, and recent related commits.
3. Name the audience, the job they are completing, the primary action, the real data/assets available, and the states that can occur.
4. Preserve established product conventions unless they create a demonstrated usability, accessibility, or consistency problem.

Do not plan around photographs, metrics, testimonials, integrations, or backend behavior that do not exist. Ask for material when it changes the result; otherwise use honest product data and state the assumption.

## Route the work

Read only the reference needed for the task:

- For a public page, shop, academy, dashboard, admin screen, component, or visual review, read [`references/interface.md`](references/interface.md).
- For UX copy, a landing page argument, product messaging, errors, empty states, notifications, or persuasive copy, read [`references/copy.md`](references/copy.md).
- For a full-stack feature, a production-bound change, or a request to review/finish/polish work, read [`references/release-gate.md`](references/release-gate.md).
- For provenance and future source updates, read [`references/sources.md`](references/sources.md).

When a task crosses modes, read the relevant references and keep one coherent outcome. Public pages and operational app screens share the brand but use different composition rules.

## Craft loop

### 1. Frame the outcome

Write a short internal brief:

- Who is doing what?
- What must be understood or completed first?
- What is the one primary action?
- What evidence makes the claim or state believable?
- Which constraints are load-bearing: permissions, billing state, tenant boundary, network availability, payment status, stock, migration, or device size?

For visual work, choose one product-specific idea. “Clean and modern” is not a direction. A usable direction ties to the subject, such as a calm network operations room, an invoice ledger, a fibre rollout, or a field installation workbench.

### 2. Model the complete flow

List applicable states before implementation: default, loading, empty, error, partial data, permission denied, disabled, processing, success, stale data, narrow width, retry/recovery, and destructive confirmation or undo.

For frontend/backend work, write the contract from persistence to rendered UI: model and migration, validation, permission, endpoint, serializer shape, client type, UI state, audit/logging, and tests. A polished screen on a stubbed or inconsistent contract is unfinished.

### 3. Build in the existing idiom

- Reuse project tokens, layout primitives, components, icons, and libraries.
- Use native controls and semantic HTML before custom widgets.
- Keep one primary action per view and make high-frequency work quick.
- Put color on action, data, status, and exceptions rather than decorative chrome.
- Use real domain nouns and data; no vanity metrics or placeholder proof.
- Keep motion interruptible, restrained, and reduced-motion safe.
- Preserve type safety, tenant isolation, permissions, idempotency, and transaction boundaries.

### 4. Inspect the product, not your intention

Run the closest available preview. Inspect the real render at desktop, tablet, and mobile widths; for app screens also test 320px/200% zoom. Walk the primary flow with keyboard only. Check focus, overflow, labels, loading, errors, empty states, disabled controls, console errors, and network failures.

Use screenshots for visual judgement. Source review cannot prove hierarchy, crop, spacing, contrast, or mobile composition. If the app cannot run, say what could not be verified and do not claim visual polish.

### 5. Adversarial finish

Try to break the change with concrete scenarios. Check removed behavior, direct consumers, API boundaries, stale state, duplicate submission, malformed/empty input, missing contact data, partial provider failure, and retry. Refute each suspected finding before reporting or fixing it.

Finish only when the intended flow works, the important failure states recover, the browser evidence holds, and verification is proportionate to production risk.

## Handoff

Lead with the outcome. State:

- What changed for the user.
- What was verified, including viewport/flow evidence when relevant.
- What remains unverified or blocked.
- Any migration, configuration, rollout, or follow-up requirement.

Do not call work “production-ready,” “premium,” or “polished” without corresponding evidence.
