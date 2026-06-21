"use client"

import React, { useEffect, useState } from "react"
import { KeyRound, Loader2, Plus, Power, RefreshCw, Shield, Trash2 } from "lucide-react"
import {
  superadminApi,
  type SuperadminActivityLog,
  type SuperadminCredential,
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
}

export default function HiddenSuperadminsPage() {
  const [accounts, setAccounts] = useState<SuperadminCredential[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [logs, setLogs] = useState<SuperadminActivityLog[]>([])
  const [form, setForm] = useState(emptyForm)
  const [passwordUpdates, setPasswordUpdates] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [credentialData, activityData] = await Promise.all([
        superadminApi.getSuperadminCredentials(),
        superadminApi.getSuperadminActivity({ limit: "120" }),
      ])
      setAccounts(credentialData.results)
      setActiveCount(credentialData.active_count)
      setLogs(activityData.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load superadmin credentials.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await superadminApi.createSuperadminCredential(form)
      setForm(emptyForm)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create superadmin credentials.")
    } finally {
      setSaving(false)
    }
  }

  const toggleAccount = async (account: SuperadminCredential) => {
    setError("")
    try {
      await superadminApi.updateSuperadminCredential(account.id, { is_active: !account.is_active })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update superadmin credentials.")
    }
  }

  const deleteAccount = async (account: SuperadminCredential) => {
    const ok = window.confirm(`Retire superadmin credentials for ${account.email}? This revokes access and frees the original email/phone for reuse.`)
    if (!ok) return
    setError("")
    try {
      await superadminApi.deleteSuperadminCredential(account.id)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete superadmin credentials.")
    }
  }

  const changePassword = async (account: SuperadminCredential) => {
    const password = passwordUpdates[account.id]?.trim()
    if (!password) {
      setError("Enter a new password before saving.")
      return
    }
    setError("")
    try {
      await superadminApi.updateSuperadminCredential(account.id, { password })
      setPasswordUpdates((current) => ({ ...current, [account.id]: "" }))
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5" />
          <div>
            <h1 className="text-xl font-bold text-white">Superadmins</h1>
            <p className="mt-1 text-sm text-amber-100/80">
              All Supes with superpower</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-slate-400">Active superadmins</p>
          <p className="text-3xl font-black text-white">{activeCount}</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-slate-700 bg-slate-900 text-slate-200">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={createAccount} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 text-slate-950">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-white">Create superadmin</h2>
                <p className="text-sm text-slate-400">Full access to every console and tenant account.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <Field label="First name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} />
              <Field label="Last name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} />
              <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
              <Field label="Phone number" value={form.phone_number} onChange={(value) => setForm({ ...form, phone_number: value })} required />
              <Field label="Temporary password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required />
              <Button disabled={saving} className="bg-white text-slate-950 hover:bg-slate-200">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Create credentials
              </Button>
            </div>
          </form>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-5 font-bold text-white">Credential vault</h2>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{account.full_name}</p>
                          <Badge className={account.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{account.email} · {account.phone_number}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Last login: {account.last_login ? new Date(account.last_login).toLocaleString() : "Never"}
                        </p>
                        <div className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row">
                          <Input
                            type="password"
                            value={passwordUpdates[account.id] || ""}
                            onChange={(event) => setPasswordUpdates((current) => ({ ...current, [account.id]: event.target.value }))}
                            placeholder="Set new password"
                            className="border-slate-700 bg-slate-900 text-white"
                          />
                          <Button
                            onClick={() => changePassword(account)}
                            variant="outline"
                            className="border-slate-700 bg-transparent text-slate-200"
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Change password
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => toggleAccount(account)} variant="outline" className="border-slate-700 bg-transparent text-slate-200">
                          <Power className="mr-2 h-4 w-4" />
                          {account.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button onClick={() => deleteAccount(account)} variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Retire
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-5 font-bold text-white">Superadmin logs</h2>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl bg-slate-950 p-4">
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                      <div>
                        <p className="font-semibold text-white">{log.summary}</p>
                        <p className="text-sm text-slate-500">
                          {log.actor_email || "System"} · {log.action}
                          {log.target_email ? ` · target ${log.target_email}` : ""}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {!logs.length && <p className="py-10 text-center text-slate-500">No superadmin activity recorded yet.</p>}
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
