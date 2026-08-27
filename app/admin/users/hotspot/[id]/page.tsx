"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  History,
  Loader2,
  RefreshCw,
  Send,
  Signal,
  Smartphone,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { ActiveSubscription } from "@/lib/types"

// Snippet D: Helper function for time remaining formatting
function formatTimeRemaining(expiryDate: string | Date): { label: string; isCritical: boolean; isExpired: boolean } {
  const target = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate
  const diffMs = target.getTime() - Date.now()

  if (diffMs <= 0) {
    const pastMs = Math.abs(diffMs)
    const days = Math.floor(pastMs / 86400000)
    if (days > 0) return { label: `${days}d ago`, isCritical: true, isExpired: true }
    const hours = Math.floor(pastMs / 3600000)
    if (hours > 0) return { label: `${hours}h ago`, isCritical: true, isExpired: true }
    const minutes = Math.floor(pastMs / 60000)
    return { label: `${minutes}m ago`, isCritical: true, isExpired: true }
  }

  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  if (days >= 1) {
    return { label: hours > 0 ? `${days}d ${hours}h left` : `${days}d left`, isCritical: false, isExpired: false }
  }
  if (hours >= 1) {
    return { label: `${hours}h ${minutes}m left`, isCritical: true, isExpired: false }
  }
  return { label: `${minutes}m left`, isCritical: true, isExpired: false }
}

