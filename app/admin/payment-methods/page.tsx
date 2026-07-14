"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  AlertCircle,
  Loader2,
  Landmark,
  Smartphone,
  Shield,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Zap,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InactivityGuard } from "@/components/inactivity-guard"
import { OtpGuard } from "@/components/otp-guard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { MpesaSettingsPanel } from "@/components/mpesa-settings-panel"
import type { PaymentMethod, PaymentDashboardStats } from "@/lib/types"

// =============================================================================
// CONSTANTS
// =============================================================================
const TUMA_BANKS = [
  "Kenya Commercial Bank", "Equity Bank", "Cooperative Bank", "Absa Bank",
  "Standard Chartered Bank", "Stanbic Bank", "Diamond Trust Bank", "Family Bank",
  "National Bank of Kenya", "NCBA Bank", "I&M Bank", "Ecobank Savings & Current",
  "Ecobank Xpress", "Faulu Bank", "Kingdom Bank", "SBM Bank Kenya", "Sidian Bank",
  "Bank of Africa", "Bank of Baroda", "Post Bank", "LOOP BUSINESS", "LOOP C2B",
  "Fortune Sacco", "K Unity Sacco", "Tower Sacco Society", "Zemo Pay",
]

type ChannelKind = "bank" | "till" | "paybill"

const CHANNEL_META: Record<ChannelKind, { title: string; methodType: string }> = {
  bank: { title: "Bank Account", methodType: "BANK_TRANSFER" },
  till: { title: "Till Number", methodType: "MPESA_TILL" },
  paybill: { title: "Paybill", methodType: "MPESA_PAYBILL" },
}

function summaryForChannel(kind: ChannelKind, m?: PaymentMethod) {
  if (!m) return undefined
  const c = (m.config || {}) as Record<string, string>
  if (kind === "bank") {
    return c.bank_name ? `${c.bank_name}${c.account_number ? ` · ${c.account_number}` : ""}` : undefined
  }
  if (kind === "till") return c.till_number ? `Till: ${c.till_number}` : undefined
  return c.paybill_number ? `Paybill: ${c.paybill_number}` : undefined
}

