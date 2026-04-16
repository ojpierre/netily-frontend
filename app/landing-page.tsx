"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { BillingCalculator } from "@/components/BillingCalculator"
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
} from "lucide-react"
import { useState, useEffect } from "react"

// ─── Scroll-reveal wrapper ─────────────────────────────────────
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
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
    "M-Pesa STK Push",
    "MikroTik RouterOS",
    "PayHero",
    "FreeRADIUS",
    "PPPoE",
    "Hotspot Billing",
    "Cloud Provisioning",
    "Auto-Invoicing",
  ]
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-slate-400 font-medium text-sm tracking-wide uppercase flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── FAQ Accordion ──────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-lg font-semibold text-slate-900 pr-4">{q}</span>
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
        <p className="pb-5 text-slate-600 leading-relaxed">{a}</p>
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
    <div className="relative mx-auto max-w-5xl mt-16 md:mt-20">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl opacity-60" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200/60">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-white rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-400 min-w-0 sm:min-w-[260px] max-w-full">
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
          <div className="flex-1 p-5 md:p-6 bg-slate-50/50 min-h-[400px]">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Active Subscribers", value: "1,247", change: "+12%", color: "text-emerald-600", icon: Users },
                { label: "Monthly Revenue", value: "KES 2.4M", change: "+8.3%", color: "text-emerald-600", icon: TrendingUp },
                { label: "Online Routers", value: "89/92", change: "96.7%", color: "text-blue-600", icon: Router },
                { label: "M-Pesa Today", value: "KES 84K", change: "+23%", color: "text-emerald-600", icon: Smartphone },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200/60 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-lg md:text-xl font-bold text-slate-900">{stat.value}</p>
                  <p className={`text-[10px] font-medium ${stat.color} mt-0.5`}>{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Chart + recent payments */}
            <div className="grid md:grid-cols-5 gap-3">
              {/* Chart placeholder */}
              <div className="md:col-span-3 bg-white rounded-xl border border-slate-200/60 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-700">Revenue Overview</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">Last 7 days</span>
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
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/60 p-4">
                <span className="text-xs font-semibold text-slate-700 block mb-3">Recent Payments</span>
                <div className="space-y-2.5">
                  {[
                    { name: "John Kamau", amount: "KES 2,500", time: "2m ago" },
                    { name: "Grace Wanjiku", amount: "KES 1,800", time: "5m ago" },
                    { name: "David Omondi", amount: "KES 3,200", time: "12m ago" },
                    { name: "Faith Njeri", amount: "KES 1,500", time: "18m ago" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">{p.name}</p>
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
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", company: "", message: "" })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

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
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* ━━━ 1. FLOATING HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-slate-200/60"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Netily</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {["Features", "Pricing", "Calculator", "FAQs"].map((label) => (
                <button
                  key={label}
                  onClick={() => scrollTo(label.toLowerCase())}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                See it in Action
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 pb-4"
          >
            <div className="flex flex-col gap-1 pt-2">
              {["Features", "Pricing", "Calculator", "FAQs"].map((label) => (
                <button
                  key={label}
                  onClick={() => scrollTo(label.toLowerCase())}
                  className="py-3 text-left text-sm font-medium text-slate-700 hover:text-blue-600"
                >
                  {label}
                </button>
              ))}
              <hr className="my-2 border-slate-200" />
              <Link
                href="/login"
                className="py-3 text-sm font-medium text-slate-700"
              >
                Login
              </Link>
              <button
                onClick={() => scrollTo("contact")}
                className="mt-1 w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-lg"
              >
                See it in Action
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ━━━ 2. HERO SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-28 md:pt-36 pb-20 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[128px] opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[128px] opacity-50" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              {/*<span>Automated 95% Daily M-Pesa Payouts</span>
              */}
              <span>Trusted by 100+ ISPs across Africa</span>
              <span className="text-lg leading-none">✨</span>
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Run your ISP
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                while you sleep.
              </span>
            </h1>
          </Reveal>

          {/* Sub-headline */}
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop chasing payments and manually resetting routers. Netily fully automates your billing,
              provisioning, and customer support so you can focus on growing your network.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.3}>
            <div id="hero-cta" className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/25 text-lg"
              >
                I&apos;m Interested
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-colors border border-slate-200 shadow-sm text-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </Reveal>

          {/* Dashboard mockup */}
          <Reveal delay={0.5}>
            <DashboardMockup />
          </Reveal>
        </div>
      </motion.section>

      {/* ━━━ 3. TRUST MARQUEE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-slate-200 py-5 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium text-center mb-4">
            Natively integrated with
          </p>
          <InfiniteMarquee />
        </div>
      </section>

      {/* ━━━ 3b. SOCIAL-PROOF STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { value: 500, suffix: "+", label: "ISPs onboarded", icon: Wifi },
              { value: 50000, suffix: "+", label: "Active subscribers", icon: Users },
              { value: 95, suffix: "%", label: "Daily M-Pesa payout", icon: CircleDollarSign },
              { value: 99, suffix: ".9%", label: "Platform uptime", icon: Activity },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 4. BENTO GRID ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Why ISPs choose Netily
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Cut the jargon. Here&apos;s what it actually feels like to automate your network.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {/* Card 1 — Highlight (full-width) */}
            <Reveal className="md:col-span-2">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white group md:flex md:items-center md:gap-10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 max-w-xl flex-1">
                  <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3.5 py-1.5 text-sm font-medium mb-5 backdrop-blur-sm">
                    <Zap className="w-4 h-4" />
                    Instant M-Pesa Magic
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-snug">
                    Customer pays via M-Pesa. Internet connects 2 seconds later.
                  </h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Zero manual reconciliation. STK Push fires, payment confirms, RADIUS credentials activate — all
                    while you&apos;re asleep. The money lands in your account the next morning.
                  </p>
                </div>
                {/* Mini STK Push phone mockup */}
                <div className="hidden md:block relative z-10 shrink-0">
                  <div className="w-48 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white">M-Pesa</p>
                        <p className="text-[8px] text-blue-200">STK Push</p>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 mb-2">
                      <p className="text-[9px] text-blue-200 mb-1">Pay to</p>
                      <p className="text-xs font-bold text-white">Netily ISP</p>
                      <p className="text-[9px] text-blue-200 mt-2 mb-1">Amount</p>
                      <p className="text-lg font-bold text-white">KES 2,500</p>
                    </div>
                    <div className="bg-green-500 rounded-lg py-2 text-center">
                      <p className="text-[10px] font-bold text-white">Payment Confirmed ✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Card 2 */}
            <Reveal delay={0.1}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Router className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Plug & Play Routers</h3>
                <p className="text-slate-600 leading-relaxed mb-5">
                  Zero-touch provisioning. Plug in a new MikroTik, and our cloud configures the client
                  instantly. No SSH, no scripts, no headaches.
                </p>
                {/* Mini router status */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Router Status</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Live</span>
                  </div>
                  {[
                    { name: "RB5009UPr+S+ — Main POP", status: "online" },
                    { name: "hAP ac³ — Block A", status: "online" },
                    { name: "CCR2004 — Fiber Hub", status: "online" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-slate-600 truncate">{r.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal delay={0.2}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Auto-Invoicing</h3>
                <p className="text-slate-600 leading-relaxed mb-5">
                  Tax-ready PDF invoices generated and emailed automatically every month. Your accountant
                  will think you hired an assistant.
                </p>
                {/* Mini invoice */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700">INV-2025-0142</span>
                      <span className="text-[8px] text-slate-400 ml-2">Auto-sent</span>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Paid</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 py-1 border-t border-dashed border-slate-200">
                    <span>10 Mbps Home Plan × 1 mo</span>
                    <span className="font-semibold text-slate-700">KES 2,500</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 py-1 border-t border-dashed border-slate-200">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-slate-900">KES 2,500</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Card 4 */}
            <Reveal delay={0.15} className="md:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 md:flex md:items-center md:gap-10 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5 md:mb-0 shrink-0 group-hover:scale-110 transition-transform">
                  <Ghost className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Ghost Records</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Never pay for dead accounts. Our system only bills you for exactly who connected this
                    month. Dormant subscribers cost you nothing.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card 5 — Customisable Captive Portals */}
            <Reveal delay={0.2}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Customisable Captive Portals</h3>
                <p className="text-slate-600 leading-relaxed">
                  Design branded hotspot login pages with your logo, colors, and messaging. Engage users before they connect.
                </p>
              </div>
            </Reveal>

            {/* Card 6 — Secure Payments */}
            <Reveal delay={0.25}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                <p className="text-slate-600 leading-relaxed">
                  End-to-end encrypted transactions via M-Pesa STK Push. PCI-compliant processing with OTP verification for every action.
                </p>
              </div>
            </Reveal>

            {/* Card 7 — Inbuilt SMS */}
            <Reveal delay={0.3}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Inbuilt SMS</h3>
                <p className="text-slate-600 leading-relaxed">
                  Send payment reminders, service alerts, and promotional messages directly from your dashboard. No third-party SMS gateway needed.
                </p>
              </div>
            </Reveal>

            {/* Card 8 — Data Protection */}
            <Reveal delay={0.35}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group overflow-hidden">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Data Protection</h3>
                <p className="text-slate-600 leading-relaxed">
                  Fully compliant with the Kenya Data Protection Act. Encrypted storage, access controls, and audit trails for all customer data.
                </p>
              </div>
            </Reveal>

            {/* Card 9 — Real Time Payments */}
            <Reveal delay={0.4} className="md:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-green-50 p-8 md:flex md:items-center md:gap-10 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5 md:mb-0 shrink-0 group-hover:scale-110 transition-transform">
                  <BanknoteIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Real Time Payments</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Payments reflect instantly. The moment a subscriber pays, their service activates in real time — no waiting, no manual intervention.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ━━━ 5. PRICING SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
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
                  <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                      <span className="text-[10px] font-medium text-slate-700">M-Pesa channel linked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                      <span className="text-[10px] font-medium text-slate-700">STK Push enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                      <span className="text-[10px] font-medium text-slate-700">Auto-settlement ON</span>
                    </div>
                  </div>
                ),
              },
              {
                step: "03",
                title: "Go live — sit back",
                desc: "Subscribers pay, internet activates, invoices send, and revenue settles to your bank. Automatically.",
                visual: (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-800">Today&apos;s Settlement</span>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-700">KES 142,350</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Settled to KCB ****4521 at 6:00 AM</p>
                  </div>
                ),
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.15}>
                <div className="relative">
                  <span className="text-5xl font-black text-slate-100">{item.step}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  {item.visual}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 6. PRICING SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Stop paying for scaling taxes.
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Honest pricing that grows with you. No surprises, no contracts.
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Metered — links to calculator */}
            <Reveal>
              <div className="h-full rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-200 p-8 md:p-10 shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                    <Clock className="w-3.5 h-3.5" />
                    Pay As You Grow
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Metered</h3>
                  <p className="text-slate-500 mb-8">Perfect for growing ISPs who want to keep costs lean.</p>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-extrabold">500</span>
                      <span className="text-slate-500 font-medium">KES/mo base</span>
                    </div>
                    <p className="text-sm text-slate-500">+ 20 KES per PPPoE user + 3% hotspot share</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      "Free M-Pesa STK Push integration",
                      "MikroTik auto-provisioning",
                      "Unlimited routers",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-700">
                        <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => scrollTo("calculator")}
                  className="w-full py-3.5 rounded-xl border-2 border-blue-300 font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Calculate Your Cost &darr;
                </button>
              </div>
            </Reveal>

            {/* Flat Tiers */}
            <Reveal delay={0.15}>
              <div className="h-full rounded-2xl bg-white border-2 border-blue-600 p-8 md:p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                    <Shield className="w-3.5 h-3.5" />
                    Lock in Overhead
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Flat Tiers</h3>
                  <p className="text-slate-500 mb-8">Predictable monthly costs. Scale without surprises.</p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { name: "Starter", price: "2,999" },
                      { name: "Pro", price: "7,999" },
                      { name: "Enterprise", price: "19,999" },
                    ].map((tier) => (
                      <div key={tier.name} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{tier.name}</p>
                        <p className="text-lg font-bold text-slate-900">{tier.price}</p>
                        <p className="text-xs text-slate-400">KES/mo</p>
                      </div>
                    ))}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      "All Metered features included",
                      "Priority email & phone support",
                      "Custom branding & white-label",
                      "Advanced analytics dashboard",
                      "Dedicated account manager (Enterprise)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-700">
                        <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => scrollTo("contact")}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors shadow-sm"
                  >
                    Book a Demo
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Callout box */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white text-center md:text-left md:flex md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">The 95% Promise</h3>
                <p className="text-blue-100 leading-relaxed max-w-2xl">
                  We handle the payment gateways, take a flat 5% transaction fee, and auto-settle the rest
                  to your B2C/Bank daily. You wake up to money in your account — every morning.
                </p>
              </div>
              <button
                onClick={() => scrollTo("contact")}
                className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ 6b. BILLING CALCULATOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <BillingCalculator onGetStarted={() => scrollTo("contact")} />

      {/* ━━━ 5b. FAQs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="faqs" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Frequently asked questions
              </h2>
              <p className="text-lg text-slate-600">
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

      {/* ━━━ CONTACT / INQUIRY FORM ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Interested in Netily? Have a question? Drop us a message and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {leadSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-2">Message Sent!</h3>
                <p className="text-sm text-emerald-600">Thank you for reaching out. Our team will get back to you shortly.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ISP / Company</label>
                    <input
                      type="text"
                      placeholder="Your ISP name"
                      value={leadForm.company}
                      onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <textarea
                    placeholder="Tell us about your ISP, what you're looking for, or any questions you have..."
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!leadForm.name || !leadForm.email) return
                    setLeadSubmitting(true)
                    try {
                      const { submitLead } = await import("@/lib/api")
                      await submitLead(leadForm)
                      setLeadSubmitted(true)
                    } catch {
                      setLeadSubmitted(true)
                    } finally {
                      setLeadSubmitting(false)
                    }
                  }}
                  disabled={leadSubmitting || !leadForm.name || !leadForm.email}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {leadSubmitting ? "Sending..." : "Send Message"}
                  {!leadSubmitting && <Send className="w-4 h-4" />}
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  We typically respond within 24 hours &bull; No spam, ever
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

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
            <button
              onClick={() => scrollTo("contact")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/25 text-lg"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
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
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <Smartphone className="w-4 h-4" />
                  <a href="tel:+254700000000" className="hover:text-white transition-colors">+254 700 000 000</a>
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
                  {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => scrollTo(item.toLowerCase())}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
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
                  {["About", "Blog", "Careers", "Contact"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} Netily. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}