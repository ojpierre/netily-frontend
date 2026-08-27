"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle2, Link2, Loader2, Plus, Search } from "lucide-react"
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

export default function SupportLeadsPage() {
  const [leads, setLeads] = useState<SupportLead[]>([])
  const [search, setSearch] = useState("")
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-white/40">Lead operations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Leads workspace</h1>
        <p className="mt-3 max-w-2xl text-white/58">
          Add manual leads, capture referrals, and mark prospects as contacted after follow-up.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={createLead} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 text-black">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black">Add lead</h2>
              <p className="text-sm text-white/45">For calls, WhatsApp, referrals, or walk-ins.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Company" value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} />
            <Field label="Who referred them? (Optional)" value={form.referral_name} onChange={(value) => setForm({ ...form, referral_name: value })} />
            <div className="space-y-2">
              <Label className="text-white/70">Notes</Label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="min-h-24 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                placeholder="What do they need help with?"
              />
            </div>
            <Button disabled={saving} className="w-full rounded-2xl bg-white text-black hover:bg-white/90">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save lead
            </Button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-black">Captured leads</h2>
              <p className="text-sm text-white/45">{leads.length} visible in this view</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="border-white/15 bg-black/25 pl-10 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-white/60" />
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <p className="font-bold">{lead.company_name || lead.name}</p>
                      {lead.affiliate_referral && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-200">
                          <Link2 className="h-3 w-3" />
                          Affiliate: {lead.affiliate_referral.affiliate_name} · {lead.affiliate_referral.referral_code}
                        </span>
                      )}
                      <p className="mt-1 text-sm text-white/50">{lead.name} · {lead.email} · {lead.phone || "No phone"}</p>
                      {lead.referral_name && <p className="mt-1 text-xs text-white/42">Referred by {lead.referral_name}</p>}
                      {lead.message && <p className="mt-2 line-clamp-2 text-sm text-white/58">{lead.message}</p>}
                    </div>
                    <Button
                      onClick={() => toggleContacted(lead)}
                      variant="outline"
                      className={`shrink-0 rounded-2xl border-white/15 ${
                        lead.is_contacted ? "bg-white text-black hover:bg-white/90" : "bg-transparent text-white hover:bg-white hover:text-black"
                      }`}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {lead.is_contacted ? "Contacted" : "Mark contacted"}
                    </Button>
                  </div>
                </div>
              ))}
              {!leads.length && <p className="py-16 text-center text-white/45">No leads found.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-white/70">{label}{required ? " *" : ""}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="border-white/15 bg-black/25 text-white placeholder:text-white/30"
      />
    </div>
  )
}
