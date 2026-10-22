import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight, Banknote, Router, ChartNoAxesCombined, Unplug, Layers, ScanEye, Globe2, RefreshCcw, Tv, MessageSquareText, CreditCard, Star } from "lucide-react"
import { featurePages, featuredSlugs, marketingHref, solutionPages } from "./content"
import { DetailCards, Hero, PricingSummary, SectionHeading } from "./sections"
import { ContactForm } from "./contact-form"
import s from "./marketing.module.css"

const trustpilotProfileUrl = process.env.NEXT_PUBLIC_TRUSTPILOT_PROFILE_URL || "https://www.trustpilot.com/review/netily.co.ke"
const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://www.google.com/maps/search/?api=1&query=Internetily"

export default function MarketingHomePage() {
  return <>
    <Hero home label="Internetily" title="Internetily ISP billing system" intro="Automate MikroTik PPPoE, hotspot and WiFi billing, M-Pesa payments, subscriber access, invoices, and renewals in one connected workflow." />
    <section className={s.compatibility}><div className={s.container}><p>Works with the routers you already own.</p><div>{["MikroTik", "Ubiquiti", "TP-Link", "Tenda", "Cambium", "Huawei", "Starlink", "FreeRADIUS"].map((name) => <span key={name}>{name}</span>)}</div><Link href={marketingHref("/integrations")}>Find the right connection for your setup <ArrowRight size={15} /></Link></div></section>
    <section id="problem" className={s.section}><div className={s.container}><SectionHeading label="Less busywork" title="Every hour on manual billing is an hour not spent growing." /><div className={s.threeColumns}>{[
      { icon: Unplug, title: "Manual reconnections", text: "Someone checks M-Pesa, opens the router, unblocks the user. Three steps that should be zero." },
      { icon: ScanEye, title: "Invisible revenue", text: "Payments come in, but which subscribers are current, overdue, or about to leave? You need answers before month-end." },
      { icon: Layers, title: "Blind spots everywhere", text: "Router status in one tab. Payments in another. Subscriber records in a spreadsheet. Nothing shows the whole picture." },
    ].map(({ icon: Icon, title, text }) => <div className={s.plainItem} key={title}><Icon size={25} /><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section id="solution" className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="One connected workflow" title="From payment to connection." /><div className={s.workflow}>{[
      { icon: Banknote, title: "Subscriber pays", text: "M-Pesa STK Push or paybill. The payment is matched to the account." },
      { icon: Router, title: "Router applies access", text: "The PPPoE profile activates or the hotspot session opens. No router login." },
      { icon: ChartNoAxesCombined, title: "You see everything", text: "Revenue, subscribers, renewals, and support. One dashboard, not three systems." },
    ].map(({ icon: Icon, title, text }, index) => <div className={s.workflowStep} key={title}><div><span>0{index + 1}</span><Icon size={28} /></div><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section id="features" className={s.section}><div className={s.container}><SectionHeading label="Made for your working day" title="Everything your ISP runs on. One place." /><DetailCards pages={featuredSlugs.map((slug) => featurePages.find((page) => page.path.endsWith(`/${slug}`))!)} /><Link className={s.textLink} href={marketingHref("/features")}>Explore all features <ArrowRight size={18} /></Link></div></section>
    <section className={`${s.section} ${s.operationsBand}`}><div className={s.container}><SectionHeading label="Ready for real networks" title="Local payment habits. One connected operating flow.">Internetily adapts the payment and network experience to the market you serve, while keeping the daily work familiar for your team.</SectionHeading><div className={s.capabilityGrid}>{[
      { icon: Globe2, title: "Payments across more markets", text: "Support Kenya, Uganda, Tanzania, and other enabled markets through regional options including M-Pesa, MTN MoMo, and Flutterwave-backed flows." },
      { icon: RefreshCcw, title: "Paid hotspot users reconnect", text: "When access is still valid, returning hotspot customers can restore their connection instead of being sent through payment again." },
      { icon: Tv, title: "Pay for another screen", text: "Customers can pay for supported TV access from the captive portal using the same guided payment experience." },
      { icon: ChartNoAxesCombined, title: "Revenue by router", text: "See what a specific router contributes across hotspot and PPPoE activity, then compare locations with clearer context." },
      { icon: MessageSquareText, title: "SMS without separate credentials", text: "Use Internetily's inbuilt SMS option for reminders and service communication when you do not run your own gateway." },
      { icon: CreditCard, title: "Daraja options for Kenya", text: "Connect supported Safaricom Till and Paybill collections with your own Daraja credentials and keep payment events tied to subscriber records." },
    ].map(({ icon: Icon, title, text }) => <article className={s.capabilityItem} key={title}><Icon size={24} /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="Your network, your way" title="Fibre. Hotspot. Wireless. All welcome." /><DetailCards pages={solutionPages} /></div></section>
    <section className={s.section}><div className={`${s.container} ${s.editorial}`}><div className={s.editorialImage}><Image src="/academy/mikrotik-pppoe.webp" alt="Networking team setting up router equipment together" fill sizes="(max-width: 760px) 100vw, 50vw" /></div><div><SectionHeading label="See for yourself" title="Take a look around before we talk.">Explore the dashboard, subscriber records, and network tools in our read-only demo. Bring your questions to a walkthrough of your own setup.</SectionHeading><a href="https://demo.netily.co.ke/admin/login" className={s.secondary}>Open the demo workspace <ArrowRight size={18} /></a></div></div></section>
    <section id="pricing" className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="Straightforward pricing" title="Pricing that grows with your subscribers." /><PricingSummary /></div></section>
    <section className={s.section}><div className={s.container}><SectionHeading label="Getting started" title="Your next steps, made simple." /><div className={s.threeColumns}>{[
      ["Tell us about your ISP", "Your subscribers, routers, and payment setup. We start with what you already have."],
      ["Connect the essentials", "Set up M-Pesa, connect MikroTik, and bring your subscriber records across."],
      ["Go live with support", "Check the full payment-to-connection flow together, then let your team take over."],
    ].map(([title, text], index) => <div className={s.plainItem} key={title}><span className={s.stepNumber}>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section className={`${s.section} ${s.reviewSection}`}><div className={`${s.container} ${s.reviewLayout}`}><SectionHeading label="Independent feedback" title="Already using Internetily? Tell the next operator what stood out.">Read public feedback before you book a walkthrough, or leave an honest review after working with the platform.</SectionHeading><div className={s.reviewGrid}><a className={s.reviewCard} href={trustpilotProfileUrl} target="_blank" rel="noopener noreferrer"><span className={s.reviewBrand}><Star size={22} /> Trustpilot</span><strong>Read or write an Internetily review</strong><span>Open Trustpilot <ArrowUpRight size={17} /></span></a><a className={s.reviewCard} href={googleReviewUrl} target="_blank" rel="noopener noreferrer"><span className={s.reviewBrand}><span className={s.googleG}>G</span> Google</span><strong>Share your experience on Google</strong><span>Open Google profile <ArrowUpRight size={17} /></span></a></div></div></section>
    <section id="contact" className={`${s.section} ${s.tinted}`}><div className={s.container}><ContactForm /></div></section>
  </>
}
