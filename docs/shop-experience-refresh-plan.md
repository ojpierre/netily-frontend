# Internetily Shop Experience Refresh Plan

## Purpose

Refresh the public Internetily shop and the superadmin shop-management workspace around the live backend that now exists.

The public shop should help home buyers, offices, schools, ISPs, and network installers quickly find the right equipment and complete an M-Pesa purchase. The superadmin workspace should make products, stock, categories, payments, and fulfilment easy to operate without returning to mock data.

The attached shop screenshot is a structural reference, not a visual template to copy. Internetily should retain its own logo, blue-led brand system, typography, component radius, and light/dark theme behaviour.

## Confirmed Live Foundation

The backend handoff confirms that these capabilities are live:

- public product and category APIs;
- product detail and related products;
- search, category, featured, ordering, and pagination parameters;
- stock validation and atomic stock reservation at checkout;
- guest checkout;
- M-Pesa STK initiation and secure callback handling;
- order-status polling and payment retry;
- stale-order expiry and stock release;
- delayed-payment reconciliation;
- order confirmation email with a secure tracking link;
- superadmin product and category management;
- superadmin order list, order detail, valid status transitions, and manual mark-paid;
- order statistics;
- persistent, variant-safe cart behaviour.

The following are not live and must not be presented as working:

- card payments;
- customer authentication and account history;
- quotes, warranties, saved addresses, and account support data;
- admin-managed hero campaigns;
- image uploads;
- shop SMS templates and delivery tracking.

The old shop outline describes several preview flows that are now outdated. The live Django API and this document should be treated as the current implementation direction.

## Experience Principles

1. **Products first.** A visitor should see categories and real products in the first viewport or immediately beneath it.
2. **Useful to non-ISPs.** Copy must work for a home buyer, office manager, school, installer, or ISP operator.
3. **Clear buying confidence.** Stock, warranty, payment method, delivery expectations, and support must be easy to find.
4. **Compact commerce layout.** Avoid oversized marketing sections and excessive decorative cards.
5. **One live source of truth.** Product, price, stock, category, and order information must come from the backend.
6. **Honest capabilities.** Hidden mock account pages must not be linked until authentication and account APIs are real.
7. **Mobile buying matters.** Search, category navigation, cart, checkout, STK feedback, and tracking must be excellent on a phone.

## Public Shop Information Architecture

### Header

Use a three-level commerce header on desktop and a compact two-level version on mobile.

Utility bar:

- delivery or collection message;
- WhatsApp sales;
- support email or phone;
- order tracking link.

Main header:

- Internetily logo with a clear Shop label;
- prominent product search;
- WhatsApp or sales action;
- cart button with quantity;
- mobile menu button.

Category navigation:

- Shop by category menu;
- featured category links from the live category API;
- Track order;
- Contact or bulk enquiry.

Do not restore customer login links until real customer authentication is ready.

### Storefront Homepage Order

Follow this merchandising sequence:

1. Compact campaign hero.
2. Shop by category.
3. Trust and service strip.
4. Featured products.
5. Internetily network-operations banner.
6. Curated category rows.
7. Shop by need.
8. Buying guides.
9. Help choosing equipment.
10. Shop by brand.
11. Newsletter and footer.

This order follows the useful rhythm in the reference while remaining distinct in visual treatment and copy.

## Homepage Sections

### 1. Compact Campaign Hero

The hero should be product-led and no taller than about 420px on desktop or 460px on mobile. A hint of the category section must remain visible at common viewport heights.

Content:

- one direct headline;
- one short supporting sentence;
- primary `Shop products` action;
- secondary `Talk to sales` action;
- campaign artwork showing real networking products;
- optional two smaller featured-product callouts;
- clear slider controls and pause behaviour.

Current state: slides are static frontend data. Keep that fallback until a hero-offer API exists.

Backend needed for management:

- campaign image;
- eyebrow;
- title;
- short copy;
- CTA label and URL;
- active dates;
- sort order;
- active state.

### 2. Shop By Category

Use a horizontal category tile row on desktop and a swipeable row on mobile.

Each tile should contain a clean product image, category name, and link to a filtered catalog. Categories must come from the API. If category artwork is not available, use a representative product image from that category.

Recommended starter categories:

