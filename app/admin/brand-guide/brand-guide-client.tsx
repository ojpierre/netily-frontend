"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  Gauge,
  ImageIcon,
  Layers3,
  Moon,
  ShieldCheck,
  Sun,
  Type,
  Wifi,
  X,
} from "lucide-react"

const sections = [
  ["positioning", "Positioning"],
  ["logos", "Logo system"],
  ["colors", "Colors"],
  ["typography", "Typography"],
  ["voice", "Voice"],
  ["media", "Media & badges"],
] as const

const colors = [
  { name: "Internetily Blue", hex: "#0B84F3", rgb: "11, 132, 243", usage: "Primary actions and the lightning mark", text: "text-white" },
  { name: "Deep Network", hex: "#0B1220", rgb: "11, 18, 32", usage: "Dark surfaces and high-contrast media", text: "text-white" },
  { name: "Signal Cyan", hex: "#22D3EE", rgb: "34, 211, 238", usage: "Highlights, diagrams, and live states", text: "text-slate-950" },
  { name: "Clean White", hex: "#FFFFFF", rgb: "255, 255, 255", usage: "Primary light surface", text: "text-slate-950", border: true },
  { name: "Ink", hex: "#171717", rgb: "23, 23, 23", usage: "Primary text and logo wordmark", text: "text-white" },
  { name: "Slate", hex: "#64748B", rgb: "100, 116, 139", usage: "Supporting text and metadata", text: "text-white" },
]

const statuses = [
  { name: "Success / M-Pesa", hex: "#00A651", note: "Confirmed payments and healthy services" },
  { name: "Warning", hex: "#F59E0B", note: "Attention needed; service is still usable" },
  { name: "Critical", hex: "#DC2626", note: "Failures, destructive actions, or interruption" },
  { name: "Information", hex: "#2563EB", note: "Neutral guidance and active information" },
]

const typeScale = [
  { token: "Display", size: "56 / 64", weight: "700", sample: "Run your network clearly." },
  { token: "H1", size: "40 / 48", weight: "700", sample: "ISP operations in one place" },
  { token: "H2", size: "30 / 38", weight: "700", sample: "Automated subscriber billing" },
  { token: "H3", size: "22 / 30", weight: "650", sample: "Payment health" },
  { token: "Body", size: "16 / 26", weight: "400", sample: "See what is due, paid, connected, and waiting for action." },
  { token: "Caption", size: "13 / 18", weight: "600", sample: "LAST UPDATED 2 MINUTES AGO" },
]