export default function HotspotClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [extending, setExtending] = useState(false)
  const [extendMode, setExtendMode] = useState<"duration" | "date">("duration")
  const [extendForm, setExtendForm] = useState({ duration_amount: 1, duration_unit: "HOURS" as "MINUTES" | "HOURS" | "DAYS" })
  const [extendManualDate, setExtendManualDate] = useState("")
  const [extendManualTime, setExtendManualTime] = useState("23:59")
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null)

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminApi.getHotspotClientSessions(clientId, { page: 1, page_size: 15 })
      setClient(res.client)
      setSessions(res.sessions)
      setSessionsTotal(res.count)
      setSessionsTotalPages(res.total_pages)
    } catch (err) {
      toast.error("Failed to load client details")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const loadSessions = async (page: number) => {
    try {
      setSessionsLoading(true)
      const res = await adminApi.getHotspotClientSessions(clientId, { page, page_size: 15 })
      setSessions(res.sessions)
      setSessionsPage(page)
    } catch (err) {
      toast.error("Failed to load sessions")
    } finally {
      setSessionsLoading(false)
    }
  }

  // Find active subscription for this client from active subscriptions
  const loadActiveSubscription = useCallback(async () => {
    try {
      const res = await adminApi.getActiveSubscriptions?.()
      if (res?.hotspot) {
        const found = res.hotspot.find((h: any) => h.client_id === clientId)
        if (found) setActiveSubscription(found)
      }
    } catch {}
  }, [clientId])

  useEffect(() => {
    loadClient()
    loadActiveSubscription()
  }, [loadClient, loadActiveSubscription])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await adminApi.deleteHotspotClient(clientId)
      toast.success("Client deleted")
      router.push("/admin/users?tab=hotspot")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const handleExtend = async () => {
    if (!activeSubscription?.session_id) {
      toast.error("No active session to extend")
      return
    }
    try {
      setExtending(true)
      let payload: any = {}
      if (extendMode === "date" && extendManualDate) {
        const iso = `${extendManualDate}T${extendManualTime}:00`
        if (new Date(iso) <= new Date()) { toast.error("Date must be in the future"); return }
        payload.expiry_date = new Date(iso).toISOString()
      } else {
        payload.duration_amount = extendForm.duration_amount
        payload.duration_unit = extendForm.duration_unit
      }
      const result = await adminApi.extendHotspotSession(activeSubscription.session_id, payload)
      toast.success(result.message || "Session extended")
      setShowExtendDialog(false)
      loadActiveSubscription()
    } catch (err: any) {
      toast.error(err.message || "Failed to extend")
    } finally {
      setExtending(false)
    }
  }

  const handleSendSms = async () => {
    if (!activeSubscription?.phone && !client?.canonical_phone) return
    const phone = activeSubscription?.phone || client?.canonical_phone
    const username = client?.canonical_username || ""
    try {
      await adminApi.sendSMS({ recipient: phone, message: `Your hotspot access code: ${username}` })
      toast.success("SMS sent")
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS")
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <p className="mt-4 text-slate-500">Client not found.</p>
      </div>
    )
  }

  const isActive = activeSubscription?.is_active_sub ?? false
  const username = client.canonical_username || ""
  const now = new Date()
  const expiryDate = activeSubscription?.expiry_date ? new Date(activeSubscription.expiry_date) : null
  // Snippet E: Replace daysLeft with timeRemaining
  const timeRemaining = expiryDate ? formatTimeRemaining(expiryDate) : null

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{username}</h1>
            <Badge className={isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {isActive ? "Active" : "Expired"}
            </Badge>
            <Badge variant="outline" className="text-pink-600 border-pink-300">Hotspot</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {client.canonical_phone || "No phone"} · {client.total_sessions} sessions · KES {client.total_spend} lifetime
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadClient}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {["overview", "sessions", "actions"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === "sessions" && sessions.length === 0) loadSessions(1) }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Subscription Card */}
          <Card>
            <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium">{activeSubscription?.plan_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expires</span>
                <span className="font-medium">
                  {expiryDate ? expiryDate.toLocaleString() : "—"}
                </span>
              </div>
              {/* Snippet F: Replace Time Left badge block */}
              {timeRemaining && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Left</span>
                  <Badge className={timeRemaining.isExpired ? "bg-red-100 text-red-700" : timeRemaining.isCritical ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                    {timeRemaining.isExpired ? "Expired" : timeRemaining.label}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Router</span>
                <span className="font-medium">{activeSubscription?.router || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Card */}
          <Card>
            <CardHeader><CardTitle className="text-base">Network Credentials</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Username / Access Code</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-sm bg-slate-100 px-2 py-1 rounded">{username}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(username, "Username")}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Password</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-sm bg-slate-100 px-2 py-1 rounded">{username}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(username, "Password")}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader><CardTitle className="text-base">Analytics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{client.total_sessions}</p>
                  <p className="text-xs text-slate-500">Total Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">KES {client.total_spend}</p>
                  <p className="text-xs text-slate-500">Lifetime Spend</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sm">{client.last_seen_at ? new Date(client.last_seen_at).toLocaleDateString() : "—"}</p>
                  <p className="text-xs text-slate-500">Last Seen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{sessionsTotal} RADIUS sessions</p>
            <Button variant="outline" size="sm" onClick={() => loadSessions(sessionsPage)} disabled={sessionsLoading}>
              <RefreshCw className={`w-4 h-4 ${sessionsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Signal className="w-10 h-10 mx-auto mb-3" />
              <p>No sessions recorded</p>
            </div>
          ) : (
            <>
              {sessions.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{s.mac_address || s.ip_address || "—"}</span>
                        {s.is_active && <Badge className="bg-green-100 text-green-700 text-xs">LIVE</Badge>}
                      </div>
                      <span className="font-bold">{s.data_total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <div><p className="font-semibold uppercase tracking-wide text-[9px]">Started</p><p>{s.start_time ? new Date(s.start_time).toLocaleString() : "—"}</p></div>
                      <div><p className="font-semibold uppercase tracking-wide text-[9px]">Duration</p><p className="font-mono">{s.duration}</p></div>
                      <div><p className="font-semibold uppercase tracking-wide text-[9px]">Router</p><p>{s.router || "—"}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sessionsTotalPages > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm" disabled={sessionsPage === 1} onClick={() => loadSessions(sessionsPage - 1)}>Previous</Button>
                  <span className="text-sm text-slate-500">{sessionsPage} / {sessionsTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={sessionsPage >= sessionsTotalPages} onClick={() => loadSessions(sessionsPage + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === "actions" && (
        <div className="space-y-2">
          {isActive && activeSubscription?.session_id && (
            <button onClick={() => setShowExtendDialog(true)} className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1 text-left"><p className="text-sm font-semibold">Extend Session</p><p className="text-xs text-slate-400">Add more time to current subscription</p></div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <button onClick={handleSendSms} className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Send className="w-5 h-5 text-green-600" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold">Send Access Code via SMS</p><p className="text-xs text-slate-400">{activeSubscription?.phone || client.canonical_phone || "—"}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={() => copyToClipboard(username, "Credentials")} className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Copy className="w-5 h-5 text-purple-600" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold">Copy Credentials</p><p className="text-xs text-slate-400 font-mono">{username}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={() => setShowDeleteDialog(true)} className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-red-100 hover:border-red-200 hover:shadow-md transition-all group mt-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold text-red-600">Delete Client</p><p className="text-xs text-slate-400">Permanently removes RADIUS credentials</p></div>
            <ChevronRight className="w-4 h-4 text-red-200" />
          </button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Hotspot Client</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong className="font-mono">{username}</strong> and their RADIUS credentials. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Session</DialogTitle>
            <DialogDescription>{username} — {activeSubscription?.plan_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex rounded-lg border overflow-hidden">
              <button type="button" onClick={() => setExtendMode("duration")} className={`flex-1 py-2 text-sm font-medium transition-colors ${extendMode === "duration" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Add Duration</button>
              <button type="button" onClick={() => setExtendMode("date")} className={`flex-1 py-2 text-sm font-medium transition-colors ${extendMode === "date" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Set Expiry</button>
            </div>
            {extendMode === "duration" ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500">Amount</label>
                  <input type="number" min={1} value={extendForm.duration_amount} onChange={e => setExtendForm(f => ({ ...f, duration_amount: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 border rounded-md text-sm mt-1" />
                </div>
                <div><label className="text-xs text-slate-500">Unit</label>
                  <select value={extendForm.duration_unit} onChange={e => setExtendForm(f => ({ ...f, duration_unit: e.target.value as any }))} className="w-full px-3 py-2 border rounded-md text-sm mt-1">
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                    <option value="DAYS">Days</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500">Date</label>
                  <input type="date" value={extendManualDate} min={new Date().toISOString().split("T")[0]} onChange={e => setExtendManualDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm mt-1" />
                </div>
                <div><label className="text-xs text-slate-500">Time</label>
                  <input type="time" value={extendManualTime} onChange={e => setExtendManualTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm mt-1" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)} disabled={extending}>Cancel</Button>
            <Button onClick={handleExtend} disabled={extending}>
              {extending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extending...</> : <><Calendar className="w-4 h-4 mr-2" />Extend</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}