// =============================================================================
// PAGE
// =============================================================================
export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [methodsError, setMethodsError] = useState<string | null>(null)

  const [stats, setStats] = useState<PaymentDashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [busyId, setBusyId] = useState<number | null>(null)

  const [channelDialog, setChannelDialog] = useState<ChannelKind | null>(null)
  const [darajaOpen, setDarajaOpen] = useState(false)
  const [kopoOpen, setKopoOpen] = useState(false)

  const [kopoConfig, setKopoConfig] = useState<Record<string, string>>({})

  const fetchMethods = useCallback(async () => {
    try {
      setMethodsError(null)
      const res = await adminApi.getPaymentMethods()
      setMethods(res.results || [])
    } catch (err: any) {
      setMethodsError(err.message || "Failed to load payment methods")
    } finally {
      setMethodsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getPaymentDashboardStats()
      setStats(data)
    } catch {
      // supplementary — fail silently
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMethods()
    fetchStats()
    adminApi.getKopoKopoConfig().then((d: any) => setKopoConfig(d || {})).catch(() => {})
  }, [fetchMethods, fetchStats])

  // ── Split by gateway. Now that the backend actually returns
  // mpesa_configuration, this correctly excludes Daraja-linked methods
  // from the Tuma-backed channel cards. ──
  const darajaMethods = methods.filter((m) => !!m.mpesa_configuration)
  const tumaMethods = methods.filter((m) => !m.mpesa_configuration)

  const bankMethod = tumaMethods.find((m) => m.method_type === "BANK_TRANSFER")
  const tillMethod = tumaMethods.find((m) => m.method_type === "MPESA_TILL")
  const paybillMethod = tumaMethods.find((m) => m.method_type === "MPESA_PAYBILL")

  const activeMethod = methods.find((m) => m.is_active)
  const activeDaraja = darajaMethods.find((m) => m.is_active)
  const darajaSummary = activeDaraja?.mpesa_configuration_details
    ? `${activeDaraja.mpesa_configuration_details.shortcode_type === "TILL" ? "Till" : "Paybill"}: ${activeDaraja.mpesa_configuration_details.business_shortcode}`
    : darajaMethods.length > 0
    ? `${darajaMethods.length} configuration${darajaMethods.length > 1 ? "s" : ""} saved`
    : undefined

  const kopoConfigured = !!kopoConfig?.client_id

  const channelMethod = (kind: ChannelKind) =>
    kind === "bank" ? bankMethod : kind === "till" ? tillMethod : paybillMethod

  const handleActivate = async (method: PaymentMethod) => {
    if (method.is_active) return
    setBusyId(method.id)
    try {
      const result = await adminApi.togglePaymentMethodActive(method.id)
      const channel = result.settlement_channel || method.name
      toast.success(`${method.name} activated`, {
        description:
          result.tuma_synced !== false
            ? `Subscribers now pay via ${channel}.`
            : `Activated locally. Sync pending${result.tuma_error ? `: ${result.tuma_error}` : "."}`,
      })
      fetchMethods()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate")
    } finally {
      setBusyId(null)
    }
  }

  const connectedCount =
    (bankMethod ? 1 : 0) + (tillMethod ? 1 : 0) + (paybillMethod ? 1 : 0) +
    (darajaMethods.length > 0 ? 1 : 0) + (kopoConfigured ? 1 : 0)

  if (methodsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <InactivityGuard timeoutMinutes={5}>
      <OtpGuard
        title="Payment Methods Verification"
        description="Verify your identity before managing payment methods and settlement channels."
      >
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Pick one gateway so subscribers can pay you. Only one is active at a time — switching
                is one click and saved credentials are kept.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setMethodsLoading(true); fetchMethods() }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
            </Button>
          </div>

          {methodsError && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-destructive flex-1">{methodsError}</p>
              <Button variant="outline" size="sm" onClick={() => { setMethodsLoading(true); fetchMethods() }}>
                Retry
              </Button>
            </div>
          )}

          {activeMethod && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <span>
                Subscribers are currently paying via <span className="font-semibold">{activeMethod.name}</span>.
              </span>
            </div>
          )}

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            5 gateways available · {connectedCount} connected
            {statsLoading ? "" : stats ? ` · KES ${Number(stats.amount_this_month || stats.total_amount || 0).toLocaleString()} this month` : ""}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GatewayCard
              icon={Landmark}
              title="Bank Account"
              tags={["Bank transfer"]}
              summary={summaryForChannel("bank", bankMethod)}
              configured={!!bankMethod}
              active={!!bankMethod?.is_active}
              busy={busyId === bankMethod?.id}
              footNote={bankMethod ? "Settlement: 1–2 business days" : "Not configured"}
              onConfigure={() => setChannelDialog("bank")}
              onActivate={bankMethod ? () => handleActivate(bankMethod) : undefined}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <GatewayCard
              icon={Smartphone}
              title="Till Number"
              subtitle="No API keys"
              tags={["Mobile Money"]}
              summary={summaryForChannel("till", tillMethod)}
              configured={!!tillMethod}
              active={!!tillMethod?.is_active}
              busy={busyId === tillMethod?.id}
              footNote={tillMethod ? "Settlement: instant" : "Not configured"}
              onConfigure={() => setChannelDialog("till")}
              onActivate={tillMethod ? () => handleActivate(tillMethod) : undefined}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            />
            <GatewayCard
              icon={Smartphone}
              title="Paybill"
              subtitle="No API keys"
              tags={["Mobile Money"]}
              summary={summaryForChannel("paybill", paybillMethod)}
              configured={!!paybillMethod}
              active={!!paybillMethod?.is_active}
              busy={busyId === paybillMethod?.id}
              footNote={paybillMethod ? "Settlement: instant" : "Not configured"}
              onConfigure={() => setChannelDialog("paybill")}
              onActivate={paybillMethod ? () => handleActivate(paybillMethod) : undefined}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            />
            <GatewayCard
              icon={Shield}
              title="M-Pesa Paybill / Till"
              subtitle="Your API keys"
              tags={["STK Push", "Paybill", "Till"]}
              summary={darajaSummary}
              configured={darajaMethods.length > 0}
              active={!!activeDaraja}
              footNote="Instant · powers hotspot & PPPoE STK"
              onConfigure={() => setDarajaOpen(true)}
              iconColor="text-violet-600"
              iconBg="bg-violet-50 dark:bg-violet-950/30"
            />
            <GatewayCard
              icon={Wallet}
              title="KopoKopo"
              tags={["Mobile Money"]}
              summary={kopoConfigured ? "Credentials saved" : undefined}
              configured={kopoConfigured}
              active={false}
              footNote="Coming soon to checkout"
              onConfigure={() => setKopoOpen(true)}
              iconColor="text-amber-600"
              iconBg="bg-amber-50 dark:bg-amber-950/30"
            />
          </div>
        </div>

        {/* Bank / Till / Paybill edit dialog */}
        <ChannelFormDialog
          kind={channelDialog}
          open={!!channelDialog}
          onOpenChange={(o) => !o && setChannelDialog(null)}
          existing={channelDialog ? channelMethod(channelDialog) : undefined}
          onSaved={() => {
            setChannelDialog(null)
            fetchMethods()
            fetchStats()
          }}
        />

        {/* Daraja dialog — reuses your existing multi-config panel as-is */}
        <Dialog open={darajaOpen} onOpenChange={setDarajaOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>M-Pesa Paybill / Till (API Keys)</DialogTitle>
              <DialogDescription>
                Connect your own Safaricom Daraja credentials for instant STK push and Paybill matching.
                You can save multiple numbers here; only one can be active at a time.
              </DialogDescription>
            </DialogHeader>
            <MpesaSettingsPanel />
          </DialogContent>
        </Dialog>

        {/* KopoKopo dialog */}
        <Dialog open={kopoOpen} onOpenChange={setKopoOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>KopoKopo</DialogTitle>
              <DialogDescription>Connect your KopoKopo account to accept payments.</DialogDescription>
            </DialogHeader>
            <KopoKopoSettings onSaved={(cfg) => setKopoConfig(cfg)} />
          </DialogContent>
        </Dialog>
      </OtpGuard>
    </InactivityGuard>
  )
}