function SectionHeading({ eyebrow, title, copy, inverse = false }: { eyebrow: string; title: string; copy: string; inverse?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0b84f3]">{eyebrow}</p>
      <h2 className={`font-[var(--font-outfit)] text-3xl font-bold sm:text-4xl ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`}>{title}</h2>
      <p className={`mt-4 text-base leading-7 ${inverse ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>{copy}</p>
    </div>
  )
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} download className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:border-[#0b84f3] hover:text-[#0871d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b84f3] dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <Download className="h-4 w-4" /> {label}
    </a>
  )
}

export function BrandGuideClient() {
  const [darkLogoPreview, setDarkLogoPreview] = useState(false)
  const [copied, setCopied] = useState("")

  async function copyColor(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    window.setTimeout(() => setCopied(""), 1400)
  }

  return (
    <main className="min-h-screen bg-white font-[var(--font-plus-jakarta-sans)] text-slate-950 dark:bg-[#080d17] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#080d17]/95">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-12 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b84f3]">
            <Image src="/internetily-logo-320.webp" alt="Internetily" width={160} height={50} className="h-8 w-auto dark:hidden" priority />
            <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={160} height={50} className="hidden h-8 w-auto dark:block" priority />
            <span className="hidden border-l border-slate-300 pl-3 text-sm font-semibold text-slate-500 sm:inline dark:border-slate-700 dark:text-slate-400">Brand guidelines</span>
          </Link>
          <a href="/internetily-brand-kit.zip" download className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#0b84f3] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0871d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b84f3] focus-visible:ring-offset-2">
            <FileArchive className="h-4 w-4" /> <span className="hidden sm:inline">Download brand kit</span><span className="sm:hidden">Brand kit</span>
          </a>
        </div>
        <nav aria-label="Brand guide sections" className="border-t border-slate-100 dark:border-slate-800">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {sections.map(([id, label]) => <a key={id} href={`#${id}`} className="min-h-10 shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">{label}</a>)}
          </div>
        </nav>
      </header>

      <section id="positioning" className="relative overflow-hidden border-b border-slate-200 bg-[#0b1220] text-white dark:border-slate-800">
        <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(#0b84f3_1px,transparent_1px),linear-gradient(90deg,#0b84f3_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-[#22d3ee]">Internetily brand system</p>
            <h1 className="max-w-4xl font-[var(--font-outfit)] text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">The operating system for modern ISPs and hotspot providers.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Internetily helps internet providers run billing, payments, subscribers, routers, support, and network operations with less friction.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/internetily-brand-kit.zip" download className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#0b84f3] px-5 py-3 font-bold text-white hover:bg-[#0871d1]"><Download className="h-5 w-5" /> Download brand kit</a>
              <a href="#logos" className="inline-flex min-h-12 items-center rounded-md border border-slate-600 px-5 py-3 font-bold text-white hover:border-slate-400 hover:bg-white/5">View logo rules</a>
            </div>
          </div>
          <aside className="self-end border-l-2 border-[#0b84f3] pl-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Our promise</p>
            <p className="mt-4 font-[var(--font-outfit)] text-2xl font-semibold leading-9">Make complex internet operations feel clear, dependable, and ready to scale.</p>
          </aside>
        </div>
        <div className="relative mx-auto grid max-w-7xl border-t border-white/10 sm:grid-cols-3">
          {[{ icon: ShieldCheck, title: "Reliable", copy: "Calm, accurate, and trustworthy in every operational moment." }, { icon: Layers3, title: "Scalable", copy: "Made for the first router, the next town, and the growing team." }, { icon: Gauge, title: "Modern", copy: "Fast interfaces, direct language, and automation that earns its place." }].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="border-b border-white/10 px-6 py-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-8">
              <Icon className="h-5 w-5 text-[#22d3ee]" />
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="logos" className="scroll-mt-28 border-b border-slate-200 py-20 dark:border-slate-800 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="01 / Logo system" title="One mark, chosen for contrast." copy="Use the full lockup when space allows. Use the icon only for favicons, app tiles, avatars, and compact product surfaces." />
            <div className="inline-flex w-fit rounded-md border border-slate-300 p-1 dark:border-slate-700" aria-label="Logo preview background">
              <button type="button" onClick={() => setDarkLogoPreview(false)} aria-pressed={!darkLogoPreview} className={`flex min-h-10 items-center gap-2 rounded px-3 text-sm font-bold ${!darkLogoPreview ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"}`}><Sun className="h-4 w-4" /> Light</button>
              <button type="button" onClick={() => setDarkLogoPreview(true)} aria-pressed={darkLogoPreview} className={`flex min-h-10 items-center gap-2 rounded px-3 text-sm font-bold ${darkLogoPreview ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"}`}><Moon className="h-4 w-4" /> Dark</button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className={`flex min-h-80 items-center justify-center rounded-lg border p-8 transition-colors ${darkLogoPreview ? "border-slate-700 bg-[#0b1220]" : "border-slate-200 bg-white"}`}>
              <Image src={darkLogoPreview ? "/internetily-white-logo-320.webp" : "/internetily-logo-320.webp"} alt={`Internetily logo for ${darkLogoPreview ? "dark" : "light"} backgrounds`} width={320} height={320} className="h-auto w-56 sm:w-64" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-7 dark:border-slate-700 dark:bg-slate-900"><Image src="/internetily-icon-512.png" alt="Internetily standalone icon" width={170} height={170} className="h-32 w-32 object-contain" /></div>
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white p-7 dark:border-slate-700"><Image src="/brand-kit/internetily-affiliate-lockup.svg" alt="Internetily Affiliate Program lockup" width={380} height={90} className="h-auto w-full" /></div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Standalone icon<br /><span className="text-slate-400">App tiles, favicon, compact UI</span></p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Affiliate lockup<br /><span className="text-slate-400">Approved partner and referral material</span></p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <DownloadLink href="/internetily_logo_2k.jpeg" label="High-resolution logo" />
            <DownloadLink href="/internetily-white-logo-320.webp" label="White logo" />
            <DownloadLink href="/internetily-icon-512.png" label="App icon" />
            <DownloadLink href="/brand-kit/internetily-affiliate-lockup.svg" label="Affiliate lockup" />
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold">Clearspace and minimum size</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Keep clear space equal to the width of the icon stem around every side of the lockup. Never let type, edges, or partner marks enter this area.</p>
              <div className="relative mt-6 flex min-h-56 items-center justify-center rounded-lg border border-dashed border-[#0b84f3] bg-[#0b84f3]/5 p-12">
                <span className="absolute left-3 top-3 rounded bg-[#0b84f3] px-2 py-1 text-xs font-bold text-white">1x clearspace</span>
                <Image src="/internetily-logo-320.webp" alt="Internetily logo clearspace example" width={240} height={240} className="h-auto w-48" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm"><p><strong>Digital</strong><br /><span className="text-slate-500">24 px minimum height</span></p><p><strong>Print</strong><br /><span className="text-slate-500">8 mm minimum height</span></p></div>
            </div>
            <div>
              <h3 className="text-xl font-bold">Do and don’t</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[{ ok: true, text: "Keep the original aspect ratio." }, { ok: true, text: "Choose the strongest contrast." }, { ok: true, text: "Use approved source files." }, { ok: false, text: "Do not stretch, skew, or rotate." }, { ok: false, text: "Do not recolor the mark." }, { ok: false, text: "Do not add shadows or effects." }].map((item) => (
                  <div key={item.text} className={`flex min-h-24 items-start gap-3 rounded-md border p-4 ${item.ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"}`}>
                    {item.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
                    <span className="text-sm font-semibold leading-6">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 border-l-4 border-[#0b84f3] bg-slate-50 p-6 dark:bg-slate-900">
            <h3 className="font-bold">Affiliate co-branding</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">Keep the affiliate lockup separate from your own brand mark with at least one icon-width of space. It identifies participation in the Internetily Affiliate Program; it must not imply employment, ownership, certification, or endorsement unless a written agreement explicitly grants that status.</p>
          </div>
        </div>
      </section>

      <section id="colors" className="scroll-mt-28 border-b border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-950 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="02 / Color architecture" title="Built for clarity across bright and dark surfaces." copy="Core colors carry the brand. Status colors carry meaning. Never substitute a brand accent for a payment or service state." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map((color) => (
              <button key={color.hex} type="button" onClick={() => copyColor(color.hex)} className={`group min-h-56 overflow-hidden rounded-lg border text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b84f3] ${color.border ? "border-slate-300" : "border-transparent"}`} style={{ backgroundColor: color.hex }} aria-label={`Copy ${color.name} ${color.hex}`}>
                <div className={`flex h-full min-h-56 flex-col justify-between p-5 ${color.text}`}>
                  <div className="flex items-start justify-between gap-4"><p className="font-bold">{color.name}</p>{copied === color.hex ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5 opacity-65 group-hover:opacity-100" />}</div>
                  <div><p className="font-mono text-lg font-bold">{color.hex}</p><p className="mt-1 font-mono text-xs opacity-75">RGB {color.rgb}</p><p className="mt-3 text-sm opacity-75">{color.usage}</p></div>
                </div>
              </button>
            ))}
          </div>
          <h3 className="mt-14 text-xl font-bold">Status colors</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {statuses.map((status) => <button key={status.hex} type="button" onClick={() => copyColor(status.hex)} className="flex min-h-28 items-start gap-4 rounded-md border border-slate-200 bg-white p-4 text-left hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"><span className="mt-1 h-10 w-10 shrink-0 rounded-md" style={{ backgroundColor: status.hex }} /><span><strong className="text-sm">{status.name}</strong><span className="mt-1 block font-mono text-xs text-slate-500">{status.hex}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{status.note}</span></span></button>)}
          </div>
        </div>
      </section>

      <section id="typography" className="scroll-mt-28 border-b border-slate-200 py-20 dark:border-slate-800 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="03 / Typography" title="Plus Jakarta Sans leads. Outfit makes the big moments." copy="Use Plus Jakarta Sans for product UI and everyday communication. Reserve Outfit for display headlines, campaign banners, and high-impact numeric metrics." />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-800 sm:p-8">
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Primary</p><h3 className="mt-1 text-2xl font-bold">Plus Jakarta Sans</h3></div><Type className="h-7 w-7 text-[#0b84f3]" /></div>
              <p className="mt-8 break-words text-5xl font-bold leading-tight sm:text-6xl">Aa Bb Cc<br />0123456789</p>
              <p className="mt-6 text-sm leading-6 text-slate-600 dark:text-slate-300">UI, navigation, body copy, forms, tables, labels, documentation, and microcopy.</p>
              <a href="https://fonts.google.com/specimen/Plus+Jakarta+Sans" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#0871d1]">Open font source <ExternalLink className="h-4 w-4" /></a>
            </div>
            <div className="rounded-lg border border-slate-200 p-6 font-[var(--font-outfit)] dark:border-slate-800 sm:p-8">
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Secondary</p><h3 className="mt-1 text-2xl font-bold">Outfit</h3></div><Type className="h-7 w-7 text-[#22d3ee]" /></div>
              <p className="mt-8 break-words text-5xl font-bold leading-tight sm:text-6xl">Aa Bb Cc<br />0123456789</p>
              <p className="mt-6 text-sm leading-6 text-slate-600 dark:text-slate-300">Hero headlines, campaign banners, feature launches, and large numeric metrics.</p>
              <a href="https://fonts.google.com/specimen/Outfit" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#0871d1]">Open font source <ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
          <div className="mt-10 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-4">Token</th><th className="p-4">Size / line height</th><th className="p-4">Weight</th><th className="p-4">Example</th></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{typeScale.map((row) => <tr key={row.token}><td className="p-4 text-sm font-bold">{row.token}</td><td className="p-4 font-mono text-sm text-slate-500">{row.size}px</td><td className="p-4 font-mono text-sm text-slate-500">{row.weight}</td><td className="p-4 text-base">{row.sample}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="voice" className="scroll-mt-28 border-b border-slate-200 bg-[#0b1220] py-20 text-white dark:border-slate-800 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading inverse eyebrow="04 / Voice" title="Direct, technical, and human." copy="Explain the real operational outcome. Use the language ISP teams already use, and make the next action obvious." />
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-700 bg-slate-700 md:grid-cols-3">
            {[{ title: "Direct", copy: "Say what happened, what it affects, and what the operator can do next." }, { title: "Technically accurate", copy: "Use specific network and payment terms without hiding behind jargon." }, { title: "Solution-oriented", copy: "Keep errors calm. Give users a path forward instead of blame." }].map((item) => <div key={item.title} className="bg-[#0b1220] p-6"><h3 className="text-lg font-bold text-[#22d3ee]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{item.copy}</p></div>)}
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div><h3 className="text-xl font-bold">Write this</h3><div className="mt-4 space-y-3">{["Payment confirmed. The customer is online.", "We could not reach the router. Check its connection and try again.", "Your subscription ends in 3 days. Renew now to keep service uninterrupted."].map((text) => <p key={text} className="border-l-2 border-emerald-400 bg-white/5 p-4 text-sm leading-6 text-slate-200">{text}</p>)}</div></div>
            <div><h3 className="text-xl font-bold">Avoid this</h3><div className="mt-4 space-y-3">{["Success! Everything is awesome!", "An unexpected exception occurred.", "Kindly be informed that your subscription shall expire imminently."].map((text) => <p key={text} className="border-l-2 border-red-400 bg-white/5 p-4 text-sm leading-6 text-slate-400">{text}</p>)}</div></div>
          </div>
          <div className="mt-12 overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="py-3 pr-6">Use</th><th className="py-3 pr-6">Not</th><th className="py-3">Context</th></tr></thead><tbody className="divide-y divide-slate-800">{[["Internetily", "internetily", "Formal brand reference"], ["M-Pesa STK Push", "Mpesa popup", "Payment request"], ["Captive portal", "Login splash thing", "Hotspot access"], ["TR-069 ACS", "TR069 server", "CPE management"], ["PPPoE session", "PPPOE connection", "Subscriber session"]].map(([use, avoid, context]) => <tr key={use}><td className="py-4 pr-6 font-bold">{use}</td><td className="py-4 pr-6 text-slate-400">{avoid}</td><td className="py-4 text-slate-400">{context}</td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section id="media" className="scroll-mt-28 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="05 / Media & badges" title="Useful assets, sized for the network they travel through." copy="Use lean, responsive media for captive portals and approved badges for partner-facing surfaces." />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex min-h-48 items-center justify-center rounded-md bg-slate-50 p-6 dark:bg-slate-950"><Image src="/brand-kit/powered-by-internetily.svg" alt="Powered by Internetily badge" width={440} height={112} className="h-auto max-w-full" /></div><div className="mt-4 flex items-center justify-between gap-4"><div><h3 className="font-bold">Powered by Internetily</h3><p className="mt-1 text-sm text-slate-500">For captive portals and customer-facing ISP pages.</p></div><DownloadLink href="/brand-kit/powered-by-internetily.svg" label="SVG" /></div></div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex min-h-48 items-center justify-center rounded-md bg-[#0b1220] p-6"><Image src="/brand-kit/internetily-verified-partner.svg" alt="Internetily Verified Partner badge" width={480} height={112} className="h-auto max-w-full" /></div><div className="mt-4 flex items-center justify-between gap-4"><div><h3 className="font-bold">Verified Partner</h3><p className="mt-1 text-sm text-slate-500">Use only where partner status has been approved.</p></div><DownloadLink href="/brand-kit/internetily-verified-partner.svg" label="SVG" /></div></div>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div><h3 className="flex items-center gap-2 text-xl font-bold"><Wifi className="h-5 w-5 text-[#0b84f3]" /> Captive portal media</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Optimize every asset before upload. A customer reaching a portal may have a slow or unstable connection.</p></div>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"><div className="grid grid-cols-[1.2fr_1fr_1fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 dark:bg-slate-900"><span>Asset</span><span>Dimensions</span><span>Maximum</span></div>{[["Desktop banner", "1600 × 900", "250 KB"], ["Mobile background", "1080 × 1350", "180 KB"], ["Login modal logo", "640 × 240", "80 KB"], ["Offer thumbnail", "800 × 600", "120 KB"]].map((row) => <div key={row[0]} className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-slate-200 px-4 py-4 text-sm dark:border-slate-800"><strong>{row[0]}</strong><span className="text-slate-500">{row[1]}</span><span className="text-slate-500">{row[2]}</span></div>)}</div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[{ icon: ImageIcon, title: "Prefer WebP", copy: "Use WebP for photographic media and PNG only when transparency is required." }, { icon: Gauge, title: "Design mobile-first", copy: "Keep faces, products, and important copy inside the central safe area." }, { icon: BadgeCheck, title: "Keep copy separate", copy: "Use live HTML text for offers and actions so it stays readable and accessible." }].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-lg border border-slate-200 p-5 dark:border-slate-800"><Icon className="h-5 w-5 text-[#0b84f3]" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div><p className="font-bold">Internetily brand guidelines</p><p className="mt-1 text-sm text-slate-500">For product, press, partner, affiliate, and customer-facing use.</p></div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold"><a href="/internetily-brand-kit.zip" download className="text-[#0871d1] hover:underline">Download brand kit</a><Link href="/affiliate" className="hover:underline">Affiliate program</Link><Link href="/contact" className="hover:underline">Contact</Link></div>
        </div>
      </footer>
    </main>
  )
}