- Wi-Fi access points.
- Routers and gateways.
- Fibre and GPON.
- Starlink accessories.
- Power backup.
- Switching.
- Cables and accessories.
- Tools and test equipment.
- Racks and cabinets.
- CCTV and security networking, when stock supports it.

### 3. Trust And Service Strip

Use one restrained full-width strip with four items:

- M-Pesa checkout.
- Stock checked at checkout.
- Warranty information on product pages.
- Help choosing compatible equipment.

Only state delivery promises once operations can consistently meet them.

### 4. Featured Products

Use the backend `featured=1` capability. Show five products on desktop and a horizontal scroll on mobile.

Product cards should show:

- product image;
- name;
- brand;
- short specification or category;
- USD or KES price according to the selected display-currency contract;
- compare-at price when present;
- stock state;
- quick add only when no variant choice is required;
- view-product action when size, storage, or colour must be selected.

Avoid hover-only information. The card must remain complete on touch devices.

### 5. Internetily Operations Banner

Use one full-width branded band between product groups. It can connect hardware purchasing with Internetily’s ISP operations platform without turning the shop into a marketing homepage.

Suggested message direction:

> Buying equipment for a growing network? Internetily helps you manage routers, subscribers, billing, payments, and support from one place.

Actions:

- Explore Internetily.
- Book a setup conversation.

### 6. Curated Product Rows

Show category-specific rows based on available catalog data, for example:

- Wi-Fi access points.
- MikroTik and routing.
- Fibre and GPON.
- Starlink and backup power.

Each row should show up to five products and a `View all` category link. Hide an entire row when it has too few active products rather than showing empty placeholders.

### 7. Shop By Need

This helps buyers who do not know product categories.

Suggested needs:

- Home and small-office Wi-Fi.
- Outdoor and long-range links.
- Fibre installations.
- Keep the internet running during outages.
- New ISP starter setup.
- Apartment or estate coverage.

Phase one can map these needs to category/search URLs in frontend configuration. A later collection model can make them admin-managed.

### 8. Buying Guides

Show three relevant guides with real imagery and practical titles. Reuse existing Internetily editorial content where it genuinely helps a hardware buyer.

Suggested topics:

- Choosing a router for a home, office, or small WISP.
- Fibre installation tools and accessories checklist.
- Power backup sizing for routers, ONTs, and access points.

Each guide needs Article structured data and a useful destination page. Do not create dead cards.

### 9. Help Choosing Equipment

Use a slim assistance band:

- short question-led copy;
- WhatsApp sales action;
- call action;
- optional bulk-quote email action.

The current WhatsApp support handoff is real and can remain the primary quick-help channel.

### 10. Shop By Brand

Brand data currently lives indirectly in product specifications. Short term, derive unique active brands and show text-first brand tiles. Long term, add a Brand model with logo, slug, sort order, and active state.

Only show brands with live products.

### 11. Footer

Keep the Internetily global footer language but adapt its columns for commerce:

- Shop categories.
- Customer help.
- Order tracking.
- Delivery and returns policies.
- Privacy, cookies, and terms.
- WhatsApp, email, and phone.
- Internetily platform link.

Do not link hidden mock account pages.

## Catalog Refresh

The catalog page should remain denser than the homepage.

Desktop layout:

- left filter rail;
- product results on the right;
- search, result count, sort, and active-filter summary above the grid.

Mobile layout:

- sticky search;
- filter drawer;
- sort menu;
- two-column product grid where width permits;
- clear active-filter chips.

Filters supported now:

- category;
- search;
- stock state;
- featured;
- price ordering;
- newest;
- name.

Future filters require normalized backend fields for brand, use case, technology, speed, radio band, port count, PoE, and warranty.

Filtering and pagination should be server-driven for scalability. The current `page_size=200` client-side catalog load is acceptable only as a temporary small-catalog implementation.

## Product Detail Refresh

Preserve the live product fetch and related-product API.

The page should contain:

- image gallery;
- breadcrumb;
- product title, brand, category, and stock;
- price and compare-at price;
- variant selectors;
- quantity control;
- add-to-cart action;
- M-Pesa checkout reassurance;
- delivery and support summary;
- details, specifications, materials, care, warranty, and origin accordions;
- related products;
- compatible-product suggestions when the backend can support relationships.

Out-of-stock products must remain viewable but cannot be added to cart.

## Checkout And Tracking Refresh

