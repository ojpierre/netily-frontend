"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { BillingCalculator } from "@/components/BillingCalculator"
import { blogPosts } from "@/lib/blog-data"
import {
  ArrowRight,
  Zap,
  Check,
  ChevronDown,
  Sparkles,
  Router,
  FileText,
  Ghost,
  Send,
  Shield,
  Clock,
  Menu,
  X,
  Wifi,
  Users,
  TrendingUp,
  Activity,
  CircleDollarSign,
  BarChart3,
  Smartphone,
  Globe,
  Lock,
  MessageSquare,
  ShieldCheck,
  BanknoteIcon,
  CreditCard,
} from "lucide-react"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { submitLead } from "@/lib/api"
import { useGeo } from "@/hooks/use-geo"

// ─── Scroll-reveal wrapper ─────────────────────────────────────
// SSR-safe: content renders fully visible on server (Googlebot reads real HTML).
// After hydration the motion animation takes over.
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  // `mounted` tracks client-side hydration. useState(false) means SSR
  // always gets false → `initial` resolves to visible state.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <motion.div
      ref={ref}
      // Before hydration (SSR + first paint): render fully visible so
      // Googlebot gets real content at opacity:1 in the initial HTML.
      // After hydration: normal scroll-reveal behaviour.
      initial={mounted ? { opacity: 0, y: 40 } : false}
      animate={mounted ? (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }) : undefined}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Marquee component ─────────────────────────────────────────
function InfiniteMarquee() {
  const items = [
    {
      name: "M-Pesa STK Push",
      detail: "Collect payments instantly from subscriber phones",
      icon: Smartphone,
      accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    },
    {
      name: "MikroTik RouterOS",
      detail: "Provision, suspend, and restore users automatically",
      icon: Router,
      accent: "from-sky-500/20 to-sky-500/5 text-sky-300",
    },
    {
      name: "FreeRADIUS",
      detail: "Keep authentication and accounting in sync",
      icon: ShieldCheck,
      accent: "from-violet-500/20 to-violet-500/5 text-violet-300",
    },
    {
      name: "Payments",
      detail: "Support more payment collection flows when needed",
      icon: CreditCard,
      accent: "from-amber-500/20 to-amber-500/5 text-amber-300",
    },
    {
      name: "Customer Messaging",
      detail: "Trigger reminders, receipts, and support updates",
      icon: MessageSquare,
      accent: "from-rose-500/20 to-rose-500/5 text-rose-300",
    },
    {
      name: "Cloud Provisioning",
      detail: "Run a modern hosted billing stack without the guesswork",
      icon: Globe,
      accent: "from-blue-500/20 to-blue-500/5 text-blue-300",
    },
    {
      name: "Hotspot Billing",
      detail: "Handle vouchers, session control, and revenue sharing",
      icon: Wifi,
      accent: "from-cyan-500/20 to-cyan-500/5 text-cyan-300",
    },
    {
      name: "Auto-Invoicing",
      detail: "Generate recurring bills and collection nudges automatically",
      icon: FileText,
      accent: "from-slate-500/20 to-slate-500/5 text-slate-200",
    },
  ]
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-4 py-1"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <article
            key={i}
            className="flex w-[260px] shrink-0 items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          </article>
        ))}
      </motion.div>
    </div>
  )
}

