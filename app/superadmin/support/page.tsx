"use client"

import React, { useEffect, useState } from "react"
import { Headphones, Loader2, Plus, Power, RefreshCw, ShieldCheck } from "lucide-react"
import {
  superadminApi,
  type SupportActivityLog,
  type SupportExecutive,
} from "@/lib/superadmin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  title: "Customer Support Executive",
}

export default function SuperadminSupportPage() {
  const [executives, setExecutives] = useState<SupportExecutive[]>([])
  const [logs, setLogs] = useState<SupportActivityLog[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [people, activity] = await Promise.all([
        superadminApi.getSupportExecutives(),
        superadminApi.getSupportActivity({ limit: "80" }),
      ])
      setExecutives(people)
      setLogs(activity.results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const createExecutive = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSaving(true)
    try {
      await superadminApi.createSupportExecutive(form)
      setForm(emptyForm)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create support account.")
    } finally {
      setSaving(false)
    }
  }

  const toggleExecutive = async (person: SupportExecutive) => {
    if (person.is_active) {
      await superadminApi.deactivateSupportExecutive(person.id)
    } else {
      await superadminApi.updateSupportExecutive(person.id, { is_active: true })
    }
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Executives</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create support accounts, give access to tenant onboarding, and review support activity.
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-slate-700 bg-slate-900 text-slate-200">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={createExecutive} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-violet-600 p-2">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Create account</h2>
                <p className="text-sm text-slate-400">They will sign in at /support/login.</p>
              </div>
            </div>

            {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

            <div className="grid gap-4">
              <Field label="First name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} />
              <Field label="Last name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} />
              <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
              <Field label="Phone number" value={form.phone_number} onChange={(value) => setForm({ ...form, phone_number: value })} required />
              <Field label="Temporary password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required />
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Button disabled={saving} className="bg-violet-600 hover:bg-violet-500">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create support executive
              </Button>
            </div>
          </form>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">Accounts</h2>
                  <p className="text-sm text-slate-400">{executives.length} support profile(s)</p>
                </div>
                <Headphones className="h-5 w-5 text-slate-500" />
              </div>
              <div className="space-y-3">
                {executives.map((person) => (
                  <div key={person.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email}</p>
                          <Badge className={person.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                            {person.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{person.email} · {person.phone_number || "No phone"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Last seen: {person.last_seen_at ? new Date(person.last_seen_at).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <Button
                        onClick={() => toggleExecutive(person)}
                        variant="outline"
                        className="border-slate-700 bg-transparent text-slate-200"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {person.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
                {!executives.length && <p className="py-10 text-center text-slate-500">No support accounts yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-violet-300" />
                <div>
                  <h2 className="font-bold text-white">Recent support logs</h2>
                  <p className="text-sm text-slate-400">Activity captured from the support console.</p>
                </div>
              </div>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl bg-slate-950 p-4">
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                      <div>
                        <p className="font-semibold text-white">{log.summary}</p>
                        <p className="text-sm text-slate-500">{log.support_email || "System"} · {log.area}</p>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {!logs.length && <p className="py-10 text-center text-slate-500">No support logs yet.</p>}
              </div>
            </section>
          </div>
        </div>
      )}
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
      <Label className="text-slate-300">{label}{required ? " *" : ""}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="border-slate-700 bg-slate-950 text-white"
      />
    </div>
  )
}