Do not change the working order, stock, polling, retry, or reconciliation logic.

Improve presentation around it:

- explain that checkout is currently M-Pesa only;
- show the KES amount before the final action;
- validate Kenyan phone input clearly;
- keep delivery details editable only before order creation;
- show `Waiting for approval`, `Payment delayed`, `Payment failed`, and `Paid` as distinct states;
- link delayed customers directly to secure order tracking;
- never automatically retry an STK request;
- retain the tracking token only in the secure tracking link or session storage.

The success copy must say `Track order`, not `Track in account`, because customer accounts are not live.

## Currency Decision

The catalog currently stores and returns USD while checkout charges the converted KES amount. A Kenyan storefront should avoid surprising the customer at payment.

Recommended backend addition:

- expose `display_currency`, `fx_rate`, and a server-calculated display amount through `/api/v1/shop/config/` or each product payload;
- keep USD as the catalog source price and snapshot the rate on the order;
- show KES as the primary storefront price when the shop is configured for Kenya;
- optionally show the USD source price in smaller text;
- never hardcode the exchange rate in the frontend.

Until this contract exists, keep the current USD display and clearly show the KES payable amount before order creation.

## Superadmin Shop Management Refresh

The current management component has working data but has been compressed into four pill tabs. Replace that presentation with a quiet operations workspace consistent with the main superadmin dashboard.

### Layout

Use a left-side shop navigation inside the content area:

- Overview.
- Orders.
- Products.
- Add product.
- Categories.
- Inventory.
- Merchandising.
- Communications.
- Settings.

On smaller screens, turn this into a labeled menu or horizontal scroll without changing routes or losing state.

Only Overview, Orders, Products, Add product, Categories, and basic Inventory should be enabled from the current backend. Other sections should remain hidden until their contracts exist.

### Overview

Use a restrained metric row rather than eight equal cards.

Primary metrics:

- paid revenue in KES;
- orders awaiting payment;
- orders requiring fulfilment;
- low-stock products.

Secondary information:

- recent orders;
- payment-status breakdown;
- order-status breakdown;
- stock alerts;
- quick actions.

### Products

Use a dense table with:

- image and product name;
- SKU or slug;
- category;
- price;
- available stock;
- featured state;
- published state;
- last update;
- actions menu.

Filters:

- search;
- category;
- active or hidden;
- featured;
- in stock, low stock, or out of stock.

Product actions:

- Edit.
- Duplicate.
- Feature or unfeature.
- Publish or unpublish.
- View storefront page.
- Delete with a strong confirmation.

### Product Editor

The current form omits many fields already supported by the backend. Organize the editor into sections:

1. Basic information: name, slug preview, category, description, long description.
2. Pricing: price, compare-at price.
3. Media: primary image and image gallery.
4. Inventory: track stock, quantity, active state, featured state, sort order.
5. Variants: sizes or storage options and colours, each with availability.
6. Product information: details, materials, care, warranty, made in.
7. Specifications: key-value specification editor.
8. Search preview: title, summary, URL preview where supported.

Use a sticky save bar with `Save draft`, `Publish`, and `Cancel`. Until image upload exists, label image fields honestly as image URLs and provide a preview.

### Categories

Provide a dedicated list with name, slug, sort order, active state, and product count.

Actions:

- Add category.
- Rename.
- Reorder.
- Publish or unpublish.

Do not expose category deletion while products reference it. The current backend can raise a protected-reference error; unpublishing is the safe action.

### Inventory

Phase one can use the existing product stock quantity and tracking flag.

Show:

- product;
- stock quantity;
- low-stock state;
- published state;
- inline stock adjustment.

The later stock-ledger phase should add reason, adjustment amount, actor, timestamp, supplier reference, and warehouse location.

### Orders

Use a table on desktop and compact rows on mobile.

Columns:

- order reference;
- customer;
- created time;
- payment state;
- fulfilment state;
- total USD;
- charged KES;
- M-Pesa receipt;
- action.

Filters:

- search;
- order status;
- payment status;
- date range;
- city or delivery area when supported.

Open order details in a right-side drawer or dedicated detail view. Show customer contact, delivery address, items, variants, totals, M-Pesa data, and the next valid transitions.

Manual mark-paid must remain an exceptional action. Require confirmation, optional receipt, and a statement that payment has been independently verified.

### Merchandising

