"use client"

import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Link2, Loader2, Mail, Phone, Plus, Search, SearchX, Users } from "lucide-react"
import { supportApi, type SupportLead } from "@/lib/support-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company_name: "",
  referral_name: "",
  message: "",
}

type StatusFilter = "all" | "open" | "contacted"

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#027EFB] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
const fieldClass = "border-white/15 bg-black/25 text-white placeholder:text-white/30 focus-visible:border-[#027EFB] focus-visible:ring-2 focus-visible:ring-[#027EFB]/40"

export default function SupportLeadsPage() {
  const [leads, setLeads] = useState<SupportLead[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const data = await supportApi.getLeads({ page_size: "40", search })
      setLeads(data.results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = window.setTimeout(fetchLeads, 250)
    return () => window.clearTimeout(id)
  }, [search])

  const createLead = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await supportApi.createLead(form)
      setForm(emptyForm)
      await fetchLeads()
    } finally {
      setSaving(false)
    }
  }

  const toggleContacted = async (lead: SupportLead) => {
    const updated = await supportApi.updateLead(lead.id, { is_contacted: !lead.is_contacted })
    setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const counts = useMemo(() => {
    const contacted = leads.filter((l) => l.is_contacted).length
    return { all: leads.length, contacted, open: leads.length - contacted }
  }, [leads])

  const visible = useMemo(
    () => leads.filter((l) => (status === "all" ? true : status === "contacted" ? l.is_contacted : !l.is_contacted)),
    [leads, status],
  )

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "contacted", label: "Contacted" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4da3ff]">Lead operations</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Leads workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">
          Add manual leads, capture referrals, and mark prospects as contacted after follow-up.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <form onSubmit={createLead} className="h-fit rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl xl:sticky xl:top-28">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#027EFB] p-2 text-white">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-black">Add lead</h2>
              <p className="text-sm text-white/45">For calls, WhatsApp, referrals, or walk-ins.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field id="lead-name" label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field id="lead-email" label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field id="lead-phone" label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field id="lead-company" label="Company" value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} />
            <Field id="lead-referral" label="Who referred them? (Optional)" value={form.referral_name} onChange={(value) => setForm({ ...form, referral_name: value })} />
            <div className="space-y-2">
              <Label htmlFor="lead-notes" className="text-white/70">Notes</Label>
              <textarea
                id="lead-notes"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="min-h-24 w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus-visible:border-[#027EFB] focus-visible:ring-2 focus-visible:ring-[#027EFB]/40"
                placeholder="What do they need help with?"
              />
            </div>
            <Button disabled={saving} className={`h-11 w-full rounded-xl bg-[#027EFB] text-white hover:bg-[#1a8dff] ${focusRing}`}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
              {saving ? "Saving…" : "Save lead"}
            </Button>
          </div>
        </form>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl" aria-labelledby="captured-leads">
          <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 id="captured-leads" className="font-black">Captured leads</h2>
              <p className="text-sm text-white/45" aria-live="polite">
                {loading ? "Loading…" : `${visible.length} visible in this view`}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                aria-label="Search leads"
                className={`h-11 pl-10 ${fieldClass}`}
              />
            </div>
          </div>

          <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = status === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatus(f.key)}
                  aria-pressed={active}
                  className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${focusRing} ${
                    active
                      ? "border-[#027EFB] bg-[#027EFB]/15 text-white"
                      : "border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-[#027EFB] text-white" : "bg-white/10 text-white/60"}`}>
                    {counts[f.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="h-4 w-1/3 rounded bg-white/10 motion-safe:animate-pulse" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-white/5 motion-safe:animate-pulse" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/5 motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((lead) => (
                <li key={lead.id} className="rounded-xl border border-white/10 bg-black/25 p-4 transition-colors hover:border-white/20 motion-reduce:transition-none">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{lead.company_name || lead.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            lead.is_contacted ? "bg-emerald-400/15 text-emerald-300" : "bg-[#027EFB]/15 text-[#6db8ff]"
                          }`}
                        >
                          {lead.is_contacted ? "Contacted" : "Open"}
                        </span>
                      </div>
                      {lead.affiliate_referral && (
                        <span className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-200">
                          <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">Affiliate: {lead.affiliate_referral.affiliate_name} · {lead.affiliate_referral.referral_code}</span>
                        </span>
                      )}
                      <p className="mt-1.5 text-sm text-white/60">{lead.name}</p>
                      <div className="mt-1 flex flex-col gap-1 text-sm text-white/50 sm:flex-row sm:flex-wrap sm:gap-x-4">
                        <span className="flex min-w-0 items-center gap-1.5 break-all">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {lead.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {lead.phone || "No phone"}
                        </span>
                        <span className="flex items-center gap-1.5 text-white/40">
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {lead.referral_name && <p className="mt-1 text-xs text-white/45">Referred by {lead.referral_name}</p>}
                      {lead.message && <p className="mt-2 line-clamp-2 text-sm text-white/60">{lead.message}</p>}
                    </div>
                    <Button
                      onClick={() => toggleContacted(lead)}
                      variant="outline"
                      aria-pressed={lead.is_contacted}
                      className={`h-11 w-full shrink-0 rounded-xl border-white/15 lg:w-auto ${focusRing} ${
                        lead.is_contacted
                          ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 hover:text-emerald-200"
                          : "bg-transparent text-white hover:bg-[#027EFB] hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {lead.is_contacted ? "Contacted" : "Mark contacted"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && !visible.length && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 px-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/50">
                {search || status !== "all" ? <SearchX className="h-5 w-5" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
              </div>
              <p className="mt-3 font-semibold">{search || status !== "all" ? "No leads match" : "No leads found"}</p>
              <p className="mt-1 max-w-xs text-sm text-white/45">
                {search || status !== "all"
                  ? "Try a different search or clear the status filter."
                  : "Add your first lead using the form."}
              </p>
              {(search || status !== "all") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setStatus("all")
                  }}
                  className={`mt-4 h-11 border-white/15 bg-transparent text-white hover:bg-white hover:text-black ${focusRing}`}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/70">{label}{required ? " *" : ""}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`h-11 ${fieldClass}`}
      />
    </div>
  )
}
