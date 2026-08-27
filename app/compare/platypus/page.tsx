import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Cloud, Zap, Shield, Globe } from "lucide-react"
import { MjengoFooter } from "@/components/mjengo-footer"

export const metadata: Metadata = {
  title: "Netily vs Platypus | The Next-Gen Alternative for ISP Billing",
  description:
    "Migrating from Platypus ISP Billing? Discover why modern Internet Service Providers are switching to Netily's fully-managed cloud infrastructure.",
  keywords: ["platypus isp billing", "platypus alternative", "isp billing software", "netily vs platypus"],
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

export default function PlatypusComparisonPage() {
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
              <span>Netily vs. Platypus</span>
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl">
              Modernize your ISP with a next-generation platform.
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Migrating from Platypus? Experience the speed and simplicity of Netily. Fully managed cloud architecture, intuitive modern UI, and automated African payment gateways—all without the legacy overhead.
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
            <h2 className="text-3xl font-black text-center text-white mb-16">Why ISPs are upgrading to Netily</h2>
            
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Cloud className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Zero Maintenance Cloud</h3>
                <p className="text-slate-400 leading-relaxed">
                  Say goodbye to managing on-premise servers, dealing with OS updates, or maintaining complex database backups. Netily is a true SaaS platform that handles all infrastructure heavy lifting for you.
                </p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Zap className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Built for Modern Payments</h3>
                <p className="text-slate-400 leading-relaxed">
                  Netily natively integrates with M-Pesa, Paystack, and Flutterwave. There's no need to build custom middleware or rely on outdated payment bridges.
                </p>
              </div>

              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <Shield className="h-8 w-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Consumer-Grade UI</h3>
                <p className="text-slate-400 leading-relaxed">
                  We believe enterprise software shouldn't look like it was built in the 2000s. Netily's interface is fast, responsive, and intuitive, cutting down staff training time drastically.
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
                    <td className="py-4 px-6 text-sm text-slate-300">Architecture</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Cloud-Native SaaS</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Often On-Premise / Self-Hosted</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">African Mobile Money</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Native Built-In Integrations</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Requires Custom API Work</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">Interface Design</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Modern, Mobile-Responsive Dashboard</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Classic Desktop-First UI</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm text-slate-300">Updates & Maintenance</td>
                    <td className="py-4 px-6 text-sm text-white border-l border-zinc-800 bg-red-950/5">Automatic, Zero Downtime</td>
                    <td className="py-4 px-6 text-sm text-slate-400 border-l border-zinc-800">Manual Server Patching</td>
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
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Ready to migrate your ISP?</h2>
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
