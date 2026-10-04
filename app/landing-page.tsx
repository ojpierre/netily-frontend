"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Menu,
  Router,
  Send,
  ShieldCheck,
  Smartphone,
  Users,
  Wifi,
  X,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { blogPosts } from "@/lib/blog-data"
import { caseStudies } from "@/lib/case-studies"
import { submitLead } from "@/lib/api"
import { useGeo } from "@/hooks/use-geo"

const BillingCalculator = dynamic(
  () => import("@/components/BillingCalculator").then((mod) => mod.BillingCalculator),
  {
    ssr: false,
    loading: () => (
      <section id="calculator" className="border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <div className="h-80 animate-pulse border border-zinc-800 bg-zinc-900/60" />
        </div>
      </section>
    ),
  },
)

const LEAD_SOURCE_OPTIONS = [
  "Google Search",
  "TikTok",
  "Facebook / Instagram",
  "LinkedIn",
  "WhatsApp group",
  "YouTube",
  "Referral from another ISP",
  "Event or community meetup",
  "Existing Internetily / Netily customer",
  "Other",
]

const navItems = [
  { label: "Problem", id: "problem" },
  { label: "Solution", id: "solution" },
  { label: "Features", id: "features" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faqs" },
]

const megaMenuGroups = [
  {
    title: "Learn",
    links: [
      { label: "Internetily Academy", href: "/academy", description: "Practical ISP, WISP, MikroTik, and hotspot courses." },
      { label: "Academy courses", href: "/academy/courses", description: "Browse the full course catalog." },
      { label: "ISP guides", href: "/blog", description: "Plain-English playbooks for operators." },
    ],
  },
  {
    title: "Proof",
    links: [
      { label: "Case studies", href: "/case-studies", description: "Example ISP outcomes and workflow stories." },
      { label: "Testimonials", href: "#testimonials", description: "Hear what operator teams care about." },
      { label: "Demo workspace", href: "https://demo.netily.co.ke/admin/login", description: "Walk through the dashboard experience." },
    ],
  },
]

const heroPhrases = [
  "M-Pesa billing",
  "MikroTik automation",
  "hotspot vouchers",
  "subscriber self-service",
  "revenue visibility",
]

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SplitWords({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={false}
          whileInView={{ filter: "blur(0px)", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.045 }}
          className={`mr-[0.25em] inline-block ${muted ? "text-zinc-500" : ""}`}
        >
          {word}
        </motion.span>
      ))}
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-3 border border-zinc-700 px-4 py-2">
      <span className="h-2.5 w-2.5 bg-amber-500" />
      <span className="text-sm font-medium tracking-wide text-zinc-400">{children}</span>
    </div>
  )
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="relative block">
      <Image
        src="/internetily-white-logo-320.webp"
        alt="Internetily"
        width={compact ? 210 : 260}
        height={compact ? 72 : 88}
        priority={compact}
        className={`${compact ? "h-14 w-auto sm:h-16" : "h-16 w-auto"} object-contain`}
      />
    </span>
  )
}

function LazyVideo({
  src,
  poster,
  label,
  className,
}: {
  src: string
  poster: string
  label: string
  className: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    const play = () => {
      video.play().catch(() => undefined)
    }

    play()
    video.addEventListener("canplay", play, { once: true })

    return () => {
      video.removeEventListener("canplay", play)
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      autoPlay
      loop
      playsInline
      preload="auto"
      aria-label={label}
      onLoadedData={(event) => {
        event.currentTarget.play().catch(() => undefined)
      }}
    />
  )
}

function RotatingHeroText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % heroPhrases.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <span className="relative inline-flex min-w-[12ch] overflow-hidden align-bottom text-amber-300">
      <AnimatePresence mode="wait">
        <motion.span
          key={heroPhrases[index]}
          initial={{ y: 18, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -18, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {heroPhrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function Grain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>')",
      }}
    />
  )
}

