import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, BadgePercent, BarChart3, Building2, Check, Clapperboard, Coffee, Gift, Hotel,
  MessageSquareText, Minus, Palette, PlayCircle, School, ShoppingBag, Sparkles, Store, Ticket, Wifi,
} from "lucide-react"
import MarketingLayout from "@/components/marketing/layout"
import { SectionHeading } from "@/components/marketing/sections"
import { StepArt } from "@/components/marketing/step-art"
import s from "@/components/marketing/marketing.module.css"
import w from "@/components/marketing/wifi-marketing.module.css"
import { SMS_GATEWAYS } from "@/lib/integrations-data"
import { BRAND_NAME, SITE_URL, brandTitle } from "@/lib/brand"

// ─── Page facts ─────────────────────────────────────────────────────────────
// Every capability named on this page exists in the product today. Things that
// do not exist yet are listed honestly in `notYet` — keep it that way.

const path = "/marketing"
const url = `${SITE_URL}${path}`
const title = brandTitle("WiFi Marketing Software: Ads, Loyalty & M-Pesa")
const description =
  "WiFi marketing for hotspots, cafés, hostels and estates in Kenya. Sponsored-ad free minutes, M-Pesa packages, loyalty points and SMS from one branded login page."

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "wifi marketing", "wifi marketing kenya", "wifi marketing platform", "wifi marketing software",
    "captive portal advertising", "hotspot advertising kenya", "guest wifi marketing", "sponsored wifi",
    "captive portal marketing", "wifi loyalty program", "monetise wifi hotspot", "Internetily", "Netily",
  ],
  alternates: { canonical: url },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: { title, description, url, siteName: "Internetily (Netily)", type: "website", images: [{ url: `${SITE_URL}/academy/hotspot-wifi.webp`, alt: "Customers using a branded WiFi hotspot" }] },
  twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/academy/hotspot-wifi.webp`] },
}

const shortAnswer =
  "WiFi marketing means using the login page of your guest or public WiFi to promote offers, learn who your customers are and bring them back. With Internetily (Netily), the same login page also sells M-Pesa packages and plays sponsored ads that unlock free minutes, so the WiFi earns money instead of only costing it."

const facts: [string, string][] = [
  ["22", "portal themes, each with a live preview"],
  ["3", "ways in: free trial, sponsored ad or paid package"],
  [String(SMS_GATEWAYS.length), "SMS gateways to choose from, plus built-in SMS"],
  ["0", "extra subscriptions for the marketing tools"],
]

const ways = [
  {
    icon: Gift, tag: "Free", title: "A first taste, once per device",
    text: "Mark any package as your free trial. Each device can claim it once, so newcomers try your WiFi and regulars move on to paid packages.",
  },
  {
    icon: PlayCircle, tag: "Sponsored", title: "Free minutes, paid for by an advertiser",
    text: "A visitor watches a short video or image ad and gets up to 60 free minutes. You sell the slot to the shop next door; we serve it and count every view.",
  },
  {
    icon: Wifi, tag: "Paid", title: "Packages bought with M-Pesa",
    text: "Customers pick a package and pay by STK Push on the same page. The money settles to your own Till, Paybill or bank, and they are online in seconds.",
  },
]

const pillars = [
  {
    icon: Palette, title: "A login page that sells", lead: "Your WiFi login is the most-viewed page in your business. Make it work.",
    points: ["24 themes, from clean Classic to Bubbles, Wi-Fi Vending and two Christmas themes", "Your logo, name, support number and a promo banner", "Live preview of the real portal before you save", "Happy-hour packages that only sell on the days and hours you choose"],
  },
  {
    icon: Clapperboard, title: "Sponsored WiFi", lead: "Let local businesses pay for your customers' internet.",
    points: ["Video or image ads, on one router or all of them", "Free minutes as the reward, one claim per device per ad", "Views and completed watches counted per ad", "A PDF report per ad, by day and by router, to send the advertiser"],
  },
  {
    icon: Sparkles, title: "Reasons to come back", lead: "Points and messages that turn a one-off visitor into a regular.",
    points: ["Loyalty points on every purchase, with five tiers and multipliers", "Rewards customers redeem on the portal as free WiFi minutes", "Personalised SMS with {first_name}, {plan_name} and expiry time", "Group SMS to all or only active hotspot users"],
  },
  {
    icon: BarChart3, title: "Know your crowd", lead: "Plan offers with your own numbers, not guesses.",
    points: ["Busiest hours and days as a heatmap", "New versus returning users, day by day", "Revenue per router, site by site", "Your top customers by lifetime spend"],
  },
]

const plays = [
  ["The sponsored half-hour", "Sell a week of ad slots to a nearby business. Their 15-second video plays on your portal; viewers get 30 free minutes. Send them the PDF report on Friday and renew the deal."],
  ["Happy hour WiFi", "Check the heatmap for your quiet hours. Create a cheaper package that only sells Monday to Friday, 2pm to 5pm, and fill the dead time."],
  ["First taste free", "Turn on a 20-minute free trial for new devices. People who like the speed come back and buy, because the trial only works once."],
  ["The loyalty free hour", "Give a free hour as a reward at 200 points. Customers see their points grow with each purchase and redeem the hour on the portal themselves."],
  ["The personal nudge", "Pick your best customers and send an SMS that uses their name and package. A message that says \"Hi Amina\" gets read."],
]

const venues = [
  { icon: Coffee, name: "Cafés and restaurants", text: "Free trial for diners, a happy-hour package for slow afternoons, and an ad slot sold to the bakery next door." },
  { icon: School, name: "Hostels and student housing", text: "Daily and weekly packages paid by M-Pesa, loyalty tiers that reward regulars, and a busy-hours view to plan bandwidth." },
  { icon: Building2, name: "Apartments and estates", text: "Hotspot packages for visitors next to monthly PPPoE for residents, with SMS to every active user from one screen." },
  { icon: ShoppingBag, name: "Markets and malls", text: "One portal per site, sponsored minutes from traders, and revenue per router so you know which wing earns." },
  { icon: Hotel, name: "Hotels and guesthouses", text: "A login page in your colours with your support number, free minutes for guests and paid upgrades for heavy users." },
  { icon: Store, name: "Hotspot businesses", text: "If WiFi is the business, this is your shop window: themes that sell, vouchers through agents, and ads as a second income." },
]

const comparison: [string, string, string][] = [
  ["What the WiFi does for you", "Costs a monthly fee", "Earns from packages and sponsored ads"],
  ["Taking payments", "Usually a separate system", "M-Pesa STK Push, Till, Paybill and 22 banks, settled to you"],
  ["Pricing", "Often in US dollars, plus setup fees", "From KSh 500 a month, then 3% of hotspot sales"],
  ["Router setup", "Varies", "MikroTik provisioning and RADIUS included"],
  ["Loyalty programme", "Sometimes", "Points, five tiers, rewards as free minutes"],
  ["Email and WhatsApp campaigns", "Often included", "Not yet. SMS only"],
]

const notYet = [
  "Email and WhatsApp campaigns. Today you reach customers by SMS.",
  "Click-through tracking on ads. We count views and completed watches, not clicks.",
  "Scheduled campaigns. SMS sends go out when you press send.",
  "Email capture on the login page. Customers are identified by phone number and device.",
]

const faqs: [string, string][] = [
  ["What is WiFi marketing?", shortAnswer],
  ["How does WiFi marketing make money for a business in Kenya?", "In three ways. Customers buy WiFi packages by M-Pesa from the login page, local businesses pay you to show their ads to people who want free minutes, and loyalty points and SMS bring customers back to spend again. Internetily runs all three from one dashboard."],
  ["Can customers get free WiFi by watching an ad?", "Yes. You upload a video or image ad and choose the reward, up to 60 free minutes. A visitor who watches it to the end is connected automatically. Each device can claim each ad once, and the ad report shows views and completed watches per day and per router."],
  ["Which routers does Internetily WiFi marketing work with?", "It runs on MikroTik routers with RouterOS. Internetily provisions the hotspot and RADIUS for you, and one account covers as many routers and sites as you have."],
  ["How much does WiFi marketing cost with Internetily?", "There is no separate marketing plan. Hotspot billing is 3% of confirmed hotspot revenue with a KSh 500 monthly minimum, plus a one-time KSh 500 activation after the 2-day free trial. SMS is paid from prepaid units or through your own SMS gateway."],
  ["Can I send SMS to my WiFi customers?", "Yes. You can send a personalised SMS to up to 500 chosen customers using their name, package and expiry time, or one message to all hotspot users or only those online now. Use built-in SMS or connect Africa's Talking, Advanta, Celcom Africa, Talksasa and others."],
  ["Does Internetily send WhatsApp or email campaigns?", "Not yet. Marketing messages go out by SMS today. If email or WhatsApp is essential for you now, you can pair Internetily with a separate email tool."],
  ["Can I run WiFi marketing across several locations?", "Yes. Each router has its own portal theme, packages and ads, and you manage every site from one dashboard with revenue and sessions per router."],
]

const steps: { art: "connect" | "brief" | "live"; title: string; text: string }[] = [
  { art: "connect", title: "Connect your MikroTik", text: "We provision the hotspot and RADIUS on your router for you, so there is nothing to script by hand." },
  { art: "brief", title: "Design your offers", text: "Pick a theme, add your logo and banner, set packages, a free trial and your first sponsored ad." },
  { art: "live", title: "Go live and grow", text: "Watch the heatmap, send your first SMS, and sell your next ad slot with the report in hand." },
]

function StructuredData() {
  const graph = [
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: "WiFi marketing", description, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${url}#service` }, inLanguage: "en" },
    {
      "@type": "Service", "@id": `${url}#service`, name: "Internetily WiFi marketing", serviceType: "WiFi marketing software", description, url,
      provider: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
      audience: { "@type": "BusinessAudience", audienceType: "Cafés, hostels, estates, malls, hotels and WiFi hotspot businesses" },
      areaServed: ["Kenya", "Uganda", "Tanzania"].map((name) => ({ "@type": "Country", name })),
      offers: { "@type": "Offer", priceCurrency: "KES", price: "500", description: "Monthly minimum; hotspot billing is 3% of confirmed hotspot revenue. No separate charge for the marketing tools." },
      hasOfferCatalog: { "@type": "OfferCatalog", name: "WiFi marketing tools", itemListElement: pillars.map((p) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: p.title, description: p.points.join("; ") } })) },
    },
    {
      "@type": "HowTo", "@id": `${url}#howto`, name: "How to start WiFi marketing with Internetily",
      step: steps.map((step, i) => ({ "@type": "HowToStep", position: i + 1, name: step.title, text: step.text })),
    },
    { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Internetily (Netily)", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "WiFi marketing", item: url }] },
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} />
}

