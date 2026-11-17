"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Gift, Search, Users, Wifi, Smartphone, Loader2, Send,
  CheckCircle2, XCircle, MapPin, X, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { COMPOSE_SMS_VARIABLES } from "@/lib/types"
import type { Router } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Kind = "all" | "pppoe" | "hotspot"
type Unit = "MINUTES" | "HOURS" | "DAYS"
type Preview = Awaited<ReturnType<typeof adminApi.getCompensationPreview>>
type Job = Awaited<ReturnType<typeof adminApi.getCompensationJob>>

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

const DEFAULT_MESSAGE =
  "Apologies for the recent downtime. We've credited you extra time on your subscription."

const PRESETS: { label: string; amount: number; unit: Unit }[] = [
  { label: "10 min", amount: 10, unit: "MINUTES" },
  { label: "30 min", amount: 30, unit: "MINUTES" },
  { label: "1 hour", amount: 1, unit: "HOURS" },
  { label: "6 hours", amount: 6, unit: "HOURS" },
  { label: "1 day", amount: 1, unit: "DAYS" },
  { label: "3 days", amount: 3, unit: "DAYS" },
]

const UNIT_MINUTES: Record<Unit, number> = { MINUTES: 1, HOURS: 60, DAYS: 1440 }
const JOB_STORAGE_KEY = "compensation_job_id"

