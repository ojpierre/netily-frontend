# Internetily search and lead growth plan

Updated 6 October 2026. Focus: become the first choice for ISP billing in Kenya, then grow in other markets with pages backed by real product evidence.

## Where we stand

The Search Console result you shared for **"isp billing system"** shows 13 clicks from 314 impressions over 90 days, or **4.14% click-through rate**, at an average position of 4.5. The increases in clicks and impressions are encouraging. This is still a small sample: six additional clicks would move the click-through rate by almost two percentage points. We should judge changes over several weeks and by query, page, country, and device rather than treating one search or one ranking as the whole market. [How Search Console counts these figures](https://support.google.com/webmasters/answer/7576553).

Your example search places paid listings and an AI Overview above regular results. The Netily mention in the AI Overview is useful brand exposure; it is not the same as a click to the site. An average organic position of 4.5 does not mean the page is always fourth on every phone or in every city. We can compete for the first organic result and for more qualified enquiries, but no SEO change can guarantee the top spot or displace sponsored listings.

The homepage already has a sensible canonical URL, product description, structured data, pricing, a calculator, a demo link, and a contact form. The opportunity is to make the promise clearer, remove reasons to doubt it, and measure what happens after a visitor clicks.

## What the site currently tells us

1. **The search result is too generic.** The homepage title lists ISP billing, MikroTik, hotspot, and WiFi billing. It says what the product is, but not why an operator should choose it. The meta description is another feature list. Google can write its own title link and snippet from visible page content, so changing metadata alone is not enough. [Google on title links](https://developers.google.com/search/docs/appearance/title-link); [Google on snippets](https://developers.google.com/search/docs/appearance/snippet).
2. **The visible first screen is less direct than the search result.** The homepage H1 rotates through different activities and the supporting line explains the Netily/Internetily rename before answering a buyer's billing problem. An operator who searches for an ISP billing system should immediately see the payment-to-access outcome and a way to inspect it.
3. **The bottom of the homepage contains a screen-reader-only keyword block.** The live page exposes a long block headed "Internetily and Netily ISP billing system for Kenya" after the form. Parts of the example search snippet resemble this block. Screen-reader-only text is useful for accessibility when it serves readers; a long list of search terms and unrelated features does not. Replace it with concise, visible answers in the appropriate sections. Google warns against keyword stuffing and content hidden chiefly for search ranking. [Spam policy](https://developers.google.com/search/docs/essentials/spam-policies).
4. **The largest buying step asks for effort before showing the payoff.** "Start free trial" and "Request demo" scroll to a multi-field form near the end of a long page. The trial label suggests a self-serve signup, while the destination asks for an enquiry. The homepage also blocks its first interaction behind a 2.6-second loading screen, followed by a video hero. This needs measurement on real phones before we decide exactly how much to remove.
5. **Trust claims need an evidence check.** The homepage displays "500+ ISPs", "50k+ active subscribers", "24h typical setup", and example testimonials and case studies with numerical outcomes. Confirm every public number against records and obtain permission for customer names or quotes. If evidence is unavailable, use a product walkthrough and plainly labelled illustrative scenarios until real customer stories are approved.
6. **The lead funnel cannot yet be judged end to end from analytics.** Google Analytics is configured, but the frontend search found no explicit `generate_lead` or `qualify_lead` event. The form sends leads through `submitLead`, so we need to connect successful submissions to the superadmin lead record and record page, campaign, and outcome without putting contact details into analytics. [Google's lead events](https://support.google.com/analytics/answer/9267735).
7. **More meta keywords will not lift Google rankings.** The homepage and shared layout contain very large keyword arrays, including competitor and "free/open source" searches. Google says it ignores the keywords meta tag for web ranking. Put effort into pages that answer real buyer questions and into working conversion paths. [Google's explanation](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag).

These are findings from the current frontend and the public homepage, not proof that any single issue caused the click or lead numbers.

## The positioning to test

**A clear category promise:** Internetily connects ISP payments, customer records, and network access. For Kenyan operators, show the M-Pesa-to-MikroTik journey. The broader homepage should still welcome operators outside Kenya; local payment detail belongs on the Kenya page.

Suggested search copy to test:

| Page | Title | Meta description |
| --- | --- | --- |
| Homepage | ISP Billing System for PPPoE & Hotspots - Internetily | Bring payments, MikroTik access, invoices, and customer support into one ISP workflow. See the product, estimate your bill, or talk with our team. |
| Kenya solution page | ISP Billing Software Kenya: M-Pesa + MikroTik - Internetily | Collect M-Pesa payments, manage PPPoE and hotspot customers, and check access after payment. See Kenyan pricing and the full workflow. |

The homepage H1 could be: **"ISP billing that connects payments to active service."** Follow it with one short line explaining who it is for and a real screenshot or clearly visible product workflow. Place a direct **"See live demo"** action beside **"Talk to our team"**. Use **"Start free trial"** only when the click starts an actual trial. This is proposed copy for review, not a claim that Google will display it verbatim.

## Page plan

Use the homepage for the broad category: "ISP billing system", "ISP billing software", and Netily/Internetily brand searches. The existing Kenya solution page should own "ISP billing system in Kenya", M-Pesa, and MikroTik buying intent. Existing hotspot, WiFi, PPPoE, and pricing pages should each answer their own use case. Avoid making several near-identical pages compete for the same query.

| Buyer question | Best destination | What to add |
| --- | --- | --- |
| What does an ISP billing system actually do? | Homepage plus one practical guide | A short, visible answer, a payment-to-access diagram, screenshots, and a checklist for evaluating a system. |
| Will M-Pesa renew a PPPoE customer automatically? | Existing Kenya/M-Pesa or PPPoE page | A real test transaction journey: payment request, confirmed receipt, customer status, router action, and what happens when confirmation is delayed. |
| How much will my ISP pay? | Existing pricing/calculator | Three labelled examples for small, mixed, and larger networks; assumptions, current rates, and when custom pricing applies. |
| Will hotspot and home subscribers work together? | Existing hotspot and PPPoE pages | Two concrete operator workflows with screenshots and a link to the calculator. |
| How does this compare with another tool? | Existing comparison pages | Fair, dated comparisons of documented features, setup work, pricing model, support, and suitability. Mark unknowns. Do not use competitors' names as decorative keywords. |
| Can my team see the product before talking to sales? | Demo route and homepage | A fast demo entry point, clear demo account expectations, and a short enquiry path available from the demo. |

Publish fewer, better pages. Update existing pages before adding a new county, estate, or competitor page. Each local page should have a real reason to exist: supported payment method, actual onboarding detail, relevant example, and a locally useful answer. Google recommends people-first content and original experience over pages made chiefly to capture search variations. [Content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## From click to enquiry

1. Put a short sales path within the first two screens on mobile and desktop: see demo, calculate cost, or ask for a setup call. Keep the full form available for buyers who want to explain their network.
2. Make the first form step easy: name, work email or WhatsApp, and "What do you run?" (PPPoE, hotspot, both, starting out). Ask for company, subscriber count, router type, and details only when useful. State what happens after submission in plain words.
3. Send the completed form to the existing superadmin leads destination. Confirm success only after the server accepts it. Preserve the entered details and show a retry message on failure.
4. Preserve page URL, referrer, and campaign tags with the lead record. Attribute Google Search, demo, affiliate, and WhatsApp separately; do not ask visitors to guess their source if it can be captured.
5. Track the steps: `view_demo`, `open_calculator`, `start_lead_form`, and `generate_lead` after server success. In the CRM, record `qualify_lead`, first contact, demo attended, and paid customer. Send no names, emails, or phone numbers to GA4. Google supports lead lifecycle events for this funnel. [Recommended events](https://support.google.com/analytics/answer/9267735).
6. Test the journey weekly on a real mobile connection, including the demo, WhatsApp widget, contact form, lead record, acknowledgement, and reply. Check whether the loading screen or hero video delays the first usable action. Aim for Google's good Core Web Vitals thresholds: LCP within 2.5 seconds, INP under 200 ms, and CLS under 0.1 at the 75th percentile. [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Credibility that earns the click

Replace illustrative case-study percentages with signed, dated results once customers approve them. A useful story names the type of operator, the starting problem, what changed, the measured period, and how the result was calculated. If a customer must remain anonymous, explain why and keep evidence internally. Use real product screenshots, a short recorded workflow, current pricing, support contact details, and a concise "how onboarding works" section. These prove more than a broad claim that the platform does everything.

Ask current customers and network partners for permission to publish technical walkthroughs and link to them from their own relevant resources. Present at ISP events, contribute practical MikroTik/M-Pesa guidance to operator communities, and answer real questions. Seek relevant editorial citations and referrals; avoid buying links or mass-producing city pages.

For AI Overviews and other answer engines, make the same useful pages easy to crawl and cite: direct answers near the top, evidence behind claims, named product details, dated updates when something actually changes, and links to deeper guides. Google says there are no separate technical requirements or special AI markup for these features beyond normal search eligibility and good content. [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

Keep structured data accurate. Validate the current SoftwareApplication and WebSite data against visible pricing and brand copy. Do not add review ratings until there are genuine public reviews. Do not expect the existing FAQ schema to earn a FAQ rich result: Google generally limits that display to well-known health and government sites. [Software app markup](https://developers.google.com/search/docs/appearance/structured-data/software-app); [FAQ display changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

## First 90 days

| When | Work | Done when |
| --- | --- | --- |
| Days 1-14 | Export Search Console data by query, page, country, and device for the last 90 and 28 days. Audit actual lead records and verify all homepage claims. Check form delivery and mobile page speed. | We know which URL receives the "isp billing system" impressions, how many organic leads arrive, and which claims are publishable. |
| Days 1-14 | Replace the hidden keyword block with visible buyer answers. Align homepage H1, title, description, CTA label, and first-screen proof. Put a short enquiry or demo path close to the hero. | Search copy matches the landing experience, and a buyer can reach the demo or start an enquiry without searching the footer. |
| Days 15-45 | Improve the Kenya solution and pricing page with an M-Pesa-to-access walkthrough, real screenshots, and current example bills. Link from homepage and relevant articles with descriptive anchor text. | The Kenya page answers local commercial questions and points to a working demo or enquiry action. |
| Days 15-45 | Add validated lead events and source fields, measure form errors and successful submissions, and review mobile performance. | Organic visit -> enquiry -> qualified lead is visible without counting failed forms as conversions. |
| Days 46-90 | Publish one verified customer story and two hands-on technical guides. Earn relevant operator and partner citations. Review query-to-page overlap. | Content is specific, evidenced, linked from suitable pages, and brings qualified enquiries. |
| Every 2 weeks | Review title/snippet appearance, leads, and on-page actions. Change one main message at a time. | We keep useful gains and stop changes that increase clicks but lower lead quality. |

Do not treat a title rewrite as an instant A/B test. Google may rewrite it, recrawl at different times, and show different snippets for different searches. Keep a change log with deployment date and the affected URL.

## Scorecard

The primary measure is **qualified sales conversations from organic search**, followed by demos attended and customers won. Record the current lead baseline before setting an absolute monthly target.

Secondary measures:

- The exact query "isp billing system": current 13 clicks / 314 impressions / 4.14% CTR / average position 4.5 over 90 days. A working 90-day goal is **25 or more clicks from comparable impressions**, and a sustained **6% or higher CTR**. These are directional goals, not a guarantee; report the raw counts alongside the percentage.
- Kenya commercial queries as a group: non-branded clicks, qualified enquiries, and demo attendance. Aim to improve all three, rather than chasing impressions from unrelated "free" searches.
- Lead efficiency: successful organic enquiries divided by organic landing-page sessions; qualified enquiries divided by successful enquiries. Set targets after two weeks of clean tracking.
- Buyer experience: successful form deliveries, median time to first sales reply, demo starts, and mobile Core Web Vitals.

Review a manual search result as a clue, not as a ranking report. Use Search Console for trends and the sales records for business results. Reaching "#1 in the market" means becoming the most trusted and chosen option for the right ISP buyers, not claiming a permanent position in a changing search page.

## Source and implementation map

Frontend: `app/page.tsx` (metadata and schema), `app/landing-page.tsx` (hero, claims, case studies, form, hidden text), `components/homepage-preloader.tsx` (loading delay), `components/BillingCalculator.tsx`, `app/solutions/[slug]/page.tsx`, `lib/alternatives-data.ts`, and `app/sitemap.ts`. Lead path: `lib/api.ts` and `app/api/public/core/leads/submit/route.ts`. This document proposes work for review; it does not change the live site.