/** An illustrative captive portal: the product, shown rather than described. */
function PortalMock() {
  return (
    <div className={w.stage} aria-hidden="true">
      <div className={w.phone}>
        <div className={w.notch} />
        <div className={w.portal}>
          <div className={w.portalHead}>
            <span className={w.portalLogo}>MC</span>
            <div><strong>Mama Chai Café</strong><span>Free and fast WiFi</span></div>
          </div>
          <p className={w.banner}><BadgePercent size={13} /> Happy hour: 3 hours for KSh 20 until 5pm</p>
          <div className={w.sponsor}>
            <span className={w.sponsorTag}>Sponsored</span>
            <strong>Get 30 minutes free</strong>
            <span>Watch a short ad from Kibanda Shoes</span>
            <span className={w.sponsorButton}><PlayCircle size={14} /> Watch and connect</span>
          </div>
          <div className={w.plans}>
            {[["1 hour", "10"], ["3 hours", "20"], ["All day", "50"]].map(([name, price], i) => (
              <span key={name} className={i === 1 ? w.planActive : undefined}><em>{name}</em><b>KSh {price}</b></span>
            ))}
          </div>
          <span className={w.payButton}>Pay with M-Pesa</span>
          <span className={w.reconnect}>Already paid? Reconnect with your phone number</span>
        </div>
      </div>
      <div className={`${w.chip} ${w.chipPoints}`}><Ticket size={15} /><span><strong>+40 points</strong>Gold tier in 160</span></div>
      <div className={`${w.chip} ${w.chipSms}`}><MessageSquareText size={15} /><span><strong>SMS sent</strong>Hi Amina, your 3 hours end at 6:40pm</span></div>
      <div className={`${w.chip} ${w.chipAd}`}><PlayCircle size={15} /><span><strong>Ad watched</strong>Kibanda Shoes · 30 min free</span></div>
      <p className={w.mockNote}>Illustrative portal</p>
    </div>
  )
}

