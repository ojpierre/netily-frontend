"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/auth-context"
import { customerApi } from "@/lib/customer-api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Smartphone, Building2, CheckCircle2, Loader2, Phone, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const quickAmounts = [500, 1000, 2000, 5000]

type RechargeMethod = {
  value: string
  label: string
  icon: typeof Smartphone
  color: "green" | "blue" | "purple" | "orange"
  description: string
  availableNow: boolean
}

const paymentMethods = [
  {
    value: "mpesa_stk",
    label: "M-Pesa STK Push",
    icon: Smartphone,
    color: "green",
    description: "Pay instantly via STK Push",
    availableNow: true,
  },
  {
    value: "mpesa_paybill_till",
    label: "M-Pesa Paybill/Till",
    icon: Smartphone,
    color: "green",
    description: "Manual M-Pesa payment with reference",
    availableNow: false,
  },
  {
    value: "airtel_money",
    label: "Airtel Money",
    icon: Smartphone,
    color: "orange",
    description: "Airtel Money collections",
    availableNow: false,
  },
  {
    value: "card",
    label: "Card Payments",
    icon: CreditCard,
    color: "blue",
    description: "Visa, Mastercard accepted",
    availableNow: false,
  },
  {
    value: "bank",
    label: "Bank Transfer",
    icon: Building2,
    color: "purple",
    description: "Manual bank transfer",
    availableNow: false,
  },
] as const satisfies RechargeMethod[]

type MpesaStatus = 'idle' | 'sending' | 'waiting' | 'success' | 'failed' | 'timeout'

