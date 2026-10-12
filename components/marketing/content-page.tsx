import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { marketingIndexes, detailPages, featurePages, pageName, marketingHref, resources, solutionPages } from "./content"
import { ClosingCTA, DetailCards, Hero, PricingSummary, SectionHeading } from "./sections"
import { ContactForm } from "./contact-form"
import { MarketingCalculator } from "./calculator"
import s from "./marketing.module.css"



export default function MarketingContentPage({ path }: { path: string }) {
  const slug = path.split("/")
  const detail = detailPages.find((page) => page.path === `/${path}`)

  if (detail) {
    const related = detail.path.startsWith("/features/") ? featurePages : solutionPages
    const image = detail.path.includes("hotspot") || detail.path.includes("portal") || detail.path.includes("wifi") ? "/academy/hotspot-wifi.webp" : detail.path.includes("fibre") ? "/academy/fiber-olt.webp" : "/academy/mikrotik-pppoe.webp"
    return <>
      <div className={s.container}><nav aria-label="Breadcrumb" className={s.breadcrumb}><Link href={marketingHref()}>Home</Link><span>/</span><Link href={marketingHref(`/${slug[0]}`)}>{pageName(slug[0])}</Link><span>/</span><span aria-current="page">{pageName(detail.path)}</span></nav></div>
      <Hero label={pageName(detail.path)} title={detail.title} intro={detail.intro} image={image} />
      <section className={s.section}><div className={s.container}>{detail.problem && <SectionHeading label="Sound familiar?" title="Less work between you and your subscribers.">{detail.problem}</SectionHeading>}<div className={s.detailPoints}>{detail.points.map((point) => { const [heading, ...body] = point.split(/\s+-\s+/); return <div key={point}>{body.length > 0 && <h2 style={{ fontSize: 26 }}>{heading}</h2>}<p>{body.length ? body.join(" - ") : heading}</p></div> })}</div></div></section>
      {detail.steps.length > 0 && <section className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="How it works" title="A simpler way through your day." /><ol className={s.threeColumns}>{detail.steps.map((step, index) => <li className={s.plainItem} key={step}><span className={s.stepNumber}>0{index + 1}</span><p>{step}</p></li>)}</ol></div></section>}
      <section className={s.section}><div className={s.container}><SectionHeading label="Keep exploring" title="The rest of your workflow, connected." /><DetailCards pages={related.filter((page) => page.path !== detail.path).slice(0, 3)} /></div></section><ClosingCTA />
    </>
  }

  const intro = marketingIndexes[path]
  if (!intro) notFound()
  return <>
    <section className={s.pageIntro}><div className={s.container}><nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href={marketingHref()}>Home</Link><span>/</span><span aria-current="page">{pageName(path)}</span></nav><p className={s.eyebrow}>Internetily / {pageName(path)}</p><h1>{intro.title}</h1><p>{intro.intro}</p></div></section>
    {path === "features" || path === "solutions" ? <section className={s.section}><div className={s.container}><DetailCards pages={path === "features" ? featurePages : solutionPages} /></div></section> : null}
    {path === "pricing" && <><section className={s.section}><div className={s.container}><PricingSummary /></div></section><section id="calculator" className={`${s.section} ${s.tinted}`}><div className={s.container}><SectionHeading label="Billing calculator" title="Put your own numbers in." /><MarketingCalculator /></div></section><section className={s.section}><div id="faqs" className={`${s.container} ${s.faq}`}><SectionHeading label="A few useful answers" title="Before you get started." />{[
      ["Can I try Internetily first?", "Yes. Request a trial and we will help you get your network set up. You can also explore the read-only demo before we talk."],
      ["Can I bring my existing subscribers?", "You can import subscriber records by CSV. We can help you check the fields and plan the move."],
      ["Do I need a static IP?", "Internetily supports a secure tunnel connection to MikroTik. We will help you check the setup for your router and connection."],
      ["Is activation included in the monthly estimate?", "No. The one-time KSh 500 activation fee after trial is separate. The estimate covers monthly PPPoE usage and the 3% hotspot share, subject to the KSh 500 minimum."],
    ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section></>}
    {path === "contact" && <section className={s.section}><div className={s.container}><ContactForm /></div></section>}
    {path === "resources" && <section className={s.section}><div className={`${s.container} ${s.cardGrid}`}>{resources.map((item) => <Link key={item.href} href={item.href} className={s.featureCard}><h2 style={{ fontSize: 26 }}>{item.title}</h2><p>{item.text}</p><span className={s.cardArrow}>Explore <ArrowRight size={18} /></span></Link>)}</div></section>}
    {path === "integrations" && <section className={s.section}><div className={s.container}><div className={s.threeColumns}>{[
      ["Payments", "Connect M-Pesa STK Push and paybill collections. Keep payments linked to subscriber records.", "/features/mpesa-billing"],
      ["Network access", "Connect MikroTik for subscriber access, PPPoE profiles, and hotspot sessions.", "/features/mikrotik-provisioning"],
      ["Customer equipment", "Manage compatible TR-069 CPE remotely. Compatibility depends on the model, firmware, and supported parameters.", "/features/tr069-device-management"],
    ].map(([title, text, href]) => <div className={s.plainItem} key={title}><h2 style={{ fontSize: 26 }}>{title}</h2><p>{text}</p><Link className={s.textLink} href={marketingHref(href)}>Explore <ArrowRight size={18} /></Link></div>)}</div><p className={s.small}>Using Ubiquiti, TP-Link, Tenda, Cambium, Huawei, or Starlink? Tell us how it fits into your network so we can confirm the integration path.</p></div></section>}
    {path === "countries" && <section className={s.section}><div className={s.container}><Link className={s.textLink} href={marketingHref("/countries/kenya")}>ISP billing in Kenya <ArrowRight size={18} /></Link><p>Operating elsewhere? Tell us which payment channels and equipment you need during your demo.</p></div></section>}
    {path === "countries/kenya" && <><section className={s.section}><div className={s.container}><SectionHeading label="From estates to regional networks" title="A workflow for the way your subscribers pay.">Connect collections to subscriber access. Send renewal reminders by SMS and let subscribers renew from their portal.</SectionHeading><DetailCards pages={solutionPages} /></div></section><section className={`${s.section} ${s.tinted}`}><div className={s.container}><PricingSummary /></div></section></>}
    {path !== "contact" && <ClosingCTA />}
  </>
}
