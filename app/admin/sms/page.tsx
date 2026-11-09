"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import {
  MessageSquare, Plus, Send, Search, RefreshCw, Users, CheckCircle,
  XCircle, Clock, MoreVertical, Download, Trash2, Eye, Zap, TrendingUp,
  Calendar, History, FileText, Settings, Wallet, Bell, Wifi, Router,
  ChevronDown, ChevronRight, Copy, AlertCircle, Package, CreditCard,
  Phone, Smartphone, ToggleLeft, ToggleRight, Info,
} from "lucide-react"
import { usePagePermissions } from "@/hooks/use-page-permissions"
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
  SMSNotificationSettings, SMSWallet, SMSUnitTopup, SMSEventTemplate,
} from "@/lib/types"
import { SMS_TEMPLATE_VARIABLES, COMPOSE_SMS_VARIABLES } from "@/lib/types"

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

// FIX 4c: Cast to any to avoid type conflict
const EMPTY_STATS = {
  total_sent: 0, delivered: 0, pending: 0, failed: 0,
  delivery_rate: 0, total_cost: 0, messages_today: 0, messages_this_week: 0,
} as any

// UPDATED: Removed deprecated fields to match backend
const EMPTY_NOTIF_SETTINGS: SMSNotificationSettings = {
  use_inbuilt_system: false,
  hotspot_welcome: true,
  pppoe_welcome: true,
  pppoe_payment_confirmation: true,
  pppoe_expiry_reminder: true,
  pppoe_expiry_intervals: [{ value: 4, unit: 'days' }],
  pppoe_expiry_notification: true,
  system_router_offline: false,
  system_alert_phone: '',
  router_offline_numbers: [],
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
  { value: 'blessedtexts', label: 'BlessedTexts' },
  { value: 'texin', label: 'Texin' },
  { value: 'celcom', label: 'Celcom Africa' },
  { value: 'talksasa', label: 'Talksasa' },
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
  blessedtexts: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender_id', label: 'Sender ID' },
  ],
  texin: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender_id', label: 'Sender ID' },
  ],
  celcom: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender_id', label: 'Short Code' },
  ],
  talksasa: [
    { key: 'api_key', label: 'API Token', type: 'password' },
    { key: 'sender_id', label: 'Sender ID' },
  ],
}

// FIX 4a: Updated pricing to match backend tiers
const TOPUP_PACKAGES = [
  { units: 25,   label: '25 Units',     price: 10,   pricePerUnit: 0.40 },
  { units: 500,  label: '500 Units',    price: 175,  pricePerUnit: 0.35 },
  { units: 1000, label: '1,000 Units',  price: 300,  pricePerUnit: 0.30, badge: 'Popular' },
  { units: 5000, label: '5,000 Units',  price: 1500, pricePerUnit: 0.30, badge: 'Best Value' },
]

// -----------------------------------------------------------------------------
// SMALL HELPERS
// -----------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    pending: 'bg-warning/15 text-warning',
    failed: 'bg-destructive/15 text-destructive',
    sent: 'bg-primary/15 text-primary',
    running: 'bg-primary/15 text-primary',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    draft: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/15 text-destructive',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
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
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
      {checked && children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 mt-5 first:mt-0">
      {children}
    </p>
  )
}

// -----------------------------------------------------------------------------
// TEMPLATES — one inline editor per automation event (no create / delete / popup)
// -----------------------------------------------------------------------------

const MAX_SMS_CHARS = 480
const smsSegments = (n: number) => (n <= 160 ? 1 : 1 + Math.ceil((n - 160) / 153))