export default function CompensationPage() {
  const router = useRouter()

  const [kind, setKind] = useState<Kind>("all")
  const [routerId, setRouterId] = useState("all")
  const [search, setSearch] = useState("")
  const [routers, setRouters] = useState<Router[]>([])

  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const [amount, setAmount] = useState(30)
  const [unit, setUnit] = useState<Unit>("MINUTES")
  const [sendSms, setSendSms] = useState(true)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [job, setJob] = useState<Job | null>(null)

  const reqRef = useRef(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollFails = useRef(0)

  const jobActive = !!job && (job.state === "queued" || job.state === "running")

  // routers for the filter
  useEffect(() => {
    adminApi.getRouters({ page_size: "100" }).then((r) => setRouters(r.results || [])).catch(() => {})
  }, [])

  // debounced preview (stale responses ignored)
  useEffect(() => {
    const id = ++reqRef.current
    setPreviewLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await adminApi.getCompensationPreview({
          type: kind,
          router_id: routerId === "all" ? undefined : routerId,
          search: search.trim() || undefined,
        })
        if (id !== reqRef.current) return
        setPreview(res)
        setExcluded(new Set())
      } catch (e: any) {
        if (id === reqRef.current) toast.error(e.message || "Failed to load users")
      } finally {
        if (id === reqRef.current) setPreviewLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [kind, routerId, search, refreshTick])

  // job polling
  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  const pollJob = (jobId: string) => {
    stopPolling()
    pollFails.current = 0
    const tick = async () => {
      try {
        const j = await adminApi.getCompensationJob(jobId)
        pollFails.current = 0
        setJob(j)
        if (j.state === "done" || j.state === "failed") {
          stopPolling()
          sessionStorage.removeItem(JOB_STORAGE_KEY)
          if (j.state === "done") toast.success(`${j.compensated.toLocaleString()} user(s) compensated`)
          else toast.error(j.error || "Compensation failed")
          setRefreshTick((n) => n + 1)
        }
      } catch {
        if (++pollFails.current >= 5) {
          stopPolling()
          sessionStorage.removeItem(JOB_STORAGE_KEY)
        }
      }
    }
    tick()
    pollRef.current = setInterval(tick, 1500)
  }

  // resume an in-flight job after a page refresh
  useEffect(() => {
    const saved = sessionStorage.getItem(JOB_STORAGE_KEY)
    if (saved) pollJob(saved)
    return stopPolling
  }, [])

  const eligible = useMemo(
    () => Math.max(0, (preview?.counts.total ?? 0) - excluded.size),
    [preview, excluded]
  )
  const totalMinutes = amount * UNIT_MINUTES[unit]
  const amountValid = Number.isInteger(amount) && amount > 0 && totalMinutes <= 30 * 1440
  const canSubmit =
    !jobActive && !starting && !previewLoading && eligible > 0 && amountValid && (!sendSms || message.trim().length > 0)

  const toggleExclude = (key: string, include: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      include ? next.delete(key) : next.add(key)
      return next
    })

  const handleStart = async () => {
    try {
      setStarting(true)
      const res = await adminApi.startCompensation({
        type: kind,
        router_id: routerId === "all" ? null : Number(routerId),
        search: search.trim() || undefined,
        exclude: Array.from(excluded),
        duration_amount: amount,
        duration_unit: unit,
        send_sms: sendSms,
        message: sendSms ? message.trim() : undefined,
      })
      setConfirmOpen(false)
      sessionStorage.setItem(JOB_STORAGE_KEY, res.job_id)
      setJob({
        job_id: res.job_id, state: "queued", total: eligible, processed: 0, compensated: 0,
        skipped: 0, failed: 0, sms_recipients: 0, sms_queued: 0,
      })
      pollJob(res.job_id)
    } catch (e: any) {
      toast.error(e.message || "Failed to start compensation")
      if (e?.data?.job_id) pollJob(e.data.job_id)
      setConfirmOpen(false)
    } finally {
      setStarting(false)
    }
  }

  const durationLabel = `${amount} ${unit.toLowerCase()}`
  const progress = job && job.total ? Math.round((job.processed / job.total) * 100) : 0

  return (
    <div className="admin-theme-route admin-users-route space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compensation</h1>
            <p className="text-muted-foreground mt-1">Credit extra time to active subscribers after downtime</p>
          </div>
        </div>
      </div>

      {/* Running / finished job banner */}
      {job && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  {jobActive && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  {job.state === "done" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {job.state === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                  {job.state === "queued" && "Queued…"}
                  {job.state === "running" && "Applying compensation…"}
                  {job.state === "done" && "Compensation complete"}
                  {job.state === "failed" && "Compensation failed"}
                </div>
                {!jobActive && (
                  <Button size="sm" variant="ghost" onClick={() => setJob(null)}><X className="w-4 h-4" /></Button>
                )}
              </div>
              <Progress value={job.state === "done" ? 100 : progress} className="h-2" />
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>Processed <b className="text-foreground">{job.processed.toLocaleString()}</b> / {job.total.toLocaleString()}</span>
                <span>Credited <b className="text-green-600 dark:text-green-400">{job.compensated.toLocaleString()}</b></span>
                {job.skipped > 0 && <span>Skipped (expired/changed) <b className="text-amber-600">{job.skipped}</b></span>}
                {job.failed > 0 && <span>Failed <b className="text-red-600">{job.failed}</b></span>}
                {job.sms_queued > 0 && <span>SMS queued <b className="text-foreground">{job.sms_recipients.toLocaleString()}</b></span>}
              </div>
              {job.error && <p className="text-sm text-red-600">{job.error}</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col lg:flex-row gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 overflow-x-auto">
          {([
            { value: "all", label: "All users", icon: Users },
            { value: "pppoe", label: "PPPoE / Static", icon: Wifi },
            { value: "hotspot", label: "Hotspot", icon: Smartphone },
          ] as const).map(({ value, label, icon: Icon }) => (
            <motion.button
              key={value}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={jobActive}
              onClick={() => setKind(value)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                kind === value
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {kind === value && (
                <motion.span
                  layoutId="comp-kind-pill"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-700 rounded-lg"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</span>
            </motion.button>
          ))}
        </div>

        <Select value={routerId} onValueChange={setRouterId} disabled={jobActive}>
          <SelectTrigger className="w-full lg:w-60 bg-white dark:bg-slate-900">
            <SelectValue placeholder="All routers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All routers</SelectItem>
            {routers.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search name, phone, username, access code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={jobActive}
            className="pl-9 bg-white dark:bg-slate-900 transition-all duration-300 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/30 focus:border-violet-500"
            autoComplete="off"
          />
        </div>
      </motion.div>

      {routerId !== "all" && kind !== "hotspot" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          PPPoE customers are matched by the router assigned on their RADIUS account.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Audience */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-3">
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground">Users to compensate</CardTitle>
                  <CardDescription>Only active, unexpired subscriptions are included</CardDescription>
                </div>
                <div className="text-right">
                  {previewLoading ? (
                    <Skeleton className="h-9 w-16 ml-auto" />
                  ) : (
                    <p className="text-3xl font-black tabular-nums text-foreground">{eligible.toLocaleString()}</p>
                  )}
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">will be credited</p>
                </div>
              </div>
              {preview && !previewLoading && (
                <div className="flex gap-2 pt-1">
                  <Badge variant="outline" className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                    PPPoE {preview.counts.pppoe.toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400">
                    Hotspot {preview.counts.hotspot.toLocaleString()}
                  </Badge>
                  {excluded.size > 0 && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                      {excluded.size} excluded
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.12 }} />)}
                </div>
              ) : !preview || preview.sample.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No eligible users</h3>
                  <p className="text-muted-foreground text-sm mt-1">Try different filters</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border dark:border-slate-700 max-h-[420px] overflow-y-auto divide-y dark:divide-slate-800">
                    {preview.sample.map((u) => {
                      const included = !excluded.has(u.key)
                      return (
                        <motion.div
                          key={u.key}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/30 ${included ? "" : "opacity-50"}`}
                        >
                          <Checkbox checked={included} disabled={jobActive} onCheckedChange={(c) => toggleExclude(u.key, !!c)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {u.username}{u.phone ? ` · ${u.phone}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className={u.kind === "hotspot"
                            ? "border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 text-[10px]"
                            : "border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 text-[10px]"}>
                            {u.kind === "hotspot" ? "Hotspot" : "PPPoE"}
                          </Badge>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">{u.router || "—"}</p>
                            <p className="text-[11px] text-slate-400">
                              {u.expires_at ? new Date(u.expires_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  {preview.counts.total > preview.sample.length && (
                    <p className="text-xs text-slate-400 text-center pt-3">
                      Showing a sample of {preview.sample.length} — all {preview.counts.total.toLocaleString()} matching users will be credited
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Compensation settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="lg:col-span-2">
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Compensation
              </CardTitle>
              <CardDescription>Time is added on top of each user's current expiry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Duration</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number" min={1} value={amount} disabled={jobActive}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  />
                  <Select value={unit} onValueChange={(v: Unit) => setUnit(v)} disabled={jobActive}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINUTES">Minutes</SelectItem>
                      <SelectItem value="HOURS">Hours</SelectItem>
                      <SelectItem value="DAYS">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Button key={p.label} size="sm" variant="outline" disabled={jobActive}
                      className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => { setAmount(p.amount); setUnit(p.unit) }}>
                      +{p.label}
                    </Button>
                  ))}
                </div>
                {!amountValid && <p className="text-xs text-red-500">Enter a whole number up to 30 days.</p>}
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-slate-200">Send SMS notification</Label>
                    <p className="text-xs text-muted-foreground">One SMS per phone number</p>
                  </div>
                  <Switch checked={sendSms} onCheckedChange={setSendSms} disabled={jobActive} />
                </div>

                {sendSms && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {COMPOSE_SMS_VARIABLES.filter((v) =>
                        ["{first_name}", "{plan_name}", "{expiry_full}"].includes(v.key)
                      ).map((v) => (
                        <button
                          key={v.key} type="button" disabled={jobActive}
                          onClick={() => setMessage((m) => m + v.key)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          {v.label}
                        </button>
                      ))}
                      <button
                        type="button" disabled={jobActive}
                        onClick={() => setMessage(DEFAULT_MESSAGE)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Reset message
                      </button>
                    </div>
                    <Textarea
                      rows={4} value={message} disabled={jobActive}
                      onChange={(e) => setMessage(e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-700"
                      placeholder="Compose your message…"
                    />
                    <p className="text-xs text-muted-foreground">{message.length} / 1000 characters</p>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                {jobActive ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running…</>
                ) : (
                  <><Gift className="w-4 h-4 mr-2" />Compensate {eligible.toLocaleString()} user{eligible === 1 ? "" : "s"}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !starting && setConfirmOpen(o)}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }} className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <AlertTriangle className="w-4 h-4" /> Confirm compensation
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                <strong>{eligible.toLocaleString()}</strong> user{eligible === 1 ? "" : "s"} will each receive <strong>+{durationLabel}</strong> on
                their current expiry.{" "}
                {sendSms ? "An SMS will be sent to each phone number." : "No SMS will be sent."} This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={starting}>Cancel</Button>
              <Button onClick={handleStart} disabled={starting} className="bg-emerald-600 hover:bg-emerald-700">
                {starting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting…</> : <><Send className="w-4 h-4 mr-2" />Compensate</>}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}