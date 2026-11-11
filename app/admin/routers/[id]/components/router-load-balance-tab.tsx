"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Loader2,
  Minus, Pencil, Plus, Power, Radio, Scale, ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { LoadBalanceMode, LoadBalanceState, LoadBalanceUplink } from "@/lib/types"

const MONITORS = ["8.8.4.4", "8.8.8.8", "1.1.1.1", "9.9.9.9", "208.67.222.222", "94.140.14.14"]
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]
const STEPS = ["Uplinks", "ISP Setup", "Traffic", "Review"]
const MODES: { id: LoadBalanceMode; label: string; hint: string }[] = [
  { id: "dhcp", label: "DHCP", hint: "Automatic: the ISP hands out an address. Most home and business fibre." },
  { id: "pppoe", label: "PPPoE", hint: "You were given a username and password to dial with." },
  { id: "static", label: "Static", hint: "You were given a fixed IP address and gateway. Usual for dedicated links." },
]
const FALLBACK_PORTS = Array.from({ length: 10 }, (_, i) => ({ name: `ether${i + 1}`, bridged: false }))
const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
const fade = "animate-in fade-in slide-in-from-right-4 duration-300"

const blank = (i: number, port: string): LoadBalanceUplink => ({
  name: "", mode: "dhcp", port, vlan_id: "", monitor_ip: MONITORS[i] ?? "", weight: 0,
  pppoe_username: "", pppoe_password: "", address: "", prefix: "32", gateway: "",
})

function evenWeights(n: number): number[] {
  const base = Math.floor(100 / n / 5) * 5
  const w = Array(n).fill(base)
  for (let rest = 100 - base * n, i = 0; rest > 0; i = (i + 1) % n, rest -= 5) w[i] += 5
  return w
}

function shift(ws: number[], i: number, delta: number): number[] {
  const w = [...ws]
  const others = () => w.map((v, k) => [v, k] as [number, number]).filter(([, k]) => k !== i)
  for (let d = delta; d > 0; d -= 5) {
    const donor = others().filter(([v]) => v > 5).sort((a, b) => b[0] - a[0])[0]
    if (!donor) break
    w[donor[1]] -= 5; w[i] += 5
  }
  for (let d = delta; d < 0 && w[i] > 5; d += 5) {
    const rcv = others().sort((a, b) => a[0] - b[0])[0]
    w[rcv[1]] += 5; w[i] -= 5
  }
  return w
}

function validate(ups: LoadBalanceUplink[]): string | null {
  const ports = new Set<string>(), mons = new Set<string>()
  for (let i = 0; i < ups.length; i++) {
    const u = ups[i], t = `ISP ${i + 1}`
    if (!u.name.trim()) return `${t}: enter an ISP name`
    if (ports.has(u.port)) return `${t}: ${u.port} is used by another ISP`
    if (mons.has(u.monitor_ip)) return `${t}: monitor IP must be unique`
    ports.add(u.port); mons.add(u.monitor_ip)
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(u.monitor_ip)) return `${t}: invalid monitor IP`
    if (u.mode === "pppoe" && (!u.pppoe_username || (!u.pppoe_password && !u.has_password))) return `${t}: PPPoE credentials required`
    if (u.mode === "static" && (!u.address || !u.gateway)) return `${t}: static IP and gateway required`
  }
  return null
}

function WeightBar({ ups }: { ups: LoadBalanceUplink[] }) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      {ups.map((u, i) => (
        <div key={i} className="transition-all duration-500" style={{ width: `${u.weight}%`, background: COLORS[i % COLORS.length] }} />
      ))}
    </div>
  )
}

