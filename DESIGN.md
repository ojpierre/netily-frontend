---
version: alpha
name: Internetily operational clarity
description: A dependable, technically fluent product system for ISP teams running billing, payments, subscribers, routers, support, and network operations.
colors:
  internetily-blue: "#0B84F3"
  internetily-blue-hover: "#0871D1"
  deep-network: "#0B1220"
  signal-cyan: "#22D3EE"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  ink: "#171717"
  slate: "#64748B"
  border: "#E2E8F0"
  success: "#00A651"
  warning: "#F59E0B"
  critical: "#DC2626"
  information: "#2563EB"
  on-brand: "#FFFFFF"
typography:
  display:
    fontFamily: Outfit
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: -0.02em
  h1:
    fontFamily: Outfit
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.015em
  h2:
    fontFamily: Outfit
    fontSize: 1.875rem
    fontWeight: 700
    lineHeight: 1.27
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: 650
    lineHeight: 1.36
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.43
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.38
rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.875rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  gutter: 24px
components:
  button-primary:
    backgroundColor: "{colors.internetily-blue}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.internetily-blue-hover}"
    textColor: "{colors.on-brand}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 48px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

## Overview

Internetily is the operating system for modern ISPs and hotspot providers. The product should make complex internet operations feel clear, dependable, and ready to scale.

The design reference is a **network operations room made calm enough for daily work**: precise instruments, clear status, restrained surfaces, and decisive actions. Public pages may dramatize the world of towers, fibre, routers, field teams, payments, and growing networks. Product screens should recede behind the operator's work.

The master-brand traits are:

- **Reliable:** calm, accurate, and trustworthy in operational moments.
- **Scalable:** useful for the first router, the next town, and the growing team.
- **Modern:** fast interfaces, direct language, and automation that earns its place.

Use two distinct modes without splitting the brand:

1. **Public and commercial pages:** stronger composition, real network imagery, Outfit display type, and a clear argument that leads to one action.
2. **Operational app screens:** Plus Jakarta Sans, quiet chrome, flat surfaces, dense but readable information, and color concentrated on data, status, and the next action.

Appearance settings may let an operator choose another UI font. Preserve that user choice inside tenant product surfaces; the brand defaults above govern public pages and shared Netily-owned surfaces.

## Colors

Internetily Blue is the action and identity color. Deep Network grounds dark media and campaign surfaces. Signal Cyan is a scarce highlight for live network states and diagrams, not a second primary action color.

- Use semantic project tokens where they exist. Do not scatter these hex values through components.
- One filled primary action per view. Peer actions stay neutral or become text links.
- Success green is for confirmed payments and healthy services. Warning amber means attention is needed while service remains usable. Critical red is for failure, interruption, and destructive actions.
- Status never relies on color alone; pair it with text or an icon.
- Operational screens use mostly neutral surfaces. Color belongs on meaningful data, active controls, and exceptions rather than navigation chrome or decorative tiles.
- Verify foreground/background contrast in the rendered state, including dark mode.

## Typography

Plus Jakarta Sans carries product UI, navigation, body copy, forms, tables, labels, documentation, and microcopy. Outfit is reserved for public-page headlines, launches, campaign banners, and a small number of high-impact numeric metrics.

- Keep a small semantic type scale. Do not introduce a one-off size or weight when an existing role fits.
- Headings are short, sentence case, balanced, and visibly subordinate to their parent level.
- Body text uses comfortable line height and a readable measure. Long prose is capped near 60–75 characters per line.
- Use tabular numbers for prices, counters, durations, and changing operational values.
- Keep useful text selectable. Truncated values remain available through expansion or a tooltip when the hidden portion matters.
- Product UI text is at least 14px in normal-density controls; mobile inputs render at 16px to avoid browser zoom.

## Layout

The interface is organized by task and reading order, not by a need to fill a dashboard template.

