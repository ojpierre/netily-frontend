"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, Smartphone, CreditCard } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { useCustomerPaymentLocale } from "@/hooks/use-customer-payment-locale"
import { formatPaymentAmount, isValidPaymentPhone, normalizePaymentPhone } from "@/lib/tenant-locale"

interface MpesaPaymentModalProps {
  open: boolean
  onClose: () => void
  planId: number
  planName: string
  amount: string
  billingPeriod?: string
  onSuccess?: () => void
}

type PaymentStatus = "idle" | "initiating" | "waiting" | "polling" | "success" | "failed"

export function MpesaPaymentModal({
  open,
  onClose,
  planId,
  planName,
  amount,
  billingPeriod = "monthly",
  onSuccess,
}: MpesaPaymentModalProps) {
  const { locale, ready } = useCustomerPaymentLocale()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const maxPolls = 30 // 30 * 3s = 90 seconds max wait

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus("idle")
      setError(null)
      setPaymentMessage("")
      setPaymentId(null)
      setPollCount(0)
      // Try to get saved phone number
      const savedPhone = localStorage.getItem(`customerPhone:${window.location.hostname}`)
      if (savedPhone) {
        setPhoneNumber(savedPhone)
      }
    }
  }, [open])

  // Poll for payment status
  useEffect(() => {
    if (status !== "polling" || !paymentId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await customerApi.getIspPaymentStatus(paymentId)
        
        // Ensure we force the status to lowercase to match perfectly
        const backendStatus = String(response.status).toLowerCase()
        
        if (backendStatus === "completed" || backendStatus === "success") {
          setStatus("success")
          clearInterval(pollInterval)
          // Save phone for future use
          localStorage.setItem(`customerPhone:${window.location.hostname}`, phoneNumber)
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 2000)
        } else if (backendStatus === "failed" || backendStatus === "cancelled") {
          setStatus("failed")
          setError(response.message || response.error_message || "Payment failed")
          clearInterval(pollInterval)
        } else {
          if (response.message) setPaymentMessage(response.message)
          // Still pending
          setPollCount((prev) => {
            if (prev >= maxPolls) {
              setStatus("failed")
              setError("We could not confirm the payment yet. If you approved it, check your payment history before trying again.")
              clearInterval(pollInterval)
            }
            return prev + 1
          })
        }
      } catch (err: any) {
        console.error("Poll error:", err)
        // Don't fail on poll errors, keep trying
        setPollCount((prev) => prev + 1)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [status, paymentId, phoneNumber, onSuccess, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ready) return
    if (!isValidPaymentPhone(phoneNumber, locale)) {
      setError("Please enter a valid phone number")
      return
    }

    setStatus("initiating")
    setError(null)

    try {
      const formattedPhone = normalizePaymentPhone(phoneNumber, locale)
      const response = await customerApi.initiateIspPayment({
        phone_number: formattedPhone,
        amount: Number(amount),
      })

      if (!response.payment_id) throw new Error("Payment started, but its tracking reference is missing. Check payment history before trying again.")
      setPaymentId(response.payment_id)
      setPaymentMessage(response.tuma_response?.message || response.message || "Check your phone and approve the request.")
      setStatus("waiting")
      
      // Start polling after a short delay
      setTimeout(() => {
        setStatus("polling")
      }, 3000)
    } catch (err: any) {
      setStatus("failed")
      setError(err.message || "Failed to initiate payment")
    }
  }

  const handleClose = () => {
    if (status === "waiting" || status === "polling") {
      // Don't close during payment, but allow cancel
      if (window.confirm("Close this window? If you approved the payment, check your payment history before paying again.")) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-success" />
            {locale.provider} Payment
          </DialogTitle>
          <DialogDescription>
            Pay {formatPaymentAmount(amount, locale.currency)} for {planName}
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{locale.paymentNumberLabel}</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={locale.phonePlaceholder}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                You will receive a payment request on this number
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-success hover:bg-green-700"
                disabled={!ready || !phoneNumber.trim()}
              >
                Pay {formatPaymentAmount(amount, locale.currency)}
              </Button>
            </div>
          </form>
        )}

        {status === "initiating" && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-success mb-4" />
            <p className="font-medium text-slate-900">Initiating payment...</p>
            <p className="text-sm text-slate-500 mt-1">
              Please wait while we connect to {locale.provider}
            </p>
          </div>
        )}

        {(status === "waiting" || status === "polling") && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-success animate-pulse" />
            </div>
            <p className="font-medium text-slate-900">Check your phone</p>
            <p className="text-sm text-slate-500 mt-1">
              {paymentMessage || `Approve the request on your phone and enter your ${locale.provider} PIN`}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for confirmation...
            </div>
            {pollCount > 10 && (
              <p className="text-xs text-warning mt-2">
                Taking longer than expected. Please check your phone.
              </p>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <p className="font-medium text-slate-900">Payment Successful!</p>
            <p className="text-sm text-slate-500 mt-1">
              Your account has been credited
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="font-medium text-slate-900">Payment Failed</p>
            <p className="text-sm text-destructive mt-1">{error}</p>
            <Button
              className="mt-4"
              onClick={() => {
                setStatus("idle")
                setError(null)
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