function PaymentsMarquee() {
  const logos = [
    { name: "M-Pesa", src: "/payments-logos/mpesa_logo.png", category: "Mobile money" },
    { name: "Airtel Money", src: "/payments-logos/airtel_money-logo.webp", category: "Mobile money" },
    { name: "Telkom Kash", src: "/payments-logos/telkom-kash.png", category: "Mobile money" },
    { name: "Co-op Bank", src: "/payments-logos/Coopbanklogo.jpg", category: "Banking" },
    { name: "Equity Bank", src: "/payments-logos/Equity_bank_logo.png", category: "Banking" },
    { name: "I&M Bank", src: "/payments-logos/Imbank-logo.webp", category: "Banking" },
    { name: "Kingdom Bank", src: "/payments-logos/Kingdom_bank_logo.png", category: "Banking" },
    { name: "National Bank", src: "/payments-logos/National-bank-logo.jpg", category: "Banking" },
    { name: "SBM Bank", src: "/payments-logos/SBM_bank_logo.png", category: "Banking" },
    { name: "Stanbic Bank", src: "/payments-logos/Stanbic-bank-logo.jpg", category: "Banking" },
    { name: "Standard Chartered", src: "/payments-logos/standard_chartered_logo.png", category: "Banking" },
  ]

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-4 py-1"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={`${logo.name}-${index}`}
            className="flex h-24 w-[220px] shrink-0 items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90"
          >
            <div className="relative flex h-12 w-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
              <Image
                src={logo.src}
                alt={`${logo.name} payment platform logo used in Netily billing workflows`}
                fill
                sizes="96px"
                className="object-contain p-2"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{logo.name}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{logo.category}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

const LEAD_SOURCE_OPTIONS = [
  "Google Search",
  "TikTok",
  "Facebook / Instagram",
  "LinkedIn",
  "WhatsApp group",
  "YouTube",
  "Referral from another ISP",
  "Event or community meetup",
  "Existing Netily customer",
  "Other",
]

function OperationsShowcaseSection() {
  const signals = [
    {
      icon: CircleDollarSign,
      title: "Payment to provisioning",
      body: "Collect, confirm, and reconnect without manual chasing.",
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-300",
    },
    {
      icon: Router,
      title: "MikroTik-aware workflows",
      body: "Built for PPPoE, hotspot, and subscriber state changes.",
      accent: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-300",
    },
    {
      icon: Activity,
      title: "Daily operational clarity",
      body: "See collections, uptime, and support movement at a glance.",
      accent: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300",
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Inside the workflow</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              One operating surface for payment, network, and support
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              From payment confirmation to subscriber state changes and support follow-up, the important operational signals stay visible in one place.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {signals.map((signal, index) => (
            <Reveal key={signal.title} delay={index * 0.08}>
              <article className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${signal.accent}`}>
                    <signal.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{signal.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{signal.body}</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.18}>
          <div className="mt-10">
            <DashboardMockup />
          </div>
        </Reveal>

        <div className="sr-only">
          Support desk setup for internet service operations. Live support visibility. Tickets, follow-ups, outages, and customer callbacks stay visible without leaving the operating dashboard.
          Network infrastructure and wireless internet equipment. Network health snapshot. Routers online 89 / 92. Provisioning, session enforcement, and cash collection stay aligned across the live network.
          admin.netily.co.ke/dashboard. Netily. Dashboard. Subscribers. Billing. Network. Routers. Monitoring.
          Active Subscribers 1,247 plus 12 percent. Monthly Revenue KES 2.4M plus 8.3 percent. Online Routers 89 out of 92, 96.7 percent. M-Pesa Today KES 84K plus 23 percent.
          Revenue Overview last 7 days Monday Tuesday Wednesday Thursday Friday Saturday Sunday.
          Recent Payments John Kamau KES 2,500. Grace Wanjiku KES 1,800. David Omondi KES 3,200. Faith Njeri KES 1,500.
        </div>
      </div>
    </section>
  )
}

function OperatingJourneySection({ scrollTo }: { scrollTo: (id: string) => void }) {
  const stages = [
    {
      icon: CircleDollarSign,
      title: "Collect payment without chasing",
      body: "STK Push, reminders, and billing events are tied closely to the subscriber lifecycle so collections don’t live in a separate spreadsheet reality.",
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-300",
    },
    {
      icon: Router,
      title: "Apply service changes automatically",
      body: "When payment status changes, Netily can drive the operational action your team would otherwise do manually in MikroTik, PPPoE, hotspot, and support flows.",
      accent: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-300",
    },
    {
      icon: BarChart3,
      title: "Run the day from one control surface",
      body: "Revenue, support, uptime, subscribers, and payment movement stay visible together so owners and operations teams can act faster.",
      accent: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300",
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">How Netily fits the work</p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                A better option for growing ISPs
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Netily is not just billing software. It is the operational layer between cash collection, subscriber access, and daily ISP decision-making.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">What teams usually replace with Netily</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Disconnected billing sheets",
                  "Manual reconnection workflows",
                  "Scattered payment follow-up",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <Reveal key={stage.title} delay={index * 0.08}>
              <article className="h-full rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stage.accent}`}>
                  <stage.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{stage.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{stage.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 rounded-[32px] border border-slate-200/80 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl shadow-slate-900/10 dark:border-slate-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Designed for momentum</p>
                <h3 className="mt-3 text-2xl md:text-3xl font-bold">You should be able to understand the value in one pass</h3>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-300">
                  We’ve tightened the story around operations, pricing, integrations, and contact so prospects can quickly see whether Netily fits their ISP without digging through a wall of sections.
                </p>
              </div>
              <button
                onClick={() => scrollTo("pricing")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                Jump to pricing
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── FAQ Accordion ──────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-lg font-semibold text-slate-900 dark:text-white pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  )
}

// ─── Animated counter ──────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1800
    const step = Math.ceil(value / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Dashboard mockup (hero visual) ───────────────────────────
function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-12 max-w-6xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl opacity-60" />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
          <div className="grid gap-4 sm:grid-cols-[168px_1fr] sm:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={HERO_SUPPORT_PHOTO}
                alt="Support desk setup for internet service operations"
                fill
                sizes="(min-width: 640px) 168px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Live support visibility</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Tickets, follow-ups, outages, and customer callbacks stay visible without leaving the operating dashboard.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-slate-950/92 p-4 text-white shadow-2xl shadow-blue-950/20 backdrop-blur dark:border-slate-700">
          <div className="grid gap-4 sm:grid-cols-[152px_1fr] sm:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={HERO_NETWORK_PHOTO}
                alt="Network infrastructure and wireless internet equipment"
                fill
                sizes="(min-width: 640px) 152px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Network health snapshot</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Routers online</span>
                  <span className="font-semibold text-emerald-300">89 / 92</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[97%] rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" />
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Provisioning, session enforcement, and cash collection stay aligned across the live network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-400 dark:text-slate-500 min-w-0 sm:min-w-[260px] max-w-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              admin.netily.co.ke/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col w-52 bg-slate-900 text-white p-4 min-h-[400px]">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">Netily</span>
            </div>
            {[
              { icon: BarChart3, label: "Dashboard", active: true },
              { icon: Users, label: "Subscribers" },
              { icon: CircleDollarSign, label: "Billing" },
              { icon: Wifi, label: "Network" },
              { icon: Router, label: "Routers" },
              { icon: Activity, label: "Monitoring" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs mb-1 ${item.active ? "bg-blue-600/20 text-blue-400" : "text-slate-400"}`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-[400px]">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Active Subscribers", value: "1,247", change: "+12%", color: "text-emerald-600", icon: Users },
                { label: "Monthly Revenue", value: "KES 2.4M", change: "+8.3%", color: "text-emerald-600", icon: TrendingUp },
                { label: "Online Routers", value: "89/92", change: "96.7%", color: "text-blue-600", icon: Router },
                { label: "M-Pesa Today", value: "KES 84K", change: "+23%", color: "text-emerald-600", icon: Smartphone },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className={`text-[10px] font-medium ${stat.color} mt-0.5`}>{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Chart + recent payments */}
            <div className="grid md:grid-cols-5 gap-3">
              {/* Chart placeholder */}
              <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Revenue Overview</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium">Last 7 days</span>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-2 h-28">
                  {[45, 62, 38, 75, 58, 90, 82].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${h}%` }} />
                      <span className="text-[8px] text-slate-400">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Recent payments */}
              <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 p-4">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">Recent Payments</span>
                <div className="space-y-2.5">
                  {[
                    { name: "John Kamau", amount: "KES 2,500", time: "2m ago" },
                    { name: "Grace Wanjiku", amount: "KES 1,800", time: "5m ago" },
                    { name: "David Omondi", amount: "KES 3,200", time: "12m ago" },
                    { name: "Faith Njeri", amount: "KES 1,500", time: "18m ago" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{p.name}</p>
                          <p className="text-[9px] text-slate-400">{p.time}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export function LandingPage() {
  const [email, setEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", company: "", lead_source: "", message: "" })
  const [leadFormErrors, setLeadFormErrors] = useState<{ name?: string; email?: string }>({})
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  // Enterprise inline lead form (pricing card)
  const [entForm, setEntForm] = useState({ name: "", email: "", company: "", subscribers: "", lead_source: "" })
  const [entErrors, setEntErrors] = useState<{ name?: string; email?: string }>({})
  const [entSubmitting, setEntSubmitting] = useState(false)
  const [entSubmitted, setEntSubmitted] = useState(false)

  // Geolocation — auto-detects East African country for local currency display
  const { geo, fmt, setCountry, GEO_TABLE } = useGeo()
  const [countrySwitcherOpen, setCountrySwitcherOpen] = useState(false)

  // Ordered list of supported countries for the switcher
  const SUPPORTED_COUNTRIES = ["KE", "UG", "TZ", "RW", "ET", "BI", "SS"].filter(
    (c) => !!GEO_TABLE[c],
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Hidden SEO anchor — read by crawlers, invisible to users */}
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
      {/* ━━━ 1. FLOATING HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8"
      >
        <div
          className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
            scrolled
              ? "border-slate-200/80 bg-white/88 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/82"
              : "border-white/60 bg-white/72 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-950/72"
          }`}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Netily</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {(["Features", "Pricing", "Calculator", "FAQs"] as const).map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(label.toLowerCase()) }}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Blog
              </Link>
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Country switcher */}
              <div className="relative">
                <button
                  onClick={() => setCountrySwitcherOpen(!countrySwitcherOpen)}
                  aria-label="Switch country / currency"
                  aria-expanded={countrySwitcherOpen}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors select-none"
                >
                  <span className="text-base leading-none">{geo.flag}</span>
                  <span className="text-xs font-semibold tracking-wide">{geo.currency}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${countrySwitcherOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {countrySwitcherOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCountrySwitcherOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Show prices in
                        </p>
                      </div>
                      {SUPPORTED_COUNTRIES.map((code) => {
                        const g = GEO_TABLE[code]!
                        const isActive = geo.countryCode === code
                        return (
                          <button
                            key={code}
                            onClick={() => { setCountry(code); setCountrySwitcherOpen(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="text-base">{g.flag}</span>
                            <span className="flex-1 font-medium">{g.countryName}</span>
                            <span className={`text-xs font-semibold ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                              {g.currency}
                            </span>
                            {isActive && (
                              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <ThemeToggle />
              <Link
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollTo("contact") }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="md:hidden flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -mr-2 text-slate-600 dark:text-slate-300"
              >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl rounded-b-2xl border-x border-b border-slate-200 bg-white/95 px-4 pb-4 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
          >
            <div className="flex flex-col gap-1 pt-2">
              {(["Features", "Pricing", "Calculator", "FAQs"] as const).map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(label.toLowerCase()) }}
                  className="py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/blog"
                className="py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
              >
                Blog
              </Link>
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              {/* Mobile country switcher */}
              <div className="py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  Show prices in
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUPPORTED_COUNTRIES.map((code) => {
                    const g = GEO_TABLE[code]!
                    const isActive = geo.countryCode === code
                    return (
                      <button
                        key={code}
                        onClick={() => { setCountry(code); setMobileMenuOpen(false) }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                            : "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span>{g.flag}</span>
                        <span className="font-medium">{g.countryName}</span>
                        {isActive && (
                          <svg className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollTo("contact") }}
                className="mt-1 w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-lg text-center"
              >
                Get in Touch
              </a>
            </div>
          </motion.div>
        )}
      </header>

      {/* ━━━ 2. HERO SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main id="main-content">
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen items-end px-4 pb-14 pt-28 sm:px-6 md:pb-20 md:pt-32 lg:px-8 overflow-hidden"
      >
        <div className="absolute inset-0 -z-20">
          <Image
            src={HERO_PHOTO}
            alt="Team using laptops to manage an internet service provider platform"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-[0.72]"
          />
          <div className="absolute inset-0 bg-slate-950/30 dark:bg-slate-950/44" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-blue-700/80 via-blue-600/35 to-transparent dark:from-blue-800/70 dark:via-blue-700/30" />
        </div>
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[128px] opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[128px] opacity-50" />
        </div>

        <div className="mx-auto w-full max-w-6xl">
          {/* Badge */}
          {/*<Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Trusted by 100+ ISPs across Kenya &amp; East Africa</span>
              <span className="text-lg leading-none">✨</span>
            </div>
          </Reveal>*/}

          <div className="max-w-3xl text-left">
            {/* H1 — Search-intent targeted */}
            <Reveal delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.02] text-white mb-3">
                ISP Billing Software
                <br />
                <span className="text-blue-100 dark:text-blue-200">
                  for Kenya &amp; East Africa
                </span>
              </h1>
            </Reveal>

            {/* Brand tagline below H1 */}
            <Reveal delay={0.15}>
              <p className="text-2xl sm:text-3xl font-bold text-white/88 mb-4 tracking-tight">
                Run your ISP while you sleep.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="max-w-xl text-base md:text-lg leading-relaxed text-white/80 dark:text-white/78">
                Automate billing, provisioning, and subscriber operations from one platform.
              </p>
            </Reveal>

            <div className="sr-only">
              Netily is the ISP billing software and ISP management system built for Kenya and East Africa, automating M-Pesa STK Push payments, MikroTik PPPoE provisioning, RADIUS authentication, hotspot billing, and customer self-service so Kenyan ISPs can stop chasing payments and start growing.
              M-Pesa billing automation. MikroTik plus PPPoE workflows. Hotspot and subscriber operations.
              Free 14-day trial. No credit card required. Built for East African ISP operations.
            </div>

            {/* CTA Buttons */}
            <Reveal delay={0.26}>
              <div id="hero-cta" className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); scrollTo("contact") }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-500"
                >
                  Start Free 14-Day Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  onClick={(e) => { e.preventDefault(); scrollTo("features") }}
                  className="inline-flex items-center gap-2 px-1 py-4 text-lg font-medium text-white/88 transition-colors hover:text-white"
                >
                  See features
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <p className="mt-3 text-xs text-white/72">No credit card required • 14 days free • Cancel anytime</p>
            </Reveal>
          </div>

          <div className="sr-only">
            Payment to provisioning. Collect, confirm, and reconnect without manual chasing.
            MikroTik-aware workflows. Built for PPPoE, hotspot, and subscriber state changes.
            Daily operational clarity. See collections, uptime, and support movement at a glance.
          </div>
        </div>
      </motion.section>

      {/* ━━━ 3. TRUST MARQUEE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-slate-200 dark:border-slate-800 py-10 bg-slate-50/60 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
              Natively integrated with
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Payments, provisioning, and subscriber ops in one workflow
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Netily does more than connect logos. Each integration powers a real step in how Kenyan ISPs bill, authenticate, notify, and support subscribers.
            </p>
          </div>
          <InfiniteMarquee />
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col items-center text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
              Payments and banking rails
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built around the payment platforms and banks Kenyan ISPs work with daily
            </h2>
            <p className="mt-2 max-w-3xl text-sm md:text-base text-slate-500 dark:text-slate-400">
              From M-Pesa collections to bank-aligned billing operations, Netily is designed for the financial channels your subscribers already trust.
            </p>
          </div>
          <PaymentsMarquee />
        </div>
      </section>

      {/* ━━━ 3b. SOCIAL-PROOF STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Operational proof</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Numbers that map to what an ISP owner actually cares about
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                value: 500,
                suffix: "+",
                label: "ISPs onboarded",
                icon: Wifi,
                eyebrow: "Regional footprint",
                detail: "Built for fiber operators, hotspot providers, and fast-growing rural WISPs.",
              },
              {
                value: 50000,
                suffix: "+",
                label: "Active subscribers",
                icon: Users,
                eyebrow: "Subscriber scale",
                detail: "Customer records, billing status, and access changes stay in one operating system.",
              },
              {
                value: 100,
                suffix: "%",
                label: "Daily M-Pesa payout",
                icon: CircleDollarSign,
                eyebrow: "Cash collection flow",
                detail: "Keep payment confirmation close to service activation and collection follow-up.",
              },
              {
                value: 99,
                suffix: ".9%",
                label: "Platform uptime",
                icon: Activity,
                eyebrow: "Reliability target",
                detail: "The platform is designed to support day-to-day operations without becoming the bottleneck.",
              },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="group h-full rounded-[28px] border border-slate-200/80 bg-white/95 p-6 text-left shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {stat.eyebrow}
                    </span>
                  </div>
                  <p className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{stat.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{stat.detail}</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400"
                      style={{ width: `${Math.min(stat.value, 100)}%` }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <OperationsShowcaseSection />

      <OperatingJourneySection scrollTo={scrollTo} />

      {/* ━━━ 3c. USE CASE BLOCK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                Built for every type of ISP
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                One platform, shaped around the different ways local ISPs grow
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Fiber ISPs",
                desc: "Automate PPPoE subscriptions, billing cycles, and M-Pesa collections for fiber broadband networks.",
                icon: Wifi,
                color: "blue",
                href: "/solutions/isp-billing-software-kenya",
                span: "lg:col-span-2",
              },
              {
                title: "Hotspot Providers",
                desc: "Branded captive portals, M-Pesa micropayments, voucher management, and session control for Wi-Fi hotspots.",
                icon: Globe,
                color: "violet",
                href: "/solutions/hotspot-billing-software-kenya",
                span: "",
              },
              {
                title: "MikroTik PPPoE Networks",
                desc: "Zero-touch MikroTik provisioning via API. Create, suspend, and resume PPPoE users automatically on payment.",
                icon: Router,
                color: "emerald",
                href: "/solutions/mikrotik-billing-software",
                span: "",
              },
              {
                title: "WISPs & Rural ISPs",
                desc: "Affordable metered billing that scales with your subscriber count. Pay only for what you use.",
                icon: TrendingUp,
                color: "amber",
                href: "/solutions/mpesa-isp-billing",
                span: "lg:col-span-2",
              },
            ].map((item, i) => {
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
                violet: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
                emerald: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
                amber: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
              }
              return (
                <Reveal key={item.title} delay={i * 0.1}>
                  <div className={`rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-full hover:shadow-md transition-shadow ${item.span}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[item.color]}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white mb-2 text-base">{item.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    <Link
                      href={item.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400"
                    >
                      Explore use case
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <div className="sr-only">
            Built for fiber ISPs, hotspot providers, MikroTik PPPoE networks, and WISPs in Kenya. Netily supports branded captive portals, voucher management, M-Pesa micropayments, PPPoE provisioning, and affordable metered billing for rural internet operators.
          </div>
        </div>
      </section>

      {/* ━━━ 4. FEATURE BENTO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Why ISPs choose Netily
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                The long section is now compressed into the few capabilities that shape the operating experience most.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Instant collections to reconnection",
                body: "STK Push, payment confirmation, and service restoration stay close together instead of being spread across tools and manual checklists.",
                icon: Smartphone,
                tone: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white xl:col-span-2 border border-blue-400/30 ring-1 ring-white/10",
                dark: true,
              },
              {
                title: "Plug-and-play router operations",
                body: "Bring MikroTik, PPPoE, hotspot, and subscriber lifecycle work into one repeatable workflow.",
                icon: Router,
                tone: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              },
              {
                title: "Customer self-service",
                body: "Let subscribers renew, pay, view invoices, raise tickets, and check usage without calling your team first.",
                icon: Users,
                tone: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              },
              {
                title: "Invoices, reminders, and messaging",
                body: "Auto-invoicing and inbuilt communications reduce the repetitive admin that usually sits between billing and support.",
                icon: MessageSquare,
                tone: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              },
              {
                title: "Secure, compliant operations",
                body: "Encrypted transactions, access controls, OTP-sensitive actions, and audit visibility support trustworthy day-to-day handling of subscriber data.",
                icon: ShieldCheck,
                tone: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              },
              {
                title: "Growth and promotion tools",
                body: "Captive portal branding, promotions, and upgrade nudges help turn subscriber attention into retention and expansion.",
                icon: TrendingUp,
                tone: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08}>
                <article className={`rounded-[28px] p-6 shadow-sm shadow-slate-900/5 ${item.tone}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.dark ? "bg-white/18 text-white shadow-lg shadow-blue-950/25" : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {item.dark && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                          Real-time flow
                        </span>
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                          Payment-aware
                        </span>
                      </div>
                    )}
                  </div>
                  <p className={`mt-5 text-xl font-semibold ${item.dark ? "text-white" : "text-slate-900 dark:text-white"}`}>{item.title}</p>
                  <p className={`mt-3 text-sm leading-relaxed ${item.dark ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>{item.body}</p>
                  {item.dark && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "STK Push", value: "Triggered" },
                        { label: "Payment", value: "Confirmed" },
                        { label: "Service", value: "Restored" },
                      ].map((step) => (
                        <div key={step.label} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-100/70">{step.label}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{step.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </Reveal>
            ))}
          </div>

          <div className="sr-only">
            Netily supports instant M-Pesa STK Push workflows, router provisioning, auto-invoicing, ghost record awareness, custom captive portals, secure payments, inbuilt SMS, Kenya Data Protection Act aligned handling, real-time payments, a customer self-service portal, hotspot ad campaigns, targeted promotions, referral rewards, loyalty tools, and plan upgrade nudges.
            Customer self-service includes renewals and top-ups via M-Pesa, invoice and receipt downloads, support ticket submission, usage history, PPPoE password reset, and mobile-first access.
            Ads and promotions include captive portal banner ads, targeted SMS campaigns, referral rewards, loyalty campaigns, analytics for impressions, clicks, and conversions, and scheduled expiry-aware campaign management.
          </div>
        </div>
      </section>

      {/* ━━━ 5. PRICING SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
                How it works
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                From sign-up to autopilot in 3 steps
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Connect your MikroTik",
                desc: "Enter your router API credentials. Netily auto-discovers PPPoE, Hotspot, and DHCP profiles in seconds.",
                visual: (
                  <div className="bg-slate-900 rounded-lg p-3 text-[10px] font-mono mt-4">
                    <p className="text-emerald-400">✓ Connected to 192.168.88.1</p>
                    <p className="text-blue-400">  Discovering profiles...</p>
                    <p className="text-slate-400">  Found: PPPoE-Server (45 users)</p>
                    <p className="text-slate-400">  Found: Hotspot-1 (120 users)</p>
                    <p className="text-emerald-400">✓ Sync complete</p>
                  </div>
                ),
              },
              {
                step: "02",
                title: "Connect M-Pesa Payments",
                desc: "Enter your Till or Paybill number, and STK Push goes live in under 60 seconds. Payments flow straight to your account.",
                visual: (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-950 flex items-center justify-center"><Check className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">M-Pesa channel linked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-950 flex items-center justify-center"><Check className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">STK Push enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-950 flex items-center justify-center"><Check className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Auto-settlement ON</span>
                    </div>
                  </div>
                ),
              },
              {
                step: "03",
                title: "Go live — sit back",
                desc: "Subscribers pay, internet activates, invoices send, and revenue settles to your bank. Automatically.",
                visual: (
                  <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Today&apos;s Settlement</span>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">KES 142,350</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">Settled to KCB ****4521 at 6:00 AM</p>
                  </div>
                ),
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.15}>
                <div className="relative">
                  <span className="text-5xl font-black text-slate-100 dark:text-slate-800">{item.step}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-2">{item.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  {item.visual}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 6. PRICING SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Stop paying for scaling taxes.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Honest pricing that grows with you. No surprises, no contracts.
              </p>
            </div>
          </Reveal>

          {/* ── Geo currency banner ── */}
          {geo.countryCode !== "KE" && (
            <div className="flex items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                {geo.flag} Showing estimated prices in <strong>{geo.currency}</strong> for {geo.countryName}.
                {" "}Billing is processed in KES.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-blue-500 dark:text-blue-400 text-xs">Switch:</span>
                {Object.values(GEO_TABLE)
                  .filter((g) => ["KE", "UG", "TZ", "RW"].includes(g.countryCode))
                  .map((g) => (
                    <button
                      key={g.countryCode}
                      onClick={() => setCountry(g.countryCode)}
                      className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${
                        geo.countryCode === g.countryCode
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                      }`}
                    >
                      {g.flag} {g.currency}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Metered — links to calculator */}
            <Reveal>
              <div className="h-full rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950 border border-blue-200 dark:border-blue-800 p-8 md:p-10 shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                    <Clock className="w-3.5 h-3.5" />
                    Pay As You Grow
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Metered</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Perfect for growing ISPs who want to keep costs lean.</p>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-extrabold">{fmt(500)}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">/mo base</span>
                    </div>
                    {geo.rateFromKES !== 1 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">≈ KSh 500/mo · estimated in {geo.currency}</p>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      + {fmt(20)} per PPPoE user · 3% hotspot share
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      `Free ${geo.paymentCopy} integration`,
                      "MikroTik auto-provisioning",
                      "Unlimited routers",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#calculator"
                  onClick={(e) => { e.preventDefault(); scrollTo("calculator") }}
                  className="w-full py-3.5 rounded-xl border-2 border-blue-300 dark:border-blue-700 font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-center block"
                >
                  Calculate Your Cost &darr;
                </a>
              </div>
            </Reveal>

            {/* Enterprise & Custom — replaces old flat-tier grid */}
            <Reveal delay={0.15}>
              <div className="h-full rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-700/50 p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6 w-fit">
                    <Shield className="w-3.5 h-3.5" />
                    Enterprise &amp; Custom
                  </div>
                  <h3 className="text-2xl font-bold mb-1 text-white">Scale Without Limits</h3>
                  <p className="text-slate-400 mb-6 text-sm">White-label, dedicated infrastructure, SLA guarantee, and a pricing model built around your ISP&apos;s actual shape.</p>

                  <ul className="space-y-2.5 mb-6">
                    {[
                      "Everything in Metered, included",
                      "Full white-label: your logo, your domain",
                      "Dedicated account manager",
                      "99.9% uptime SLA",
                      "Custom {payment} integrations".replace("{payment}", geo.paymentCopy),
                      "Priority 24/7 phone support",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Inline contact form */}
                  <div className="mt-auto">
                    {entSubmitted ? (
                      <div className="rounded-xl bg-emerald-900/40 border border-emerald-700/50 p-5 text-center">
                        <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <p className="text-emerald-300 font-semibold text-sm">Request received!</p>
                        <p className="text-slate-400 text-xs mt-1">Our team will reach you within 24 hours.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Get a custom quote — no obligation</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Your name *"
                              value={entForm.name}
                              onChange={(e) => { setEntForm({ ...entForm, name: e.target.value }); if (entErrors.name) setEntErrors((p) => ({ ...p, name: undefined })) }}
                              className={`w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${ entErrors.name ? "border-red-500" : "border-slate-600" }`}
                            />
                            {entErrors.name && <p className="text-xs text-red-400 mt-1">{entErrors.name}</p>}
                          </div>
                          <div>
                            <input
                              type="email"
                              placeholder="Work email *"
                              value={entForm.email}
                              onChange={(e) => { setEntForm({ ...entForm, email: e.target.value }); if (entErrors.email) setEntErrors((p) => ({ ...p, email: undefined })) }}
                              className={`w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${ entErrors.email ? "border-red-500" : "border-slate-600" }`}
                            />
                            {entErrors.email && <p className="text-xs text-red-400 mt-1">{entErrors.email}</p>}
                          </div>
                          <input
                            type="text"
                            placeholder="Company / ISP name"
                            value={entForm.company}
                            onChange={(e) => setEntForm({ ...entForm, company: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            placeholder="Est. subscribers"
                            min="0"
                            value={entForm.subscribers}
                            onChange={(e) => setEntForm({ ...entForm, subscribers: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={entForm.lead_source}
                            onChange={(e) => setEntForm({ ...entForm, lead_source: e.target.value })}
                            className="col-span-2 h-10 rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Where did you hear about us?</option>
                            {LEAD_SOURCE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          disabled={entSubmitting}
                          onClick={async () => {
                            // Validate
                            const errs: { name?: string; email?: string } = {}
                            if (!entForm.name.trim()) errs.name = "Required"
                            if (!entForm.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(entForm.email)) errs.email = "Valid email required"
                            if (Object.keys(errs).length) { setEntErrors(errs); return }
                            setEntSubmitting(true)
                            try {
                              await submitLead({
                                name: entForm.name.trim(),
                                email: entForm.email.trim(),
                                phone: "",
                                company: entForm.company.trim(),
                                lead_source: entForm.lead_source,
                                message: `Enterprise enquiry from ${geo.countryName}. Est. subscribers: ${entForm.subscribers || "not specified"}.`,
                              })
                              setEntSubmitted(true)
                            } catch {
                              // silently succeed — don't block the UX on API errors
                              setEntSubmitted(true)
                            } finally {
                              setEntSubmitting(false)
                            }
                          }}
                          className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-semibold text-white text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          {entSubmitting ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Request Enterprise Quote
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Callout box 
          <Reveal delay={0.2}>
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white text-center md:text-left md:flex md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">The 95% Promise</h3>
                <p className="text-blue-100 leading-relaxed max-w-2xl">
                  We handle the payment gateways, take a flat 5% transaction fee, and auto-settle the rest
                  to your B2C/Bank daily. You wake up to money in your account — every morning.
                </p>
              </div>
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollTo("contact") }}
                className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
          */}
        </div>
      </section>

      {/* ━━━ 6b. BILLING CALCULATOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <BillingCalculator
        geo={geo}
        onGetStarted={() => scrollTo("contact")}
        onContactSales={() => {
          setLeadForm((prev) => ({
            ...prev,
            message: "Hi, I'm interested in the Enterprise / Custom plan. Please send me a quote.",
          }))
          scrollTo("contact")
        }}
      />

      {/* ━━━ 5b. FAQs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="faqs" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Frequently asked questions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Everything you need to know about Netily.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              {[
                {
                  q: "How long does setup take?",
                  a: "Most ISPs are fully operational on Netily within 24 hours. We handle MikroTik integration, M-Pesa STK Push configuration, and RADIUS setup during your onboarding call.",
                },
                {
                  q: "Do I need to change my MikroTik configuration?",
                  a: "Nope. Our cloud controller connects to your existing MikroTik routers via API. We configure PPPoE/Hotspot profiles remotely — zero downtime.",
                },
                {
                  q: "How secure is my data on Netily?",
                  a: "Very. All customer data is encrypted at rest and in transit. We use OTP-verified access to sensitive pages, enforce role-based permissions, and maintain full audit trails. We're fully compliant with the Kenya Data Protection Act.",
                },
                {
                  q: "What happens if a customer doesn't pay?",
                  a: "Netily automatically suspends their PPPoE/Hotspot session when their subscription expires. When they pay again, access is restored instantly — no manual intervention.",
                },
                {
                  q: "Is there a contract or commitment?",
                  a: "No contracts. Month-to-month billing. You can cancel anytime from your dashboard. We believe you should stay because you love the product, not because you're locked in.",
                },
                {
                  q: "Can I white-label the customer portal?",
                  a: "Yes! On Pro and Enterprise tiers, you get full white-label support — your logo, your domain, your brand. Your customers never see the Netily name.",
                },
              ].map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ BLOG SNIPPETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                  From the Blog
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Guides for Kenyan ISP Owners
                </h2>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                  In-depth resources on ISP billing software, MikroTik automation, and growing your ISP business.
                </p>
              </div>
              <Link
                href="/blog"
                className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {blogPosts.map((post, i) => {
              const gradients: Record<string, string> = {
                blue: "from-blue-600 via-indigo-600 to-purple-700",
                emerald: "from-emerald-500 via-teal-600 to-cyan-700",
                orange: "from-orange-500 via-rose-500 to-pink-600",
                purple: "from-purple-600 via-violet-600 to-indigo-700",
              }
              const badgeColors: Record<string, string> = {
                blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
                purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
              }
              const gradient = gradients[post.categoryColor] ?? gradients.blue
              const badge = badgeColors[post.categoryColor] ?? badgeColors.blue
              return (
                <Reveal key={post.slug} delay={i * 0.1}>
                  <article className="group flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden flex items-end p-5`}>
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover opacity-70 transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-slate-900/10" />
                      <span className="relative text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                        {post.category}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime} min read</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1 mb-5">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${post.author.avatarBg} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {post.author.initials}
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{post.author.name}</span>
                        </div>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
                        >
                          Read
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━ CONTACT / INQUIRY FORM ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Interested in Netily? Have a question? Drop us a message and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {leadSubmitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">Message Sent!</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-6">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <a
                  href="https://chat.whatsapp.com/GDBSxnHgcU0Ly7cc2qEjnC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Join our WhatsApp Community
                </a>
                <p className="text-xs text-emerald-500 dark:text-emerald-600 mt-3">Optional — stay updated with tips, announcements &amp; support</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] max-w-5xl mx-auto">
                <div className="rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Talk to Netily</p>
                  <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Choose the clearest next step</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Use the form for demos, pricing questions, migrations, or operational advice. We’ve kept the content SEO-rich, but the contact area should feel simpler and more directed.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      "Book a walkthrough for your ISP workflow",
                      "Ask about M-Pesa, hotspot, or MikroTik automation",
                      "Tell us how you heard about Netily so we can track channels better",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] p-6 md:p-8 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={leadForm.name}
                        onChange={(e) => {
                          setLeadForm({ ...leadForm, name: e.target.value })
                          if (leadFormErrors.name) setLeadFormErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${leadFormErrors.name ? "border-red-400" : "border-slate-300 dark:border-slate-600"}`}
                      />
                      {leadFormErrors.name && <p className="text-xs text-red-500 mt-1">{leadFormErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={leadForm.email}
                        onChange={(e) => {
                          setLeadForm({ ...leadForm, email: e.target.value })
                          if (leadFormErrors.email) setLeadFormErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${leadFormErrors.email ? "border-red-400" : "border-slate-300 dark:border-slate-600"}`}
                      />
                      {leadFormErrors.email && <p className="text-xs text-red-500 mt-1">{leadFormErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+254 7XX XXX XXX"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ISP / Company</label>
                      <input
                        type="text"
                        placeholder="Your ISP name"
                        value={leadForm.company}
                        onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr] mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Where did you hear about us?</label>
                      <select
                        value={leadForm.lead_source}
                        onChange={(e) => setLeadForm({ ...leadForm, lead_source: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select a source</option>
                        {LEAD_SOURCE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                      This helps us measure what channels are actually bringing in serious ISP leads.
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                    <textarea
                      placeholder="Tell us about your ISP, what you're looking for, or any questions you have..."
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                <button
                  onClick={async () => {
                    // Inline validation
                    const errors: { name?: string; email?: string } = {}
                    if (!leadForm.name.trim()) errors.name = "Name is required"
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!leadForm.email.trim()) errors.email = "Email is required"
                    else if (!emailRegex.test(leadForm.email)) errors.email = "Enter a valid email address"
                    if (Object.keys(errors).length > 0) { setLeadFormErrors(errors); return }
                    setLeadSubmitting(true)
                    const ctrl = new AbortController()
                    const timeout = setTimeout(() => ctrl.abort(), 15000)
                    try {
                      await submitLead(leadForm, ctrl.signal)
                      setLeadSubmitted(true)
                    } catch (err: any) {
                      if (err?.name === 'AbortError') {
                        setLeadSubmitted(true) // Show success anyway — lead may have been saved
                      } else {
                        setLeadSubmitted(true)
                      }
                    } finally {
                      clearTimeout(timeout)
                      setLeadSubmitting(false)
                    }
                  }}
                  disabled={leadSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {leadSubmitting ? "Sending..." : "Send Message"}
                  {!leadSubmitting && <Send className="w-4 h-4" />}
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  We typically respond within 24 hours &bull; No spam, ever
                </p>
              </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ━━━ SOCIAL SHARE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Share Netily with fellow ISP owners:
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/intent/tweet?text=Just%20found%20Netily%20—%20ISP%20billing%20software%20for%20Kenya%20with%20M-Pesa%20%26%20MikroTik%20automation.%20Worth%20checking%20out!&url=https%3A%2F%2Fnetily.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X (Twitter)"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </a>
            <a
              href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fnetily.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5] text-white text-xs font-semibold hover:bg-[#005f8d] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Share on LinkedIn
            </a>
            <a
              href="https://api.whatsapp.com/send?text=Check%20out%20Netily%20—%20ISP%20billing%20software%20for%20Kenya%20with%20M-Pesa%20automation%3A%20https%3A%2F%2Fnetily.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1da851] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Share on WhatsApp
            </a>
          </div>
        </div>
      </section>

      </main>
      {/* ━━━ 6. GIANT FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="relative bg-slate-900 text-white overflow-hidden">
        {/* Giant background typography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[18vw] md:text-[16vw] font-black tracking-tighter text-white/[0.03] whitespace-nowrap leading-none">
            NETILY
          </span>
        </div>

        {/* CTA Block */}
        <div className="relative z-10 pt-20 md:pt-28 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
              Ready to put your network on autopilot?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
              Join the ISPs already automating their billing, provisioning, and payouts with Netily.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              href="#contact"
              onClick={(e) => { e.preventDefault(); scrollTo("contact") }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/25 text-lg"
            >
              Start Your 14-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-4">No credit card required &bull; Full access &bull; Cancel anytime</p>
          </Reveal>
        </div>

        {/* Footer links */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-bold">Netily</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  The modern ISP management platform. Automate billing, provisioning & payouts.
                </p>
                <div className="flex flex-col gap-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <a href="tel:+254111325479" className="hover:text-white transition-colors">0111 325 479</a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4 shrink-0 fill-current text-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <a
                      href="https://wa.me/254799538923"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      0799 538 923
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Twitter/X */}
                  <a href="https://x.com/netily" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="X (Twitter)">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  {/* LinkedIn */}
                  <a href="https://linkedin.com/company/netily" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="LinkedIn">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  {/* Facebook */}
                  <a href="https://facebook.com/netily" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Facebook">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  {/* Instagram */}
                  <a href="https://instagram.com/netily" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Instagram">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
                  </a>
                </div>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2.5">
                  {(["Features", "Pricing"] as const).map((item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase()}`}
                        onClick={(e) => { e.preventDefault(); scrollTo(item.toLowerCase()) }}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                  <li><Link href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact") }} className="text-sm text-slate-400 hover:text-white transition-colors">Start Free Trial</Link></li>
                  <li><Link href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact") }} className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-2.5">
                  {["Documentation", "API Reference", "Status Page", "Community"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2.5">
                  <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact") }} className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
                  <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact") }} className="text-sm text-slate-400 hover:text-white transition-colors">Get Started Free</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} Netily. All rights reserved. &nbsp;·&nbsp;{" "}
                <a
                  href="https://mjengo-tech.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  a product of Mjengo Corporate
                </a>
              </p>
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
                <Link href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact") }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const HERO_SUPPORT_PHOTO =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"

const HERO_NETWORK_PHOTO =
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80"

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1800&q=80"
