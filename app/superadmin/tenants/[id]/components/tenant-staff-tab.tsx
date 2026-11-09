"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Loader2, KeyRound, Phone, Mail, ShieldCheck, Wand2, Copy, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { superadminApi, type TenantStaffResponse, type TenantStaffUser } from "@/lib/superadmin-api"

const card = "rounded-2xl border border-[#e8e2d9] bg-[#fcfaf7] text-[#23251d]"
const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-[#8a8577]"

function generatePassword(len = 12) {
  const set = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
  const buf = new Uint32Array(len)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => set[n % set.length]).join("")
}

const fdate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "Never")

function UserRow({ u, onReset }: { u: TenantStaffUser; onReset: (u: TenantStaffUser) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee8df] px-5 py-4 last:border-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          {u.full_name}
          <span className="rounded bg-[#f0ebe3] px-1.5 py-0.5 font-mono text-[10px] uppercase">{u.role}</span>
          {!u.is_active && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">Inactive</span>}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a8577]">
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email || "—"}</span>
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone_number || "—"}</span>
          <span>Last login: {fdate(u.last_login)}</span>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => onReset(u)}>
        <KeyRound className="mr-1.5 h-4 w-4" />Change password
      </Button>
    </div>
  )
}

export function StaffTab({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<TenantStaffResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<TenantStaffUser | null>(null)
  const [pwd, setPwd] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await superadminApi.getTenantStaff(tenantId))
    } catch (e: any) {
      toast.error(e.message || "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const open = (u: TenantStaffUser) => { setTarget(u); setPwd("") }
  const close = () => { if (!saving) { setTarget(null); setPwd("") } }

  const save = async () => {
    if (!target) return
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters")
    setSaving(true)
    try {
      const r = await superadminApi.resetTenantStaffPassword(tenantId, target.id, pwd)
      toast.success(r.detail)
      setTarget(null); setPwd("")
    } catch (e: any) {
      toast.error(e.message || "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#d9702f]" /></div>
  if (!data) return null

  const admins = [data.admin, ...data.other_admins].filter(Boolean) as TenantStaffUser[]

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="p-5 pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="h-5 w-5 text-[#d9702f]" />Company admin</h3>
          <p className="text-xs text-[#8a8577]">Created when the tenant was registered. Use this if the admin forgets their password.</p>
        </div>
        {admins.length ? admins.map((u) => <UserRow key={u.id} u={u} onReset={open} />)
          : <p className="px-5 pb-6 text-sm text-[#8a8577]">No admin account found.</p>}
      </div>

      <div className={card}>
        <div className="p-5 pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold"><Users className="h-5 w-5 text-[#d9702f]" />Staff ({data.staff.length})</h3>
          <p className="text-xs text-[#8a8577]">Accounts created by the company admin.</p>
        </div>
        {data.staff.length ? data.staff.map((u) => <UserRow key={u.id} u={u} onReset={open} />)
          : <p className="px-5 pb-6 text-sm text-[#8a8577]">This company has no staff accounts yet.</p>}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>{target?.full_name} · {target?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New password</Label>
            <div className="flex gap-2">
              <Input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
              <Button type="button" variant="outline" size="icon" title="Generate" onClick={() => setPwd(generatePassword())}><Wand2 className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" title="Copy" disabled={!pwd}
                onClick={() => { navigator.clipboard.writeText(pwd); toast.success("Copied") }}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className={label}>The user will be signed out of existing sessions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || pwd.length < 8} className="bg-[#d9702f] text-white hover:bg-[#c4621f]">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}