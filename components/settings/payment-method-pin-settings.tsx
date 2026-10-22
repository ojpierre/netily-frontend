"use client"

import { FormEvent, useEffect, useState } from "react"
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { adminApi, type PaymentMethodPinStatus } from "@/lib/admin-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SecurePinField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" className="max-w-sm font-mono tracking-[0.25em]" />
  </div>
}

export function PaymentMethodPinSettingsCard() {
  const [status, setStatus] = useState<PaymentMethodPinStatus | null>(null)
  const [currentPin, setCurrentPin] = useState("")
  const [pin, setPin] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getPaymentMethodPinStatus()
      .then(setStatus)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load Payment Methods security."))
      .finally(() => setLoading(false))
  }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pin.length !== 6 || confirmation.length !== 6) { toast.error("Enter and confirm a six-digit PIN."); return }
    if (pin !== confirmation) { toast.error("The two PIN entries do not match."); return }
    setSaving(true)
    try {
      const next = status?.configured
        ? await adminApi.changePaymentMethodPin(currentPin, pin, confirmation)
        : await adminApi.setupPaymentMethodPin(pin, confirmation)
      setStatus(next)
      setCurrentPin("")
      setPin("")
      setConfirmation("")
      toast.success(status?.configured ? "Payment Methods PIN changed." : "Payment Methods PIN is now active.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the PIN.")
    } finally {
      setSaving(false)
    }
  }

  return <Card>
    <CardHeader>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div>
        <div><CardTitle>Payment Methods PIN</CardTitle><CardDescription className="mt-1">Protect gateway credentials and settlement changes with a tenant-owned six-digit PIN.</CardDescription></div>
      </div>
    </CardHeader>
    <form onSubmit={save}>
      <CardContent className="space-y-5">
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading PIN status...</div> : <>
          <Alert><ShieldCheck className="h-4 w-4" /><AlertDescription>{status?.configured ? "PIN protection is active. A successful check unlocks payment settings for 15 minutes in that signed-in session." : "No PIN is set yet. The principal tenant administrator will be prompted to create one before opening Payment Methods."}</AlertDescription></Alert>
          {status?.can_setup ? <div className="grid gap-4 sm:grid-cols-2">
            {status.configured && !status.bypass && <div className="sm:col-span-2"><SecurePinField id="current-payment-pin" label="Current PIN" value={currentPin} onChange={setCurrentPin} /></div>}
            <SecurePinField id="new-payment-pin" label={status.configured ? "New PIN" : "Create PIN"} value={pin} onChange={setPin} />
            <SecurePinField id="confirm-payment-pin" label="Confirm PIN" value={confirmation} onChange={setConfirmation} />
          </div> : <p className="text-sm text-muted-foreground">Only the principal tenant administrator can set or change this PIN.</p>}
        </>}
      </CardContent>
      {status?.can_setup && <CardFooter><Button type="submit" disabled={loading || saving || pin.length !== 6 || confirmation.length !== 6 || (status.configured && !status.bypass && currentPin.length !== 6)}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{status.configured ? "Change Payment Methods PIN" : "Set Payment Methods PIN"}</Button></CardFooter>}
    </form>
  </Card>
}