function EventTemplateCard({ tpl, canEdit }: { tpl: SMSEventTemplate; canEdit: boolean }) {
  const [value, setValue] = useState(tpl.content)
  const [saved, setSaved] = useState(tpl.content)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const vars = SMS_TEMPLATE_VARIABLES[tpl.event_type] ?? []
  const dirty = value !== saved

  const insertVar = (key: string) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + key + value.slice(end)
    if (next.length > MAX_SMS_CHARS) {
      toast.error(`Message is limited to ${MAX_SMS_CHARS} characters`)
      return
    }
    setValue(next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + key.length
      el.setSelectionRange(pos, pos)
    })
  }

  const save = async () => {
    if (!value.trim()) { toast.error('Message cannot be empty'); return }
    setSaving(true)
    try {
      const res = await adminApi.saveSMSEventTemplate(tpl.event_type, value)
      setSaved(res.content)
      setValue(res.content)
      toast.success(`${tpl.label} saved`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{tpl.label}</CardTitle>
        <CardDescription>{tpl.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          ref={ref}
          rows={5}
          maxLength={MAX_SMS_CHARS}
          value={value}
          disabled={!canEdit}
          onChange={e => setValue(e.target.value)}
          placeholder="Type your message..."
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{value.length} / {MAX_SMS_CHARS}</span>
          <span>{smsSegments(value.length)} segment{smsSegments(value.length) > 1 ? 's' : ''}</span>
        </div>

        {vars.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vars.map(v => (
              <button
                key={v.key}
                type="button"
                title={`${v.label} — e.g. ${v.example}`}
                disabled={!canEdit}
                onClick={() => insertVar(v.key)}
                className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              >
                {v.key}
              </button>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="flex items-center justify-end gap-2 pt-1">
            {value.trim() !== tpl.default_content.trim() && (
              <Button variant="ghost" size="sm" onClick={() => setValue(tpl.default_content)}>
                Reset to default
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={!dirty || saving || !value.trim()}>
              {saving && <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TemplatesPanel({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<SMSEventTemplate[] | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      setItems(await adminApi.getSMSEventTemplates())
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (failed) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Could not load templates.{' '}
        <button className="underline" onClick={load}>Retry</button>
      </div>
    )
  }
  if (!items) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading templates…</div>
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map(t => <EventTemplateCard key={t.event_type} tpl={t} canEdit={canEdit} />)}
    </div>
  )
}

// -----------------------------------------------------------------------------
// TOPUP SHEET (UPDATED with custom amount input)
// -----------------------------------------------------------------------------

function TopupSheet({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selected, setSelected] = useState<typeof TOPUP_PACKAGES[0] | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  // Calculate units from custom KES amount (min KES 10, rate KES 0.40/unit)
  const customUnits = customAmount ? Math.max(0, Math.floor(parseFloat(customAmount) / 0.40)) : 0
  const isCustomValid = customAmount !== '' && parseFloat(customAmount) >= 10

  const handleTopup = async () => {
    if (!phone) return
    setLoading(true)
    try {
      if (customAmount && isCustomValid) {
        // Custom amount topup
        await adminApi.initiateSMSTopup(customUnits, phone)
        toast.success(`STK push sent for ${customUnits} units. Enter your M-Pesa PIN.`)
      } else if (selected) {
        await adminApi.initiateSMSTopup(selected.units, phone)
        toast.success(`STK push sent for ${selected.units} units. Enter your M-Pesa PIN.`)
      } else {
        toast.error('Select a package or enter a custom amount')
        setLoading(false)
        return
      }
      onClose()
      onSuccess()
    } catch (e: any) {
      toast.error(e?.message ?? 'Top-up failed')
    } finally {
      setLoading(false)
    }
  }

  const activeUnits = customAmount && isCustomValid ? customUnits : selected?.units
  const activePrice = customAmount && isCustomValid ? parseFloat(customAmount) : selected?.price

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Buy SMS Units
          </SheetTitle>
          <SheetDescription>Units are debited when you send SMS messages.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Preset packages */}
          <div className="grid grid-cols-2 gap-3">
            {TOPUP_PACKAGES.map(pkg => (
              <button
                key={pkg.units}
                onClick={() => { setSelected(pkg); setCustomAmount('') }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  selected?.units === pkg.units && !customAmount
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pkg.badge}
                  </span>
                )}
                <div className="text-lg font-bold text-foreground">{pkg.label}</div>
                <div className="text-2xl font-extrabold text-foreground mt-1">KES {pkg.price}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{pkg.pricePerUnit.toFixed(2)}/unit</div>
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Or enter custom amount (min KES 10)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">KES</span>
              <Input
                type="number"
                min="10"
                step="1"
                placeholder="e.g. 50"
                className="pl-12"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelected(null) }}
              />
            </div>
            {customAmount && (
              <p className="text-xs text-muted-foreground">
                {isCustomValid
                  ? `- ${customUnits} units at KES 0.40/unit`
                  : 'Minimum amount is KES 10'}
              </p>
            )}
          </div>

          {/* Phone number */}
          <div className="space-y-1.5">
            <Label>M-Pesa Phone Number</Label>
            <Input
              placeholder="0712345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          {/* Summary */}
          {(activeUnits || activePrice) && (
            <div className="rounded-lg bg-muted/50 border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Units</span><span className="font-medium">{(activeUnits ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-foreground">KES {activePrice}</span></div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleTopup}
            disabled={(!selected && !isCustomValid) || !phone || loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Pay via M-Pesa STK
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// -----------------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------------

const STAT_COLORS: Record<string, string> = {
  blue:    'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber:   'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  red:     'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  purple:  'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
}

export default function SMSPage() {
  const perms = usePagePermissions("/admin/sms")
  const [activeTab, setActiveTab] = useState("history")
  const [messages, setMessages] = useState<SMSMessage[]>([])
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
  const [isTopupOpen, setIsTopupOpen] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])
  const [viewMessage, setViewMessage] = useState<SMSMessage | null>(null)

  const [gwEditing, setGwEditing] = useState<number | null>(null)
  const [gwForm, setGwForm] = useState<SMSGatewayConfigWrite>({
    provider: 'africastalking', is_active: true,
    api_key: '', api_secret: '', username: '', sender_id: '',
    extra_config: {},
    auto_payment_confirmation: true, auto_expiry_reminder: true,
    auto_welcome_message: true, auto_service_suspension: false,
  })

  useEffect(() => {
    const openGateway = () => setActiveTab("gateway")
    const openNotifications = () => setActiveTab("notifications")
    window.addEventListener("netily:onboarding:sms-gateway", openGateway)
    window.addEventListener("netily:onboarding:sms-notifications", openNotifications)
    return () => {
      window.removeEventListener("netily:onboarding:sms-gateway", openGateway)
      window.removeEventListener("netily:onboarding:sms-notifications", openNotifications)
    }
  }, [])

  // FIX: Compose dialog with customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<{id:string; name:string; phone:string; code:string; type:string}[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<{phone:string; name:string; type:string; id:string}[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [recipientType, setRecipientType] = useState<'pppoe'|'hotspot'|'all'>('pppoe')

  // FIX: Campaign bulk state - UPDATED TYPE to include pppoe_active, pppoe_expired, and hotspot_active
  const [bulkGroup, setBulkGroup] = useState<'pppoe'|'pppoe_active'|'pppoe_expired'|'hotspot'|'hotspot_active'|'all'>('pppoe')
  const [bulkName, setBulkName] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkSending, setBulkSending] = useState(false)

  // Debounced search
  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await adminApi.searchCustomers(customerSearch, recipientType)
        setCustomerResults(res.results ?? [])
      } catch {} finally { setSearchLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [customerSearch, recipientType])

  // -- fetch ------------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [msgs, camps, sts, bal, wlt, ns, gws] = await Promise.all([
        adminApi.getSMSMessages().catch(() => null),
        adminApi.getSMSCampaigns().catch(() => null),
        adminApi.getSMSStats().catch(() => null),
        adminApi.getSMSBalance().catch(() => null),
        adminApi.getSMSWallet().catch(() => null),
        adminApi.getSMSNotificationSettings().catch(() => null),
        adminApi.getSMSGatewayConfigs().catch(() => []),
      ])

      if (msgs) setMessages(Array.isArray(msgs) ? msgs : (msgs as any).results ?? [])
      if (camps) setCampaigns(Array.isArray(camps) ? camps : (camps as any).results ?? [])
      if (sts) setStats(sts)
      if (bal) setBalance(bal)
      if (wlt) setWallet(wlt)
      if (ns) setNotifSettings(ns)

      const gwList = (Array.isArray(gws) ? gws : []) as SMSGatewayConfig[]
      setGatewayConfigs(gwList)
      
      // Reset editing state — don't pre-select old IDs that may not exist
      setGwEditing(null)
      
      const active = gwList.find(g => g.is_active)
      if (active) {
        setGwEditing(active.id)
        setGwForm({
          provider: active.provider,
          is_active: active.is_active,
          use_inbuilt_system: (active as any).use_inbuilt_system ?? false,
          api_key: '', api_secret: '',
          username: active.username,
          sender_id: active.sender_id,
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

  // -- AUTO FETCH LIVE BALANCE FOR CUSTOM PROVIDERS (FIX) --------------------
  useEffect(() => {
    // Only fetch live balance when using a custom provider (not inbuilt)
    if (!notifSettings.use_inbuilt_system) {
      const activeCustomGw = gatewayConfigs.find(g => g.is_active && !g.use_inbuilt_system)
      if (activeCustomGw && activeCustomGw.id) {
        adminApi.testSMSGateway(activeCustomGw.id)
          .then(res => {
            if (res.success && res.balance) {
              // Update balance state with live provider data
              setBalance({
                balance: typeof res.balance === 'number' ? res.balance : parseFloat(res.balance),
                currency: 'KES',
                provider: activeCustomGw.provider,
              })
            }
          })
          .catch(err => console.error('Failed to fetch live balance:', err))
      }
    }
  }, [gatewayConfigs, notifSettings.use_inbuilt_system])

  // -- derived ----------------------------------------------------------------
  const filteredMessages = useMemo(() => messages.filter(m => {
    const q = searchQuery.toLowerCase()
    const matchQ = m.recipient.toLowerCase().includes(q) ||
      (m.recipient_name ?? '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || m.status === statusFilter
    return matchQ && matchS
  }), [messages, searchQuery, statusFilter])

  // -- handlers ---------------------------------------------------------------
  const handleSend = async () => {
    if (selectedRecipients.length === 0 || !composeForm.message.trim()) {
      toast.error('Add at least one recipient and a message')
      return
    }
    setIsSending(true)
    try {
      const res = await adminApi.composeSMS({
        message: composeForm.message,
        recipients: selectedRecipients,
      })
      if (res.queued) {
        toast.success(`Sending to ${res.count} recipients in the background`)
      } else if (!res.failed) {
        toast.success(`SMS sent to ${res.sent} recipient(s)`)
      } else {
        const firstErr = res.results?.find(r => !r.success)?.error || 'Send failed'
        toast.error(`${res.failed} failed: ${firstErr}`)
        if (res.sent) toast.success(`${res.sent} sent`)
      }
      if (res.queued || (res.sent ?? 0) > 0) {
        setIsComposeOpen(false)
        setSelectedRecipients([])
        setComposeForm({ recipients: '', message: '', template: '' })
      }
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send')
    } finally { setIsSending(false) }
  }

  const handleBulkSend = async () => {
    if (!bulkMessage.trim()) { toast.error('Message is required'); return }
    setBulkSending(true)
    try {
      const res = await adminApi.sendCampaignToGroup({
        group: bulkGroup,
        message: bulkMessage,
        name: bulkName || undefined,
      })
      toast.success(`Campaign started - ${res.recipient_count} recipients`)
      setBulkMessage('')
      setBulkName('')
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to start campaign')
    } finally { setBulkSending(false) }
  }

  const handleSaveNotifSettings = async (patch: Partial<SMSNotificationSettings>) => {
    setIsSavingNotif(true)
    try {
      const updated = await adminApi.updateSMSNotificationSettings(patch)
      // Merge, not replace — preserves all fields
      setNotifSettings(prev => ({ ...prev, ...updated }))
      toast.success('Notification settings saved')
    } catch (e: any) { toast.error(e?.message ?? 'Failed to save') }
    finally { setIsSavingNotif(false) }
  }

  const handleToggleNotif = (key: keyof SMSNotificationSettings, value: boolean | number | any[]) => {
    const patch = { [key]: value } as Partial<SMSNotificationSettings>
    setNotifSettings(p => ({ ...p, ...patch }))
    handleSaveNotifSettings(patch)
  }

  // UPDATED: handleGatewaySave with 404 fallback
  const handleGatewaySave = async () => {
    setGwSaving(true)
    try {
      const payload: Partial<SMSGatewayConfigWrite> = { ...gwForm, is_active: true }
      if (payload.use_inbuilt_system) {
        delete payload.api_key
        delete payload.api_secret
        delete payload.username
      } else if (gwEditing) {
        if (!payload.api_key) delete payload.api_key
        if (!payload.api_secret) delete payload.api_secret
      }

      let res: SMSGatewayConfig
      if (gwEditing) {
        try {
          res = await adminApi.updateSMSGatewayConfig(gwEditing, payload)
        } catch (err: any) {
          // Record doesn't exist in this tenant — reset and create fresh
          if (err.message?.includes('Not found') || err.message?.includes('404')) {
            setGwEditing(null)
            res = await adminApi.createSMSGatewayConfig(payload as SMSGatewayConfigWrite)
          } else {
            throw err
          }
        }
      } else {
        res = await adminApi.createSMSGatewayConfig(payload as SMSGatewayConfigWrite)
      }

      const updated = await adminApi.getSMSGatewayConfigs().catch(() => [])
      setGatewayConfigs(updated)
      setGwEditing(res.id)
      toast.success('Gateway saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed')
    } finally {
      setGwSaving(false)
    }
  }

  const handleGatewayTest = async () => {
    if (!gwEditing) { toast.error('Save first'); return }
    setGwTesting(true)
    try {
      const r = await adminApi.testSMSGateway(gwEditing)
      if (r.success) {
        toast.success(`Connected! Balance: ${JSON.stringify(r.balance)}`)
        // Also update the live balance display immediately
        if (r.balance) {
          setBalance({
            balance: typeof r.balance === 'number' ? r.balance : parseFloat(r.balance),
            currency: 'KES',
            provider: gwForm.provider,
          })
        }
      } else {
        toast.error(`Failed: ${r.error}`)
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Test failed')
    } finally {
      setGwTesting(false)
    }
  }

  const [composeForm, setComposeForm] = useState({ recipients: '', message: '', template: '' })
  const composeRef = useRef<HTMLTextAreaElement>(null)
  const insertComposeVar = (key: string) => {
    const el = composeRef.current
    const cur = composeForm.message
    const start = el?.selectionStart ?? cur.length
    const end = el?.selectionEnd ?? cur.length
    const next = cur.slice(0, start) + key + cur.slice(end)
    if (next.length > MAX_SMS_CHARS) { toast.error(`Message is limited to ${MAX_SMS_CHARS} characters`); return }
    setComposeForm(p => ({ ...p, message: next }))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + key.length
      el.setSelectionRange(pos, pos)
    })
  }
  const walletUnits = wallet?.sms_units ?? 0

  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 space-y-6">

        {/* -- Header ----------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SMS Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Send messages, manage templates, and configure notifications</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {notifSettings.use_inbuilt_system && (
              <Button variant="outline" size="sm" onClick={() => setIsTopupOpen(true)} className="w-full sm:w-auto">
                <Wallet className="w-4 h-4 mr-1.5" />
                {walletUnits > 0 ? `${Number(walletUnits).toLocaleString()} units` : 'Buy Units'}
              </Button>
            )}
            <Button size="sm" onClick={() => setIsComposeOpen(true)} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-1.5" />
              Send SMS
            </Button>
          </div>
        </div>

        {/* -- Stats row -------------------------------------------------------- */}
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${STAT_COLORS[s.color]}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* -- Main tabs -------------------------------------------------------- */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 w-full sm:w-fit">
            <TabsTrigger value="history" className="text-xs"><History className="w-3.5 h-3.5 mr-1.5" />History</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs"><FileText className="w-3.5 h-3.5 mr-1.5" />Templates</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs"><Users className="w-3.5 h-3.5 mr-1.5" />Campaigns</TabsTrigger>
            <TabsTrigger data-onboarding="sms-notifications-tab" value="notifications" className="text-xs"><Bell className="w-3.5 h-3.5 mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger data-onboarding="sms-gateway-tab" value="gateway" className="text-xs"><Settings className="w-3.5 h-3.5 mr-1.5" />Gateway</TabsTrigger>
            {notifSettings.use_inbuilt_system && (
              <TabsTrigger value="wallet" className="text-xs"><Wallet className="w-3.5 h-3.5 mr-1.5" />Wallet</TabsTrigger>
            )}
          </TabsList>

          {/* -- HISTORY -------------------------------------------------------- */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <CardTitle>Message History</CardTitle>
                    <CardDescription>All sent and received messages</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto"><Download className="w-4 h-4 mr-1.5" />Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 mb-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-full text-sm sm:w-32"><SelectValue /></SelectTrigger>
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
                      <TableRow className="bg-muted/50">
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
                            {m.recipient_name && <div className="text-xs text-muted-foreground">{m.recipient}</div>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs text-muted-foreground truncate">{m.message}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setViewMessage(m)}
                              >
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={m.status} /></TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs capitalize text-muted-foreground">{m.type}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {m.status === 'failed' && perms.canEdit && (
                                  <DropdownMenuItem onClick={() => adminApi.retrySMS(m.id).then(() => toast.success('Retrying...'))}>
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
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
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

          {/* -- TEMPLATES ------------------------------------------------------ */}
          <TabsContent value="templates" className="mt-4">
            <TemplatesPanel canEdit={perms.canEdit} />
          </TabsContent>

          {/* -- CAMPAIGNS (UPDATED with PPPoE Active/Expired and Hotspot Active) -- */}
          <TabsContent value="campaigns" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Send bulk card */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Bulk SMS</CardTitle>
                  <CardDescription>Send to PPPoE (active/expired/all), Hotspot (all/active), or every customer at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Target Group</Label>
                    <Select value={bulkGroup} onValueChange={(v: any) => setBulkGroup(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pppoe">PPPoE / Static — All</SelectItem>
                        <SelectItem value="pppoe_active">PPPoE / Static — Active only</SelectItem>
                        <SelectItem value="pppoe_expired">PPPoE / Static — Expired only</SelectItem>
                        <SelectItem value="hotspot">Hotspot users — All (incl. expired)</SelectItem>
                        <SelectItem value="hotspot_active">Hotspot users — Active only</SelectItem>
                        <SelectItem value="all">All (PPPoE + Hotspot)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Campaign Name</Label>
                    <Input placeholder="e.g., April Promotion" value={bulkName} onChange={e => setBulkName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label>Message</Label>
                      <span className={`text-xs ${bulkMessage.length > 160 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {bulkMessage.length}/160 · {Math.ceil(Math.max(bulkMessage.length,1)/160)} unit(s)/recipient
                      </span>
                    </div>
                    <Textarea rows={4} placeholder="Type your message-" value={bulkMessage}
                      onChange={e => setBulkMessage(e.target.value)} />
                  </div>
                  <Button className="w-full" disabled={!bulkMessage || bulkSending}
                    onClick={handleBulkSend}>
                    {bulkSending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to {bulkGroup === 'all' ? 'All Customers' :
                      bulkGroup === 'pppoe' ? 'All PPPoE Customers' :
                      bulkGroup === 'pppoe_active' ? 'Active PPPoE Customers' :
                      bulkGroup === 'pppoe_expired' ? 'Expired PPPoE Customers' :
                      bulkGroup === 'hotspot_active' ? 'Active Hotspot Users' :
                      'All Hotspot Users'}
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign history */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>Previous bulk sends and their results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs text-right">Recipients</TableHead>
                          <TableHead className="text-xs text-right">Sent ?</TableHead>
                          <TableHead className="text-xs text-right">Failed ?</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm font-medium">{c.name}</TableCell>
                            <TableCell className="text-sm text-right">{(c.recipient_count ?? 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm text-right text-emerald-600">{c.delivered_count ?? 0}</TableCell>
                            <TableCell className="text-sm text-right text-destructive">{c.failed_count ?? 0}</TableCell>
                            <TableCell><StatusBadge status={c.status} /></TableCell>
                          </TableRow>
                        ))}
                        {campaigns.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No campaigns yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* -- NOTIFICATIONS -------------------------------------------------- */}
          <TabsContent value="notifications" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">

              {/* -- Inbuilt toggle ---------------------------------------- */}
              <Card data-onboarding="sms-notifications-panel" className="lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notifSettings.use_inbuilt_system ? 'bg-primary' : 'bg-muted'}`}>
                      <Zap className={`w-6 h-6 ${notifSettings.use_inbuilt_system ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">Use Netily Inbuilt SMS System</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
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
                          <div className="text-sm bg-primary/10 border border-primary/15 rounded-lg px-3 py-2 text-primary">
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

              {/* -- Hotspot notifications ------------------------------ */}
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
                    label="Welcome / Session Active"
                    description="Confirm activation with login details (username & password per device) and speed"
                    checked={notifSettings.hotspot_welcome}
                    onCheckedChange={v => handleToggleNotif('hotspot_welcome', v)}
                  />
                </CardContent>
              </Card>

              {/* -- PPPoE / Static notifications (UPDATED - removed deprecated) ----------------------- */}
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
                    label="Payment / Renewal Confirmation"
                    description="Confirm when a payment or renewal is received"
                    checked={notifSettings.pppoe_payment_confirmation}
                    onCheckedChange={v => handleToggleNotif('pppoe_payment_confirmation', v)}
                  />
                  <Separator />

                  {/* --- EXPIRY REMINDER (UPDATED with multi-interval) --- */}
                  <NotifToggle
                    label="Expiry Reminder"
                    description="Remind before subscription expires"
                    checked={notifSettings.pppoe_expiry_reminder}
                    onCheckedChange={v => handleToggleNotif('pppoe_expiry_reminder', v)}
                  >
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">Send reminders at:</Label>
                      {((notifSettings as any).pppoe_expiry_intervals ?? [{ value: 4, unit: 'days' }]).map(
                        (interval: { value: number; unit: string }, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              className="w-20 h-7 text-sm"
                              value={interval.value}
                              onChange={e => {
                                const intervals = [...((notifSettings as any).pppoe_expiry_intervals ?? [{ value: 4, unit: 'days' }])]
                                intervals[idx] = { ...intervals[idx], value: parseInt(e.target.value) || 1 }
                                handleToggleNotif('pppoe_expiry_intervals' as any, intervals as any)
                              }}
                            />
                            <Select
                              value={interval.unit}
                              onValueChange={v => {
                                const intervals = [...((notifSettings as any).pppoe_expiry_intervals ?? [{ value: 4, unit: 'days' }])]
                                intervals[idx] = { ...intervals[idx], unit: v }
                                handleToggleNotif('pppoe_expiry_intervals' as any, intervals as any)
                              }}
                            >
                              <SelectTrigger className="w-24 h-7 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">days</SelectItem>
                                <SelectItem value="hours">hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">before expiry</span>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => {
                                const intervals = ((notifSettings as any).pppoe_expiry_intervals ?? []).filter((_: any, i: number) => i !== idx)
                                handleToggleNotif('pppoe_expiry_intervals' as any, intervals as any)
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        variant="outline" size="sm" className="h-7 text-xs mt-1"
                        onClick={() => {
                          const intervals = [...((notifSettings as any).pppoe_expiry_intervals ?? []), { value: 1, unit: 'days' }]
                          handleToggleNotif('pppoe_expiry_intervals' as any, intervals as any)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />Add reminder
                      </Button>
                    </div>
                  </NotifToggle>
                  <Separator />

                  {/* NEW: Subscription Expired Notification */}
                  <NotifToggle
                    label="Subscription Expired"
                    description="Notify customer once when their subscription has actually expired"
                    checked={notifSettings.pppoe_expiry_notification}
                    onCheckedChange={v => handleToggleNotif('pppoe_expiry_notification', v)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* -- GATEWAY ------------------------------------------------------- */}
          <TabsContent value="gateway" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card data-onboarding="sms-gateway-panel">
                <CardHeader>
                  <CardTitle>Provider Configuration</CardTitle>
                  <CardDescription>
                    {notifSettings.use_inbuilt_system
                      ? 'Using Netily Inbuilt Gateway (Bytewave Master Account)'
                      : 'Configure your own SMS provider credentials'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* -- INBUILT MODE BANNER ------------------------------- */}
                  {notifSettings.use_inbuilt_system ? (
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/10 p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary">Netily Inbuilt SMS Active</p>
                          <p className="text-xs text-primary">
                            Messages route through Netily's Bytewave master account. Units deducted from your wallet.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm bg-card rounded-lg px-4 py-2 border border-primary/15">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-semibold text-foreground">Bytewave (Netily Default)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm bg-card rounded-lg px-4 py-2 border border-primary/15">
                        <span className="text-muted-foreground">API Keys</span>
                        <span className="text-muted-foreground italic text-xs">Managed by Netily — not required</span>
                      </div>
                      <div className="flex items-center justify-between text-sm bg-card rounded-lg px-4 py-2 border border-primary/15">
                        <span className="text-muted-foreground">SMS Units</span>
                        <span className="font-bold text-primary">
                          {Number(walletUnits).toLocaleString()} units available
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-primary border-primary/30 hover:bg-primary/15"
                        onClick={() => setIsTopupOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />Buy More Units
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        To use your own provider, turn off "Netily Inbuilt SMS" in the Notifications tab.
                      </p>
                    </div>
                  ) : (
                    /* -- CUSTOM PROVIDER FORM ---------------------------- */
                    <>
                      <div className="space-y-1.5">
                        <Label>Provider</Label>
                        <Select
                          value={gwForm.provider}
                          onValueChange={v => setGwForm(p => ({ ...p, provider: v as SMSProvider }))}
                        >
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
                            onChange={e => setGwForm(p => ({
                              ...p, extra_config: { ...p.extra_config, partner_id: e.target.value }
                            }))}
                          />
                        </div>
                      )}
                      {gwForm.provider === 'celcom' && (
                        <div className="space-y-1.5">
                          <Label>Partner ID</Label>
                          <Input
                            placeholder="Celcom Partner ID"
                            value={gwForm.extra_config?.partner_id ?? ''}
                            onChange={e => setGwForm(p => ({
                              ...p, extra_config: { ...p.extra_config, partner_id: e.target.value }
                            }))}
                          />
                        </div>
                      )}
                      {gwForm.provider === 'infobip' && (
                        <div className="space-y-1.5">
                          <Label>Base URL</Label>
                          <Input
                            placeholder="https://xxxxx.api.infobip.com"
                            value={gwForm.extra_config?.base_url ?? ''}
                            onChange={e => setGwForm(p => ({
                              ...p, extra_config: { ...p.extra_config, base_url: e.target.value }
                            }))}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleGatewaySave} disabled={gwSaving}>
                          {gwSaving && <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />}
                          {gwEditing ? 'Update Gateway' : 'Save Gateway'}
                        </Button>
                        {gwEditing && (
                          <Button variant="outline" onClick={handleGatewayTest} disabled={gwTesting}>
                            {gwTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>

                      {/* Saved gateways list - only show custom gateways */}
                      {gatewayConfigs.filter(g => !g.use_inbuilt_system).length > 0 && (
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Saved Gateways</p>
                          {gatewayConfigs.filter(g => !g.use_inbuilt_system).map(gw => (
                            <div key={gw.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
                              gw.is_active
                                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                                : 'bg-muted/50 border border-border'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{gw.provider_display}</span>
                                {gw.is_active && (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px]">Active</Badge>
                                )}
                                {gw.sender_id && (
                                  <span className="text-muted-foreground text-xs">{gw.sender_id}</span>
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                {!gw.is_active && perms.canEdit && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs"
                                    onClick={() => adminApi.activateSMSGateway(gw.id).then(fetchAll)}>
                                    Activate
                                  </Button>
                                )}
                                {perms.canEdit && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs"
                                    onClick={() => {
                                      setGwEditing(gw.id)
                                      setGwForm(gw)
                                    }}>
                                    Edit
                                  </Button>
                                )}
                                {perms.canDelete && (
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                                    onClick={() => adminApi.deleteSMSGatewayConfig(gw.id).then(fetchAll)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {perms.canAdd && (
                            <div className="mt-4 pt-4 border-t">
                              <Button variant="outline" size="sm" className="w-full text-xs"
                                onClick={() => { setGwEditing(null); setGwForm({ provider: 'africastalking', is_active: true, use_inbuilt_system: false, api_key: '', api_secret: '', username: '', sender_id: '', extra_config: {}, auto_payment_confirmation: true, auto_expiry_reminder: true, auto_welcome_message: true, auto_service_suspension: false }) }}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Another Gateway
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Live balance card — updated for inbuilt mode */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Balance</CardTitle>
                  <CardDescription>
                    {notifSettings.use_inbuilt_system
                      ? 'Your Netily wallet SMS units'
                      : 'Current balance from your active provider'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* PRESERVED: dark balance card is intentional — do not theme-swap */}
                  <div className="rounded-xl bg-linear-to-br from-slate-800 to-slate-900 p-5 text-white">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      {notifSettings.use_inbuilt_system ? 'Wallet Units' : 'Provider Balance'}
                    </p>
                    <p className="text-3xl font-bold">
                      {notifSettings.use_inbuilt_system
                        ? `${Number(walletUnits).toLocaleString()} units`
                        : balance
                          ? `${balance.currency || 'KES'} ${Number(balance.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : '—'}
                    </p>
                    {!notifSettings.use_inbuilt_system && balance && (
                      <p className="text-xs text-slate-400 mt-1">{balance.provider}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Sent Today', value: stats.messages_today },
                      { label: 'This Week', value: stats.messages_this_week },
                      { label: 'Delivery Rate', value: `${stats.delivery_rate ?? 0}%` },
                      {
                        label: 'Total Spend',
                        value: `KES ${Number(stats.total_cost ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* -- WALLET --------------------------------------------------------- */}
          {notifSettings.use_inbuilt_system && (
            <TabsContent value="wallet" className="mt-4">
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Balance card */}
                <Card className="lg:col-span-1">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                      <Wallet className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available SMS Units</p>
                      <p className="text-4xl font-extrabold text-foreground mt-1">{Number(walletUnits).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~ KES {(walletUnits * (wallet?.sell_price_per_unit ?? 0.6)).toFixed(0)} value
                      </p>
                    </div>
                    <Button className="w-full" onClick={() => setIsTopupOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />Buy More Units
                    </Button>

                    <div className="text-left pt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>All units</span>
                        <span className="font-semibold text-foreground">KES 0.40/unit</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Minimum top-up: KES 10 (25 units)</p>
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
                          <TableRow className="bg-muted/50">
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
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(t.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(wallet?.topup_history ?? []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
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
          )}
        </Tabs>

        {/* -- COMPOSE DIALOG (UPDATED) ----------------------------------------- */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>Search for customers and add them as recipients</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Recipient Type</Label>
                <Select value={recipientType} onValueChange={(v: any) => {
                  setRecipientType(v)
                  setCustomerSearch('')
                  setCustomerResults([])
                }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pppoe">PPPoE / Static</SelectItem>
                    <SelectItem value="hotspot">Hotspot</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Search & Add Recipients</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8 h-8 text-sm"
                    placeholder="Name or phone..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                </div>
                {customerResults.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto text-sm divide-y">
                    {customerResults.map(c => (
                      <button key={c.id} className="w-full text-left px-3 py-1.5 hover:bg-muted flex justify-between"
                        onClick={() => {
                          if (!selectedRecipients.find(r => r.phone === c.phone)) {
                            setSelectedRecipients(p => [...p, { phone: c.phone, name: c.name, type: c.type, id: c.id }])
                          }
                          setCustomerSearch('')
                          setCustomerResults([])
                        }}>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedRecipients.map(r => (
                      <span key={r.phone} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {r.name || r.phone}
                        <button onClick={() => setSelectedRecipients(p => p.filter(x => x.phone !== r.phone))}>
                          <XCircle className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Message</Label>
                <p className="text-xs text-muted-foreground">Use variables to personalize each delivery.</p>
                <Textarea
                  ref={composeRef}
                  rows={5}
                  maxLength={MAX_SMS_CHARS}
                  placeholder="Dear {first_name}, your package expires on {expiry_date}."
                  value={composeForm.message}
                  onChange={e => setComposeForm(p => ({ ...p, message: e.target.value }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{composeForm.message.length} / {MAX_SMS_CHARS}</span>
                  <span>
                    {smsSegments(composeForm.message.length)} segment
                    {smsSegments(composeForm.message.length) > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMPOSE_SMS_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      title={`${v.label} — e.g. ${v.example}`}
                      onClick={() => insertComposeVar(v.key)}
                      className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                {perms.canAdd && (
                  <Button onClick={handleSend} disabled={isSending || selectedRecipients.length === 0 || !composeForm.message}>
                    {isSending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to {selectedRecipients.length} recipient(s)
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* -- TOPUP SHEET ----------------------------------------------------- */}
        <TopupSheet
          open={isTopupOpen}
          onClose={() => setIsTopupOpen(false)}
          onSuccess={fetchAll}
        />

        {/* -- VIEW MESSAGE DIALOG -------------------------------------------- */}
        <Dialog open={!!viewMessage} onOpenChange={(open) => !open && setViewMessage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{viewMessage?.recipient_name || viewMessage?.recipient}</DialogTitle>
              <DialogDescription>
                {viewMessage?.sent_at ? new Date(viewMessage.sent_at).toLocaleString() : '—'}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap break-words">
              {viewMessage?.message}
            </div>
            {viewMessage && (
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={viewMessage.status} />
                <span className="text-xs text-muted-foreground capitalize">{viewMessage.type}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}