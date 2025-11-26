"use client"

import { useState } from "react"
import { useAuth } from "@/app/auth-context"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const quickAmounts = [500, 1000, 2000, 5000]

const paymentMethods = [
  { value: "mpesa", label: "M-Pesa", icon: Smartphone, color: "green" },
  { value: "card", label: "Credit/Debit Card", icon: CreditCard, color: "blue" },
  { value: "bank", label: "Bank Transfer", icon: Building2, color: "purple" },
]

export default function RechargePage() {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("mpesa")
  const [loading, setLoading] = useState(false)

  // Mock user data as fallback
  const mockUser = {
    balance: "5000.00",
    package: {
      name: "Premium Package",
      price: "2000.00"
    }
  }

  const currentUser = user || mockUser

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      if (user) {
        await api.createPayment(amount, method)
        toast.success("Payment initiated successfully!")
        await refreshUser()
      } else {
        // Mock success for demo
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success(`Payment of KSh ${amount} initiated successfully! (Demo Mode)`)
      }
      setAmount("")
    } catch (error: any) {
      toast.error(error.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recharge Account</h1>
        <p className="text-slate-600 mt-1">Add credit to your account balance</p>
      </div>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Payment simulation only. Login to make real payments.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="p-8">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Current Balance</p>
            <p className="text-4xl font-bold text-blue-600 mb-4">
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
              <div className="grid grid-cols-4 gap-2 mt-3">
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
                            ? "border-green-500 bg-green-50"
                            : pm.color === "blue"
                            ? "border-blue-500 bg-blue-50"
                            : "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setMethod(pm.value)}
                    >
                      <RadioGroupItem value={pm.value} id={pm.value} />
                      <Icon className={`w-5 h-5 ${
                        pm.color === "green"
                          ? "text-green-600"
                          : pm.color === "blue"
                          ? "text-blue-600"
                          : "text-purple-600"
                      }`} />
                      <Label htmlFor={pm.value} className="flex-1 cursor-pointer">
                        {pm.label}
                      </Label>
                      {isSelected && (
                        <CheckCircle2 className={`w-5 h-5 ${
                          pm.color === "green"
                            ? "text-green-600"
                            : pm.color === "blue"
                            ? "text-blue-600"
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
              className="w-full py-6 text-lg"
            >
              {loading ? "Processing..." : `Pay KSh ${amount || "0"}`}
            </Button>
          </form>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-8 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Payment Instructions</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>M-Pesa: Enter amount and complete payment via STK push</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Card: You'll be redirected to secure payment gateway</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Bank: Transfer to provided account number</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}