- Group with space first, tonal surfaces second, and separator lines only when structure still needs help.
- Gaps between groups are visibly larger than gaps inside a group.
- Align content to a small set of shared edges. Stray alignment creates more noise than a missing decoration.
- Public pages use a capped, centered canvas with deliberate full-bleed media. Operational screens use a stable shell and let the main work area flex.
- Breakpoints follow content failure, not default device names. Test at 1440px, 768px, 390px, and 320px/200% zoom.
- Text containers grow and wrap. Critical controls remain reachable without clipped panes or horizontal page scrolling.
- Admin and analytics screens answer one operational question first. Show real objects, real statuses, and the most frequent action above ornamental KPIs.

## Elevation & Depth

Product screens are flat by default. Use a one-step tonal change or a structural border before a shadow. Public and shop surfaces may use restrained shadows to separate physical products or media from the page.

- Keep shadows soft and infrequent; they indicate elevation, not importance.
- Avoid cards inside cards. Nested regions should usually be spacing, a divider, or a tonal inset.
- Images receive a subtle outline when needed for edge definition.
- Motion is quick and mechanical: about 120–150ms for feedback and up to 250ms for content changes. No bounce, overshoot, or repeated entrance animation on frequent workflows.
- Respect `prefers-reduced-motion`; remove autoplay and transform-heavy motion when reduced motion is requested.

## Shapes

Internetily uses practical radii rather than pills everywhere. Use medium radii for controls and panels, small radii for dense operational elements, and full pills only for compact statuses, filters, and segmented choices.

- Closely nested shapes use concentric radii: the outer radius equals the inner radius plus padding.
- Do not round tables, every row, and every text label merely to make the interface feel friendly.
- Keep icon style and stroke weight consistent on one surface. Outline is the default; fill marks an active state.

## Components

Every interactive component is complete only when these states are accounted for where applicable: default, hover, focus, active, disabled, loading, error, and success.

- Use native elements first: buttons for actions, links for navigation, labels for fields, and native form controls unless a custom widget preserves the full keyboard pattern.
- Every keyboard-reachable control has an immediate visible `:focus-visible` indicator.
- Icon-only controls have an accessible name and a touch target of at least 44px where used on mobile.
- Loading keeps the action label understandable and prevents layout jumps. Empty states orient the operator and offer one next action. Errors state what failed and what to do next.
- Destructive actions use distinct treatment and confirmation when irreversible; reversible actions should prefer Undo.
- Tables align numbers to the end, keep headers quiet, preserve honest zeros and missing-value dashes, and avoid decorative zebra striping unless it materially helps a long dense table.
- Charts use the minimum chrome needed to read the data. Never invent vanity metrics, trends, testimonials, or proof.

## Do's and Don'ts

### Do

- Use the terms ISP teams already use: **M-Pesa STK Push**, **captive portal**, **TR-069 ACS**, and **PPPoE session**.
- Make the product's real object the visual idea: a payment, router, subscriber, plan, invoice, support case, network link, or physical shop item.
- Write direct, technical, human copy: what happened, what it affects, and what the operator can do next.
- Keep public-page claims paired with proof: the product, a real workflow, a real number, a real customer statement, or a demonstration supplied by the project.
- Reuse the existing component library, tokens, and interaction patterns before creating another system.
- Inspect the rendered result and key states in a browser before calling the interface polished.

### Don't

- Do not default to “Welcome back,” four icon KPI cards, colored icon circles, rainbow charts, a purple gradient, glass panels, or a generic bento grid.
- Do not use “clean, modern, premium” as the design direction. Name a concrete product-specific reference and decision.
- Do not invent customer counts, ratings, testimonials, uptime claims, revenue, or growth percentages.
- Do not add a hero treatment to an operational admin screen.
- Do not make every region a card, every label uppercase and tracked, or every link carry an arrow.
- Do not use decoration to compensate for weak hierarchy, thin content, or an unclear action.
- Do not show fake success before the server confirms it.
- Do not ship an interaction without loading, empty, error, permission, disabled, narrow-width, and recovery behavior where those states can occur.
