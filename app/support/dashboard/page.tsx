"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Building2, CheckCircle2, Headphones, Inbox, MessageSquare, UserPlus, History } from "lucide-react"
import { supportApi, type SupportDashboard } from "@/lib/support-api"
import { Button } from "@/components/ui/button"

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#027EFB] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
const panel = "rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl"

export default function SupportDashboardPage() {
  const [data, setData] = useState<SupportDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supportApi.getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4da3ff]">Support command center</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Help tenants get moving.</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">
            Register new ISP accounts, follow up leads, and leave a clean operational trail.
          </p>
        </div>
        <Button asChild className={`h-11 rounded-xl bg-[#027EFB] px-5 text-white hover:bg-[#1a8dff] ${focusRing}`}>
          <Link href="/admin/selfie">
            Register tenant
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard icon={MessageSquare} label="Open Leads" value={stats?.open_leads ?? 0} loading={loading} />
        <StatCard icon={CheckCircle2} label="Contacted Leads" value={stats?.contacted_leads ?? 0} loading={loading} />
        <StatCard icon={Building2} label="Active Tenants" value={stats?.active_tenants ?? 0} loading={loading} />
        <StatCard icon={Headphones} label="My Actions Today" value={stats?.my_actions_today ?? 0} loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${panel} xl:col-span-2`} aria-labelledby="recent-leads">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 id="recent-leads" className="text-lg font-black">Recent leads</h2>
              <p className="text-sm text-white/45">Fresh prospects needing follow-up.</p>
            </div>
            <Button asChild variant="outline" className={`h-11 border-white/15 bg-transparent text-white hover:bg-white hover:text-black ${focusRing}`}>
              <Link href="/support/leads">Open leads</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="h-4 w-1/3 rounded bg-white/10 motion-safe:animate-pulse" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-white/5 motion-safe:animate-pulse" />
                </div>
              ))}

            {!loading &&
              (data?.recent_leads || []).map((lead) => (
                <div key={lead.id} className="rounded-xl border border-white/10 bg-black/30 p-4 transition-colors hover:border-white/20 motion-reduce:transition-none">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{lead.company_name || lead.name}</p>
                      <p className="break-words text-sm text-white/50">{lead.email} · {lead.phone || "No phone"}</p>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        lead.is_contacted ? "bg-emerald-400/15 text-emerald-300" : "border border-[#027EFB]/40 bg-[#027EFB]/10 text-[#6db8ff]"
                      }`}
                    >
                      {lead.is_contacted ? "Contacted" : "Open"}
                    </span>
                  </div>
                </div>
              ))}

            {!loading && !data?.recent_leads?.length && (
              <EmptyState icon={Inbox} title="No leads yet" copy="New leads will show up here as soon as they come in." />
            )}
          </div>
        </section>

        <section className={panel} aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="text-lg font-black">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <ActionLink href="/admin/selfie" icon={UserPlus} title="Create ISP account" copy="Use the hidden onboarding route." />
            <ActionLink href="/support/leads" icon={MessageSquare} title="Manage leads" copy="Track referrals and conversions." />
          </div>

          <h3 className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/45">
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            My recent activity
          </h3>
          <div className="mt-4 space-y-3">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-black/30 p-3">
                  <div className="h-3.5 w-4/5 rounded bg-white/10 motion-safe:animate-pulse" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-white/5 motion-safe:animate-pulse" />
                </div>
              ))}
            {!loading &&
              (data?.recent_activity || []).map((log) => (
                <div key={log.id} className="rounded-xl bg-black/30 p-3">
                  <p className="text-sm font-semibold">{log.summary}</p>
                  <p className="mt-1 text-xs text-white/40">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))}
            {!loading && !data?.recent_activity?.length && (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-white/45">
                No support actions recorded yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, loading }: { icon: React.ElementType; label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl transition hover:border-[#027EFB]/40 hover:bg-white/[0.08] motion-reduce:transition-none md:p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#027EFB]/10 text-[#4da3ff]">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="mt-4 h-8 w-16 rounded bg-white/10 motion-safe:animate-pulse" aria-label="Loading" />
      ) : (
        <p className="mt-4 text-2xl font-black md:text-3xl">{value.toLocaleString()}</p>
      )}
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  )
}

function ActionLink({ href, icon: Icon, title, copy }: { href: string; icon: React.ElementType; title: string; copy: string }) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-[#027EFB]/50 hover:bg-[#027EFB]/10 motion-reduce:transition-none ${focusRing}`}
    >
      <Icon className="h-5 w-5 shrink-0 text-[#4da3ff]" aria-hidden="true" />
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-white/55">{copy}</span>
      </span>
    </Link>
  )
}

function EmptyState({ icon: Icon, title, copy }: { icon: React.ElementType; title: string; copy: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/50">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-white/45">{copy}</p>
    </div>
  )
}
