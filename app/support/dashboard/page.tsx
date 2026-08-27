"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Building2, CheckCircle2, Headphones, Loader2, MessageSquare, UserPlus } from "lucide-react"
import { supportApi, type SupportDashboard } from "@/lib/support-api"
import { Button } from "@/components/ui/button"

export default function SupportDashboardPage() {
  const [data, setData] = useState<SupportDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supportApi.getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/40">Support command center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Help tenants get moving.</h1>
          <p className="mt-3 max-w-2xl text-white/58">
            Register new ISP accounts, follow up leads, and leave a clean operational trail.
          </p>
        </div>
        <Button asChild className="rounded-2xl bg-white text-black hover:bg-white/90">
          <Link href="/admin/selfie">
            Register tenant
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageSquare} label="Open Leads" value={stats?.open_leads ?? 0} />
        <StatCard icon={CheckCircle2} label="Contacted Leads" value={stats?.contacted_leads ?? 0} />
        <StatCard icon={Building2} label="Active Tenants" value={stats?.active_tenants ?? 0} />
        <StatCard icon={Headphones} label="My Actions Today" value={stats?.my_actions_today ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Recent leads</h2>
              <p className="text-sm text-white/45">Fresh prospects needing follow-up.</p>
            </div>
            <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black">
              <Link href="/support/leads">Open leads</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {(data?.recent_leads || []).map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold">{lead.company_name || lead.name}</p>
                    <p className="text-sm text-white/50">{lead.email} · {lead.phone || "No phone"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${lead.is_contacted ? "bg-white text-black" : "border border-white/15 text-white/70"}`}>
                    {lead.is_contacted ? "Contacted" : "Open"}
                  </span>
                </div>
              </div>
            ))}
            {!data?.recent_leads?.length && <p className="py-8 text-center text-white/45">No leads yet.</p>}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <h2 className="text-xl font-black">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <ActionLink href="/admin/selfie" icon={UserPlus} title="Create ISP account" copy="Use the hidden onboarding route." />
            <ActionLink href="/support/leads" icon={MessageSquare} title="Manage leads" copy="Track referrals and conversions." />
          </div>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-white/45">My recent activity</h3>
          <div className="mt-4 space-y-3">
            {(data?.recent_activity || []).map((log) => (
              <div key={log.id} className="rounded-2xl bg-black/30 p-3">
                <p className="text-sm font-semibold">{log.summary}</p>
                <p className="mt-1 text-xs text-white/40">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
            {!data?.recent_activity?.length && <p className="text-sm text-white/45">No support actions recorded yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.1]">
      <Icon className="h-5 w-5 text-white/65" />
      <p className="mt-5 text-3xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-white/48">{label}</p>
    </div>
  )
}

function ActionLink({ href, icon: Icon, title, copy }: { href: string; icon: React.ElementType; title: string; copy: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:bg-white hover:text-black">
      <Icon className="h-5 w-5" />
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs opacity-60">{copy}</span>
      </span>
    </Link>
  )
}
