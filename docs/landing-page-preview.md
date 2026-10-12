# Homepage Migration

## Current Routes

- `/` now serves the new Internetily homepage.
- `/landing-page` serves the previous homepage, including its original intro.
- Previous nested preview URLs redirect permanently to the matching main URL.
  For example, `/landing-page/features/mpesa-billing` redirects to
  `/features/mpesa-billing`. Query strings, including affiliate codes, are preserved.
- The superadmin topbar brand-guide shortcut is unchanged.

## Public Pages

The migrated pages include `/features` and its 20 detail pages, `/solutions` and
four operator solutions, `/pricing`, `/contact`, `/integrations`, `/resources`,
`/countries`, and `/countries/kenya`.

Existing country/county pages under `/solutions/[slug]` remain in place. The new
operator solutions share that route without replacing the older pages.
The academy, blog, shop, documentation, legal pages, and dashboards are unchanged.

## Implementation

Shared presentation and copy now live in `components/marketing`, independently
of the archived homepage. Thin route files use the shared metadata and page
renderer. The previous homepage component remains in `app/landing-page.tsx`.

The new homepage retains contact, features, pricing, problem, and solution anchors.
Older calculator and FAQ anchors navigate to the relevant part of `/pricing`.

Billing rates remain KSh 25 per billable PPPoE subscriber, 3% hotspot share, and
the KSh 500 monthly minimum. Activation remains separate. No backend billing or
payment behavior changed.

The enquiry form still uses the existing lead-submission API. Referral codes and
prefilled enquiry messages are preserved. Submissions are real leads.

## Search and Caching

- Main routes have indexable metadata, self-referencing canonical URLs, social
  sharing metadata, and appropriate organization/website or breadcrumb markup.
- The dynamic sitemap includes the new routes; the existing sitemap index already
  points to it. The old homepage and preview redirects are not listed.
- Crawl rules allow the new public paths without exposing private dashboard routes.
- `/landing-page` retains noindex metadata and HTTP headers.
- Homepage service-worker caching is bypassed, including the start-URL cache, so
  an old offline homepage does not mask the route swap after deployment.
- Stale FAQ, review, and offer markup from the previous homepage is not emitted on
  the new homepage.

## Verification

Run the local server with `npm run dev -- --webpack --port 3002`, then run
`node scripts/check-marketing-pages.mjs`.

The browser test checks the 33 public routes, canonical and robots metadata,
archive behavior, permanent redirects with query strings, sitemap entries, an
existing country page, responsive navigation, calculator anchors, and mocked lead
success/error/retry flows. It never sends test enquiries to production.

Set `MARKETING_URL` for another local port and `CHROME_PATH` for a different Chrome
installation. Production builds still need access to the existing Google Fonts
downloads. Local development can render fallback fonts when downloads are blocked.

## Deployment

Deploy the frontend normally; this migration requires no database changes.
After deployment, check `/`, `/landing-page`, `/pricing`, a feature page, and an
existing country page. Clear any separate reverse-proxy/CDN HTML cache if it still
serves the previous homepage. The old homepage remains available for comparison.
