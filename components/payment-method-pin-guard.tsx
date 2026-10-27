"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { adminApi, type PaymentMethodPinStatus } from "@/lib/admin-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The security check could not be completed."
}

function PinInput({ id, label, value, onChange, visible, onToggle, autoFocus = false }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  autoFocus?: boolean
}) {
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        autoFocus={autoFocus}
        type={visible ? "text" : "password"}
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        className="h-12 pr-12 text-center font-mono text-xl tracking-[0.35em]"
        aria-describedby={`${id}-hint`}
      />
      <button type="button" onClick={onToggle} className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-muted-foreground" aria-label={visible ? "Hide PIN" : "Show PIN"}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    <p id={`${id}-hint`} className="text-xs text-muted-foreground">Enter exactly 6 digits.</p>
  </div>
}

export function PaymentMethodPinGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PaymentMethodPinStatus | null>(null)
  const [pin, setPin] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [lockedSeconds, setLockedSeconds] = useState(0)

  useEffect(() => {
    let active = true
    const refresh = async (event?: Event) => {
      const supplied = (event as CustomEvent<PaymentMethodPinStatus> | undefined)?.detail
      try {
        const next = supplied || await adminApi.getPaymentMethodPinStatus()
        if (!active) return
        setStatus(next)
        setLockedSeconds(next.locked_seconds || 0)
        setError("")
      } catch (requestError) {
        if (active) setError(errorMessage(requestError))
      }
    }
    void refresh()
    window.addEventListener("netily-payment-pin-status-changed", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      active = false
      window.removeEventListener("netily-payment-pin-status-changed", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  useEffect(() => {
    const relock = () => {
      setStatus((current) => current?.bypass ? current : current ? { ...current, unlocked: false } : current)
      setError("Your Payment Methods unlock expired. Enter the PIN to continue.")
    }
    window.addEventListener("netily-payment-pin-required", relock)
    return () => window.removeEventListener("netily-payment-pin-required", relock)
  }, [])

  useEffect(() => {
    if (lockedSeconds <= 0) return
    const timer = window.setInterval(() => setLockedSeconds((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [lockedSeconds])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pin.length !== 6) { setError("Enter the complete 6-digit PIN."); return }
    if (!status?.configured && pin !== confirmation) { setError("The two PIN entries do not match."); return }
    setBusy(true)
    setError("")
    try {
      const next = status?.configured
        ? await adminApi.verifyPaymentMethodPin(pin)
        : await adminApi.setupPaymentMethodPin(pin, confirmation)
      setStatus(next)
      setLockedSeconds(next.locked_seconds || 0)
      setPin("")
      setConfirmation("")
    } catch (requestError: any) {
      setError(errorMessage(requestError))
      if (requestError?.data?.locked_seconds) setLockedSeconds(Number(requestError.data.locked_seconds))
      setPin("")
    } finally {
      setBusy(false)
    }
  }

  if (status?.unlocked || status?.bypass) return <>{children}</>

  if (!status && !error) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Checking Payment Methods security</span></div>
  }

  const setup = Boolean(status && !status.configured)
  return <div className="flex min-h-[65vh] items-center justify-center p-4">
    <Card className="w-full max-w-md rounded-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
          {setup ? <KeyRound className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
        </div>
        <CardTitle>{setup ? "Protect payment settings" : "Enter Payment Methods PIN"}</CardTitle>
        <CardDescription>
          {setup
            ? "Create a six-digit PIN before managing settlement accounts and gateway credentials."
            : "Confirm the tenant PIN to manage gateways and settlement channels."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
        {setup && !status?.can_setup ? (
          <Alert><ShieldCheck className="h-4 w-4" /><AlertDescription>The principal tenant administrator must set the first PIN. Your existing page permissions remain unchanged.</AlertDescription></Alert>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <PinInput id="payment-method-pin" label={setup ? "Create PIN" : "Payment Methods PIN"} value={pin} onChange={setPin} visible={visible} onToggle={() => setVisible((current) => !current)} autoFocus />
            {setup && <PinInput id="payment-method-pin-confirm" label="Confirm PIN" value={confirmation} onChange={setConfirmation} visible={visible} onToggle={() => setVisible((current) => !current)} />}
            {setup && <p className="rounded-md bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">Use a PIN your tenant administrator can remember, but avoid repeated or sequential digits. It is stored as a secure hash.</p>}
            {!setup && <p className="text-center text-xs text-muted-foreground">Access stays unlocked for 15 minutes on this signed-in session.</p>}
            <Button className="h-12 w-full" disabled={busy || lockedSeconds > 0 || pin.length !== 6 || (setup && confirmation.length !== 6)}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</> : lockedSeconds > 0 ? `Try again in ${Math.ceil(lockedSeconds / 60)} min` : setup ? "Set PIN and continue" : "Unlock Payment Methods"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  </div>
}