export function RouterLoadBalanceTab({ routerId }: { routerId: number; isDemo?: boolean }) {
  const [lb, setLb] = useState<LoadBalanceState | null>(null)
  const [ports, setPorts] = useState(FALLBACK_PORTS)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState(0)
  const [ups, setUps] = useState<LoadBalanceUplink[]>([])
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState<Record<number, boolean>>({})
  const [showScript, setShowScript] = useState(false)
  const wasSynced = useRef(true)

  const refresh = useCallback(async (silent = false) => {
    try {
      const s = await adminApi.getLoadBalance(routerId)
      if (!wasSynced.current && s.in_sync) toast.success("Router confirmed the configuration")
      wasSynced.current = s.in_sync
      setLb(s)
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Failed to load load-balancing settings")
    } finally {
      setLoading(false)
    }
  }, [routerId])

  useEffect(() => {
    refresh()
    adminApi.getRouterPorts(routerId)
      .then((r) => {
        const list = (r.ports || [])
          .filter((p: any) => p.type === "ether")
          .map((p: any) => ({ name: p.name as string, bridged: p.bridge === "netily-bridge" }))
        if (list.length) setPorts(list)
      })
      .catch(() => {})
  }, [routerId, refresh])

  useEffect(() => {
    if (!lb?.configured || lb.in_sync || editing) return
    const t = setInterval(() => refresh(true), 4000)
    return () => clearInterval(t)
  }, [lb?.configured, lb?.in_sync, editing, refresh])

  const free = ports.filter((p) => !p.bridged)

  const startWizard = () => {
    if (lb?.configured && lb.uplinks.length) {
      setUps(lb.uplinks.map((u) => ({ ...u, vlan_id: u.vlan_id ?? "", prefix: String(u.prefix ?? 32), pppoe_password: "" })))
      setStep(1)
    } else {
      setUps([]); setStep(0)
    }
    setEditing(true)
  }

  const pickCount = (n: number) => {
    const w = evenWeights(n)
    setUps(Array.from({ length: n }, (_, i) => ({ ...(ups[i] ?? blank(i, free[i]?.name ?? `ether${i + 1}`)), weight: w[i] })))
    setStep(1)
  }

  const patch = (i: number, p: Partial<LoadBalanceUplink>) => setUps((s) => s.map((u, k) => (k === i ? { ...u, ...p } : u)))

  const next = () => {
    if (step === 1) {
      const err = validate(ups)
      if (err) return toast.error(err)
    }
    setStep((s) => s + 1)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await adminApi.saveLoadBalance(routerId, ups.map((u) => ({
        ...u,
        vlan_id: u.vlan_id === "" ? null : Number(u.vlan_id),
        prefix: Number(u.prefix || 32),
      })))
      wasSynced.current = res.in_sync
      setLb(res); setEditing(false); setStep(0)
      toast.success("Configuration saved. Run the command on the router to apply it.")
    } catch (e: any) {
      toast.error(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const disable = async () => {
    if (!confirm("Disable load balancing? You will get a removal command to run on the router. Your WAN ports will need to be configured manually afterwards.")) return
    try {
      const res = await adminApi.disableLoadBalance(routerId)
      wasSynced.current = res.in_sync
      setLb(res)
    } catch (e: any) {
      toast.error(e?.message || "Failed to disable")
    }
  }

  const copy = (txt?: string) => { if (txt) { navigator.clipboard.writeText(txt); toast.success("Copied to clipboard") } }

  if (loading) return <Card><CardContent className="space-y-3 py-8"><Skeleton className="h-6 w-56" /><Skeleton className="h-24 w-full" /></CardContent></Card>

  if (!editing) {
    if (!lb?.configured) {
      return (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Load Balancing &amp; Failover</h3>
            <p className="mx-auto mb-6 max-w-md text-slate-600">
              Combine 2 to 6 internet connections. New connections are split by your percentages, and traffic fails over automatically if an ISP goes down.
            </p>
            <Button size="lg" onClick={startWizard}><Plus className="mr-2 h-4 w-4" />Set up load balancing</Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className={`space-y-6 ${fade}`}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" />Load Balancing</CardTitle>
              <CardDescription>
                {lb.is_enabled ? `${lb.uplinks.length} uplinks share new connections with automatic failover` : "Disabled"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {lb.in_sync
                ? <Badge className="bg-success/15 text-success"><CheckCircle2 className="mr-1 h-3 w-3" />{lb.is_enabled ? "Applied on router" : "Removed from router"}</Badge>
                : <Badge variant="outline" className="border-warning/40 text-warning"><Radio className="mr-1 h-3 w-3 animate-pulse" />Waiting for router</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {lb.is_enabled && <WeightBar ups={lb.uplinks} />}
            <div className="grid gap-3 md:grid-cols-2">
              {lb.uplinks.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="font-mono text-xs text-slate-500">{u.port}{u.vlan_id ? ` · VLAN ${u.vlan_id}` : ""} · {u.mode.toUpperCase()} · ping {u.monitor_ip}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: COLORS[i % COLORS.length] }}>{u.weight}%</span>
                </div>
              ))}
            </div>

            {!lb.in_sync && (
              <div className="space-y-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {lb.is_enabled ? "Paste this in the MikroTik terminal (Winbox → New Terminal)" : "Paste this to remove load balancing from the router"}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-slate-900 p-4 font-mono text-xs text-success">{lb.magic_link}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => copy(lb.magic_link)}><Copy className="mr-2 h-4 w-4" />Copy command</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowScript((v) => !v)}>{showScript ? "Hide" : "View"} script</Button>
                </div>
                {showScript && <pre className="max-h-80 overflow-auto rounded-md bg-slate-900 p-4 font-mono text-[11px] text-slate-100">{lb.script_preview}</pre>}
                <p className="text-xs text-slate-500">This page updates automatically as soon as the router confirms.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={startWizard}><Pencil className="mr-2 h-4 w-4" />{lb.is_enabled ? "Edit" : "Re-enable"}</Button>
            {lb.is_enabled && <Button variant="destructive" onClick={disable}><Power className="mr-2 h-4 w-4" />Disable</Button>}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${i < step ? "bg-success text-white" : i === step ? "scale-110 bg-primary text-white" : "bg-slate-200 text-slate-500"}`}>
                  {i < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span className={`mt-1 text-xs ${i === step ? "font-semibold text-primary" : "text-slate-500"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-2 h-1 flex-1 rounded transition-colors duration-500 ${i < step ? "bg-success" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <div key={step} className={fade}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>How many internet connections?</CardTitle>
              <CardDescription>Each uplink must be cabled into its own Ethernet port on this router.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => pickCount(n)} className="rounded-xl border-2 p-6 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                  <p className="text-3xl font-bold">{n}</p>
                  <p className="text-xs text-slate-500">uplinks</p>
                </button>
              ))}
            </CardContent>
            <CardFooter className="border-t pt-6"><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button></CardFooter>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Match each ISP to the port it is cabled into</AlertTitle>
              <AlertDescription>
                Any existing DHCP client on these ports is replaced. The Netily bridge and hotspot stay untouched. The monitor IP is pinged through that ISP to detect outages and must be different for each ISP.
              </AlertDescription>
            </Alert>
            {ups.map((u, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />ISP {i + 1}
                  </CardTitle>
                  <div className="inline-flex overflow-hidden rounded-lg border">
                    {MODES.map((m) => (
                      <button key={m.id} onClick={() => patch(i, { mode: m.id })}
                        className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${u.mode === m.id ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-500">{MODES.find((m) => m.id === u.mode)?.hint}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ISP name *</Label>
                      <Input value={u.name} maxLength={24} placeholder="e.g. Safaricom" onChange={(e) => patch(i, { name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ethernet port</Label>
                      <select className={selectCls} value={u.port} onChange={(e) => patch(i, { port: e.target.value })}>
                        {ports.map((p) => (
                          <option key={p.name} value={p.name} disabled={p.bridged || ups.some((o, k) => k !== i && o.port === p.name)}>
                            {p.name}{p.bridged ? " (hotspot bridge)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {u.mode === "pppoe" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>PPPoE username *</Label>
                        <Input value={u.pppoe_username} placeholder="username@isp.co.ke" onChange={(e) => patch(i, { pppoe_username: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>PPPoE password *</Label>
                        <div className="relative">
                          <Input type={showPw[i] ? "text" : "password"} value={u.pppoe_password}
                            placeholder={u.has_password ? "Saved - leave blank to keep" : "Enter PPPoE password"}
                            onChange={(e) => patch(i, { pppoe_password: e.target.value })} />
                          <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPw((s) => ({ ...s, [i]: !s[i] }))}>
                            {showPw[i] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {u.mode === "static" && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Static IP address *</Label>
                        <Input value={u.address} placeholder="e.g. 197.248.234.141" onChange={(e) => patch(i, { address: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Prefix</Label>
                        <Input value={u.prefix} inputMode="numeric" onChange={(e) => patch(i, { prefix: e.target.value })} />
                        <p className="text-[11px] text-slate-500">Leave 32 if unsure</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Gateway *</Label>
                        <Input value={u.gateway} placeholder="e.g. 41.90.1.1" onChange={(e) => patch(i, { gateway: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>VLAN ID (optional)</Label>
                      <Input value={u.vlan_id ?? ""} inputMode="numeric" placeholder="blank if untagged" onChange={(e) => patch(i, { vlan_id: e.target.value.replace(/\D/g, "") })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Monitor IP *</Label>
                      <Input value={u.monitor_ip} className="font-mono" onChange={(e) => patch(i, { monitor_ip: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={next}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Connection split</CardTitle>
              <CardDescription>
                Sets how many <b>new connections</b> each ISP receives, not speed. Each connection stays on the ISP it started on. Give a faster ISP a larger share: if A is 100 Mbps and B is 50 Mbps, use 65 / 35.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <WeightBar ups={ups} />
              {ups.map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{u.name || `ISP ${i + 1}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setUps((s) => { const w = shift(s.map((x) => x.weight), i, -5); return s.map((x, k) => ({ ...x, weight: w[k] })) })}><Minus className="h-4 w-4" /></Button>
                    <span className="w-12 text-center font-mono font-bold" style={{ color: COLORS[i % COLORS.length] }}>{u.weight}%</span>
                    <Button size="icon" className="h-8 w-8 bg-success hover:bg-green-700" onClick={() => setUps((s) => { const w = shift(s.map((x) => x.weight), i, 5); return s.map((x, k) => ({ ...x, weight: w[k] })) })}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {ups.map((u, i) => <span key={i} className="mr-4">{u.weight}% → <b>{u.name || `ISP ${i + 1}`}</b></span>)}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={next}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
              <CardDescription>Nothing changes on the router until you run the generated command.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WeightBar ups={ups} />
              {ups.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{u.name}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{u.port}{u.vlan_id ? ` · VLAN ${u.vlan_id}` : ""} · {u.mode.toUpperCase()}</span>
                  <span className="font-bold">{u.weight}%</span>
                </div>
              ))}
              <Alert className="border-warning/20 bg-warning/10">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <AlertTitle>Before you apply</AlertTitle>
                <AlertDescription className="text-warning">
                  The router must run RouterOS v7. The selected ports are reconfigured as WAN uplinks. Run the command from a stable connection (Winbox via LAN), since a mistake here can interrupt the tunnel.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={save} disabled={saving} className="bg-success hover:bg-green-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save &amp; generate command
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}