export default function WifiMarketingPage() {
  return (
    <MarketingLayout>
      <StructuredData />

      {/* Hero */}
      <section className={w.hero}>
        <div className={`${s.container} ${w.heroGrid}`}>
          <div>
            <nav aria-label="Breadcrumb" className={w.crumb}><Link href="/">Internetily</Link><span aria-hidden="true">/</span><span>WiFi marketing</span></nav>
            <p className={s.eyebrow}>WiFi marketing</p>
            <h1 className={w.heroTitle}>WiFi marketing that pays for the WiFi.</h1>
            <p className={w.heroIntro}>Turn your WiFi login page into a shop window. Sell packages by M-Pesa, give free minutes to people who watch a local business&apos;s ad, and bring customers back with points and SMS.</p>
            <div className={s.actions}>
              <Link className={s.button} href="/contact">Book a demo <ArrowRight size={18} /></Link>
              <a className={s.secondary} href="https://demo.netily.co.ke/admin/login">Explore the demo <ArrowUpRight size={18} /></a>
            </div>
            <p className={w.heroNote}><Check size={15} /> 2-day free trial <Check size={15} /> No credit card <Check size={15} /> Prices in KSh</p>
          </div>
          <PortalMock />
        </div>
      </section>

      {/* Answer box + facts */}
      <section className={w.answerBand}>
        <div className={`${s.container} ${w.answerGrid}`}>
          <div className={w.answer}>
            <h2>What is WiFi marketing?</h2>
            <p>{shortAnswer}</p>
          </div>
          <dl className={w.facts}>
            {facts.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}
          </dl>
        </div>
      </section>

      {/* Three ways in */}
      <section className={s.section}>
        <div className={s.container}>
          <SectionHeading label="Free, sponsored or paid" title="Three ways onto your WiFi. Every one of them works for you.">Most guest WiFi tools give the internet away and hope for a lead. Internetily lets you decide, router by router, who gets in free, who watches an ad, and who pays.</SectionHeading>
          <div className={w.ways}>
            {ways.map(({ icon: Icon, tag, title: t, text }) => (
              <article key={tag} className={w.way}>
                <span className={w.wayIcon}><Icon size={22} /></span>
                <p className={w.wayTag}>{tag}</p>
                <h3>{t}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className={`${s.section} ${s.tinted}`}>
        <div className={s.container}>
          <SectionHeading label="The platform" title="Four tools. One login page. One dashboard." />
          <div className={w.pillars}>
            {pillars.map(({ icon: Icon, title: t, lead, points }) => (
              <article key={t} className={w.pillar}>
                <div className={w.pillarHead}><span className={w.wayIcon}><Icon size={22} /></span><h3>{t}</h3></div>
                <p className={w.pillarLead}>{lead}</p>
                <ul>{points.map((point) => <li key={point}><Check size={16} />{point}</li>)}</ul>
              </article>
            ))}
          </div>
          <p className={w.pillarLinks}>
            Go deeper: <Link href="/features/captive-portals">captive portals</Link> · <Link href="/features/hotspot-billing">hotspot billing</Link> · <Link href="/features/sms-reminders">SMS</Link> · <Link href="/features/vouchers-agents">vouchers and agents</Link>
          </p>
        </div>
      </section>

      {/* Plays */}
      <section className={s.section}>
        <div className={`${s.container} ${w.playsGrid}`}>
          <SectionHeading label="Start this week" title="Five WiFi marketing campaigns you can run on Monday.">No agency, no designer. Each one uses a tool that is already in your Internetily account.</SectionHeading>
          <ol className={w.plays}>
            {plays.map(([t, text]) => <li key={t}><h3>{t}</h3><p>{text}</p></li>)}
          </ol>
        </div>
      </section>

      {/* Venues */}
      <section className={`${s.section} ${s.tinted}`}>
        <div className={s.container}>
          <SectionHeading label="Who it is for" title="Built for any place where people wait, work or stay." />
          <div className={w.venues}>
            {venues.map(({ icon: Icon, name, text }) => (
              <article key={name} className={w.venue}><Icon size={24} /><h3>{name}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={s.section}>
        <div className={s.container}>
          <SectionHeading label="How it works" title="Live in three steps. No IT team needed." />
          <div className={s.threeColumns}>
            {steps.map((step, i) => (
              <div key={step.title} className={s.plainItem} data-art-host>
                <StepArt name={step.art} accent={i as 0 | 1 | 2} />
                <span className={s.stepNumber}>0{i + 1}</span>
                <h3 className={s.itemTitle}>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className={`${s.section} ${s.tinted}`}>
        <div className={s.container}>
          <SectionHeading label="Compare" title="A stand-alone WiFi marketing tool, or WiFi that earns?">The difference is simple: a marketing add-on is another bill. Internetily is the system that already takes your WiFi payments, with the marketing built in.</SectionHeading>
          <div className={w.tableWrap}>
            <table className={w.table}>
              <thead><tr><th scope="col">What you get</th><th scope="col">Typical stand-alone tool</th><th scope="col">Internetily (Netily)</th></tr></thead>
              <tbody>
                {comparison.map(([row, other, ours]) => (
                  <tr key={row}>
                    <th scope="row">{row}</th>
                    <td><Minus size={15} aria-hidden="true" /> {other}</td>
                    <td className={ours.startsWith("Not yet") ? w.honestCell : undefined}>{ours.startsWith("Not yet") ? <Minus size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />} {ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing + honesty */}
      <section className={s.section}>
        <div className={`${s.container} ${w.priceGrid}`}>
          <div className={w.priceCard}>
            <p className={s.eyebrow}>Pricing</p>
            <h2>No marketing plan to buy.</h2>
            <p className={w.priceLine}>KSh 500 <span>/ month minimum</span></p>
            <ul>
              {["3% of confirmed hotspot revenue", "Portal themes, ads, loyalty and analytics included", "SMS from prepaid units or your own gateway", "Unlimited routers and sites", "One-time KSh 500 activation after the 2-day trial"].map((item) => <li key={item}><Check size={17} />{item}</li>)}
            </ul>
            <p className={w.priceExample}>Example: a café selling KSh 40,000 of WiFi a month pays KSh 1,200. Anything it earns from ad slots is its own.</p>
            <Link className={s.button} href="/pricing#calculator">Calculate your cost <ArrowRight size={18} /></Link>
          </div>
          <div className={w.honest}>
            <p className={s.eyebrow}>Straight talk</p>
            <h2>What it does not do yet.</h2>
            <p>We would rather tell you now than after you sign up.</p>
            <ul>{notYet.map((item) => <li key={item}><Minus size={16} />{item}</li>)}</ul>
            <p className={w.honestFoot}>Need one of these? <Link href="/contact">Tell us</Link>. It shapes what we build next.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`${s.section} ${s.tinted}`} id="faqs">
        <div className={s.container}>
          <SectionHeading label="Questions" title="WiFi marketing, answered." />
          <div className={s.faq}>
            {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <p className={w.related}>Related reading: <Link href="/blog/start-wifi-hotspot-business-kenya-2026">How to start a WiFi hotspot business in Kenya</Link> · <Link href="/blog/sell-wifi-vouchers-shops-agents-kenya">Selling WiFi vouchers through agents</Link> · <Link href="/solutions/managed-wifi">Managed WiFi</Link></p>
        </div>
      </section>

      {/* Close */}
      <section className={s.ctaBand}>
        <div className={s.container}>
          <div>
            <p className={s.eyebrow}>Your WiFi is already on</p>
            <h2>Put it to work.</h2>
            <p>Show us your site and we will set up your first sponsored ad and happy-hour package on the call.</p>
          </div>
          <Link className={s.button} href="/contact">Book a demo <ArrowRight size={18} /></Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
