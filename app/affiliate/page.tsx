import React from "react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { ArrowRight, CheckCircle2, ChevronDown, Gift, Share2, Wallet, Users } from "lucide-react"
import { MjengoFooter } from "@/components/mjengo-footer"

export const metadata: Metadata = {
  title: "Netily Affiliate Program | Earn by Referring ISPs in Kenya & Africa",
  description:
    "Join the Netily Affiliate Program. Refer ISPs, WISPs, and hotspot operators in Kenya and Africa to our billing software and earn recurring commissions via M-Pesa.",
  keywords: [
    "isp affiliate program kenya",
    "earn money referring isps",
    "isp billing software affiliate",
    "mikrotik affiliate program",
    "wisp referral program africa",
    "m-pesa hotspot affiliate",
    "best isp affiliate network nairobi",
    "netily affiliate",
    "make money online kenya tech",
    "b2b saas affiliate program africa",
  ],
}

export default function AffiliateLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 selection:bg-red-500/30 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
            <Image
              src="/White logo no background.png"
              alt="Netily"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/affiliate/login"
              className="hidden text-sm font-semibold text-slate-300 hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/affiliate/register"
              className="rounded-full bg-gradient-to-r from-red-600 to-red-700 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:scale-105 hover:from-red-500 hover:to-red-600"
            >
              Become an Affiliate
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.15),transparent_40%)]" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400">
              <Gift className="h-4 w-4" />
              <span>Netily Partner Network</span>
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl">
              Turn your network into <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">recurring revenue.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
              Refer Internet Service Providers (ISPs), WISPs, and hotspot operators across Africa to Netily. Earn generous commissions paid directly to your M-Pesa for every successful activation.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/affiliate/register"
                className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/20 transition hover:bg-red-500 hover:scale-105"
              >
                Join the Program <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Video Player */}
          <div className="mx-auto mt-20 max-w-5xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-red-900/20">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none z-10" />
              <video
                src="/internetily-affiliate-intro.mp4"
                controls
                poster="/internetily_logo_2k.jpeg"
                className="w-full aspect-video object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="border-t border-zinc-800 bg-zinc-900/50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">How it works</h2>
              <p className="mt-4 text-lg text-slate-400">Start earning in three simple steps. No technical knowledge required.</p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900 p-8 hover:border-red-500/30 transition-colors">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">1. Sign up</h3>
                <p className="mt-2 text-sm text-slate-400">Create your free affiliate account in under 60 seconds and get your unique referral link.</p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900 p-8 hover:border-red-500/30 transition-colors">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">2. Share your link</h3>
                <p className="mt-2 text-sm text-slate-400">Post your link in ISP WhatsApp groups, forums, or send it directly to operators who need billing software.</p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900 p-8 hover:border-red-500/30 transition-colors">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">3. Get Paid</h3>
                <p className="mt-2 text-sm text-slate-400">When an ISP pays for their first month, you get a generous cut sent straight to your M-Pesa or Bank account.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tiers & Commission */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Gamified Earnings</h2>
              <p className="mt-4 text-lg text-slate-400">The more ISPs you refer, the higher your commission tier.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Bronze */}
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-sm relative">
                <h3 className="text-xl font-bold text-amber-600">Bronze</h3>
                <p className="mt-2 text-sm text-slate-400">0 - 5 ISPs referred</p>
                <div className="my-6 text-4xl font-black text-white">KES 500 <span className="text-lg font-normal text-slate-500">/ sale</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-amber-600" /> Standard payout rate
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-amber-600" /> 30-day cookie window
                  </li>
                </ul>
              </div>

              {/* Silver */}
              <div className="rounded-3xl border border-red-500/30 bg-zinc-800 p-8 shadow-2xl shadow-red-900/20 relative scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                <h3 className="text-xl font-bold text-slate-300">Silver</h3>
                <p className="mt-2 text-sm text-slate-400">6 - 15 ISPs referred</p>
                <div className="my-6 text-4xl font-black text-white">KES 750 <span className="text-lg font-normal text-slate-500">/ sale</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> 50% bonus per sale
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> Priority payouts
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-red-500" /> 30-day cookie window
                  </li>
                </ul>
              </div>

              {/* Gold */}
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-sm relative">
                <h3 className="text-xl font-bold text-yellow-500">Gold</h3>
                <p className="mt-2 text-sm text-slate-400">16+ ISPs referred</p>
                <div className="my-6 text-4xl font-black text-white">KES 1,000 <span className="text-lg font-normal text-slate-500">/ sale</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500" /> Double payout rate
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500" /> Direct line to founders
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="border-t border-zinc-800 bg-zinc-900/50 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-3xl font-black tracking-tight text-white text-center sm:text-4xl mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <details className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-semibold">
                  Who is the ideal Netily customer?
                  <span className="shrink-0 rounded-full bg-zinc-800 p-1.5 text-slate-400 group-open:bg-red-500/10 group-open:text-red-500 transition">
                    <ChevronDown className="h-5 w-5 group-open:-rotate-180 transition-transform" />
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-slate-400 text-sm">
                  The ideal customer is an ISP or WISP using MikroTik routers for PPPoE or Hotspot authentication, who wants to automate their billing and M-Pesa payments.
                </p>
              </details>

              <details className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-semibold">
                  How does the 30-day cookie work?
                  <span className="shrink-0 rounded-full bg-zinc-800 p-1.5 text-slate-400 group-open:bg-red-500/10 group-open:text-red-500 transition">
                    <ChevronDown className="h-5 w-5 group-open:-rotate-180 transition-transform" />
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-slate-400 text-sm">
                  When a prospect clicks your unique referral link, a cookie is saved in their browser. If they sign up for Netily at any time within the next 30 days, you get credited for the referral.
                </p>
              </details>

              <details className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white font-semibold">
                  When and how do I get paid?
                  <span className="shrink-0 rounded-full bg-zinc-800 p-1.5 text-slate-400 group-open:bg-red-500/10 group-open:text-red-500 transition">
                    <ChevronDown className="h-5 w-5 group-open:-rotate-180 transition-transform" />
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-slate-400 text-sm">
                  Payouts are processed on the 15th of every month for the previous month&apos;s successful conversions. You can choose to be paid directly via M-Pesa or Bank Transfer.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden border-t border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-950/20" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Ready to start earning?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">Join top affiliates making steady income by referring the best ISP billing software in Africa.</p>
            <div className="mt-10">
              <Link
                href="/affiliate/register"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/20 transition hover:bg-red-500 hover:scale-105"
              >
                Create your free account <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/White logo no background.png"
              alt="Netily"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <span className="text-zinc-600 font-bold ml-2">Affiliates</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/" className="hover:text-white">Main Site</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
        <div className="mt-8 text-center">
          <MjengoFooter />
        </div>
      </footer>
    </div>
  )
}