// =============================================================================
// GATEWAY CARD
// =============================================================================
function GatewayCard({
  icon: Icon,
  title,
  subtitle,
  tags,
  summary,
  footNote,
  configured,
  active,
  busy,
  onConfigure,
  onActivate,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: {
  icon: typeof Landmark
  title: string
  subtitle?: string
  tags: string[]
  summary?: string
  footNote?: string
  configured: boolean
  active: boolean
  busy?: boolean
  onConfigure: () => void
  onActivate?: () => void
  iconColor?: string
  iconBg?: string
}) {
  return (
    <Card className={active ? "border-primary/40 shadow-sm" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {subtitle && <Badge variant="outline" className="text-[10px]">{subtitle}</Badge>}
            </div>
            <div className="mt-1">
              {active ? (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" />Active
                </Badge>
              ) : configured ? (
                <Badge variant="secondary" className="text-[10px]">Connected</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] font-normal">{t}</Badge>
          ))}
        </div>
        {summary && (
          <div className="text-xs font-mono px-3 py-2 rounded-lg bg-muted/50 truncate">{summary}</div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">{footNote}</span>
          <div className="flex items-center gap-2">
            {configured && !active && onActivate && (
              <Button size="sm" variant="secondary" onClick={onActivate} disabled={busy}>
                {busy && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}Activate
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onConfigure}>
              {configured ? "Edit" : "Configure"}<ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// BANK / TILL / PAYBILL EDIT DIALOG (single-instance, edit-in-place)
// =============================================================================
function ChannelFormDialog({
  kind,
  open,
  onOpenChange,
  existing,
  onSaved,
}: {
  kind: ChannelKind | null
  open: boolean
  onOpenChange: (o: boolean) => void
  existing?: PaymentMethod
  onSaved: () => void
}) {
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [number, setNumber] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const c = (existing?.config || {}) as Record<string, string>
    setBankName(c.bank_name || "")
    setAccountNumber(c.account_number || "")
    setNumber(c.till_number || c.paybill_number || "")
  }, [open, existing])

  if (!kind) return null
  const meta = CHANNEL_META[kind]

  const handleSave = async () => {
    if (kind === "bank") {
      if (!bankName) return toast.error("Select a bank")
      if (!accountNumber.trim()) return toast.error("Account number is required")
    } else if (!number.trim()) {
      return toast.error(`${kind === "till" ? "Till" : "Paybill"} number is required`)
    }

    setSaving(true)
    try {
      const cfg: Record<string, string> =
        kind === "bank"
          ? { bank_name: bankName, account_number: accountNumber.trim() }
          : kind === "till"
          ? { till_number: number.trim() }
          : { paybill_number: number.trim() }

      const payload: Partial<PaymentMethod> = {
        name: meta.title,
        code: existing?.code || `tuma-${kind}-${Date.now().toString(36)}`,
        method_type: meta.methodType as any,
        config: cfg,
      }

      if (existing) {
        await adminApi.updatePaymentMethod(existing.id, payload)
        toast.success(`${meta.title} updated`)
      } else {
        await adminApi.createPaymentMethod(payload)
        toast.success(`${meta.title} saved`, {
          description: "Activate it on the card to start collecting payments here.",
        })
      }
      onSaved()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit ${meta.title}` : `Set Up ${meta.title}`}</DialogTitle>
          <DialogDescription>
            {kind === "bank"
              ? "Funds settle directly to this bank account."
              : `Customers pay to this ${kind === "till" ? "Till" : "Paybill"} number.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {kind === "bank" ? (
            <>
              <div className="space-y-2">
                <Label>Bank <span className="text-destructive">*</span></Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger><SelectValue placeholder="Select bank..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TUMA_BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Number <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. 0112345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>{kind === "till" ? "Till Number" : "Paybill Number"} <span className="text-destructive">*</span></Label>
              <Input
                placeholder={kind === "till" ? "e.g. 123456" : "e.g. 600100"}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {existing
              ? "Changing these details updates your existing settlement channel — no need to delete and re-add."
              : "This channel starts inactive. Activate it from its card once saved."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Save Changes" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// KOPOKOPO SETTINGS
// =============================================================================
function KopoKopoSettings({ onSaved }: { onSaved?: (cfg: Record<string, string>) => void }) {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getKopoKopoConfig()
      .then((data: any) => setConfig(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.saveKopoKopoConfig(config)
      toast.success("KopoKopo configuration saved")
      onSaved?.(config)
    } catch (err: any) {
      toast.error(err?.message || "Failed to save KopoKopo configuration")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Client ID <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Your KopoKopo client ID"
          value={config.client_id || ""}
          onChange={(e) => setConfig((c) => ({ ...c, client_id: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Client Secret <span className="text-destructive">*</span></Label>
        <Input
          type="password"
          placeholder="Your KopoKopo client secret"
          value={config.client_secret || ""}
          onChange={(e) => setConfig((c) => ({ ...c, client_secret: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Webhook Secret</Label>
        <Input
          placeholder="Optional — for verifying webhook signatures"
          value={config.webhook_secret || ""}
          onChange={(e) => setConfig((c) => ({ ...c, webhook_secret: e.target.value }))}
        />
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save KopoKopo Settings
        </Button>
      </DialogFooter>
    </div>
  )
}