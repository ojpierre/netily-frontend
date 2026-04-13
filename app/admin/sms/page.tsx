"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  MessageSquare, Plus, Send, Search, RefreshCw, Users, CheckCircle,
  XCircle, Clock, MoreVertical, Download, Trash2, Eye, Zap, TrendingUp,
  Calendar, History, FileText, Settings, Wallet, Bell, Wifi, Router,
  ChevronDown, ChevronRight, Copy, AlertCircle, Package, CreditCard,
  Phone, Smartphone, ToggleLeft, ToggleRight, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  SMSMessage, SMSTemplate, SMSCampaign, SMSStats, SMSBalance,
  SMSGatewayConfig, SMSGatewayConfigWrite, SMSProvider,
  SMSNotificationSettings, SMSWallet, SMSUnitTopup,
} from "@/lib/types"
import { SMS_TEMPLATE_VARIABLES } from "@/lib/types"

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_STATS: SMSStats = {
  total_sent: 0, delivered: 0, pending: 0, failed: 0,
  delivery_rate: 0, total_cost: 0, messages_today: 0, messages_this_week: 0,
}

const EMPTY_NOTIF_SETTINGS: SMSNotificationSettings = {
  use_inbuilt_system: false,
  hotspot_new_subscription: true, hotspot_welcome: true,
  hotspot_session_expiry: true, hotspot_expiry_minutes_before: 15,
  hotspot_payment_failed: true, hotspot_session_expired: true,
  pppoe_welcome: true, pppoe_payment_confirmation: true,
  pppoe_expiry_reminder: true, pppoe_expiry_days_before: 4,
  pppoe_service_suspended: true, pppoe_service_resumed: true,
  pppoe_plan_changed: true, pppoe_renewal_confirmation: true,
  pppoe_new_subscription: true,
}

const PROVIDER_OPTIONS: { value: SMSProvider; label: string }[] = [
  { value: 'africastalking', label: "Africa's Talking" },
  { value: 'twilio', label: 'Twilio' },
  { value: 'vonage', label: 'Vonage (Nexmo)' },
  { value: 'infobip', label: 'Infobip' },
  { value: 'beem', label: 'Beem Africa' },
  { value: 'advanta', label: 'Advanta SMS' },
  { value: 'hubtel', label: 'Hubtel' },
  { value: 'bytewave', label: 'Bytewave (Netily)' },
]

const PROVIDER_FIELDS: Record<SMSProvider, { key: string; label: string; type?: string }[]> = {
  africastalking: [{ key: 'username', label: 'Username' }, { key: 'api_key', label: 'API Key', type: 'password' }, { key: 'sender_id', label: 'Sender ID' }],
  twilio: [{ key: 'api_key', label: 'Account SID', type: 'password' }, { key: 'api_secret', label: 'Auth Token', type: 'password' }, { key: 'sender_id', label: 'From Number' }],
  vonage: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'api_secret', label: 'API Secret', type: 'password' }, { key: 'sender_id', label: 'Sender ID' }],
  infobip: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'sender_id', label: 'Sender ID' }],
  beem: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'api_secret', label: 'Secret Key', type: 'password' }, { key: 'sender_id', label: 'Sender Name' }],
  advanta: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'sender_id', label: 'Short Code' }],
  hubtel: [{ key: 'api_key', label: 'Client ID', type: 'password' }, { key: 'api_secret', label: 'Client Secret', type: 'password' }, { key: 'sender_id', label: 'Sender ID' }],
  bytewave: [{ key: 'api_key', label: 'API Token', type: 'password' }, { key: 'sender_id', label: 'Sender ID' }],
}

