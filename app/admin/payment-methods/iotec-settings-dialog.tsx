"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { IotecConfiguration, IotecConfigurationInput } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Form = IotecConfigurationInput & { client_secret: string }
const initialForm = (): Form => ({
  name: "iotec Mobile Money", client_id: "", client_secret: "", wallet_id: "",
  is_sandbox: true, transaction_charges_category: "ChargeWallet", is_active: false,
})

export function IotecSettingsDialog({ open, onOpenChange, config, onChanged }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: IotecConfiguration
  onChanged: () => Promise<void>
}) {
  const [form, setForm] = useState<Form>(initialForm)
  const [busy, setBusy] = useState<"save" | "test" | "delete" | null>(null)
  const [error, setError] = useState("")
  const [testResult, setTestResult] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(config ? {
      name: config.name || "iotec Mobile Money", client_id: config.client_id,
      client_secret: "", wallet_id: config.wallet_id, is_sandbox: config.is_sandbox,
      transaction_charges_category: config.transaction_charges_category,
      is_active: config.is_active,
    } : initialForm())
    setError("")
    setTestResult("")
    setConfirmDelete(false)
  }, [open, config?.id])

  const patch = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError("")
  }

  const save = async () => {
    if (!form.client_id.trim()) return setError("Enter the client ID.")
    if (!config && !form.client_secret.trim()) return setError("Enter the client secret.")
    if (!UUID_PATTERN.test(form.wallet_id.trim())) return setError("Enter a valid wallet ID (UUID).")
    setBusy("save")
    setError("")
    try {
      const payload: IotecConfigurationInput = {
        name: form.name?.trim() || "iotec Mobile Money",
        client_id: form.client_id.trim(), wallet_id: form.wallet_id.trim(),
        is_sandbox: form.is_sandbox,
        transaction_charges_category: form.transaction_charges_category,
        is_active: config?.is_active || form.is_active,
        ...(form.client_secret.trim() ? { client_secret: form.client_secret.trim() } : {}),
      }
      if (config) await adminApi.updateIotecConfiguration(config.id, payload)
      else await adminApi.createIotecConfiguration(payload)
      setForm((current) => ({ ...current, client_secret: "" }))
      await onChanged()
      toast.success("Mobile Money settings saved")
      onOpenChange(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save settings.") }
    finally { setBusy(null) }
  }

  const test = async () => {
    if (!config) return
    setBusy("test")
    setError("")
    setTestResult("")
    try {
      const result = await adminApi.testIotecConfiguration(config.id)
      const balance = result.balance
      const shownBalance = balance && typeof balance === "object" && !Array.isArray(balance)
        ? (balance as Record<string, unknown>).available_balance ?? (balance as Record<string, unknown>).balance
        : balance
      setTestResult(`${result.message || "Connected. Wallet verified."}${typeof shownBalance === "number" || typeof shownBalance === "string" ? ` Balance: ${shownBalance}` : ""}`)
      await onChanged()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connection test failed."); await onChanged() }
    finally { setBusy(null) }
  }

  const remove = async () => {
    if (!config || !confirmDelete) return
    setBusy("delete")
    try {
      await adminApi.deleteIotecConfiguration(config.id)
      await onChanged()
      toast.success("Mobile Money configuration removed")
      onOpenChange(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove configuration.") }
    finally { setBusy(null) }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!next) setForm((current) => ({ ...current, client_secret: "" })); onOpenChange(next) }}>
    <DialogContent data-onboarding="iotec-config-form" className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{config ? "Edit Mobile Money" : "Connect Mobile Money"}</DialogTitle>
        <DialogDescription>Payments settle directly into your iotec wallet. Test the connection before activating it.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="iotec-name">Display name</Label><Input id="iotec-name" value={form.name} onChange={(event) => patch("name", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="iotec-client">Client ID</Label><Input id="iotec-client" autoComplete="off" value={form.client_id} onChange={(event) => patch("client_id", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="iotec-secret">Client secret</Label><Input id="iotec-secret" type="password" autoComplete="new-password" placeholder={config?.has_client_secret ? "Secret saved - leave blank to keep it" : "Enter client secret"} value={form.client_secret} onChange={(event) => patch("client_secret", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="iotec-wallet">Wallet ID</Label><Input id="iotec-wallet" autoComplete="off" value={form.wallet_id} onChange={(event) => patch("wallet_id", event.target.value)} aria-invalid={!!error && error.includes("wallet ID")} /><p className="text-xs text-muted-foreground">Use the wallet UUID from your iotec account.</p></div>
        <div className="space-y-1.5"><Label>Environment</Label><Select value={form.is_sandbox ? "sandbox" : "live"} onValueChange={(value) => patch("is_sandbox", value === "sandbox")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Sandbox uses test currency ITX. Switch to Live before real customers pay.</p></div>
        <div className="space-y-1.5"><Label>Who pays iotec&apos;s fee?</Label><Select value={form.transaction_charges_category} onValueChange={(value) => patch("transaction_charges_category", value as Form["transaction_charges_category"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ChargeWallet">I absorb the fee</SelectItem><SelectItem value="ChargeCustomer">Customer pays the fee on top</SelectItem></SelectContent></Select>{form.transaction_charges_category === "ChargeCustomer" && <p className="text-xs text-amber-700 dark:text-amber-400">Customers may pay more than the plan price.</p>}</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} disabled={!!config?.is_active} onChange={(event) => patch("is_active", event.target.checked)} />{config?.is_active ? "Currently active (use Deactivate on the card)" : "Activate after saving"}</label>
        {testResult && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{testResult}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {confirmDelete && <div className="rounded border border-destructive/30 p-3 text-sm"><p>This removes iotec as a payment method. Payment history is preserved.</p><Button className="mt-2" variant="destructive" disabled={!!busy} onClick={() => void remove()}>Confirm removal</Button></div>}
      </div>
      <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
        {config && <Button variant="destructive" disabled={!!busy} onClick={() => setConfirmDelete(true)}>Delete</Button>}
        {config && <Button variant="outline" disabled={!!busy} onClick={() => void test()}>{busy === "test" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Test connection</Button>}
        <Button disabled={!!busy} onClick={() => void save()}>{busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