function MiniDashboard() {
  const rows = [
    ["M-Pesa payment", "KES 2,500", "Connected"],
    ["PPPoE expiry", "Grace W.", "Renewed"],
    ["Router sync", "MikroTik-03", "Healthy"],
  ]

  return (
    <div className="border border-white/15 bg-zinc-950/75 p-4 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Live operations</p>
          <p className="mt-1 text-sm font-medium text-white">Internetily command surface</p>
        </div>
        <span className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Online
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Subscribers", "50K+"],
          ["ISPs", "500+"],
          ["Uptime", "99.9%"],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
            <p className="mt-2 text-xl font-medium text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {rows.map(([event, amount, status]) => (
          <div key={`${event}-${amount}`} className="grid grid-cols-[1fr_auto_auto] gap-3 border border-white/10 bg-white/[0.025] px-3 py-2 text-xs">
            <span className="text-zinc-300">{event}</span>
            <span className="text-zinc-500">{amount}</span>
            <span className="text-amber-400">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NetworkPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-45">
      <motion.svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 520"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="network-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[
          "M40 420 C220 260 330 360 480 210 S790 120 1160 260",
          "M80 130 C250 90 360 210 520 165 S780 250 1120 90",
          "M150 490 C330 330 490 450 670 300 S930 185 1190 380",
        ].map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#network-line)"
            strokeWidth="1.4"
            strokeDasharray="10 18"
            initial={false}
            animate={{ strokeDashoffset: [0, -56] }}
            transition={{ duration: 12 + index * 4, repeat: Infinity, ease: "linear" }}
          />
        ))}
        {[
          [90, 405],
          [245, 275],
          [410, 330],
          [560, 185],
          [735, 245],
          [930, 150],
          [1105, 265],
          [180, 115],
          [505, 155],
          [820, 250],
          [1025, 95],
        ].map(([cx, cy], index) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={index % 3 === 0 ? 5 : 3.5}
            fill="currentColor"
            initial={false}
            animate={{ opacity: [0.18, 0.75, 0.18], scale: [0.9, 1.24, 0.9] }}
            transition={{ duration: 3.4 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.svg>
    </div>
  )
}

function HomepageMetricsSection() {
  const metrics = [
    {
      value: "500+",
      label: "ISPs onboarded",
      meta: "operator teams",
      className: "bg-foreground text-background",
    },
    {
      value: "50k+",
      label: "active subscribers",
      meta: "subscriber reach",
      className: "bg-primary text-primary-foreground",
    },
    {
      value: "24h",
      label: "typical setup window",
      meta: "go-live rhythm",
      className: "bg-accent text-accent-foreground",
    },
  ]

  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-16 text-foreground md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="grid overflow-hidden border border-border bg-card shadow-2xl shadow-black/5 lg:grid-cols-[1.05fr_repeat(3,1fr)]">
          <div className="relative flex min-h-72 flex-col justify-end border-b border-border bg-muted/45 p-7 lg:border-b-0 lg:border-r lg:p-9">
            <div className="absolute left-4 top-0 h-full w-px bg-border" />
            <div className="absolute right-4 top-0 h-full w-px bg-border" />
            <p className="max-w-xs text-3xl font-medium leading-[0.95] tracking-tight md:text-4xl">
              ISP operations in motion
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Live operating signals from billing, subscribers, and onboarding workflows.
            </p>
          </div>

          {metrics.map((metric, index) => (
            <article key={metric.label} className="relative min-h-72 border-b border-border bg-background lg:border-b-0 lg:border-r last:lg:border-r-0">
              <div className={`${metric.className} relative flex h-44 flex-col justify-between p-7 md:h-52 lg:h-64 lg:p-8`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs lowercase opacity-75">{metric.meta}</span>
                  <span className="text-xs opacity-75">{index === 0 ? "adoption" : index === 1 ? "scale" : "setup"}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-[4.8rem] font-light leading-none tracking-tight md:text-[6rem] lg:text-[7rem]">
                    {metric.value}
                  </span>
                </div>
                <div className="absolute -bottom-8 left-0 h-8 w-8 bg-inherit [clip-path:polygon(0_0,100%_0,100%_100%)]" />
              </div>
              <div className="flex min-h-28 items-end p-7 lg:p-8">
                <p className="max-w-36 text-sm lowercase leading-5 text-muted-foreground">/{metric.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Internetily gave our billing and support team one clean place to understand payments, renewals, customers, and router-side work.",
      name: "Operations Lead",
      company: "Regional WISP",
      region: "East Africa",
      metric: "renewals",
    },
    {
      quote:
        "The biggest win was visibility. We could tell which customers needed billing follow-up, which needed support, and which were ready to reconnect.",
      name: "Founder",
      company: "Estate WiFi Operator",
      region: "Kenya",
      metric: "support clarity",
    },
    {
      quote:
        "We wanted a system that felt practical for daily ISP work. Internetily made billing, customer records, and access workflows easier to coordinate.",
      name: "Commercial Manager",
      company: "Altnet Team",
      region: "United Kingdom",
      metric: "billing visibility",
    },
  ]
  const [active, setActive] = useState(0)
  const testimonial = testimonials[active]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [testimonials.length])

  return (
    <section id="testimonials" className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
      <Grain />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-16 lg:items-end">
        <div>
          <SectionLabel>Customer Voice</SectionLabel>
          <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
            Teams trust Internetily when billing needs to move with operations.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Clear billing, customer records, payments, support, and access workflows help ISP teams spend less time chasing context and more time serving subscribers.
          </p>
        </div>

        <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900 p-6 md:p-8">
          <div className="absolute right-6 top-6 text-8xl font-light leading-none text-white/5">"</div>
          <AnimatePresence mode="wait">
            <motion.article
              key={testimonial.quote}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="relative z-10"
            >
              <p className="text-2xl font-light leading-10 text-white md:text-4xl md:leading-[1.18]">
                {testimonial.quote}
              </p>
              <div className="mt-10 flex flex-col gap-4 border-t border-zinc-800 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-base font-medium text-white">{testimonial.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{testimonial.company} / {testimonial.region}</p>
                </div>
                <p className="w-fit border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-amber-200">
                  {testimonial.metric}
                </p>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="mt-8 flex gap-2">
            {testimonials.map((item, index) => (
              <button
                key={item.quote}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2.5 flex-1 transition ${index === active ? "bg-amber-400" : "bg-zinc-700 hover:bg-zinc-600"}`}
                aria-label={`Show testimonial from ${item.company}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CaseStudiesSection() {
  return (
    <section id="case-studies" className="relative overflow-hidden border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
      <NetworkPattern />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Case Studies</SectionLabel>
            <h2 className="mt-6 max-w-3xl text-balance text-4xl font-normal leading-tight md:text-6xl">
              Example wins from ISP billing, support, and renewal workflows.
            </h2>
          </div>
          <a href="#contact" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-amber-400">
            Build your case study
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/case-studies/${study.slug}`} className="group overflow-hidden border border-zinc-800 bg-zinc-950 transition hover:border-zinc-600">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-zinc-800">
                <Image
                  src={study.image}
                  alt={study.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 border border-white/15 bg-zinc-950/70 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white backdrop-blur">
                  {study.region}
                </div>
              </div>
              <div className="p-6">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <p className="text-5xl font-light tracking-tight text-white">{study.metric}</p>
                  <p className="max-w-28 text-right text-xs lowercase leading-4 text-zinc-500">/{study.metricLabel}</p>
                </div>
                <h3 className="line-clamp-2 text-2xl font-normal leading-tight text-white">{study.title}</h3>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">{study.summary}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                  Read case study
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function AcademySection() {
  return (
    <section id="academy" className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
      <Grain />
      <div className="absolute inset-0 opacity-35">
        <NetworkPattern />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="relative mb-10 aspect-[4/3] overflow-hidden sm:aspect-[16/9]">
          <Image src="/academy/african-networking-learners.webp" alt="African learners practicing router and switch connections with an instructor in a networking lab" fill sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
        </div>
        <div className="grid gap-8">
          <div className="max-w-4xl">
            <SectionLabel>Internetily Academy</SectionLabel>
            <h2 className="mt-6 text-balance text-4xl font-normal leading-tight text-white md:text-6xl">
              Learn the skills behind a better network.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
              Get hands-on with networking, plan your next rollout, and make everyday ISP work easier.
              Practical learning for new owners, technicians, and growing teams.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/academy" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
              Explore Academy
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/academy/courses" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
              View courses
              <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function PaymentLogoStrip() {
  const logos = [
    { name: "M-Pesa", src: "/payments-logos/mpesa_logo.png" },
    { name: "Airtel Money", src: "/payments-logos/airtel_money-logo.webp" },
    { name: "Telkom Kash", src: "/payments-logos/telkom-kash.png" },
    { name: "Co-op Bank", src: "/payments-logos/Coopbanklogo.jpg" },
    { name: "Equity Bank", src: "/payments-logos/Equity_bank_logo.png" },
    { name: "I&M Bank", src: "/payments-logos/Imbank-logo.webp" },
    { name: "Stanbic Bank", src: "/payments-logos/Stanbic-bank-logo.jpg" },
  ]

  return (
    <div className="overflow-hidden border-y border-zinc-800 bg-zinc-950 py-8">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {[...logos, ...logos].map((logo, index) => (
          <div key={`${logo.name}-${index}`} className="flex h-20 w-48 shrink-0 items-center gap-3 border border-zinc-800 bg-zinc-900/80 px-4">
            <div className="relative h-10 w-20 bg-white">
              <Image src={logo.src} alt={`${logo.name} payment integration`} fill sizes="80px" className="object-contain p-1.5" />
            </div>
            <p className="text-sm font-medium text-zinc-300">{logo.name}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function SolutionCarousel() {
  const steps = [
    {
      title: "1 - Collect",
      description: "STK Push, reminders, invoices, and payment confirmations stay tied to the subscriber lifecycle.",
      icon: <Smartphone className="h-5 w-5" />,
      image: "/images/hero2.png",
    },
    {
      title: "2 - Provision",
      description: "Internetily applies router-side changes for MikroTik PPPoE, hotspot, voucher, and subscriber access workflows.",
      icon: <Router className="h-5 w-5" />,
      image: "/images/hero1.png",
    },
    {
      title: "3 - Operate",
      description: "Revenue, users, tickets, payments, and network status stay visible in one daily operating surface.",
      icon: <BarChart3 className="h-5 w-5" />,
      image: "/images/hero2.png",
    },
  ]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % steps.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [steps.length])

  return (
    <section id="solution" className="border-b border-zinc-800 bg-zinc-900 py-24 text-white md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="mb-12 max-w-2xl">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="mt-6 text-balance text-4xl font-normal leading-tight tracking-tight md:text-6xl">
            <SplitWords text="A single control layer for ISP operations" />
          </h2>
          <p className="mt-5 text-base leading-7 text-zinc-400 md:text-lg">
            Internetily, formerly Netily, connects the work that usually lives in separate tools: cash collection, customer access,
            router provisioning, support follow-up, and revenue visibility.
          </p>
        </div>

        <div className="grid min-h-[420px] gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden border border-zinc-700 bg-zinc-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={steps[activeIndex].image}
                  alt={steps[activeIndex].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <MiniDashboard />
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute left-4 right-4 top-4 flex gap-2">
              {steps.map((_, index) => (
                <div key={index} className="h-1 flex-1 bg-white/10">
                  {activeIndex === index && (
                    <motion.div
                      className="h-full bg-amber-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 7, ease: "linear" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <button
                key={step.title}
                onClick={() => setActiveIndex(index)}
                className={`group w-full border p-6 text-left transition-all ${
                  activeIndex === index
                    ? "border-white/15 bg-white/[0.04]"
                    : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 ${activeIndex === index ? "bg-amber-500 text-black" : "bg-white/5 text-zinc-500"}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-medium ${activeIndex === index ? "text-white" : "text-zinc-500"}`}>
                      {step.title}
                    </h3>
                    {activeIndex === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden text-base leading-7 text-zinc-400"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </div>
                  <ChevronRight className={`mt-1 h-5 w-5 transition ${activeIndex === index ? "text-white/50" : "text-transparent"}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-800">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="pr-4 text-lg font-medium text-white">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="pb-5 leading-7 text-zinc-400">{a}</p>
      </motion.div>
    </div>
  )
}

function RouterAndIspSetupSection({ onIspSetupLead }: { onIspSetupLead: () => void }) {
  const vendors = [
    ["Tenda", "SMB WiFi and access networks"],
    ["TP-Link", "Routers, APs, and small networks"],
    ["Ubiquiti", "UISP, UniFi, and WISP estates"],
    ["MikroTik", "RouterOS, PPPoE, Hotspot, queues"],
    ["Cambium", "Wireless backhaul and WISP rollouts"],
    ["Huawei", "FTTH, ONT, and enterprise access"],
    ["Starlink", "Backhaul, failover, and remote sites"],
    ["FreeRADIUS", "AAA, accounting, and access control"],
  ]

  const setupItems = [
    "Hardware planning for routers, access points, backhaul, Starlink failover, and customer premises equipment",
    "Software setup for billing, M-Pesa payments, RADIUS, MikroTik provisioning, hotspot portals, SMS, and support",
    "Business integration covering packages, onboarding, customer records, collections, staff roles, and reporting",
  ]

  return (
    <section className="border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <SectionLabel>Routers, NAS, and backhaul</SectionLabel>
            <h2 className="mt-6 text-balance text-4xl font-normal leading-tight text-white md:text-6xl">
              <SplitWords text="Internetily works around the equipment real ISPs already use" />
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
              Whether your network runs on MikroTik, Ubiquiti, Cambium, Huawei, TP-Link, Tenda,
              FreeRADIUS, or Starlink-backed sites, Internetily helps connect billing, subscriber
              access, payments, and support into one operating workflow.
            </p>
          </div>
          <div className="border border-zinc-700 bg-zinc-900/70 p-6">
            <p className="text-sm font-medium text-white">What this means in daily operations</p>
            <div className="mt-5 grid gap-3">
              {[
                ["Router-aware billing", "Plans, payments, access states, and subscriber records stay aligned."],
                ["Cleaner field support", "Technicians can understand customer context before touching router work."],
                ["Growth without extra admin", "New sites, hotspots, estates, and WISP expansions plug into one operating flow."],
              ].map(([title, body]) => (
                <div key={title} className="border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map(([name, detail], index) => (
            <Reveal key={name} delay={index * 0.04}>
              <article className="h-full border border-zinc-800 bg-zinc-900/65 p-5 transition hover:border-amber-500/50">
                <div className="flex h-16 items-center justify-center border border-zinc-700 bg-zinc-950">
                  <span className="text-lg font-medium tracking-tight text-white">{name}</span>
                </div>
                <p className="mt-5 text-sm font-medium text-white">{name} support</p>
                <p className="mt-2 text-xs leading-6 text-zinc-500">{detail}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 border border-amber-500/30 bg-amber-500 p-1 text-black">
          <div className="border border-black/10 bg-amber-400 p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">Looking to set up your own ISP?</p>
                <h3 className="mt-4 text-3xl font-normal tracking-tight md:text-5xl">
                  We can help plan the hardware, software, and business workflow
                </h3>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-black/70 md:text-base">
                  Internetily can support a new ISP from idea to launch: network architecture, routers,
                  Starlink or fiber backhaul planning, M-Pesa billing, customer portal, RADIUS, packages,
                  staff roles, and daily operations.
                </p>
                <button
                  onClick={onIspSetupLead}
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-900"
                >
                  I want to set up an ISP
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {setupItems.map((item) => (
                  <div key={item} className="flex gap-3 border border-black/10 bg-black/5 p-4 text-sm leading-6 text-black/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sr-only">
          Internetily and Netily support NAS, routers, and ISP network equipment including Tenda, TP-Link, Ubiquiti, MikroTik, Cambium Networks, Huawei, Starlink, and FreeRADIUS. Internetily helps with Starlink ISP setup, Starlink backhaul billing, Starlink outage recovery workflows, MikroTik PPPoE billing, WISP billing, hotspot billing, M-Pesa billing, router provisioning, RADIUS authentication, and full ISP business setup in Kenya and East Africa.
        </div>
      </div>
    </section>
  )
}

function ProductVideoSection({
  videoSrc,
  posterSrc,
  eyebrow,
  headline,
  body,
  button,
  reverse = false,
  onClick,
}: {
  videoSrc: string
  posterSrc: string
  eyebrow: string
  headline: string
  body: string
  button: string
  reverse?: boolean
  onClick: () => void
}) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
      <Grain />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className={`grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <Reveal>
            <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/25">
              <LazyVideo
                className="aspect-video h-full w-full object-cover"
                src={videoSrc}
                poster={posterSrc}
                label={`${headline} preview video`}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-950/55 via-transparent to-transparent" />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 border border-white/15 bg-zinc-950/70 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur">
                <span className="h-2 w-2 bg-amber-500" />
                Live product motion
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="max-w-xl">
              <SectionLabel>{eyebrow}</SectionLabel>
              <h2 className="mt-6 text-balance text-4xl font-normal leading-tight tracking-tight text-white md:text-6xl">
                {headline}
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400 md:text-lg">{body}</p>
              <button
                onClick={onClick}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                {button}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [countrySwitcherOpen, setCountrySwitcherOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    lead_source: "",
    referral_name: "",
    message: "",
  })
  const [leadFormErrors, setLeadFormErrors] = useState<{ name?: string; email?: string }>({})
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadSubmitError, setLeadSubmitError] = useState("")
  const [affiliateReferralCode, setAffiliateReferralCode] = useState("")
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)

  const { geo, fmt, setCountry, GEO_TABLE } = useGeo()
  const supportedCountries = ["KE", "UG", "TZ", "ZA", "RW", "ET", "BI", "SS", "NG", "GB", "US", "AU", "NZ"].filter((code) => !!GEO_TABLE[code])

  useEffect(() => {
    const onScroll = () => setIsHeaderScrolled(window.scrollY > 220)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get("lead_source")?.trim()
    const message = params.get("message")?.trim()
    if (source || message) {
      setLeadForm((current) => ({
        ...current,
        lead_source: source && LEAD_SOURCE_OPTIONS.includes(source) ? source : current.lead_source || "Google Search",
        message: message || current.message,
      }))
    }

    const code = params.get("ref")?.trim().toUpperCase() || ""
    if (!/^[A-Z0-9_-]{4,64}$/.test(code)) return
    setAffiliateReferralCode(code)
    setLeadForm((current) => ({ ...current, lead_source: "Affiliate referral" }))
  }, [])

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    setMegaMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const prefillIspSetupLead = () => {
    setLeadSubmitted(false)
    setLeadForm((prev) => ({
      ...prev,
      lead_source: prev.lead_source || "Google Search",
      message:
        "Hi Internetily, I want to set up my own ISP. Please help me with hardware planning, Starlink/fiber/wireless backhaul, MikroTik routers, billing software, M-Pesa integration, customer portal, RADIUS, packages, staff roles, and full business operations setup.",
    }))
    window.setTimeout(() => scrollTo("contact"), 0)
  }

  const submitMainLead = async () => {
    const errors: { name?: string; email?: string } = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!leadForm.name.trim()) errors.name = "Name is required"
    if (!leadForm.email.trim()) errors.email = "Email is required"
    else if (!emailRegex.test(leadForm.email)) errors.email = "Enter a valid email address"

    if (Object.keys(errors).length) {
      setLeadFormErrors(errors)
      return
    }

    setLeadSubmitting(true)
    setLeadSubmitError("")
    const ctrl = new AbortController()
    const timeout = window.setTimeout(() => ctrl.abort(), 15000)
    try {
      await submitLead(
        {
          ...leadForm,
          ...(affiliateReferralCode ? { referral_code: affiliateReferralCode } : {}),
        },
        ctrl.signal,
      )
      setLeadSubmitted(true)
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError"
        ? "The request took too long. Please check your connection and try again."
        : error instanceof Error
          ? error.message
          : "We could not submit your enquiry. Please try again."
      setLeadSubmitError(message)
    } finally {
      window.clearTimeout(timeout)
      setLeadSubmitting(false)
    }
  }

  return (
    <div className="public-site min-h-screen bg-zinc-950 text-white antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>

      <header
        className={`public-header fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          isHeaderScrolled ? "px-0 py-0" : "px-6 py-6"
        }`}
        data-scrolled={isHeaderScrolled ? "true" : "false"}
      >
        <nav
          className={`public-nav mx-auto flex items-center justify-between transition-all duration-500 ${
            isHeaderScrolled ? "max-w-none rounded-none border-x-0 border-t-0 px-6 md:px-12 lg:px-16" : "max-w-7xl"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 text-white" aria-label="Internetily home">
            <BrandMark compact />
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/70 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  scrollTo(item.id)
                }}
                className="inline-flex min-h-12 items-center px-2 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <Link href="/blog" className="inline-flex min-h-12 items-center px-2 transition-colors hover:text-white">
              Blog
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMegaMenuOpen((open) => !open)}
                className="inline-flex min-h-12 items-center gap-2 px-2 transition-colors hover:text-white"
                aria-expanded={megaMenuOpen}
              >
                Learn
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {megaMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMegaMenuOpen(false)} />
                  <div className="absolute left-1/2 top-full z-50 mt-3 grid w-[560px] -translate-x-1/2 grid-cols-2 gap-3 border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
                    {megaMenuGroups.map((group) => (
                      <div key={group.title}>
                        <p className="px-3 pb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{group.title}</p>
                        <div className="grid gap-1">
                          {group.links.map((link) =>
                            link.href.startsWith("#") ? (
                              <a
                                key={link.href}
                                href={link.href}
                                onClick={(event) => {
                                  event.preventDefault()
                                  scrollTo(link.href.slice(1))
                                }}
                                className="block border border-transparent p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
                              >
                                <span className="block text-sm font-medium text-white">{link.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-zinc-500">{link.description}</span>
                              </a>
                            ) : (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMegaMenuOpen(false)}
                                className="block border border-transparent p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
                              >
                                <span className="block text-sm font-medium text-white">{link.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-zinc-500">{link.description}</span>
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link href="/docs" className="inline-flex min-h-12 items-center px-2 transition-colors hover:text-white">
              Docs
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative">
              <button
                onClick={() => setCountrySwitcherOpen(!countrySwitcherOpen)}
                className="flex min-h-12 items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10"
                aria-expanded={countrySwitcherOpen}
              >
                <span>{geo.flag}</span>
                <span>{geo.currency}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${countrySwitcherOpen ? "rotate-180" : ""}`} />
              </button>
              {countrySwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCountrySwitcherOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden border border-zinc-700 bg-zinc-950 shadow-2xl">
                    {supportedCountries.map((code) => {
                      const item = GEO_TABLE[code]!
                      return (
                        <button
                          key={code}
                          onClick={() => {
                            setCountry(code)
                            setCountrySwitcherOpen(false)
                          }}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                            geo.countryCode === code ? "bg-amber-500 text-black" : "text-zinc-300 hover:bg-zinc-900"
                          }`}
                        >
                          <span>{item.flag}</span>
                          <span className="flex-1">{item.countryName}</span>
                          <span className="text-xs">{item.currency}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <ThemeToggle />
            <a
              href="https://demo.netily.co.ke/admin/login"
                className="inline-flex min-h-12 items-center justify-center border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              View Demo
            </a>
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault()
                scrollTo("contact")
              }}
              className="inline-flex min-h-12 items-center justify-center bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Start Trial
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex h-12 w-12 items-center justify-center text-white" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="public-mobile-menu mx-auto mt-4 max-w-7xl border border-zinc-700 bg-zinc-950/95 p-5 backdrop-blur lg:hidden">
            <div className="flex flex-col gap-2 text-sm text-zinc-300">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    scrollTo(item.id)
                  }}
                  className="inline-flex min-h-12 items-center"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/academy" className="inline-flex min-h-12 items-center">Academy</Link>
              <Link href="/academy/courses" className="inline-flex min-h-12 items-center">Academy courses</Link>
              <Link href="/blog" className="inline-flex min-h-12 items-center">Blog</Link>
              <Link href="/docs" className="inline-flex min-h-12 items-center">Docs</Link>
              <Link href="/case-studies" className="inline-flex min-h-12 items-center">Case studies</Link>
              <a href="https://demo.netily.co.ke/admin/login" className="inline-flex min-h-12 items-center">View demo workspace</a>
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault()
                  setMobileMenuOpen(false)
                  scrollTo("contact")
                }}
                className="inline-flex min-h-12 items-center"
              >
                Contact sales
              </a>
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-4">
                {supportedCountries.map((code) => {
                  const item = GEO_TABLE[code]!
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        setCountry(code)
                        setMobileMenuOpen(false)
                      }}
                      className={`min-h-12 border px-3 py-2 text-left text-xs ${
                        geo.countryCode === code ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {item.flag} {item.currency}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">
        <section className="public-hero relative min-h-screen overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0">
            <LazyVideo
              className="h-full w-full object-cover"
              src="/internetily_intro.mp4"
              poster="/internetily_intro_poster.webp"
              label="Internetily intro video"
            />
            <div className="pointer-events-none absolute inset-0 bg-zinc-950/30" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-zinc-950/82 via-zinc-950/20 to-zinc-950/10" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/20" />
          </div>
          <Grain />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-6 pb-14 pt-44 md:px-12 lg:px-16">
            <div className="max-w-5xl">
              <h1 className="max-w-4xl text-balance text-3xl font-normal tracking-tight text-white md:text-5xl lg:text-6xl">
                Internetily runs <RotatingHeroText /> for growing ISPs.
              </h1>
              <p className="mt-5 max-w-3xl text-pretty text-sm leading-7 text-white/70 md:text-base">
                Formerly Netily, Internetily keeps the proven billing core and adds a clearer brand for the full operating layer: payments, routers, customers, support, and growth.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault()
                    scrollTo("contact")
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white px-7 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#solution"
                  onClick={(event) => {
                    event.preventDefault()
                    scrollTo("solution")
                  }}
                  className="inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Watch the workflow
                </a>
              </div>
            </div>
          </div>
        </section>

        <HomepageMetricsSection />

        <PaymentLogoStrip />

        <RouterAndIspSetupSection onIspSetupLead={prefillIspSetupLead} />

        <section id="problem" className="relative border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <Grain />
          <NetworkPattern />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <SectionLabel>The Problem</SectionLabel>
              <h2 className="mt-8 text-balance text-5xl font-normal tracking-tight text-white md:text-6xl">
                <SplitWords text="Your ISP should not run on scattered admin work" />
              </h2>
              <p className="mt-7 text-balance text-lg leading-8 text-zinc-300 md:text-xl">
                When payments, router access, invoices, support, and subscriber records live apart,
                every growth step creates more manual work. Internetily compresses that work into one
                connected system that owners, support teams, and technicians can trust day to day.
              </p>
              <div className="mt-10 grid w-full gap-4 text-left md:grid-cols-3">
                {[
                  ["Manual reconnection", "Teams spend time checking payments and toggling users by hand."],
                  ["Disconnected billing", "Spreadsheets and payment statements do not show the whole customer state."],
                  ["Weak visibility", "Owners need a live view of collections, churn risk, support, and network health."],
                ].map(([title, body]) => (
                  <div key={title} className="border border-zinc-700 bg-zinc-950/35 p-5">
                    <p className="text-lg font-medium text-white">{title}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ProductVideoSection
          videoSrc="/Video 1.mp4"
          posterSrc="/video-1-poster.webp"
          eyebrow="Cloud Control"
          headline="Centralized Control, Anywhere."
          body="Manage your entire hotspot network from a single, intuitive cloud dashboard. Deploy updates, monitor status, and control multiple locations without ever touching a router."
          button="Schedule a Demo"
          onClick={() => {
            setLeadForm((prev) => ({
              ...prev,
              message: "Hi, I would like to schedule a demo for Internetily hotspot network control.",
            }))
            scrollTo("contact")
          }}
        />

        <SolutionCarousel />

        <section id="features" className="border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="mb-14 max-w-3xl">
              <SectionLabel>Platform Components</SectionLabel>
              <h2 className="mt-6 text-balance text-4xl font-normal tracking-tight md:text-6xl">
                <SplitWords text="Everything important, visible from one surface" />
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "M-Pesa billing automation",
                  body: "STK Push, payment confirmation, invoices, receipts, reminders, and automatic access restoration.",
                  icon: Smartphone,
                  span: "xl:col-span-2",
                },
                {
                  title: "MikroTik provisioning",
                  body: "Connect RouterOS API for PPPoE, hotspot, DHCP, profiles, queues, and subscriber state updates.",
                  icon: Router,
                  span: "",
                },
                {
                  title: "Customer self-service",
                  body: "Subscribers can renew, check usage, download receipts, view invoices, and raise support tickets.",
                  icon: Users,
                  span: "",
                },
                {
                  title: "Hotspot and vouchers",
                  body: "Captive portal billing, voucher operations, session control, campaigns, and small-ticket purchases.",
                  icon: Wifi,
                  span: "",
                },
                {
                  title: "Revenue intelligence",
                  body: "Track collections, payment movement, subscriber growth, churn signals, and settlement visibility.",
                  icon: BarChart3,
                  span: "",
                },
                {
                  title: "Roles and audit controls",
                  body: "Give staff the right permissions while keeping sensitive actions protected and traceable.",
                  icon: ShieldCheck,
                  span: "xl:col-span-2",
                },
              ].map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05} className={feature.span}>
                  <article className="h-full border border-zinc-800 bg-zinc-900/65 p-6 transition hover:border-zinc-600">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center bg-amber-500 text-black">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.25em] text-zinc-600">0{index + 1}</span>
                    </div>
                    <h3 className="text-2xl font-normal text-white">{feature.title}</h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ProductVideoSection
          videoSrc="/Video 2.mp4"
          posterSrc="/video-2-poster.webp"
          eyebrow="Captive Portals"
          headline="Make the First Connection Count."
          body="Turn a simple Wi-Fi login into a brand touchpoint. Deliver seamless, lightning-fast, and fully customizable captive portals that engage users the moment they connect."
          button="Talk To Us"
          reverse
          onClick={() => {
            setLeadForm((prev) => ({
              ...prev,
              message: "Hi, I would like to talk about branded captive portals for my hotspot network.",
            }))
            scrollTo("contact")
          }}
        />

        <section className="border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <SectionLabel>Use Cases</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
                  <SplitWords text="Built for how local networks actually grow" />
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-400">
                  Internetily supports fiber ISPs, rural WISPs, hotspot providers, estates, campuses, hotels,
                  and MikroTik-first teams across Kenya and the region.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Fiber ISPs", "PPPoE subscriptions, billing cycles, renewals, and customer records."],
                  ["Hotspot providers", "Vouchers, captive portals, micropayments, and session controls."],
                  ["Rural WISPs", "Metered pricing, lean operations, router automation, and SMS reminders."],
                  ["Managed Wi-Fi", "Hotels, apartments, schools, churches, campuses, malls, and shared spaces."],
                ].map(([title, body]) => (
                  <div key={title} className="border border-zinc-700 bg-zinc-950/35 p-6">
                    <h3 className="text-xl font-medium text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="mb-12 max-w-3xl">
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
                <SplitWords text="Transparent pricing that follows your footprint" />
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                Start with a low activation fee, then pay around your PPPoE footprint and hotspot revenue.
                Estimates can be shown in your regional currency, while billing is processed in KES.
              </p>
            </div>

            {geo.countryCode !== "KE" && (
              <div className="mb-6 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {geo.flag} Showing estimated prices in <strong>{geo.currency}</strong> for {geo.countryName}. Billing is processed in KES.
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="border border-zinc-700 bg-zinc-900 p-7 lg:col-span-2">
                <div className="mb-8 flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.26em] text-amber-400">Metered</p>
                    <h3 className="mt-3 text-3xl font-normal text-white">Pay as you grow</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                      Best for ISPs that want automation without heavy fixed software overhead.
                    </p>
                  </div>
                  <CircleDollarSign className="h-10 w-10 text-amber-400" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    [fmt(500), "activation"],
                    [fmt(25), "per PPPoE subscriber"],
                    ["3%", "hotspot revenue share"],
                  ].map(([value, label]) => (
                    <div key={label} className="border border-zinc-800 bg-zinc-950 p-5">
                      <p className="text-3xl font-medium text-white">{value}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</p>
                    </div>
                  ))}
                </div>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    `Free ${geo.paymentCopy} integration`,
                    "Unlimited routers",
                    "MikroTik auto-provisioning",
                    "Customer self-service portal",
                    "Billing calculator and revenue visibility",
                    "KSh 500 monthly minimum",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#calculator"
                  onClick={(event) => {
                    event.preventDefault()
                    scrollTo("calculator")
                  }}
                  className="mt-8 inline-flex min-h-12 items-center gap-2 bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                >
                  Calculate your cost
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="border border-amber-500/30 bg-amber-500 p-7 text-black">
                <p className="text-sm uppercase tracking-[0.26em] text-black/60">Enterprise</p>
                <h3 className="mt-3 text-3xl font-normal">Custom scale</h3>
                <p className="mt-3 text-sm leading-7 text-black/70">
                  For large ISPs, white-label portals, dedicated infrastructure, priority support, SLA needs,
                  and custom payment or bank workflows.
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {["White-label branding", "Dedicated account support", "Custom integrations", "Priority implementation"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault()
                    setLeadForm((prev) => ({
                      ...prev,
                      message: "Hi, I am interested in the Internetily Enterprise / Custom plan. Please send me a quote.",
                    }))
                    scrollTo("contact")
                  }}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-900"
                >
                  Request quote
                  <Send className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <BillingCalculator
          geo={geo}
          onGetStarted={() => scrollTo("contact")}
          onContactSales={() => {
            setLeadForm((prev) => ({
              ...prev,
              message: "Hi, I am interested in the Internetily Enterprise / Custom plan. Please send me a quote.",
            }))
            scrollTo("contact")
          }}
        />

        <ProductVideoSection
          videoSrc="/Video 3.mp4"
          posterSrc="/video-3-poster.webp"
          eyebrow="Infrastructure"
          headline="Built for High Performance."
          body="Engineered with a modern, decoupled backend to ensure your network scales securely. Whether you are handling ten users or ten thousand, experience zero bottlenecks and rock-solid reliability."
          button="Read the Specs"
          onClick={() => {
            window.location.href = "/docs"
          }}
        />

        <section className="border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <SectionLabel>Onboarding</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
                  <SplitWords text="Go from request to live operations quickly" />
                </h2>
              </div>
              <div className="grid gap-4">
                {[
                  ["01", "Submit ISP details", "Tell us your company, routers, subscribers, payment channel, and support needs."],
                  ["02", "Connect payments and routers", "Internetily helps configure M-Pesa, MikroTik API access, RADIUS, and customer workflows."],
                  ["03", "Launch and monitor", "Your team starts running subscriptions, payments, support, and network access from one dashboard."],
                ].map(([step, title, body]) => (
                  <div key={step} className="grid gap-4 border border-zinc-700 bg-zinc-950/35 p-5 sm:grid-cols-[72px_1fr]">
                    <span className="text-4xl font-medium text-zinc-700">{step}</span>
                    <div>
                      <h3 className="text-xl font-medium text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AcademySection />

        <CaseStudiesSection />

        <TestimonialsSection />

        <section id="faqs" className="border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
          <div className="mx-auto max-w-4xl px-6 md:px-12">
            <div className="mb-12">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="mt-6 text-balance text-4xl font-normal md:text-6xl">
                <SplitWords text="Answers before the first call" />
              </h2>
            </div>
            {[
              {
                q: "How long does setup take?",
                a: "Most ISPs can become operational within 24 hours once router access, payment details, and onboarding information are available.",
              },
              {
                q: "Does Internetily work with MikroTik routers?",
                a: "Yes. Internetily connects to MikroTik RouterOS via API for PPPoE and hotspot provisioning, subscriber control, and router-aware billing workflows.",
              },
              {
                q: "How much does a WiFi billing system in Kenya cost?",
                a: "Internetily starts with a low activation fee, then usage-based billing around PPPoE footprint and hotspot revenue. That keeps pricing practical for small ISPs, estates, hostels, hotels, campuses, and public hotspot operators that are still growing.",
              },
              {
                q: "Is free ISP billing software for MikroTik enough?",
                a: "Free and open-source tools can work if your team is comfortable hosting, securing, maintaining, and extending the system. Internetily is built for teams that want MikroTik billing, M-Pesa payments, invoices, reminders, support, and customer self-service managed in one supported workflow.",
              },
              {
                q: "Does Internetily replace a FreeRADIUS billing system?",
                a: "Internetily works around RADIUS-driven PPPoE and hotspot access, then adds billing, payments, customer records, reminders, invoices, reporting, and renewal workflows on top of the network access layer.",
              },
              {
                q: "Can Internetily handle PPPoE, hotspot, FTTH, and FTTX billing?",
                a: "Yes. Internetily is designed for PPPoE billing, hotspot billing, WiFi payments, FTTH and FTTX operators, estate internet, campus WiFi, and small to growing ISP teams in Kenya.",
              },
              {
                q: "How should I compare Centipid, ISPMan, and other billing systems?",
                a: "Compare payment automation, MikroTik support, RADIUS workflows, customer self-service, invoice handling, support, reporting, setup effort, and the real cost of maintaining the system. Internetily is built for ISP teams that want guided onboarding and practical billing automation.",
              },
              {
                q: "Does Internetily support M-Pesa STK Push?",
                a: "Yes. Internetily supports M-Pesa STK Push and payment-aware subscriber activation, with regional payment workflows depending on your country and setup.",
              },
              {
                q: "What happens when a customer does not pay?",
                a: "Expired subscriptions can trigger automated suspension, reminders, and instant restoration once the customer renews.",
              },
              {
                q: "Can customers serve themselves?",
                a: "Yes. Subscribers can use a customer portal for renewals, invoices, receipts, usage checks, profile actions, and support requests.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes. You can request a trial without a card and use onboarding to confirm fit before committing.",
              },
            ].map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel>Guides</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal md:text-5xl">ISP operations resources</h2>
              </div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                View all articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {blogPosts.slice(0, 5).map((post) => (
                <article key={post.slug} className="group border border-zinc-800 bg-zinc-950">
                  <div className="relative h-44 overflow-hidden border-b border-zinc-800">
                    <Image src={post.coverImage} alt={post.coverImageAlt} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover opacity-75 transition group-hover:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">{post.category}</p>
                    <h3 className="mt-3 line-clamp-2 text-lg font-medium text-white">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                      Read guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Affiliate CTA Section */}
        <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(185,28,28,0.1),transparent_50%)]" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionLabel>Partner with Us</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-5xl">
                  Join the Internetily / Netily affiliate program for ISP referrals worldwide.
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-400">
                  Join our affiliate network and get paid every time a WISP, ISP, or Hotspot operator you refer pays for their first month. No limits, no caps — just cash directly to your M-Pesa or bank account.
                </p>
                <div className="mt-8">
                  <Link
                    href="/affiliate"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-500 hover:scale-105"
                  >
                    View 2026 Affiliate Program <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                <LazyVideo
                  src="/internetily-affiliate-intro.mp4"
                  poster="/internetily-affiliate-poster.webp"
                  label="Internetily affiliate program preview video"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="relative overflow-hidden bg-zinc-950 py-24 md:py-32">
          <Grain />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <SectionLabel>Start</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
                  <SplitWords text="Book an ISP billing demo" />
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-400">
                  Share your network details and we will map the cleanest Internetily setup for payments, MikroTik PPPoE, hotspot vouchers, WiFi billing, invoices, reminders, and customer self-service.
                </p>
                <div className="mt-8 grid gap-3">
                  {[
                    ["Sales", "Use the form for sales enquiries"],
                    ["Support", "Use your dashboard support channel"],
                    ["WhatsApp", "0100034307"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center gap-4 border border-zinc-800 bg-zinc-900 p-4">
                      <Banknote className="h-5 w-5 text-amber-400" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">{label}</p>
                        <p className="text-sm text-zinc-300">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {leadSubmitted ? (
                <div className="border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                  <Check className="mx-auto h-8 w-8 text-emerald-400" />
                  <h3 className="mt-4 text-2xl font-medium text-white">Message sent</h3>
                  <p className="mt-3 text-sm leading-6 text-emerald-100/80">
                    Thanks for reaching out. The Internetily team will review your ISP billing setup and get back to you within 24 hours.
                  </p>
                  <a
                    href="https://chat.whatsapp.com/GDBSxnHgcU0Ly7cc2qEjnC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#25D366] px-5 py-3 text-sm font-medium text-white"
                  >
                    Join WhatsApp community
                  </a>
                </div>
              ) : (
                <div className="border border-zinc-800 bg-zinc-900 p-6 md:p-8">
                  {affiliateReferralCode && (
                    <div className="mb-5 border border-amber-400/30 bg-amber-400/10 p-4">
                      <p className="text-sm font-medium text-amber-200">Affiliate referral applied</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Code {affiliateReferralCode} is securely attached to this enquiry for manual review.
                      </p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-300">Full name *</label>
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(event) => {
                          setLeadForm({ ...leadForm, name: event.target.value })
                          if (leadFormErrors.name) setLeadFormErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        className={`h-12 w-full border bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500 ${
                          leadFormErrors.name ? "border-red-500" : "border-zinc-700"
                        }`}
                        placeholder="John Doe"
                      />
                      {leadFormErrors.name && <p className="mt-1 text-xs text-red-400">{leadFormErrors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-300">Email *</label>
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(event) => {
                          setLeadForm({ ...leadForm, email: event.target.value })
                          if (leadFormErrors.email) setLeadFormErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        className={`h-12 w-full border bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500 ${
                          leadFormErrors.email ? "border-red-500" : "border-zinc-700"
                        }`}
                        placeholder="john@example.com"
                      />
                      {leadFormErrors.email && <p className="mt-1 text-xs text-red-400">{leadFormErrors.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-300">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                        className="h-12 w-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-300">ISP / Company</label>
                      <input
                        type="text"
                        value={leadForm.company}
                        onChange={(event) => setLeadForm({ ...leadForm, company: event.target.value })}
                        className="h-12 w-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
                        placeholder="Your ISP, hotspot, estate, or company name"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-300">Where did you hear about us?</label>
                      <select
                        value={leadForm.lead_source}
                        onChange={(event) => setLeadForm({ ...leadForm, lead_source: event.target.value })}
                        disabled={Boolean(affiliateReferralCode)}
                        className="h-12 w-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
                      >
                        <option value="">Select a source</option>
                        {LEAD_SOURCE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!affiliateReferralCode && (
                      <div>
                        <label className="mb-1.5 block text-sm text-zinc-300">Who referred you?</label>
                        <input
                          type="text"
                          value={leadForm.referral_name}
                          onChange={(event) => setLeadForm({ ...leadForm, referral_name: event.target.value })}
                          className="h-12 w-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
                          placeholder="Optional"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-sm text-zinc-300">Message</label>
                    <textarea
                      value={leadForm.message}
                      onChange={(event) => setLeadForm({ ...leadForm, message: event.target.value })}
                      rows={5}
                      className="min-h-32 w-full resize-none border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                      placeholder="Tell us your county, estates or towns served, subscriber size, MikroTik or router setup, payment workflow, and what you want to automate..."
                    />
                  </div>
                  <button
                    onClick={submitMainLead}
                    disabled={leadSubmitting}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-white text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
                  >
                    {leadSubmitting ? "Sending..." : "Request demo"}
                    {!leadSubmitting && <Send className="h-4 w-4" />}
                  </button>
                  {leadSubmitError && (
                    <p className="mt-3 border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300" role="alert">
                      {leadSubmitError}
                    </p>
                  )}
                  <p className="mt-3 text-center text-xs text-zinc-500">Demos cover payments, MikroTik, hotspot, WiFi billing, invoices, and renewals. No spam.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="sr-only" aria-label="Internetily ISP billing software overview">
          <h2>Internetily and Netily ISP billing system for Kenya</h2>
          <p>
            Internetily, formerly Netily, is an ISP billing system in Kenya for ISPs, WISPs, hotspot operators,
            estate WiFi teams, hotels, hostels, schools, campuses, and managed internet providers. It supports
            M-Pesa STK Push, MikroTik PPPoE billing, hotspot billing software Kenya workflows, WiFi billing
            system Kenya workflows, RADIUS authentication, subscriber management, automated invoicing, SMS
            payment reminders, customer self-service portals, payment reconciliation, bandwidth management,
            voucher billing, and internet service provider management.
          </p>
          <p>
            Netily remains part of the product history. Internetily is the current brand for the same trusted
            ISP automation core, with continued focus on practical billing, MikroTik, hotspot, support, and
            customer operations for growing internet providers.
          </p>
          <p>
            Operators who know the platform as Netily can still recognize the billing workflows, regional payment
            focus, onboarding style, and ISP operations knowledge now presented under the Internetily name.
          </p>
          <p>
            Internetily supports fiber ISP billing software, wireless ISP billing software, WISP billing,
            hotel WiFi billing, apartment internet billing, campus WiFi management, school WiFi billing,
            estate internet management, church WiFi billing, fixed wireless access billing, Nairobi ISP
            billing, Mombasa ISP billing, Kisumu WISP billing, Nakuru internet billing, Eldoret ISP
            management, Thika ISP software, Machakos ISP billing, and Kenya county ISP billing workflows.
          </p>
          <p>
            Some buyers compare ISP management tools, open source ISP billing software, free ISP billing
            software, MikroTik billing systems, and regional alternatives. Internetily helps them compare
            payment handling, implementation quality, pricing transparency, support workflows, and customer outcomes.
          </p>
          <p>
            Internetily preserves the Netily product strengths: M-Pesa STK Push, Airtel Money, Telkom Kash,
            Co-operative Bank, Equity Bank, I&amp;M Bank, Kingdom Bank, National Bank, SBM Bank, Stanbic Bank,
            Standard Chartered, bank-aligned billing workflows, daily settlement visibility, customer receipts,
            automated payment reconciliation, and payment reminders for Kenyan ISP billing operations.
          </p>
          <p>
            Internetily supports dashboard themes, staff role edits, permission controls, OTP-sensitive actions,
            audit trails, lead capture, sales follow-up, support tickets, customer callbacks, previous billing
            cycle breakdowns, revenue analytics, churn signals, inventory context, routers, networks, payments,
            vouchers, invoices, loyalty, promotions, captive portal ads, referral rewards, and customer
            self-service for renewals, usage checks, receipt downloads, invoice downloads, support requests,
            PPPoE password reset, and mobile-first subscriber access.
          </p>
          <p>
            The comparison and alternatives pages explain practical trade-offs around regional ISP billing tools,
            open source ISP management, GitHub ISP billing software, free ISP billing software, MikroTik ISP
            billing software, RADIUS ISP management systems, and East African ISP management software.
          </p>
          <p>
            The Internetily and Netily affiliate program is built for ISP consultants, MikroTik engineers, WISP
            communities, hotspot resellers, telecom creators, and B2B SaaS partners who refer internet providers
            worldwide. Affiliate leads are tracked through referral links and reviewed manually for commission
            eligibility, making the program relevant for best ISP affiliate program 2026, ISP billing software
            affiliate program, WISP referral program, MikroTik consultant referral program, and global telecom
            SaaS affiliate program searches.
          </p>
        </section>
      </main>

      <footer className="public-footer relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="select-none whitespace-nowrap text-[18vw] font-black leading-none tracking-tighter text-white/[0.035]">
            INTERNETILY
          </span>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 lg:px-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Image
                  src="/internetily-white-logo-320.webp"
                  alt="Internetily"
                  width={280}
                  height={96}
                  className="public-footer-logo-dark h-20 w-auto object-contain md:h-24"
                />
                <Image
                  src="/internetily-logo-320.webp"
                  alt="Internetily"
                  width={280}
                  height={96}
                  className="public-footer-logo-light hidden h-20 w-auto object-contain md:h-24"
                />
              </div>
              <p className="mt-5 text-sm leading-6 text-zinc-500">
                Modern ISP billing and management for payment, router, customer, and revenue operations.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Product</h3>
              <ul className="mt-4 space-y-1 text-sm text-zinc-500 [&_a]:inline-flex [&_a]:min-h-12 [&_a]:items-center">
                <li><a href="#features" onClick={(event) => { event.preventDefault(); scrollTo("features") }}>Features</a></li>
                <li><a href="#pricing" onClick={(event) => { event.preventDefault(); scrollTo("pricing") }}>Pricing</a></li>
                <li><a href="#contact" onClick={(event) => { event.preventDefault(); scrollTo("contact") }}>Start trial</a></li>
                <li><Link href="/docs">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium">Resources</h3>
              <ul className="mt-4 space-y-1 text-sm text-zinc-500 [&_a]:inline-flex [&_a]:min-h-12 [&_a]:items-center">
                <li><Link href="/blog">ISP growth blog</Link></li>
                <li><Link href="/solutions/isp-billing-software-kenya-counties">Kenya county billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-nairobi">Nairobi ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-mombasa">Mombasa WiFi billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-tanzania">Tanzania ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-uganda">Uganda ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-south-africa">South Africa ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-united-kingdom">UK ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-usa">USA ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-australia">Australia ISP billing</Link></li>
                <li><Link href="/solutions/isp-billing-software-new-zealand">New Zealand ISP billing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium">Company</h3>
              <ul className="mt-4 space-y-1 text-sm text-zinc-500 [&_a]:inline-flex [&_a]:min-h-12 [&_a]:items-center">
                <li><Link href="/affiliate">Affiliate Program</Link></li>
                <li><Link href="/privacy">Privacy policy</Link></li>
                <li><Link href="/terms">Terms of service</Link></li>
                <li><a href="tel:+254111325479">0100034307</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} Internetily. All rights reserved.</p>
            <a href="https://mjengocorporate.com/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center hover:text-zinc-400">
              a product of Mjengo Corporate
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