const TOPUP_PACKAGES = [
  { units: 500, label: '500 Units', price: 300, pricePerUnit: 0.60 },
  { units: 1000, label: '1,000 Units', price: 600, pricePerUnit: 0.60 },
  { units: 2000, label: '2,000 Units', price: 1100, pricePerUnit: 0.55, badge: 'Popular' },
  { units: 5000, label: '5,000 Units', price: 2500, pricePerUnit: 0.50, badge: 'Best Value' },
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    sent: 'bg-blue-100 text-blue-700',
    running: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-purple-100 text-purple-700',
    draft: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function NotifToggle({
  label, description, checked, onCheckedChange,
  children,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
      {checked && children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 mt-5 first:mt-0">
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function TemplateEditor({
  open, onClose, onSave, initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (t: { name: string; content: string; event_type?: string }) => void
  initial?: SMSTemplate | null
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [eventType, setEventType] = useState('pppoe_payment')

  const vars = SMS_TEMPLATE_VARIABLES[eventType] ?? []

  const insertVar = (key: string) => {
    setContent(prev => prev + key)
  }

  const preview = useMemo(() => {
    let text = content
    ;(SMS_TEMPLATE_VARIABLES[eventType] ?? []).forEach(v => {
      text = text.replace(new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g'), v.example)
    })
    return text
  }, [content, eventType])

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setContent(initial?.content ?? '')
    }
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Template' : 'New Template'}</DialogTitle>
          <DialogDescription>Build a reusable message. Click variables to insert them.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input placeholder="e.g., PPPoE Payment Received" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotspot_welcome">Hotspot — Welcome</SelectItem>
                  <SelectItem value="hotspot_expiry">Hotspot — Expiry Warning</SelectItem>
                  <SelectItem value="hotspot_expired">Hotspot — Session Expired</SelectItem>
                  <SelectItem value="pppoe_welcome">PPPoE — Welcome</SelectItem>
                  <SelectItem value="pppoe_payment">PPPoE — Payment Confirmation</SelectItem>
                  <SelectItem value="pppoe_expiry">PPPoE — Expiry Reminder</SelectItem>
                  <SelectItem value="pppoe_suspended">PPPoE — Service Suspended</SelectItem>
                  <SelectItem value="pppoe_resumed">PPPoE — Service Resumed</SelectItem>
                  <SelectItem value="pppoe_plan_changed">PPPoE — Plan Changed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <span className={`text-xs ${content.length > 160 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                  {content.length} chars · {Math.ceil(content.length / 160)} SMS
                </span>
              </div>
              <Textarea
                placeholder="Type your message..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
              />
            </div>

            {vars.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Click to insert variable</Label>
                <div className="flex flex-wrap gap-1.5">
                  {vars.map(v => (
                    <button
                      key={v.key}
                      onClick={() => insertVar(v.key)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-xs text-slate-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Preview</Label>
            <div className="bg-slate-900 rounded-xl p-4 min-h-[200px]">
              <div className="bg-[#1a2e1a] rounded-lg p-3 max-w-[220px] mx-auto">
                <div className="text-[11px] text-slate-400 mb-1">SMS</div>
                <div className="text-xs text-green-300 leading-relaxed whitespace-pre-wrap">
                  {preview || <span className="text-slate-600">Preview appears here…</span>}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Available variables</Label>
              <div className="rounded-lg border divide-y text-xs">
                {vars.map(v => (
                  <div key={v.key} className="flex items-center justify-between px-3 py-1.5">
                    <code className="text-blue-600">{v.key}</code>
                    <span className="text-slate-400">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ name, content, event_type: eventType })} disabled={!name || !content}>
            {initial ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPUP SHEET
// ─────────────────────────────────────────────────────────────────────────────

function TopupSheet({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selected, setSelected] = useState<typeof TOPUP_PACKAGES[0] | null>(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTopup = async () => {
    if (!selected || !phone) return
    setLoading(true)
    try {
      await adminApi.initiateSMSTopup(selected.units, phone)
      toast.success(`STK push sent for ${selected.units} units. Enter your M-Pesa PIN.`)
      onClose()
      onSuccess()
    } catch (e: any) {
      toast.error(e?.message ?? 'Top-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            Buy SMS Units
          </SheetTitle>
          <SheetDescription>Units are debited when you send SMS messages.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TOPUP_PACKAGES.map(pkg => (
              <button
                key={pkg.units}
                onClick={() => setSelected(pkg)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  selected?.units === pkg.units
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pkg.badge}
                  </span>
                )}
                <div className="text-lg font-bold text-slate-800">{pkg.label}</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">KES {pkg.price}</div>
                <div className="text-xs text-slate-500 mt-0.5">{pkg.pricePerUnit.toFixed(2)}/unit</div>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>M-Pesa Phone Number</Label>
            <Input
              placeholder="0712345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          {selected && (
            <div className="rounded-lg bg-slate-50 border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Units</span><span className="font-medium">{selected.units.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-slate-900">KES {selected.price}</span></div>
            </div>
          )}

          <Button className="w-full" onClick={handleTopup} disabled={!selected || !phone || loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Pay via M-Pesa STK
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState("history")
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [templates, setTemplates] = useState<SMSTemplate[]>([])
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([])
  const [stats, setStats] = useState<SMSStats>(EMPTY_STATS)
  const [balance, setBalance] = useState<SMSBalance | null>(null)
  const [wallet, setWallet] = useState<SMSWallet | null>(null)
  const [notifSettings, setNotifSettings] = useState<SMSNotificationSettings>(EMPTY_NOTIF_SETTINGS)
  const [gatewayConfigs, setGatewayConfigs] = useState<SMSGatewayConfig[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isSavingNotif, setIsSavingNotif] = useState(false)
  const [gwSaving, setGwSaving] = useState(false)
  const [gwTesting, setGwTesting] = useState(false)

  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [isTopupOpen, setIsTopupOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])

  const [gwEditing, setGwEditing] = useState<number | null>(null)
  const [gwForm, setGwForm] = useState<SMSGatewayConfigWrite>({
    provider: 'africastalking', is_active: true,
    api_key: '', api_secret: '', username: '', sender_id: '',
    extra_config: {},
    auto_payment_confirmation: true, auto_expiry_reminder: true,
    auto_welcome_message: true, auto_service_suspension: false,
  })

  const [composeForm, setComposeForm] = useState({ recipients: '', message: '', template: '' })

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [msgs, tmpls, camps, sts, bal, wlt, ns, gws] = await Promise.all([
        adminApi.getSMSMessages().catch(() => null),
        adminApi.getSMSTemplates().catch(() => null),
        adminApi.getSMSCampaigns().catch(() => null),
        adminApi.getSMSStats().catch(() => null),
        adminApi.getSMSBalance().catch(() => null),
        adminApi.getSMSWallet().catch(() => null),
        adminApi.getSMSNotificationSettings().catch(() => null),
        adminApi.getSMSGatewayConfigs().catch(() => []),
      ])

      if (msgs) setMessages(Array.isArray(msgs) ? msgs : (msgs as any).results ?? [])
      if (tmpls) setTemplates(Array.isArray(tmpls) ? tmpls : (tmpls as any).results ?? [])
      if (camps) setCampaigns(Array.isArray(camps) ? camps : (camps as any).results ?? [])
      if (sts) setStats(sts)
      if (bal) setBalance(bal)
      if (wlt) setWallet(wlt)
      if (ns) setNotifSettings(ns)

      const gwList = (Array.isArray(gws) ? gws : []) as SMSGatewayConfig[]
      setGatewayConfigs(gwList)
      const active = gwList.find(g => g.is_active)
      if (active) {
        setGwEditing(active.id)
        setGwForm({
          provider: active.provider, is_active: active.is_active,
          api_key: '', api_secret: '',
          username: active.username, sender_id: active.sender_id,
          extra_config: active.extra_config ?? {},
          auto_payment_confirmation: active.auto_payment_confirmation,
          auto_expiry_reminder: active.auto_expiry_reminder,
          auto_welcome_message: active.auto_welcome_message,
          auto_service_suspension: active.auto_service_suspension,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── derived ────────────────────────────────────────────────────────────────
  const filteredMessages = useMemo(() => messages.filter(m => {
    const q = searchQuery.toLowerCase()
    const matchQ = m.recipient.toLowerCase().includes(q) ||
      (m.recipient_name ?? '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || m.status === statusFilter
    return matchQ && matchS
  }), [messages, searchQuery, statusFilter])

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!composeForm.recipients || !composeForm.message) {
      toast.error('Fill in recipient and message')
      return
    }
    setIsSending(true)
    try {
      const res = await adminApi.sendSMS({ recipient: composeForm.recipients, message: composeForm.message }).catch(() => null)
      if (res) { setMessages(p => [res as SMSMessage, ...p]); toast.success('SMS sent') }
      else toast.error('Failed to send')
      setIsComposeOpen(false)
      setComposeForm({ recipients: '', message: '', template: '' })
    } finally { setIsSending(false) }
  }

  const handleSaveTemplate = async (data: { name: string; content: string; event_type?: string }) => {
    try {
      if (editingTemplate) {
        const res = await adminApi.updateSMSTemplate(editingTemplate.id, data)
        setTemplates(p => p.map(t => t.id === editingTemplate.id ? res : t))
        toast.success('Template updated')
      } else {
        const res = await adminApi.createSMSTemplate({
          name: data.name, content: data.content, is_active: true,
          variables: [...(data.content.match(/\{[\w_]+\}/g) ?? [])],
        })
        setTemplates(p => [...p, res])
        toast.success('Template created')
      }
      setIsTemplateOpen(false)
      setEditingTemplate(null)
    } catch (e: any) { toast.error(e?.message ?? 'Failed') }
  }

  const handleDeleteTemplate = async (id: number) => {
    await adminApi.deleteSMSTemplate(id).catch(() => null)
    setTemplates(p => p.filter(t => t.id !== id))
    toast.success('Template deleted')
  }

  const handleSaveNotifSettings = async (patch: Partial<SMSNotificationSettings>) => {
    setIsSavingNotif(true)
    try {
      const updated = await adminApi.updateSMSNotificationSettings(patch)
      setNotifSettings(updated)
      toast.success('Notification settings saved')
    } catch (e: any) { toast.error(e?.message ?? 'Failed to save') }
    finally { setIsSavingNotif(false) }
  }

  const handleToggleNotif = (key: keyof SMSNotificationSettings, value: boolean | number) => {
    const patch = { [key]: value } as Partial<SMSNotificationSettings>
    setNotifSettings(p => ({ ...p, ...patch }))
    handleSaveNotifSettings(patch)
  }

  const handleGatewaySave = async () => {
    setGwSaving(true)
    try {
      const payload: Partial<SMSGatewayConfigWrite> = { ...gwForm }
      if (gwEditing) { if (!payload.api_key) delete payload.api_key; if (!payload.api_secret) delete payload.api_secret }
      let res: SMSGatewayConfig
      if (gwEditing) res = await adminApi.updateSMSGatewayConfig(gwEditing, payload)
      else res = await adminApi.createSMSGatewayConfig(gwForm)
      const updated = await adminApi.getSMSGatewayConfigs().catch(() => [])
      setGatewayConfigs(updated)
      setGwEditing(res.id)
      toast.success('Gateway saved')
    } catch (e: any) { toast.error(e?.message ?? 'Failed') }
    finally { setGwSaving(false) }
  }

  const handleGatewayTest = async () => {
    if (!gwEditing) { toast.error('Save first'); return }
    setGwTesting(true)
    try {
      const r = await adminApi.testSMSGateway(gwEditing)
      r.success ? toast.success(`Connected! Balance: ${JSON.stringify(r.balance)}`) : toast.error(`Failed: ${r.error}`)
    } catch (e: any) { toast.error(e?.message ?? 'Test failed') }
    finally { setGwTesting(false) }
  }

  const walletUnits = wallet?.sms_units ?? 0

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">SMS Management</h1>
            <p className="text-slate-500 text-sm mt-1">Send messages, manage templates, and configure notifications</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsTopupOpen(true)}>
              <Wallet className="w-4 h-4 mr-1.5" />
              {walletUnits > 0 ? `${Number(walletUnits).toLocaleString()} units` : 'Buy Units'}
            </Button>
            <Button size="sm" onClick={() => setIsComposeOpen(true)}>
              <Send className="w-4 h-4 mr-1.5" />
              Send SMS
            </Button>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Sent', value: stats.total_sent, icon: MessageSquare, color: 'blue' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'emerald' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' },
            { label: 'Delivery Rate', value: `${(stats.delivery_rate ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'purple' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-${s.color}-100 flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main tabs ──────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="history" className="text-xs"><History className="w-3.5 h-3.5 mr-1.5" />History</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs"><FileText className="w-3.5 h-3.5 mr-1.5" />Templates</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs"><Users className="w-3.5 h-3.5 mr-1.5" />Campaigns</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs"><Bell className="w-3.5 h-3.5 mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger value="gateway" className="text-xs"><Settings className="w-3.5 h-3.5 mr-1.5" />Gateway</TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs"><Wallet className="w-3.5 h-3.5 mr-1.5" />Wallet</TabsTrigger>
          </TabsList>

          {/* ── HISTORY ──────────────────────────────────────────────────────── */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <CardTitle>Message History</CardTitle>
                    <CardDescription>All sent and received messages</CardDescription>
                  </div>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" />Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input placeholder="Search messages…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Recipient</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Message</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Type</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Sent</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.slice(0, 50).map(m => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{m.recipient_name || m.recipient}</div>
                            {m.recipient_name && <div className="text-xs text-slate-400">{m.recipient}</div>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs">
                            <p className="text-xs text-slate-600 truncate">{m.message}</p>
                          </TableCell>
                          <TableCell><StatusBadge status={m.status} /></TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs capitalize text-slate-500">{m.type}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-slate-400">
                            {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {m.status === 'failed' && (
                                  <DropdownMenuItem onClick={() => adminApi.retrySMS(m.id).then(() => toast.success('Retrying…'))}>
                                    <RefreshCw className="w-4 h-4 mr-2" />Retry
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(m.message)}>
                                  <Copy className="w-4 h-4 mr-2" />Copy
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMessages.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                            No messages found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TEMPLATES ────────────────────────────────────────────────────── */}
          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message Templates</CardTitle>
                    <CardDescription>Reusable messages with smart variable substitution</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => { setEditingTemplate(null); setIsTemplateOpen(true) }}>
                    <Plus className="w-4 h-4 mr-1.5" />New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No templates yet. Create one to save time.</p>
                  </div>
                )}
                <div className="grid gap-3">
                  {templates.map(t => (
                    <div key={t.id} className="border rounded-xl p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{t.name}</span>
                            <span className="text-xs text-slate-400">Used {t.usage_count ?? 0}×</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{t.content}</p>
                          {t.variables?.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {t.variables.map(v => (
                                <code key={v} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{'{' + v + '}'}</code>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs"
                            onClick={() => { setComposeForm(p => ({ ...p, message: t.content })); setIsComposeOpen(true) }}>
                            Use
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setEditingTemplate(t); setIsTemplateOpen(true) }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                            onClick={() => handleDeleteTemplate(t.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CAMPAIGNS ────────────────────────────────────────────────────── */}
          <TabsContent value="campaigns" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Campaigns</CardTitle>
                <CardDescription>Mass SMS to customer segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Campaign</TableHead>
                        <TableHead className="text-xs">Recipients</TableHead>
                        <TableHead className="text-xs">Progress</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{c.name}</div>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{c.message}</p>
                          </TableCell>
                          <TableCell className="text-sm">{(c.recipient_count ?? 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={c.recipient_count ? ((c.delivered_count ?? 0) / c.recipient_count) * 100 : 0} className="w-20 h-1.5" />
                              <span className="text-xs text-slate-500">{c.delivered_count ?? 0}/{c.recipient_count ?? 0}</span>
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-400">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {campaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">No campaigns yet</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTIFICATIONS ────────────────────────────────────────────────── */}
          <TabsContent value="notifications" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">

              {/* ── Inbuilt toggle ──────────────────────────────────────── */}
              <Card className="lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notifSettings.use_inbuilt_system ? 'bg-blue-500' : 'bg-slate-100'}`}>
                      <Zap className={`w-6 h-6 ${notifSettings.use_inbuilt_system ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Use Netily Inbuilt SMS System</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Route all automated SMS through Netily's Bytewave gateway. No need to configure your own provider.
                            Units are deducted from your wallet balance.
                          </p>
                        </div>
                        <Switch
                          checked={notifSettings.use_inbuilt_system}
                          onCheckedChange={v => handleToggleNotif('use_inbuilt_system', v)}
                        />
                      </div>
                      {notifSettings.use_inbuilt_system && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-blue-700">
                            <span className="font-semibold">{Number(walletUnits).toLocaleString()}</span> units available
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setIsTopupOpen(true)}>
                            <Plus className="w-3.5 h-3.5 mr-1" />Top Up
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Hotspot notifications ────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-sky-500" />
                    <CardTitle className="text-base">Hotspot Notifications</CardTitle>
                  </div>
                  <CardDescription>SMS events for captive portal / WiFi users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NotifToggle
                    label="New Purchase"
                    description="When a hotspot user successfully buys a plan"
                    checked={notifSettings.hotspot_new_subscription}
                    onCheckedChange={v => handleToggleNotif('hotspot_new_subscription', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Welcome / Session Active"
                    description="Confirm activation with access code and speed"
                    checked={notifSettings.hotspot_welcome}
                    onCheckedChange={v => handleToggleNotif('hotspot_welcome', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Session Expiry Warning"
                    description="Notify user before their session ends"
                    checked={notifSettings.hotspot_session_expiry}
                    onCheckedChange={v => handleToggleNotif('hotspot_session_expiry', v)}
                  >
                    <div className="ml-0 mt-2 flex items-center gap-2">
                      <Label className="text-xs text-slate-500 whitespace-nowrap">Send</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        className="w-20 h-7 text-sm"
                        value={notifSettings.hotspot_expiry_minutes_before}
                        onChange={e => handleToggleNotif('hotspot_expiry_minutes_before', parseInt(e.target.value) || 15)}
                      />
                      <Label className="text-xs text-slate-500">minutes before</Label>
                    </div>
                  </NotifToggle>
                  <Separator />
                  <NotifToggle
                    label="Session Fully Expired"
                    description="Let user know they need to purchase again"
                    checked={notifSettings.hotspot_session_expired}
                    onCheckedChange={v => handleToggleNotif('hotspot_session_expired', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Payment Failed"
                    description="Alert when M-Pesa STK push is cancelled or fails"
                    checked={notifSettings.hotspot_payment_failed}
                    onCheckedChange={v => handleToggleNotif('hotspot_payment_failed', v)}
                  />
                </CardContent>
              </Card>

              {/* ── PPPoE / Static notifications ─────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Router className="w-4 h-4 text-violet-500" />
                    <CardTitle className="text-base">PPPoE / Static Notifications</CardTitle>
                  </div>
                  <CardDescription>SMS events for managed subscriber accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NotifToggle
                    label="New Customer Welcome"
                    description="Greet new customers with their credentials"
                    checked={notifSettings.pppoe_welcome}
                    onCheckedChange={v => handleToggleNotif('pppoe_welcome', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="New Subscription Created"
                    description="When admin sets up a subscription for a customer"
                    checked={notifSettings.pppoe_new_subscription}
                    onCheckedChange={v => handleToggleNotif('pppoe_new_subscription', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Payment Confirmation"
                    description="Confirm receipt of subscription payment"
                    checked={notifSettings.pppoe_payment_confirmation}
                    onCheckedChange={v => handleToggleNotif('pppoe_payment_confirmation', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Renewal Confirmation"
                    description="Confirm when subscription is successfully renewed"
                    checked={notifSettings.pppoe_renewal_confirmation}
                    onCheckedChange={v => handleToggleNotif('pppoe_renewal_confirmation', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Expiry Reminder"
                    description="Remind before subscription expires"
                    checked={notifSettings.pppoe_expiry_reminder}
                    onCheckedChange={v => handleToggleNotif('pppoe_expiry_reminder', v)}
                  >
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-xs text-slate-500 whitespace-nowrap">Send</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        className="w-20 h-7 text-sm"
                        value={notifSettings.pppoe_expiry_days_before}
                        onChange={e => handleToggleNotif('pppoe_expiry_days_before', parseInt(e.target.value) || 4)}
                      />
                      <Label className="text-xs text-slate-500">days before expiry</Label>
                    </div>
                  </NotifToggle>
                  <Separator />
                  <NotifToggle
                    label="Plan Changed"
                    description="Notify customer when their plan is upgraded or downgraded"
                    checked={notifSettings.pppoe_plan_changed}
                    onCheckedChange={v => handleToggleNotif('pppoe_plan_changed', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Service Suspended"
                    description="Alert when service is suspended"
                    checked={notifSettings.pppoe_service_suspended}
                    onCheckedChange={v => handleToggleNotif('pppoe_service_suspended', v)}
                  />
                  <Separator />
                  <NotifToggle
                    label="Service Resumed"
                    description="Confirm when service is restored"
                    checked={notifSettings.pppoe_service_resumed}
                    onCheckedChange={v => handleToggleNotif('pppoe_service_resumed', v)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── GATEWAY ──────────────────────────────────────────────────────── */}
          <TabsContent value="gateway" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Configuration</CardTitle>
                  <CardDescription>
                    {notifSettings.use_inbuilt_system
                      ? 'Inbuilt system is active — custom gateway is a fallback'
                      : 'Configure your SMS provider credentials'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Provider</Label>
                    <Select value={gwForm.provider} onValueChange={v => setGwForm(p => ({ ...p, provider: v as SMSProvider }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {PROVIDER_FIELDS[gwForm.provider]?.map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label>{f.label}</Label>
                      <Input
                        type={f.type ?? 'text'}
                        placeholder={gwEditing ? '(leave blank to keep current)' : `Enter ${f.label.toLowerCase()}`}
                        value={(gwForm as any)[f.key] ?? ''}
                        onChange={e => setGwForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {gwForm.provider === 'advanta' && (
                    <div className="space-y-1.5">
                      <Label>Partner ID</Label>
                      <Input
                        value={gwForm.extra_config?.partner_id ?? ''}
                        onChange={e => setGwForm(p => ({ ...p, extra_config: { ...p.extra_config, partner_id: e.target.value } }))}
                      />
                    </div>
                  )}
                  {gwForm.provider === 'infobip' && (
                    <div className="space-y-1.5">
                      <Label>Base URL</Label>
                      <Input
                        placeholder="https://xxxxx.api.infobip.com"
                        value={gwForm.extra_config?.base_url ?? ''}
                        onChange={e => setGwForm(p => ({ ...p, extra_config: { ...p.extra_config, base_url: e.target.value } }))}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleGatewaySave} disabled={gwSaving}>
                      {gwSaving && <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />}
                      {gwEditing ? 'Update' : 'Save Gateway'}
                    </Button>
                    {gwEditing && (
                      <Button variant="outline" onClick={handleGatewayTest} disabled={gwTesting}>
                        {gwTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>

                  {/* saved list */}
                  {gatewayConfigs.length > 0 && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Saved Gateways</p>
                      {gatewayConfigs.map(gw => (
                        <div key={gw.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${gw.is_active ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{gw.provider_display}</span>
                            {gw.is_active && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Active</Badge>}
                            {gw.sender_id && <span className="text-slate-400 text-xs">{gw.sender_id}</span>}
                          </div>
                          <div className="flex gap-1">
                            {!gw.is_active && (
                              <Button size="sm" variant="ghost" className="h-6 text-xs"
                                onClick={() => adminApi.activateSMSGateway(gw.id).then(fetchAll)}>
                                Activate
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-6 text-xs"
                              onClick={() => {
                                setGwEditing(gw.id)
                                setGwForm({ provider: gw.provider, is_active: gw.is_active, api_key: '', api_secret: '', username: gw.username, sender_id: gw.sender_id, extra_config: gw.extra_config ?? {}, auto_payment_confirmation: gw.auto_payment_confirmation, auto_expiry_reminder: gw.auto_expiry_reminder, auto_welcome_message: gw.auto_welcome_message, auto_service_suspension: gw.auto_service_suspension })
                              }}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400"
                              onClick={() => adminApi.deleteSMSGatewayConfig(gw.id).then(fetchAll)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full text-xs"
                        onClick={() => { setGwEditing(null); setGwForm({ provider: 'africastalking', is_active: true, api_key: '', api_secret: '', username: '', sender_id: '', extra_config: {}, auto_payment_confirmation: true, auto_expiry_reminder: true, auto_welcome_message: true, auto_service_suspension: false }) }}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />Add Another Gateway
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Balance</CardTitle>
                  <CardDescription>Current balance from your active provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Provider Balance</p>
                    <p className="text-3xl font-bold">
                      {balance
                        ? `${balance.currency || 'KES'} ${Number(balance.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </p>
                    {balance && (
                      <p className="text-xs text-slate-400 mt-1">{balance.provider}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Sent Today', value: stats.messages_today },
                      { label: 'This Week', value: stats.messages_this_week },
                      { label: 'Delivery Rate', value: `${stats.delivery_rate ?? 0}%` },
                      { label: 'Total Spend', value: `KES ${Number(stats.total_cost ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className="text-lg font-bold text-slate-800">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── WALLET ───────────────────────────────────────────────────────── */}
          <TabsContent value="wallet" className="mt-4">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Balance card */}
              <Card className="lg:col-span-1">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Wallet className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Available SMS Units</p>
                    <p className="text-4xl font-extrabold text-slate-900 mt-1">{Number(walletUnits).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ≈ KES {(walletUnits * (wallet?.sell_price_per_unit ?? 0.6)).toFixed(0)} value
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setIsTopupOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Buy More Units
                  </Button>

                  <div className="text-left pt-2 space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pricing Tiers</p>
                    {TOPUP_PACKAGES.map(p => (
                      <div key={p.units} className="flex justify-between text-xs text-slate-500">
                        <span>{p.units.toLocaleString()}+ units</span>
                        <span>KES {p.pricePerUnit.toFixed(2)}/unit</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top-up history */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top-up History</CardTitle>
                  <CardDescription>Your recent unit purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Units</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(wallet?.topup_history ?? []).map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.units_purchased.toLocaleString()}</TableCell>
                            <TableCell>KES {Number(t.amount_paid).toLocaleString()}</TableCell>
                            <TableCell><StatusBadge status={t.status} /></TableCell>
                            <TableCell className="text-xs text-slate-400">
                              {new Date(t.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(wallet?.topup_history ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                              No purchases yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── COMPOSE DIALOG ────────────────────────────────────────────────── */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>Send to one or multiple phone numbers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Recipient(s)</Label>
                <Textarea
                  rows={2}
                  placeholder="+254712345678, +254723456789"
                  value={composeForm.recipients}
                  onChange={e => setComposeForm(p => ({ ...p, recipients: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Template (optional)</Label>
                <Select value={composeForm.template} onValueChange={v => {
                  const t = templates.find(x => String(x.id) === v)
                  setComposeForm(p => ({ ...p, template: v, message: t?.content ?? p.message }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Select template…" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label>Message</Label>
                  <span className={`text-xs ${composeForm.message.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {composeForm.message.length}/160
                  </span>
                </div>
                <Textarea
                  rows={4}
                  placeholder="Type your message…"
                  value={composeForm.message}
                  onChange={e => setComposeForm(p => ({ ...p, message: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={isSending || !composeForm.recipients || !composeForm.message}>
                {isSending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── TEMPLATE EDITOR ───────────────────────────────────────────────── */}
        <TemplateEditor
          open={isTemplateOpen}
          onClose={() => { setIsTemplateOpen(false); setEditingTemplate(null) }}
          onSave={handleSaveTemplate}
          initial={editingTemplate}
        />

        {/* ── TOPUP SHEET ───────────────────────────────────────────────────── */}
        <TopupSheet
          open={isTopupOpen}
          onClose={() => setIsTopupOpen(false)}
          onSuccess={fetchAll}
        />
      </div>
    </TooltipProvider>
  )
}