export default function RechargePage() {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("mpesa_stk")
  const [loading, setLoading] = useState(false)
  
  // M-Pesa STK Push state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false)
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle')
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string | null>(null)
  const [mpesaPaymentId, setMpesaPaymentId] = useState<number | null>(null)
  const [mpesaProgress, setMpesaProgress] = useState(0)
  const [mpesaCountdown, setMpesaCountdown] = useState(60)

  // Mock user data as fallback
  const mockUser = {
    balance: "5000.00",
    package: {
      name: "Premium Package",
      price: "2000.00"
    }
  }

  const currentUser = user || mockUser

  // Format phone number for M-Pesa (254XXXXXXXXX)
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1)
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1)
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned
    }
    return cleaned
  }

  // Validate phone number
  const isValidPhone = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone)
    return /^254[17]\d{8}$/.test(formatted)
  }

  // Poll payment status when waiting
  useEffect(() => {
    let progressInterval: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout
    let pollInterval: NodeJS.Timeout

    if (mpesaStatus === 'waiting') {
      // Progress bar animation (visual only)
      progressInterval = setInterval(() => {
        setMpesaProgress(prev => {
          if (prev >= 95) return prev
          return prev + (100 - prev) * 0.1
        })
      }, 1000)

      // Countdown timer
      countdownInterval = setInterval(() => {
        setMpesaCountdown(prev => {
          if (prev <= 1) {
            setMpesaStatus('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Poll backend for payment status every 3 seconds
      if (mpesaPaymentId) {
        pollInterval = setInterval(async () => {
          try {
            const payment = await customerApi.getPaymentStatus(mpesaPaymentId)
            if (payment.status === 'completed') {
              setMpesaStatus('success')
              setMpesaProgress(100)
              toast.success('Payment successful!')
              if (user) {
                refreshUser()
              }
            } else if (payment.status === 'failed') {
              setMpesaStatus('failed')
              toast.error('Payment failed or was cancelled')
            }
          } catch (error) {
            console.error('Failed to poll payment status:', error)
          }
        }, 3000)
      }

      return () => {
        clearInterval(progressInterval)
        clearInterval(countdownInterval)
        if (pollInterval) clearInterval(pollInterval)
      }
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval)
      if (countdownInterval) clearInterval(countdownInterval)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [mpesaStatus, mpesaPaymentId, user, refreshUser])

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  const initiateMpesaPayment = async () => {
    if (!isValidPhone(phoneNumber)) {
      toast.error("Please enter a valid Safaricom phone number")
      return
    }

    if (!amount || parseFloat(amount) < 10) {
      toast.error("Minimum amount is KSh 10")
      return
    }

    setMpesaStatus('sending')
    setMpesaProgress(0)
    setMpesaCountdown(60)

    try {
      // Call PayHero unified payment API via self-service
      const response = await customerApi.initiatePayment({
        amount: parseFloat(amount),
        phone_number: formatPhoneNumber(phoneNumber),
      })
      
      if (response.status === 'error' || response.status === 'failed') {
        throw new Error(response.error || response.message || 'Payment initiation failed')
      }
      
      // Store payment_id for status polling
      if (response.payment_id) {
        setMpesaPaymentId(response.payment_id)
      }
      
      // Store checkout ID for reference
      if (response.payhero_response?.checkout_request_id) {
        setMpesaCheckoutId(response.payhero_response.checkout_request_id)
      }
      
      setMpesaStatus('waiting')
    } catch (error: any) {
      setMpesaStatus('failed')
      toast.error(error.message || "Failed to initiate M-Pesa payment")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (method === 'mpesa_stk') {
      // Open M-Pesa dialog
      setMpesaDialogOpen(true)
      setMpesaStatus('idle')
      // Pre-fill phone from user profile if available
      if (user?.phone) {
        setPhoneNumber(user.phone)
      }
      return
    }

    const selectedMethod = paymentMethods.find((option) => option.value === method)
    if (selectedMethod && !selectedMethod.availableNow) {
      toast.info(`${selectedMethod.label} is prepared on frontend and awaiting backend propagation.`)
      return
    }

    setLoading(true)
    try {
      if (user) {
        toast.error("Only M-Pesa STK Push is currently active in production")
        setLoading(false)
        return
      }

      // Mock success for demo
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Payment of KSh ${amount} initiated successfully! (Demo Mode)`)
      setAmount("")
    } catch (error: any) {
      toast.error(error.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  const resetMpesaDialog = () => {
    setMpesaStatus('idle')
    setMpesaProgress(0)
    setMpesaCountdown(60)
    setMpesaCheckoutId(null)
  }

  const closeMpesaDialog = () => {
    setMpesaDialogOpen(false)
    resetMpesaDialog()
    if (mpesaStatus === 'success') {
      setAmount("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recharge Account</h1>
        <p className="text-slate-600 mt-1">Add credit to your account balance</p>
      </div>

      {!user && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm">ℹ️</span>
          </div>
          <p className="text-sm text-primary">
            <strong>Demo Mode:</strong> Payment simulation only. Login to make real payments.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="p-8">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Current Balance</p>
            <p className="text-4xl font-bold text-primary mb-4">
              KSh {parseFloat(currentUser.balance || "0").toFixed(2)}
            </p>
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Package</span>
                <span className="text-sm font-semibold">{currentUser.package?.name || "None"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Monthly Cost</span>
                <span className="text-sm font-semibold">
                  KSh {currentUser.package?.price || "0"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recharge Form */}
        <Card className="p-8 md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <Label>Amount (KSh)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-lg"
                min="1"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickAmount(value)}
                    className="w-full"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="mt-3 space-y-3">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon
                  const isSelected = method === pm.value
                  return (
                    <div
                      key={pm.value}
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? pm.color === "green"
                            ? "border-success bg-success/10"
                            : pm.color === "blue"
                            ? "border-primary bg-primary/10"
                            : pm.color === "orange"
                            ? "border-warning bg-warning/10"
                            : "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setMethod(pm.value)}
                    >
                      <RadioGroupItem value={pm.value} id={pm.value} />
                      <Icon className={`w-5 h-5 ${
                        pm.color === "green"
                          ? "text-success"
                          : pm.color === "blue"
                          ? "text-primary"
                          : pm.color === "orange"
                          ? "text-warning"
                          : "text-purple-600"
                      }`} />
                      <div className="flex-1">
                        <Label htmlFor={pm.value} className="cursor-pointer block flex items-center gap-2">
                          {pm.label}
                          {!pm.availableNow && (
                            <Badge variant="outline" className="text-[10px]">Pending Backend</Badge>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground">{pm.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`w-5 h-5 ${
                          pm.color === "green"
                            ? "text-success"
                            : pm.color === "blue"
                            ? "text-primary"
                            : pm.color === "orange"
                            ? "text-warning"
                            : "text-purple-600"
                        }`} />
                      )}
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !amount}
              className={`w-full py-6 text-lg ${method === 'mpesa_stk' ? 'bg-success hover:bg-green-700' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : method === 'mpesa_stk' ? (
                <>
                  <Smartphone className="mr-2 h-5 w-5" />
                  Pay KSh {amount || "0"} with M-Pesa
                </>
              ) : (
                `Pay KSh ${amount || "0"}`
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* M-Pesa STK Push Dialog */}
      <Dialog open={mpesaDialogOpen} onOpenChange={closeMpesaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-success/15 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-success" />
              </div>
              M-Pesa Payment
            </DialogTitle>
            <DialogDescription>
              Pay KSh {amount} via M-Pesa STK Push
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {mpesaStatus === 'idle' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Safaricom Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712 345 678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 text-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number to receive the STK push prompt
                  </p>
                </div>

                <div className="bg-success/10 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800">Amount to Pay</span>
                    <span className="font-bold text-green-900 text-lg">KSh {parseFloat(amount || "0").toLocaleString()}</span>
                  </div>
                  <div className="border-t border-success/20 pt-3">
                    <div className="flex items-start gap-2 text-xs text-success">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>You will receive an M-Pesa prompt on your phone</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-success mt-1">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Enter your M-Pesa PIN to complete payment</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-success mt-1">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Your account will be credited instantly</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={initiateMpesaPayment}
                  className="w-full bg-success hover:bg-green-700"
                  disabled={!isValidPhone(phoneNumber)}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Send STK Push
                </Button>
              </>
            )}

            {mpesaStatus === 'sending' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-success mx-auto mb-4" />
                <p className="font-medium">Sending STK Push...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            )}

            {mpesaStatus === 'waiting' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="h-10 w-10 text-success animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-lg">Check your phone</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your M-Pesa PIN to complete the payment
                  </p>
                </div>
                <Progress value={mpesaProgress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Waiting for confirmation... {mpesaCountdown}s</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Ref: {mpesaCheckoutId}
                </p>
              </div>
            )}

            {mpesaStatus === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
                <div>
                  <p className="font-bold text-xl text-success">Payment Successful!</p>
                  <p className="text-muted-foreground">KSh {amount} has been added to your account</p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {mpesaCheckoutId}
                </Badge>
                <Button onClick={closeMpesaDialog} className="w-full">
                  Done
                </Button>
              </div>
            )}

            {mpesaStatus === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-destructive/15 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-xl text-destructive">Payment Failed</p>
                  <p className="text-muted-foreground">Unable to process your payment</p>
                </div>
                <Button onClick={resetMpesaDialog} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}

            {mpesaStatus === 'timeout' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-warning/15 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-12 w-12 text-warning" />
                </div>
                <div>
                  <p className="font-bold text-xl text-warning">Request Timed Out</p>
                  <p className="text-muted-foreground">The payment request expired. Please try again.</p>
                </div>
                <Button onClick={resetMpesaDialog} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <Card className="p-8 bg-primary/10 border-primary/20">
        <h3 className="font-semibold text-primary mb-3">Payment Instructions</h3>
        <ul className="space-y-2 text-sm text-primary">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>M-Pesa: Enter amount and complete payment via STK push</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>M-Pesa Paybill/Till and Airtel Money are ready on frontend and will be enabled after backend propagation.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Card and Bank transfer methods will activate once provider credentials and backend channels are finalized.</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}