import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Banknote, Router, ChartNoAxesCombined, Unplug, Layers, ScanEye } from "lucide-react"
import { featurePages, featuredSlugs, marketingHref, solutionPages } from "./content"
import { DetailCards, Hero, PricingSummary, SectionHeading } from "./sections"
import { ContactForm } from "./contact-form"
import s from "./marketing.module.css"

export default function MarketingHomePage() {
  return <>
    <Hero home label="ISP billing & network management" title="Internetily" intro="M-Pesa billing, MikroTik access, invoices, and renewals in one workflow. Built for ISPs in Kenya and East Africa." />
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
    <section className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="Your network, your way" title="Fibre. Hotspot. Wireless. All welcome." /><DetailCards pages={solutionPages} /></div></section>
    <section className={s.section}><div className={`${s.container} ${s.editorial}`}><div className={s.editorialImage}><Image src="/academy/mikrotik-pppoe.webp" alt="Networking team setting up router equipment together" fill sizes="(max-width: 760px) 100vw, 50vw" /></div><div><SectionHeading label="See for yourself" title="Take a look around before we talk.">Explore the dashboard, subscriber records, and network tools in our read-only demo. Bring your questions to a walkthrough of your own setup.</SectionHeading><a href="https://demo.netily.co.ke/admin/login" className={s.secondary}>Open the demo workspace <ArrowRight size={18} /></a></div></div></section>
    <section id="pricing" className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="Straightforward pricing" title="Pricing that grows with your subscribers." /><PricingSummary /></div></section>
    <section className={s.section}><div className={s.container}><SectionHeading label="Getting started" title="Your next steps, made simple." /><div className={s.threeColumns}>{[
      ["Tell us about your ISP", "Your subscribers, routers, and payment setup. We start with what you already have."],
      ["Connect the essentials", "Set up M-Pesa, connect MikroTik, and bring your subscriber records across."],
      ["Go live with support", "Check the full payment-to-connection flow together, then let your team take over."],
    ].map(([title, text], index) => <div className={s.plainItem} key={title}><span className={s.stepNumber}>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section id="contact" className={`${s.section} ${s.tinted}`}><div className={s.container}><ContactForm /></div></section>
  </>
}
