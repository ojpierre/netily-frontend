"use client"

import React, { useState } from "react"
import {
  MoreVertical, Eye, CreditCard, Calendar, ArrowRightLeft, Edit, Server, UserPlus,
  UserCheck, Power, RefreshCw, Trash2, Loader2, XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminApi } from "@/lib/admin-api"
import type { Plan } from "@/lib/types"

export interface ActionTarget {
  customerId: number
  serviceId: number | null
  name: string
  email: string
  phone: string
  location?: string
  type: string                       // pppoe | static | hotspot
  serviceStatus: string              // ACTIVE | PENDING | SUSPENDED ...
  expiryDate?: string
  planName?: string
  planPrice?: number
  ipAddress?: string
  online?: boolean
  creds?: { id?: string | number; username?: string; is_enabled?: boolean } | null
}

type DialogKey = "renew" | "extend" | "plan" | "edit" | "ip" | "child" | "suspend" | null
type Run = (fn: () => Promise<any>, ok: string | ((r: any) => string)) => Promise<void>

interface Props {
  target: ActionTarget
  onChanged: () => void | Promise<void>
  onDelete?: () => void
  onView?: () => void
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

/* ───────────────────────── shell ───────────────────────── */
function Shell({
  title, description, busy, confirm, onConfirm, disabled, onClose, children, tone = "",
}: {
  title: string; description?: React.ReactNode; busy: boolean; confirm: string
  onConfirm: () => void; disabled?: boolean; onClose: () => void; children?: React.ReactNode; tone?: string
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent className="admin-theme-dialog sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className={tone}>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={onConfirm} disabled={busy || disabled}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────── Renew ───────────────────────── */
function RenewDialog({ t, run, busy, close }: { t: ActionTarget; run: Run; busy: boolean; close: () => void }) {
  const [f, setF] = useState({ record: true, amount: "", ref: "", sms: true })
  const amt = parseFloat(f.amount)
  const bad = f.record && f.amount !== "" && !(amt > 0)
  return (
    <Shell
      title="Renew Subscription" busy={busy} confirm="Renew Now" disabled={bad} onClose={close}
      tone="text-emerald-600" onConfirm={() =>
        run(() => adminApi.renewCustomerSubscription(t.customerId, {
          record_payment: f.record, send_sms: f.sms,
          ...(f.record && f.amount ? { amount: amt } : {}),
          ...(f.record && f.ref.trim() ? { payment_reference: f.ref.trim() } : {}),
        }), (r) => `${t.name} renewed — expires ${r?.new_expiration ? fmt(r.new_expiration) : "never"}`)}
      description={<>Renews <b>{t.name}</b> on <b>{t.planName || "current plan"}</b> as if they just paid. Current expiry: {fmt(t.expiryDate)}</>}
    >
      <div className="flex items-center gap-2">
        <Checkbox id="rn-rec" checked={f.record} onCheckedChange={(c) => setF({ ...f, record: !!c })} />
        <Label htmlFor="rn-rec">Record a payment (cash / manual)</Label>
      </div>
      {f.record && (
        <div className="grid grid-cols-2 gap-3 pl-6">
          <div className="space-y-1"><Label className="text-xs">Amount (KES)</Label>
            <Input type="number" min={1} placeholder={t.planPrice ? String(t.planPrice) : "Plan price"} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Reference</Label>
            <Input placeholder="Receipt / note" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Checkbox id="rn-sms" checked={f.sms} onCheckedChange={(c) => setF({ ...f, sms: !!c })} />
        <Label htmlFor="rn-sms">Send renewal SMS</Label>
      </div>
    </Shell>
  )
}

/* ───────────────────────── Extend ───────────────────────── */
function ExtendDialog({ t, run, busy, close, plans }: { t: ActionTarget; run: Run; busy: boolean; close: () => void; plans: Plan[] }) {
  const [mode, setMode] = useState<"duration" | "date">("duration")
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState<"MINUTES" | "HOURS" | "DAYS">("DAYS")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("23:59")
  const [planId, setPlanId] = useState("")
  const target = date ? new Date(`${date}T${time || "23:59"}:00`) : null
  const invalid = mode === "date" && (!target || target <= new Date())

  const submit = () => {
    if (!t.serviceId) return toast.error("No service to extend")
    const pid = planId ? parseInt(planId, 10) : undefined
    return run(
      () => mode === "date"
        ? adminApi.extendService(t.customerId, t.serviceId!, 1, "DAYS", pid, target!.toISOString())
        : adminApi.extendService(t.customerId, t.serviceId!, amount, unit, pid),
      (r) => r?.message || "Subscription updated",
    )
  }
  return (
    <Shell title="Extend Subscription" busy={busy} confirm="Extend" disabled={invalid} onClose={close} onConfirm={submit}
      description={`Current expiry: ${fmt(t.expiryDate)}`}>
      <div className="flex rounded-lg border overflow-hidden">
        {(["duration", "date"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium ${mode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            {m === "duration" ? "Add Duration" : "Set Expiry Date"}
          </button>
        ))}
      </div>
      {mode === "duration" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Amount</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 1)} /></div>
            <div className="space-y-1"><Label>Unit</Label>
              <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINUTES">Minutes</SelectItem><SelectItem value="HOURS">Hours</SelectItem><SelectItem value="DAYS">Days</SelectItem>
                </SelectContent>
              </Select></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["+1 Hour", 1, "HOURS"], ["+1 Day", 1, "DAYS"], ["+7 Days", 7, "DAYS"], ["+30 Days", 30, "DAYS"]] as const).map(([l, a, u]) => (
              <Button key={l} size="sm" variant="outline" onClick={() => { setAmount(a); setUnit(u) }}>{l}</Button>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-xs">Date</Label>
            <Input type="date" min={new Date().toISOString().split("T")[0]} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          {date && invalid && <p className="col-span-2 text-xs text-destructive">Pick a future date/time.</p>}
        </div>
      )}
      <div className="space-y-1 pt-2 border-t">
        <Label>Change plan <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Select value={planId || "keep"} onValueChange={(v) => setPlanId(v === "keep" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="keep">Keep current plan</SelectItem>
            {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — KES {parseFloat(p.base_price || "0").toLocaleString()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={busy}
        className="w-full border-destructive/40 text-destructive"
        onClick={() => t.serviceId && run(
          () => adminApi.extendService(t.customerId, t.serviceId!, 1, "DAYS", undefined, new Date(Date.now() + 60_000).toISOString()),
          `${t.name} will expire in 1 minute`)}>
        <XCircle className="w-4 h-4 mr-2" />Expire now (1 min)
      </Button>
    </Shell>
  )
}

/* ───────────────────────── Change plan ───────────────────────── */
function PlanDialog({ t, run, busy, close }: { t: ActionTarget; run: Run; busy: boolean; close: () => void }) {
  const [state, setState] = useState<{ loading: boolean; plans: any[]; current: number | null; serviceId: number | null }>(
    { loading: true, plans: [], current: null, serviceId: t.serviceId })
  const [sel, setSel] = useState("")
  React.useEffect(() => {
    adminApi.getCustomerAvailablePlans(t.customerId, t.serviceId)
      .then((r) => { setState({ loading: false, plans: r.plans || [], current: r.current_plan_id ?? null, serviceId: r.service_id ?? t.serviceId }); setSel(r.current_plan_id ? String(r.current_plan_id) : "") })
      .catch((e) => { toast.error(e.message || "Failed to load plans"); close() })
  }, [t.customerId, t.serviceId, close])
  const chosen = state.plans.find((p) => String(p.id) === sel)
  return (
    <Shell title="Change Plan" busy={busy} confirm="Change Plan" onClose={close}
      disabled={state.loading || !sel || sel === String(state.current ?? "")}
      onConfirm={() => run(() => adminApi.changeCustomerPlan(t.customerId, parseInt(sel, 10), state.serviceId), (r) => r?.message || "Plan changed")}
      description={`Current plan: ${t.planName || "none"}`}>
      {state.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
        <>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
            <SelectContent>{state.plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — KES {parseFloat(p.price || "0").toLocaleString()}</SelectItem>)}</SelectContent>
          </Select>
          {chosen && <p className="text-xs text-muted-foreground">{chosen.download_speed || 0}/{chosen.upload_speed || 0} Mbps · {chosen.data_limit ? `${chosen.data_limit} GB` : "Unlimited"}</p>}
        </>
      )}
    </Shell>
  )
}

/* ───────────────────────── Edit IP ───────────────────────── */
function IPDialog({ t, run, busy, close }: { t: ActionTarget; run: Run; busy: boolean; close: () => void }) {
  const [poolId, setPoolId] = useState<number | null>(null)
  const [ips, setIps] = useState<{ id: number; ip_address: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState("")
  const [q, setQ] = useState("")
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    (async () => {
      try {
        const svcs = await adminApi.getCustomerServices(t.customerId)
        const svc = svcs.find((s) => s.id === t.serviceId) || svcs[0]
        let pid: number | null = typeof svc?.plan?.ip_pool === "number" ? svc.plan.ip_pool : null
        if (!pid && svc?.plan?.id) {
          const p = await adminApi.getPlan(svc.plan.id)
          pid = typeof p.ip_pool === "number" ? p.ip_pool : null
        }
        if (!pid) { toast.error("This plan has no IP pool assigned."); return close() }
        setPoolId(pid)
        setIps((await adminApi.getIPPoolAvailableIPs(pid)).results || [])
      } catch (e: any) { toast.error(e.message || "Could not load IPs"); close() }
      finally { setLoading(false) }
    })()
  }, [t.customerId, t.serviceId, close])

  const search = (v: string) => {
    setQ(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!poolId) return
      setLoading(true)
      try { setIps((await adminApi.getIPPoolAvailableIPs(poolId, v || undefined)).results || []) } finally { setLoading(false) }
    }, 350)
  }
  return (
    <Shell title="Change IP Address" busy={busy} confirm="Change IP" disabled={!sel || loading} onClose={close}
      onConfirm={() => t.serviceId && run(() => adminApi.changeServiceIP(t.customerId, t.serviceId!, parseInt(sel, 10)), (r) => r?.message || "IP updated")}
      description={`Current IP: ${t.ipAddress || "none"}. It is released back to the pool.`}>
      <Input placeholder="Search IP (e.g. 10.50.3)" value={q} onChange={(e) => search(e.target.value)} />
      <Select value={sel} onValueChange={setSel}>
        <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : `${ips.length} available`} /></SelectTrigger>
        <SelectContent>{ips.map((i) => <SelectItem key={i.id} value={String(i.id)}><span className="font-mono">{i.ip_address}</span></SelectItem>)}</SelectContent>
      </Select>
    </Shell>
  )
}

/* ───────────────────────── Edit user ───────────────────────── */
function EditDialog({ t, run, busy, close }: { t: ActionTarget; run: Run; busy: boolean; close: () => void }) {
  const [first, ...rest] = (t.name || "").split(" ")
  const [f, setF] = useState({
    first_name: first || "", last_name: rest.join(" "), email: t.email || "", phone: t.phone || "",
    location: t.location || "", username: t.creds?.username || "", password: "",
  })
  React.useEffect(() => {          // authoritative password (list payloads can be stale)
    if (t.creds?.id) adminApi.getRADIUSCredential(String(t.creds.id)).then((c) =>
      setF((p) => ({ ...p, password: c.password || "", username: c.username || p.username }))).catch(() => {})
  }, [t.creds?.id])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const submit = () => run(async () => {
    await adminApi.updateCustomer(t.customerId, {
      first_name: f.first_name, last_name: f.last_name, phone: f.phone, location: f.location,
      ...(f.email.trim() ? { email: f.email.trim() } : {}),
    } as any)
    const patch: { username?: string; password?: string } = {}
    if (f.username && f.username !== t.creds?.username) patch.username = f.username
    if (f.password) patch.password = f.password
    if (t.creds && Object.keys(patch).length) await adminApi.updateRADIUSCredentials(t.customerId, patch)
  }, "User updated")

  return (
    <Shell title="Edit User" busy={busy} confirm="Save Changes" onClose={close} onConfirm={submit}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>First name</Label><Input value={f.first_name} onChange={set("first_name")} /></div>
        <div><Label>Last name</Label><Input value={f.last_name} onChange={set("last_name")} /></div>
      </div>
      <div><Label>Email</Label><Input type="email" value={f.email} onChange={set("email")} /></div>
      <div><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
      <div><Label>Location</Label><Input value={f.location} onChange={set("location")} /></div>
      {t.creds && (
        <div className="border-t pt-3 space-y-3">
          <div><Label>RADIUS username</Label>
            <div className="flex gap-2">
              <Input value={f.username} onChange={set("username")} />
              <Button type="button" variant="outline" title="Regenerate from phone" disabled={busy}
                onClick={async () => { try { const r = await adminApi.regenerateRADIUSUsername(t.customerId); setF((p) => ({ ...p, username: r.new_username })); toast.success(`Username: ${r.new_username}`) } catch (e: any) { toast.error(e.message) } }}>
                <RefreshCw className="w-4 h-4" /></Button>
            </div></div>
          <div><Label>RADIUS password</Label><Input value={f.password} onChange={set("password")} autoComplete="new-password" /></div>
        </div>
      )}
    </Shell>
  )
}

/* ───────────────────────── Child account ───────────────────────── */
function ChildDialog({ t, run, busy, close, plans }: { t: ActionTarget; run: Run; busy: boolean; close: () => void; plans: Plan[] }) {
  const [f, setF] = useState({ label: "", plan: "", type: "pppoe" as "pppoe" | "static", pass: "", activate: true })
  const submit = () => run(async () => {
    const plan = plans.find((p) => String(p.id) === f.plan)
    const child = await adminApi.addChildAccount(t.customerId, { label: f.label.trim() })
    try {
      const data: Record<string, any> = {
        service_type: "INTERNET", auth_connection_type: f.type.toUpperCase(),
        status: f.activate ? "ACTIVE" : "PENDING", activate_now: f.activate,
        radius_username: child.radius_username, radius_password: f.pass.trim() || child.radius_password,
        plan: plan!.id, download_speed: plan!.download_speed, upload_speed: plan!.upload_speed,
        monthly_price: plan!.base_price,
      }
      if (typeof plan!.ip_pool === "number") {
        const ips = await adminApi.getIPPoolAvailableIPs(plan!.ip_pool).catch(() => null)
        if (ips?.results?.length) data.assigned_ip = ips.results[0].id
      }
      const svc = await adminApi.createCustomerService(child.id, data)
      if (f.activate && svc?.id) await adminApi.activateService(child.id, svc.id).catch(() => {})
    } catch (e) {
      await adminApi.deleteCustomer(child.id).catch(() => {})   // no orphan child
      throw e
    }
    return child
  }, (c) => `Child ${c.account_suffix} created. Paybill account: ${c.billing_account_number}`)

  return (
    <Shell title="Add Child Account" busy={busy} confirm="Create" disabled={!f.plan} onClose={close} onConfirm={submit}
      description={<>Another PPPoE account for <b>{t.name}</b> sharing the same phone.</>}>
      <div><Label>Label</Label><Input placeholder="e.g. Shop" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Connection</Label>
          <Select value={f.type} onValueChange={(v: any) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="pppoe">PPPoE</SelectItem><SelectItem value="static">Static IP</SelectItem></SelectContent>
          </Select></div>
        <div><Label>Plan *</Label>
          <Select value={f.plan || undefined} onValueChange={(v) => setF({ ...f, plan: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>PPPoE password <span className="text-xs text-muted-foreground">(blank = phone)</span></Label>
        <Input type="password" autoComplete="new-password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Checkbox id="ch-act" checked={f.activate} onCheckedChange={(c) => setF({ ...f, activate: !!c })} /><Label htmlFor="ch-act">Activate now</Label></div>
    </Shell>
  )
}

/* ───────────────────────── main ───────────────────────── */
export function UserActions({ target: t, onChanged, onDelete, onView }: Props) {
  const [dialog, setDialog] = useState<DialogKey>(null)
  const [busy, setBusy] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const close = React.useCallback(() => setDialog(null), [])

  const isNet = t.type === "pppoe" || t.type === "static"
  const suspended = t.creds?.is_enabled === false
  const pending = t.serviceStatus === "PENDING"

  const loadPlans = async () => {
    if (plans.length) return
    try { setPlans((await adminApi.getPlans({ is_active: "true", page_size: "200" })).results || []) } catch { /* non-fatal */ }
  }
  const open = (k: DialogKey, needsPlans = false) => { if (needsPlans) loadPlans(); setDialog(k) }

  const run: Run = async (fn, ok) => {
    try {
      setBusy(true)
      const r = await fn()
      toast.success(typeof ok === "function" ? ok(r) : ok, { duration: 6000 })
      setDialog(null)
      await onChanged()
    } catch (e: any) { toast.error(e?.message || "Action failed") }
    finally { setBusy(false) }
  }

  const quick = (fn: () => Promise<any>, ok: string | ((r: any) => string)) => run(fn, ok)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="User actions"><MoreVertical className="w-4 h-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          {onView && <DropdownMenuItem onClick={onView}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => open("edit")}><Edit className="w-4 h-4 mr-2" />Edit User</DropdownMenuItem>
          {isNet && <>
            <DropdownMenuItem className="text-emerald-600" onClick={() => open("renew")}><CreditCard className="w-4 h-4 mr-2" />Renew Subscription</DropdownMenuItem>
            <DropdownMenuItem onClick={() => open("extend", true)}><Calendar className="w-4 h-4 mr-2" />Extend Subscription</DropdownMenuItem>
            <DropdownMenuItem onClick={() => open("plan")}><ArrowRightLeft className="w-4 h-4 mr-2" />Change Plan</DropdownMenuItem>
            <DropdownMenuItem onClick={() => open("child", true)}><UserPlus className="w-4 h-4 mr-2" />Add Child Account</DropdownMenuItem>
            <DropdownMenuItem onClick={() => open("ip")}><Server className="w-4 h-4 mr-2" />Edit IP Address</DropdownMenuItem>
          </>}
          {pending && t.serviceId && (
            <DropdownMenuItem className="text-green-600"
              onClick={() => quick(() => adminApi.activateService(t.customerId, t.serviceId!), `${t.name} activated`)}>
              <UserCheck className="w-4 h-4 mr-2" />Activate Now
            </DropdownMenuItem>
          )}
          {t.creds && <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={suspended ? "text-green-600" : "text-yellow-600"} onClick={() => open("suspend")}>
              <Power className="w-4 h-4 mr-2" />{suspended ? "Unsuspend User" : "Suspend User"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-blue-600" disabled={!t.creds.id}
              onClick={() => quick(async () => {
                const r = await adminApi.refreshInternet(String(t.creds!.id))
                if (r.status === "error") throw new Error(r.message)
                return r
              }, (r) => r.message)}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh Internet
            </DropdownMenuItem>
          </>}
          {onDelete && <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" />Delete User</DropdownMenuItem>
          </>}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "renew" && <RenewDialog t={t} run={run} busy={busy} close={close} />}
      {dialog === "extend" && <ExtendDialog t={t} run={run} busy={busy} close={close} plans={plans} />}
      {dialog === "plan" && <PlanDialog t={t} run={run} busy={busy} close={close} />}
      {dialog === "ip" && <IPDialog t={t} run={run} busy={busy} close={close} />}
      {dialog === "edit" && <EditDialog t={t} run={run} busy={busy} close={close} />}
      {dialog === "child" && <ChildDialog t={t} run={run} busy={busy} close={close} plans={plans} />}
      {dialog === "suspend" && (
        <Shell
          title={suspended ? "Unsuspend User?" : "Suspend User?"} busy={busy} onClose={close}
          confirm={suspended ? "Unsuspend" : "Suspend"} tone={suspended ? "text-green-600" : "text-yellow-600"}
          description={suspended
            ? <>Internet for <b>{t.name}</b> is restored immediately. Expiry is unchanged.</>
            : <><b>{t.name}</b> will be disconnected and paused. Subscription and expiry stay intact.</>}
          onConfirm={() => run(async () => {
            await adminApi.toggleRadius(t.customerId, suspended, suspended ? "Unsuspended via admin panel" : "Suspended via admin panel")
            if (!suspended && t.online && t.creds?.username) await adminApi.disconnectRADIUSUser(t.creds.username).catch(() => {})
          }, suspended ? "Internet access resumed" : "Internet access paused")}
        />
      )}
    </>
  )
}