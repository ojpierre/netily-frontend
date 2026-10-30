# Interface craft

Use this reference for public pages, shop/academy experiences, product screens, dashboards, admin tools, and visual reviews.

## Choose the correct mode

### Public page

A public page is read and scrolled. Build its argument before its sections:

1. What is this?
2. Who is it for?
3. What should the visitor believe?
4. What proves it?
5. What should they do next?

One claim and its proof form a section. Delete filler sections. Use real network, team, product, or workflow imagery where available. A product UI fragment must be a real, coherent interface with data that adds up, not grey bars in a fake browser frame.

The first screen has one focal point, a short headline, one supporting sentence, and one primary action. Carry the chosen idea through the full page instead of returning to stock feature-card blocks after the hero.

### Operational app screen

An app screen is worked in. Its visual priority is the operator's job:

- Answer one operational question first.
- Put the most frequent action within one step of the first screen.
- Use color on data and exceptions, not on every panel and navigation item.
- Treat KPIs as type and aligned numbers unless a container adds real grouping.
- Keep surfaces flat; use a border or one tonal step before a shadow.
- Use tables as rules and alignment: quiet headers, end-aligned numbers, honest zeros, missing-value dashes.
- Keep the product visible through its real objects and vocabulary: subscribers, plans, routers, invoices, payments, tickets, stock, and orders.
- Do not add a marketing hero, a greeting banner, decorative growth percentages, or icons in tinted circles to manufacture hierarchy.

Quiet does not mean thin. Show the requested blocks, first rows, useful context, and the action required to complete the job.

## Completion states

Account for applicable states on every stateful control or region:

| State | Required behavior |
| --- | --- |
| Default | Clear resting affordance and value |
| Hover | One restrained pointer cue; never the only cue |
| Focus | Immediate visible `:focus-visible` ring |
| Active | Brief tactile state without layout shift |
| Disabled | Native disabled behavior plus a reason when it is not obvious |
| Loading | Progress inside the affected region; stable labels and dimensions |
| Error | What failed, why when known, and the next action; not color alone |
| Success | Confirmed result from the real operation, not optimistic fiction |

Also cover empty, partial, permission-denied, stale, retry, and destructive states at the flow level.

## Accessibility floor

- Use buttons for actions and links for navigation.
- Give every field a visible label and every icon-only control an accessible name.
- Preserve natural keyboard order; no positive `tabindex`.
- Escape closes overlays; focus moves inside and returns to the trigger.
- Target at least 44×44px on touch surfaces when density allows.
- Do not rely on color alone for status or selection.
- Honor reduced motion and provide controls for autoplaying content.
- Reflow at 320px/200% zoom without page-level horizontal scrolling or unreachable actions.
- Use one visible primary `main`, coherent headings, and a skip link when repeated chrome precedes content.

## Visual critique from screenshots

Review screenshots separately from source:

1. **One-second read:** Is there one focal point? Can a stranger say what this is and what to do?
2. **Squint:** Do two or three large masses establish hierarchy, or is everything medium?
3. **Brand removal:** If the logo vanished, could this belong to any competitor?
4. **Edges:** Are text and controls aligned to a few repeated axes?
5. **Grouping:** Are related items closer than unrelated ones? Is whitespace deliberate rather than accidental?
6. **Type:** Is the hierarchy decisive, the measure readable, and wrapping intentional?
7. **Color:** Is the accent scarce enough to mean something?
8. **Imagery/data:** Does each image or chart prove or explain something real?
9. **Sameness:** Do consecutive sections or panels repeat the same composition without reason?
10. **Mobile:** Is it recomposed for the phone rather than squeezed?
11. **Substance:** Does the screen deliver the information and action the brief promised?
12. **Collisions:** Check overlays, clipping, long content, zoom, and scrolling.

Fix hierarchy, truth, missing workflow states, and broken mobile behavior before decorative polish.

## Anti-slop examples

| Avoid | Prefer |
| --- | --- |
| Four identical KPI cards with colored icon bubbles | A ranked operational summary using type, alignment, and one meaningful data hue |
| A bento grid because the page needs “visual interest” | A composition derived from the argument or workflow |
| Every region in a rounded card | Space for grouping, tonal sections for scope, borders for structure |
| Multiple filled accent buttons | One primary action; neutral secondary actions and descriptive links |
| Fake dashboard figures | Real API data, honest zero/empty states, or no metric |
| “Modern” gradients and glows | Brand color used by role, real imagery, or a product-specific diagram |
| Animation on every hover and mount | Instant or short feedback; staged motion only when it communicates hierarchy |
| Desktop columns stacked mechanically | Mobile ordering, crops, actions, and line breaks chosen for the smaller screen |
