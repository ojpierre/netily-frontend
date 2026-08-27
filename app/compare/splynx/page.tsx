import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Cloud, Zap, Shield, Globe } from "lucide-react"
import { MjengoFooter } from "@/components/mjengo-footer"

export const metadata: Metadata = {
  title: "Netily vs Splynx | The Modern Cloud Alternative for ISPs in Africa",
  description:
    "Compare Netily and Splynx for your ISP. See why African WISPs are choosing Netily's cloud-native architecture and built-in M-Pesa & Paystack integrations.",
  keywords: ["splynx alternative", "netily vs splynx", "isp billing software", "mikrotik billing cloud"],
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

export default function SplynxComparisonPage() {
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
              href="/"
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32">
          <Grain />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(185,28,28,0.15),transparent_50%)]" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400">
              <Globe className="h-4 w-4" />
              <span>Netily vs. Splynx</span>
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl">
              The modern, cloud-native alternative for African ISPs.
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Comparing Netily and Splynx? Discover how Netily’s zero-maintenance cloud infrastructure and native mobile money integrations provide a streamlined experience without the overhead of managing on-premise servers.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/#contact"
                className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/20 transition hover:bg-red-500 hover:scale-105"
              >
                Try Netily Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-24 border-t border-zinc-800 bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-black text-center text-white mb-16">Why forward-thinking ISPs choose Netily</h2>
            
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Cloud className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">100% Cloud-Native</h3>
                <p className="text-slate-400 leading-relaxed">
                  Unlike traditional systems that may require you to provision, secure, and maintain your own Linux servers, Netily is a fully managed SaaS. You sign up, connect your MikroTik router, and you're done. No server maintenance required.
                </p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Zap className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Native Mobile Money</h3>
                <p className="text-slate-400 leading-relaxed">
                  Netily was built specifically for the African market. M-Pesa STK Push, Paystack, and Flutterwave are native integrations built into the core—no third-party payment modules or complex API configurations needed.
                </p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Shield className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Modern, Simple UI</h3>
                <p className="text-slate-400 leading-relaxed">
                  Legacy billing software can be overwhelming with hundreds of menus. Netily’s dashboard is intentionally designed to be clean, fast, and accessible on any device, reducing the learning curve for your staff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Objective Comparison Table */}
        <section className="py-24 border-t border-zinc-800 bg-zinc-950">
          <Grain />
          <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden backdrop-blur-sm">
              <table className="w-full text-left">
                <thead className="bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="py-5 px-6 text-sm font-semibold text-white w-1/3">Feature</th>
                    <th className="py-5 px-6 text-sm font-semibold text-red-400 w-1/3 border-l border-zinc-800 bg-red-950/10">Netily</th>
                    <th className="py-5 px-6 text-sm font-semibold text-slate-400 w-1/3 border-l border-zinc-800">Legacy Systems</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">Infrastructure</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Fully Managed Cloud (SaaS)</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Often requires self-hosted Linux servers</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">African Payments</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Native M-Pesa, Paystack, Flutterwave</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Often requires third-party plugins</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">Router Support</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">MikroTik RouterOS</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Multiple Vendors</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">Setup Time</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Minutes (No OS installation)</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Hours to Days (Requires OS & DB setup)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden border-t border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-950/20" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Ready for a modern billing experience?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">Join the fastest-growing ISPs across Africa who have migrated to Netily.</p>
            <div className="mt-10">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-red-600/20 transition hover:bg-red-500 hover:scale-105"
              >
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MjengoFooter />
    </div>
  )
}
