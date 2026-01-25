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
  const [phoneNumber, setPhoneNumber] = useState("")
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const maxPolls = 30 // 30 * 3s = 90 seconds max wait

  // Format phone number to 254XXXXXXXXX
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "")
    
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.substring(1)
    } else if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1)
    } else if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned
    }
    
    return cleaned
  }

  // Validate phone number
  const isValidPhone = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone)
    return /^254[17]\d{8}$/.test(formatted)
  }

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus("idle")
      setError(null)
      setTransactionId(null)
      setPollCount(0)
      // Try to get saved phone number
      const savedPhone = localStorage.getItem("customerPhone")
      if (savedPhone) {
        setPhoneNumber(savedPhone)
      }
    }
  }, [open])

  // Poll for payment status
  useEffect(() => {
    if (status !== "polling" || !transactionId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await customerApi.getPaymentStatus(transactionId)
        
        if (response.status === "completed" || response.status === "success") {
          setStatus("success")
          clearInterval(pollInterval)
          // Save phone for future use
          localStorage.setItem("customerPhone", phoneNumber)
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 2000)
        } else if (response.status === "failed" || response.status === "cancelled") {
          setStatus("failed")
          setError(response.message || "Payment failed")
          clearInterval(pollInterval)
        } else {
          // Still pending
          setPollCount((prev) => {
            if (prev >= maxPolls) {
              setStatus("failed")
              setError("Payment timeout. Please try again or check your M-Pesa messages.")
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
  }, [status, transactionId, phoneNumber, onSuccess, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidPhone(phoneNumber)) {
      setError("Please enter a valid Safaricom phone number")
      return
    }

    setStatus("initiating")
    setError(null)

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const response = await customerApi.initiatePayment({
        plan_id: planId,
        phone_number: formattedPhone,
        billing_period: billingPeriod,
      })

      setTransactionId(response.transaction_id)
      setStatus("waiting")
      
      // Start polling after a short delay
      setTimeout(() => {
        setStatus("polling")
      }, 3000)
    } catch (err: any) {
      console.error("Payment initiation error:", err)
      setStatus("failed")
      setError(err.message || "Failed to initiate payment")
    }
  }

  const handleClose = () => {
    if (status === "waiting" || status === "polling") {
      // Don't close during payment, but allow cancel
      if (window.confirm("Are you sure you want to cancel? Check your M-Pesa if you've already entered PIN.")) {
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
            <CreditCard className="w-5 h-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Pay KSh {parseFloat(amount).toLocaleString()} for {planName}
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Safaricom Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                You will receive an STK push on this number
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
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
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!phoneNumber.trim()}
              >
                Pay KSh {parseFloat(amount).toLocaleString()}
              </Button>
            </div>
          </form>
        )}

        {status === "initiating" && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-green-600 mb-4" />
            <p className="font-medium text-slate-900">Initiating payment...</p>
            <p className="text-sm text-slate-500 mt-1">
              Please wait while we connect to M-Pesa
            </p>
          </div>
        )}

        {(status === "waiting" || status === "polling") && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
            <p className="font-medium text-slate-900">Check your phone</p>
            <p className="text-sm text-slate-500 mt-1">
              Enter your M-Pesa PIN when prompted
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for confirmation...
            </div>
            {pollCount > 10 && (
              <p className="text-xs text-orange-600 mt-2">
                Taking longer than expected. Please check your M-Pesa messages.
              </p>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-medium text-slate-900">Payment Successful!</p>
            <p className="text-sm text-slate-500 mt-1">
              Your account has been credited
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="font-medium text-slate-900">Payment Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
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