This section should manage hero campaigns, curated rows, shop-by-need collections, and brand order. It requires new backend models and should not use localStorage as production state.

### Communications

Future scope:

- order-confirmation templates;
- payment-received templates;
- dispatch and delivery templates;
- delivery logs;
- retry failed messages.

Keep this hidden until real APIs exist.

## Backend Additions Needed For The Full Refresh

The live backend already covers the core transaction. The design refresh needs these additions in later phases:

1. Storefront configuration endpoint for display currency, FX presentation, contacts, and delivery copy.
2. Hero campaign CRUD.
3. Category image and optional description.
4. Brand model or normalized product brand field.
5. Curated collection or shop-by-need model.
6. Product image upload and media ordering.
7. Stock movement ledger and low-stock threshold.
8. Fulfilment fields such as courier, tracking number, dispatch time, and delivery time.
9. Shop communication templates and delivery logs.
10. Customer authentication and account APIs as a separate project.

Do not alter the following established backend rules:

- shop remains in the public schema;
- `/api/v1/shop/` remains a public-router path;
- the payment callback path must not contain `mpesa` or `safaricom`;
- checkout pricing and stock validation remain server-authoritative;
- card payment remains hidden until a real provider exists;
- category deletion remains unavailable while products reference it.

## SEO And Discoverability

- Add Product structured data to product pages with price, currency, availability, brand, and URL.
- Add BreadcrumbList structured data to catalog and product pages.
- Give categories indexable URLs with unique titles and descriptions.
- Use real product names in image alt text.
- Include product and category pages in the sitemap only when active.
- Canonicalize filtered catalog URLs to avoid duplicate search pages.
- Keep internal search result pages out of the sitemap.
- Add useful buying guides that link naturally to relevant categories and products.
- Use Kenyan buying language where appropriate without excluding regional or international buyers.

## Performance And Reliability

- Keep product imagery in fixed aspect-ratio containers.
- Generate responsive image sizes and modern formats.
- Lazy-load content below the first product row.
- Avoid loading all products on the client as the catalog grows.
- Preserve catalog cache invalidation after product or category changes.
- Show stale-stock risk only through normal stock language; checkout remains authoritative.
- Keep cart restoration resilient when a product becomes inactive or unavailable.
- Track checkout API failures and payment delays separately from ordinary validation errors.

## Recommended Delivery Phases

### Phase 1: Refresh What Is Already Live

- Rebuild the storefront hierarchy using live categories and products.
- Refresh header, category row, trust strip, product rows, needs section, guides, help strip, brands, and footer.
- Improve product cards, catalog filters, product detail, checkout copy, and tracking.
- Rebuild superadmin layout with side navigation.
- Expand the product editor to all fields already supported by the API.
- Add dedicated categories and basic inventory views.
- Keep hero slides static and keep unsupported admin sections hidden.

### Phase 2: Merchandising And Media

- Add hero campaign, collection, category-image, brand, and media-upload APIs.
- Connect storefront sections to admin-managed data.
- Add image optimization and campaign scheduling.

### Phase 3: Fulfilment And Communications

- Add stock ledger, courier and tracking fields, dispatch workflow, customer messages, and delivery logs.
- Add operational alerts for delayed payment, low stock, and overdue fulfilment.

### Phase 4: Customer Accounts

- Design and implement real customer authentication.
- Connect orders, addresses, receipts, quotes, warranties, support, and preferences.
- Remove or replace all remaining mock account data only when the backend is ready.

## Acceptance Checklist

- The first viewport shows a compact offer and the start of product discovery.
- Every visible product and category comes from the live API.
- Public search, category filters, stock filters, and sorting work on mobile and desktop.
- Product cards never imply unavailable variants can be bought.
- Checkout clearly states M-Pesa and the KES payable amount.
- Payment polling, delayed payment, retry, and order tracking continue working.
- No public navigation reaches mock customer-account pages.
- Superadmin shop navigation is on the side and matches the platform shell.
- Product administration covers all currently supported backend fields.
- Categories can be unpublished but not unsafely deleted.
- Order actions expose only valid backend transitions.
- Manual mark-paid is clearly guarded and auditable.
- Unsupported merchandising and communications features are not presented as live.
- Product and category pages have useful metadata and structured data.
- The storefront remains usable with slow images, empty categories, API errors, and out-of-stock products.

