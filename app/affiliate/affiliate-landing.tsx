"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ChevronDown, Gift, Share2, Users, Wallet, CheckCircle2, Menu, X } from "lucide-react"

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-3 border border-zinc-700 px-4 py-2 bg-zinc-900/50">
      <span className="h-2.5 w-2.5 bg-red-600" />
      <span className="text-sm font-medium tracking-wide text-zinc-400">{children}</span>
    </div>
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

const heroPhrases = [
  "Internet Service Providers",
  "Wireless ISPs (WISPs)",
  "Hotspot Operators",
  "Fiber Networks",
]

function RotatingHeroText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % heroPhrases.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <span className="relative inline-flex min-w-[12ch] overflow-hidden align-bottom text-red-500">
      <AnimatePresence mode="wait">
        <motion.span
          key={heroPhrases[index]}
          initial={{ y: 18, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -18, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block whitespace-nowrap"
        >
          {heroPhrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function AffiliateLandingClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="bg-black text-white selection:bg-red-500/30 min-h-screen">
      <Grain />
      
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="sr-only">Netily Affiliate Program</span>
              <Image
                src="/White logo no background.png"
                alt="Internetily"
                width={160}
                height={50}
                className="h-8 w-auto object-contain"
              />
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase ml-2 border-l border-white/20 pl-4 hidden sm:inline-block">
                Partners
              </span>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-zinc-400"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works") }} className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition">How it works</a>
            <a href="#tiers" onClick={(e) => { e.preventDefault(); scrollTo("tiers") }} className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition">Tiers</a>
            <a href="#faqs" onClick={(e) => { e.preventDefault(); scrollTo("faqs") }} className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition">FAQ</a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6 lg:items-center">
            <Link href="/affiliate/login" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition">
              Log in
            </Link>
            <Link
              href="/affiliate/register"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition"
            >
              Become an Affiliate
            </Link>
          </div>
        </nav>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-zinc-950 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                  <span className="sr-only">Netily</span>
                  <Image src="/White logo no background.png" alt="Netily" width={120} height={40} className="h-8 w-auto" />
                </Link>
                <button type="button" className="-m-2.5 rounded-md p-2.5 text-zinc-400" onClick={() => setMobileMenuOpen(false)}>
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-white/10">
                  <div className="space-y-2 py-6">
                    <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works") }} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-zinc-800">How it works</a>
                    <a href="#tiers" onClick={(e) => { e.preventDefault(); scrollTo("tiers") }} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-zinc-800">Tiers</a>
                    <a href="#faqs" onClick={(e) => { e.preventDefault(); scrollTo("faqs") }} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-zinc-800">FAQ</a>
                  </div>
                  <div className="py-6 space-y-4">
                    <Link href="/affiliate/login" onClick={() => setMobileMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-zinc-800">Log in</Link>
                    <Link href="/affiliate/register" onClick={() => setMobileMenuOpen(false)} className="-mx-3 block rounded-lg bg-red-600 px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-red-500">Become an Affiliate</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen overflow-hidden border-b border-zinc-800 pt-24 lg:pt-0 flex flex-col justify-center">
          <Grain />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_50%)]" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16 w-full pb-20 pt-10">
            <div className="grid gap-16 lg:gap-24 lg:grid-cols-2 lg:items-center">
              <div className="max-w-2xl">
                <SectionLabel>Partner Network</SectionLabel>
                <h1 className="mt-8 text-balance text-5xl font-normal leading-tight tracking-tight text-white md:text-7xl">
                  <SplitWords text="Refer" /> <br />
                  <RotatingHeroText /> <br />
                  <SplitWords text="and earn revenue." />
                </h1>
                <p className="mt-6 text-lg leading-8 text-zinc-400 max-w-xl">
                  Join the Netily Partner Network. Refer ISPs, WISPs, and hotspot operators in Africa to the fastest-growing billing platform and get paid recurring commissions straight to M-Pesa.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/affiliate/register"
                    className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-white px-8 font-medium text-black transition-all hover:bg-zinc-200"
                  >
                    <span>Become an Affiliate</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#video"
                    onClick={(e) => { e.preventDefault(); scrollTo("video") }}
                    className="inline-flex h-12 items-center justify-center px-6 font-medium text-zinc-300 transition-colors hover:text-white"
                  >
                    Watch video
                  </a>
                </div>
              </div>

              {/* Decorative side element */}
              <div className="relative hidden lg:block h-[550px] w-full rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/happy_affiliate_partner.png"
                  alt="Happy Affiliate Partner"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating commission badge */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="rounded-xl border border-red-500/20 bg-black/60 p-6 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-400 uppercase tracking-widest">Commission Received</p>
                      <Gift className="h-5 w-5 text-red-500 animate-pulse" />
                    </div>
                    <p className="mt-2 text-4xl font-black text-white">KES 45,000</p>
                    <p className="mt-1 text-xs text-zinc-400">Paid today via M-Pesa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section id="video" className="relative border-b border-zinc-800 bg-zinc-950 py-24 md:py-32">
          <Grain />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:items-center">
              <div>
                <SectionLabel>The Program</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-5xl">
                  <SplitWords text="See how the Netily affiliate program works." />
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-400">
                  You don't need technical knowledge to earn. Watch our short intro video to understand who to target and how the 30-day tracking cookie attributes sales directly to you.
                </p>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                <video
                  src="/internetily-affiliate-intro.mp4"
                  poster="/internetily_logo_2k.jpeg"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="relative border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <Grain />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <SectionLabel>Process</SectionLabel>
            <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-5xl max-w-2xl">
              <SplitWords text="Start earning in three simple steps." />
            </h2>
            
            <div className="mt-20 grid gap-10 md:grid-cols-3">
              <div className="relative border-t border-zinc-800 pt-8">
                <span className="absolute -top-3 left-0 bg-zinc-900 px-2 text-sm font-bold text-red-500">01</span>
                <Users className="mb-6 h-8 w-8 text-zinc-400" />
                <h3 className="text-xl font-medium text-white">Sign Up</h3>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Create your free affiliate account in under 60 seconds. Instantly access your dashboard, marketing assets, and unique referral link.
                </p>
              </div>
              
              <div className="relative border-t border-zinc-800 pt-8">
                <span className="absolute -top-3 left-0 bg-zinc-900 px-2 text-sm font-bold text-red-500">02</span>
                <Share2 className="mb-6 h-8 w-8 text-zinc-400" />
                <h3 className="text-xl font-medium text-white">Share Your Link</h3>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Post your link in ISP WhatsApp groups, Facebook forums, or send it directly to operators. Our 30-day cookie ensures you get credit.
                </p>
              </div>
              
              <div className="relative border-t border-zinc-800 pt-8">
                <span className="absolute -top-3 left-0 bg-zinc-900 px-2 text-sm font-bold text-red-500">03</span>
                <Wallet className="mb-6 h-8 w-8 text-zinc-400" />
                <h3 className="text-xl font-medium text-white">Get Paid</h3>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  When an ISP pays for their first month, you earn a commission. We process payouts directly to M-Pesa or Bank on the 15th of every month.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gamified Tiers */}
        <section id="tiers" className="relative border-b border-zinc-800 bg-zinc-950 py-24 md:py-32 overflow-hidden">
          <Grain />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <SectionLabel>Rewards</SectionLabel>
            <div className="mt-6 md:flex md:items-end md:justify-between">
              <h2 className="text-balance text-4xl font-normal leading-tight md:text-5xl max-w-2xl">
                <SplitWords text="The more you refer, the more you earn." />
              </h2>
              <p className="mt-4 md:mt-0 text-base text-zinc-400 max-w-md">
                Our tiered gamification system rewards top performers. Unlock higher commission rates simply by bringing in more operators.
              </p>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-3">
              {/* Bronze */}
              <div className="relative flex flex-col border border-zinc-800 bg-zinc-900/50 p-8 rounded-2xl">
                <Grain />
                <h3 className="text-xl font-medium text-white">Bronze</h3>
                <p className="mt-2 text-sm text-zinc-500">0 - 5 ISPs referred</p>
                <div className="my-8">
                  <span className="text-4xl font-normal text-white">KES 500</span>
                  <span className="text-zinc-500"> / sale</span>
                </div>
                <ul className="mt-auto space-y-4">
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-zinc-600" /> Standard payout rate
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-zinc-600" /> 30-day cookie window
                  </li>
                </ul>
              </div>

              {/* Silver */}
              <div className="relative flex flex-col border border-red-500/30 bg-zinc-900 p-8 shadow-[0_0_40px_rgba(220,38,38,0.1)] md:-translate-y-4 rounded-2xl overflow-hidden">
                <Grain />
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                <span className="absolute -top-3 right-8 bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full">
                  Most Popular
                </span>
                
                <h3 className="text-xl font-medium text-white">Silver</h3>
                <p className="mt-2 text-sm text-zinc-500">6 - 15 ISPs referred</p>
                <div className="my-8">
                  <span className="text-4xl font-normal text-white">KES 750</span>
                  <span className="text-zinc-500"> / sale</span>
                </div>
                <ul className="mt-auto space-y-4">
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> 50% bonus per sale
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> Priority M-Pesa payouts
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> Dedicated swipe file
                  </li>
                </ul>
              </div>

              {/* Gold */}
              <div className="relative flex flex-col border border-zinc-800 bg-zinc-900/50 p-8 rounded-2xl">
                <Grain />
                <h3 className="text-xl font-medium text-white">Gold</h3>
                <p className="mt-2 text-sm text-zinc-500">16+ ISPs referred</p>
                <div className="my-8">
                  <span className="text-4xl font-normal text-white">KES 1,000</span>
                  <span className="text-zinc-500"> / sale</span>
                </div>
                <ul className="mt-auto space-y-4">
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-600" /> Double payout rate
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-600" /> Direct line to founders
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-600" /> Custom discount codes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="relative border-b border-zinc-800 bg-zinc-900 py-24 md:py-32">
          <Grain />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-5xl">
                  <SplitWords text="Common questions." />
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-400">
                  Everything you need to know about referring ISPs and earning commissions.
                </p>
              </div>
              
              <div className="space-y-4">
                <details className="group border border-zinc-800 bg-zinc-950 p-6 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-medium">
                    Who is the ideal Netily customer?
                    <ChevronDown className="h-5 w-5 text-zinc-500 group-open:-rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 border-t border-zinc-800 pt-4 leading-relaxed text-zinc-400 text-sm">
                    The ideal customer is an ISP or WISP using MikroTik routers for PPPoE or Hotspot authentication, who wants to automate their billing and M-Pesa payments.
                  </div>
                </details>

                <details className="group border border-zinc-800 bg-zinc-950 p-6 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-medium">
                    How does the 30-day cookie work?
                    <ChevronDown className="h-5 w-5 text-zinc-500 group-open:-rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 border-t border-zinc-800 pt-4 leading-relaxed text-zinc-400 text-sm">
                    When a prospect clicks your unique referral link, a cookie is saved in their browser. If they sign up for Netily at any time within the next 30 days, you get credited for the referral.
                  </div>
                </details>

                <details className="group border border-zinc-800 bg-zinc-950 p-6 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-medium">
                    When and how do I get paid?
                    <ChevronDown className="h-5 w-5 text-zinc-500 group-open:-rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 border-t border-zinc-800 pt-4 leading-relaxed text-zinc-400 text-sm">
                    Payouts are processed on the 15th of every month for the previous month&apos;s successful conversions. You can choose to be paid directly via M-Pesa or Bank Transfer.
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-zinc-950 py-24 md:py-32 border-b border-zinc-800">
          <Grain />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent_70%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-16 text-center">
            <div className="mx-auto flex w-fit items-center gap-3 border border-zinc-700 px-4 py-2 bg-zinc-900/50">
              <span className="h-2.5 w-2.5 bg-red-600" />
              <span className="text-sm font-medium tracking-wide text-zinc-400">Start Now</span>
            </div>
            <h2 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-normal leading-tight md:text-5xl">
              Ready to turn your network into revenue?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400">
              Join top affiliates making steady income by referring the best ISP billing software in Africa. Setup takes less than a minute.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/affiliate/register"
                className="group inline-flex h-12 items-center justify-center rounded-md bg-white px-8 font-medium text-black transition-all hover:bg-zinc-200"
              >
                Create your free account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bg-black pt-12 pb-8 overflow-hidden">
        <Grain />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <Image
              src="/White logo no background.png"
              alt="Netily"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <span className="text-zinc-600 font-medium ml-2 border-l border-zinc-800 pl-2">Affiliate Program</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/" className="hover:text-white transition">Main Site</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
