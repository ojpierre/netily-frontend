# Homepage Preview

## Where to Review

The new homepage is at `/landing-page`. The existing `/` homepage is unchanged.
The superadmin topbar now links to `/admin/brand-guide`.

All new page components, styles, and copy live in `app/landing-page`.
The source copy is `ISP_NEW/internetily-new-hpcopy.md`; `content.json` contains
the visitor-facing feature and solution copy, not the source document's notes.

## Routes

- `/landing-page`: streamlined homepage, network imagery, enquiry form.
- `/landing-page/features`: feature index with 20 detail pages.
- `/landing-page/solutions`: fibre ISPs, hotspot providers, rural WISPs, managed Wi-Fi.
- `/landing-page/pricing`: current rates, calculator, common questions.
- `/landing-page/contact`: enquiry form using the existing lead-submission API.
- `/landing-page/integrations`: payment, MikroTik, and TR-069 integration paths.
- `/landing-page/resources`: links to existing guides, academy, documentation, affiliates, and shop.
- `/landing-page/countries` and `/landing-page/countries/kenya`: regional starting point.

Feature and solution detail paths follow the supplied document, prefixed with
`/landing-page`. Unknown preview paths return 404.
Links to existing resources, legal pages, and the demo intentionally use their
existing destinations. New marketing pages stay under the preview prefix.

## What Stayed the Same

- The live homepage, billing backend, authentication, and existing public pages.
- KSh 25 per billable PPPoE subscriber and 3% hotspot share, not the draft's 5%.
- KSh 500 monthly minimum and separate KSh 500 activation after trial.
- The existing lead API and referral-code payload. Preview referral codes persist
  across preview navigation for the browser session.
- Existing enquiry submissions are real leads. Do not submit test data to production.

The new pages use Plus Jakarta Sans for interface/body text and Outfit for headings,
with blue, mint, neutral surfaces, and light/dark support. No additional fonts load.

## Review Before Publishing

- Confirm feature claims against enabled product capabilities, especially branch
  isolation, referral rewards, device compatibility, and automated notifications.
- Supply verified customer quotes and evidence for growth metrics before adding
  social proof. Example case studies are not presented as real customer results.
- Confirm any launch-time commitment, trial duration, and cancellation/data-retention
  promises. The preview does not advertise unverified deadlines or policies.
- Trial requests go to an enquiry form, so they say "Request a trial", not instant signup.
- Competitor comparisons, other countries, tools, and changelog entries need their
  own review. No competitor claims or backdated product updates were invented.

## Staging and Migration

Preview pages have noindex/nofollow metadata and HTTP headers, are absent from all
sitemaps, and bypass service-worker runtime caching. This is a public preview URL,
not a password-protected environment.

After approval, move the approved pages and links to their final paths, review
canonicals and structured data, remove preview noindex rules only for the approved
production routes, and update sitemaps. Do not remove noindex from `/landing-page`.

## Local Checks

Run `npm run dev -- --webpack --port 3002`, then
`node scripts/check-landing-preview.mjs` in another terminal.
The smoke test uses headless Chrome, checks routes and responsive navigation, and
mocks lead requests so it does not create production leads. Set `CHROME_PATH` if
Chrome is installed elsewhere and `PREVIEW_URL` to use a different local port.

Google Fonts must be reachable for a production build. A network-restricted local
development server may use fallback fonts even though routes render successfully.
