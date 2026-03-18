"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Copy, Loader2, Plus, RefreshCw, Settings2, ShieldCheck, TestTube2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { adminApi } from "@/lib/admin-api"
import type { MpesaConfiguration, MpesaTransaction } from "@/lib/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MpesaFormState {
  shortcode_type: "PAYBILL" | "TILL"
  business_shortcode: string
  consumer_key: string
  consumer_secret: string
  passkey: string
  is_sandbox: boolean
  is_active: boolean
}

const initialForm: MpesaFormState = {
  shortcode_type: "PAYBILL",
  business_shortcode: "",
  consumer_key: "",
  consumer_secret: "",
  passkey: "",
  is_sandbox: true,
  is_active: true,
}

function formatCurrency(value: string | number | undefined): string {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date?: string | null): string {
  if (!date) return "-"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString()
}

export function MpesaSettingsPanel() {
  const [configs, setConfigs] = useState<MpesaConfiguration[]>([])
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MpesaConfiguration | null>(null)
  const [form, setForm] = useState<MpesaFormState>(initialForm)

  const [testPhone, setTestPhone] = useState("")
  const [testAmount, setTestAmount] = useState("10")

  const fetchData = useCallback(async () => {
    try {
      const [cfgRes, txRes] = await Promise.all([
        adminApi.getMpesaConfigurations(),
        adminApi.getBillingMpesaTransactions({ page_size: "20" }),
      ])
      setConfigs(cfgRes.results || [])
      setTransactions(txRes.results || [])
    } catch (error: any) {
      console.error("Failed to fetch M-Pesa data", error)
      toast.error(error?.message || "Failed to load M-Pesa settings")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const hasDefault = useMemo(() => configs.some(c => c.is_default), [configs])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    toast.success("M-Pesa data refreshed")
  }

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setOpen(true)
  }

  const openEdit = (config: MpesaConfiguration) => {
    setEditing(config)
    setForm({
      shortcode_type: config.shortcode_type,
      business_shortcode: config.business_shortcode,
      consumer_key: config.consumer_key || "",
      consumer_secret: "",
      passkey: "",
      is_sandbox: config.is_sandbox,
      is_active: config.is_active,
    })
    setOpen(true)
  }

  const validateForm = (): boolean => {
    if (!form.business_shortcode || !/^\d{5,7}$/.test(form.business_shortcode)) {
      toast.error("Business shortcode must be numeric and 5-7 digits")
      return false
    }
    if (!form.consumer_key) {
      toast.error("Consumer key is required")
      return false
    }
    if (!editing && !form.consumer_secret) {
      toast.error("Consumer secret is required")
      return false
    }
    if (!editing && !form.passkey) {
      toast.error("Passkey is required")
      return false
    }
    return true
  }

  const onSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload: Partial<MpesaConfiguration> = {
        shortcode_type: form.shortcode_type,
        business_shortcode: form.business_shortcode,
        consumer_key: form.consumer_key,
        is_sandbox: form.is_sandbox,
        is_active: form.is_active,
      }

      if (form.consumer_secret) payload.consumer_secret = form.consumer_secret
      if (form.passkey) payload.passkey = form.passkey

      if (editing) {
        await adminApi.updateMpesaConfiguration(editing.id, payload)
        toast.success("M-Pesa configuration updated")
      } else {
        await adminApi.createMpesaConfiguration(payload)
        toast.success("M-Pesa configuration created")
      }

      setOpen(false)
      setEditing(null)
      setForm(initialForm)
      await fetchData()
    } catch (error: any) {
      console.error("Failed to save configuration", error)
      toast.error(error?.message || "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (config: MpesaConfiguration) => {
    if (!confirm(`Delete configuration ${config.business_shortcode}?`)) return

    try {
      setActionId(config.id)
      await adminApi.deleteMpesaConfiguration(config.id)
      toast.success("Configuration deleted")
      await fetchData()
    } catch (error: any) {
      console.error("Failed to delete configuration", error)
      toast.error(error?.message || "Delete failed")
    } finally {
      setActionId(null)
    }
  }

  const onTest = async (config: MpesaConfiguration) => {
    try {
      setActionId(config.id)
      const payload = testPhone && testAmount
        ? { test_phone: testPhone, test_amount: testAmount }
        : undefined
      const result = await adminApi.testMpesaConfiguration(config.id, payload)
      toast.success(result?.message || "Credentials test successful")
      await fetchData()
    } catch (error: any) {
      console.error("Failed to test configuration", error)
      toast.error(error?.message || "Credentials test failed")
    } finally {
      setActionId(null)
    }
  }

  const onRegisterUrls = async (config: MpesaConfiguration) => {
    try {
      setActionId(config.id)
      const result = await adminApi.registerMpesaUrls(config.id)
      toast.success(result?.message || "URLs registered successfully")
      await fetchData()
    } catch (error: any) {
      console.error("Failed to register URLs", error)
      toast.error(error?.message || "URL registration failed")
    } finally {
      setActionId(null)
    }
  }

  const onSetDefault = async (config: MpesaConfiguration) => {
    try {
      setActionId(config.id)
      const result = await adminApi.setMpesaDefault(config.id)
      toast.success(result?.message || "Set as default")
      await fetchData()
    } catch (error: any) {
      console.error("Failed to set default", error)
      toast.error(error?.message || "Failed to set default")
    } finally {
      setActionId(null)
    }
  }

  const onToggleActive = async (config: MpesaConfiguration) => {
    try {
      setActionId(config.id)
      const result = await adminApi.toggleMpesaActive(config.id)
      toast.success(result?.message || "Status updated")
      await fetchData()
    } catch (error: any) {
      console.error("Failed to toggle active", error)
      toast.error(error?.message || "Failed to update status")
    } finally {
      setActionId(null)
    }
  }

  const copyAccountReference = async (value?: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success("Account reference copied")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-green-600" />
                M-Pesa Settings
              </CardTitle>
              <CardDescription>
                Configure Daraja credentials, test access, then register callback URLs.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add M-Pesa Config
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test_phone">Optional Test Phone</Label>
              <Input
                id="test_phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_amount">Optional Test Amount</Label>
              <Input
                id="test_amount"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading M-Pesa configurations...</div>
          ) : configs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No M-Pesa configuration yet</p>
              <p className="text-sm text-muted-foreground">Create one to start receiving Paybill/Till payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{config.shortcode_type}</Badge>
                        <Badge variant="secondary">{config.business_shortcode}</Badge>
                        <Badge className={config.is_sandbox ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                          {config.is_sandbox ? "Sandbox" : "Production"}
                        </Badge>
                        {config.is_default && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {config.validation_status && (
                          <Badge variant="outline">Validation: {config.validation_status}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Last validated: {formatDate(config.last_validated_at)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={actionId === config.id} onClick={() => onTest(config)}>
                        {actionId === config.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}
                        Test
                      </Button>
                      <Button size="sm" variant="outline" disabled={actionId === config.id} onClick={() => onRegisterUrls(config)}>
                        {actionId === config.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Register URLs
                      </Button>
                      <Button size="sm" variant="outline" disabled={actionId === config.id || config.is_default} onClick={() => onSetDefault(config)}>
                        Set Default
                      </Button>
                      <Button size="sm" variant="outline" disabled={actionId === config.id} onClick={() => onToggleActive(config)}>
                        {config.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(config)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" disabled={actionId === config.id} onClick={() => onDelete(config)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasDefault && configs.length > 0 && (
            <p className="text-xs text-amber-700">No default M-Pesa configuration is set yet. Pick one configuration and click Set Default.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>M-Pesa Transaction Logs</CardTitle>
          <CardDescription>Track receipts, account references, and failed payment reasons.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>M-Pesa Receipt</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Account Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.transaction_id || "-"}</TableCell>
                  <TableCell>{tx.customer_name || "-"}</TableCell>
                  <TableCell>{tx.phone_number || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{tx.account_reference || "-"}</span>
                      {tx.account_reference && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => copyAccountReference(tx.account_reference)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={String(tx.status).toUpperCase() === "COMPLETED" ? "default" : "secondary"}
                      className={String(tx.status).toUpperCase() === "FAILED" ? "bg-red-100 text-red-700" : undefined}
                    >
                      {String(tx.status).toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No M-Pesa transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit M-Pesa Configuration" : "Create M-Pesa Configuration"}</DialogTitle>
            <DialogDescription>
              Save Daraja credentials, then use Test and Register URLs actions from the configuration list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="shortcode_type">Shortcode Type</Label>
              <Select
                value={form.shortcode_type}
                onValueChange={(value) => setForm(prev => ({ ...prev, shortcode_type: value as "PAYBILL" | "TILL" }))}
              >
                <SelectTrigger id="shortcode_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYBILL">PAYBILL</SelectItem>
                  <SelectItem value="TILL">TILL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_shortcode">Business Shortcode</Label>
              <Input
                id="business_shortcode"
                value={form.business_shortcode}
                onChange={(e) => setForm(prev => ({ ...prev, business_shortcode: e.target.value.trim() }))}
                placeholder="123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                value={form.consumer_key}
                onChange={(e) => setForm(prev => ({ ...prev, consumer_key: e.target.value }))}
                placeholder="Daraja consumer key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_secret">Consumer Secret {editing ? "(leave blank to keep existing)" : ""}</Label>
              <Input
                id="consumer_secret"
                type="password"
                value={form.consumer_secret}
                onChange={(e) => setForm(prev => ({ ...prev, consumer_secret: e.target.value }))}
                placeholder="Daraja consumer secret"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passkey">Passkey {editing ? "(leave blank to keep existing)" : ""}</Label>
              <Input
                id="passkey"
                type="password"
                value={form.passkey}
                onChange={(e) => setForm(prev => ({ ...prev, passkey: e.target.value }))}
                placeholder="Lipa na M-Pesa passkey"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Sandbox</p>
                  <p className="text-xs text-muted-foreground">Use Safaricom sandbox</p>
                </div>
                <Switch
                  checked={form.is_sandbox}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_sandbox: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Enable immediately</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
