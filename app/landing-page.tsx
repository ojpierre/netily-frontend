"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
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

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export function LandingPage() {
  const [email, setEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
              {["Features", "Pricing", "FAQs"].map((label) => (
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
                onClick={() => scrollTo("hero-cta")}
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
              {["Features", "Pricing", "FAQs"].map((label) => (
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
                onClick={() => scrollTo("hero-cta")}
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
              <span>Automated 95% Daily M-Pesa Payouts</span>
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

          {/* Lead Capture */}
          <Reveal delay={0.3}>
            <div id="hero-cta" className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your work email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-13 px-5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
              />
              <button className="h-13 px-7 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
                Get Your Custom Demo
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Free demo • No credit card required • Setup in 24h
            </p>
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
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 max-w-xl">
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
                {/* Decorative dots */}
                <div className="absolute bottom-6 right-8 grid grid-cols-5 gap-2 opacity-20">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-white" />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Card 2 */}
            <Reveal delay={0.1}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Router className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Plug & Play Routers</h3>
                <p className="text-slate-600 leading-relaxed">
                  Zero-touch provisioning. Plug in a new MikroTik, and our cloud configures the client
                  instantly. No SSH, no scripts, no headaches.
                </p>
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal delay={0.2}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Auto-Invoicing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tax-ready PDF invoices generated and emailed automatically every month. Your accountant
                  will think you hired an assistant.
                </p>
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
          </div>
        </div>
      </section>

      {/* ━━━ 5. PRICING SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
            {/* Metered */}
            <Reveal>
              <div className="h-full rounded-2xl bg-white border border-slate-200 p-8 md:p-10 shadow-sm hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                  <Clock className="w-3.5 h-3.5" />
                  Pay As You Grow
                </div>
                <h3 className="text-2xl font-bold mb-1">Metered</h3>
                <p className="text-slate-500 mb-8">Perfect for the growing ISPs who want to keep costs lean.</p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-extrabold">500</span>
                    <span className="text-slate-500 font-medium">KES/mo base</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "20 KES per active PPPoE user",
                    "3% share on Hotspot revenue",
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

                <button
                  onClick={() => scrollTo("hero-cta")}
                  className="w-full py-3.5 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Start a Free Trial
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
                    onClick={() => scrollTo("hero-cta")}
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
                onClick={() => scrollTo("hero-cta")}
                className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

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
                  q: "How does the 95% payout work?",
                  a: "When your customer pays via M-Pesa through our integrated STK Push, we collect the payment, deduct a flat 5% processing fee, and auto-settle 95% to your B2C Paybill or bank account daily.",
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
              onClick={() => scrollTo("hero-cta")}
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
                <p className="text-sm text-slate-400 leading-relaxed">
                  The modern ISP management platform. Automate billing, provisioning & payouts.
                </p>
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