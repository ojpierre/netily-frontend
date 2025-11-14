"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Search, Zap, Wifi, TrendingUp, Filter, CreditCard, Smartphone, Phone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Plan {
  id: string
  name: string
  speed: string
  speedValue: number
  price: number
  duration: number
  category: "basic" | "standard" | "premium"
  features: string[]
  popular?: boolean
}

export default function RechargePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "pokopoko" | "airtel" | "card">("mpesa")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<"all" | "basic" | "standard" | "premium">("all")
  const [sortBy, setSortBy] = useState<"price" | "speed">("price")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const allPlans: Plan[] = [
    // Basic Plans
    { id: "mtaani-5", name: "Mtaani-5", speed: "1000 Mbps", speedValue: 1000, price: 1200, duration: 31, category: "basic", features: ["Unlimited data", "3-4 devices", "Email support"] },
    { id: "mtaani-8", name: "Mtaani-8", speed: "1500 Mbps", speedValue: 1500, price: 1500, duration: 31, category: "basic", features: ["Unlimited data", "4-5 devices", "Email support"], popular: true },
    { id: "mtaani-10", name: "Mtaani-10", speed: "2000 Mbps", speedValue: 2000, price: 1800, duration: 31, category: "standard", features: ["Unlimited data", "6-8 devices", "Priority support"], popular: true },
    
    // Standard Plans
    { id: "mtaani-15", name: "Mtaani-15", speed: "2500 Mbps", speedValue: 2500, price: 2200, duration: 31, category: "standard", features: ["Unlimited data", "8-10 devices", "Priority support"] },
    { id: "mtaani-20", name: "Mtaani-20", speed: "3000 Mbps", speedValue: 3000, price: 2500, duration: 31, category: "premium", features: ["Unlimited data", "Unlimited devices", "24/7 premium support"] },
    
    // Weekly Plans
    { id: "mtaani-8-weekly", name: "Mtaani-8 Weekly", speed: "1500 Mbps", speedValue: 1500, price: 450, duration: 7, category: "basic", features: ["Unlimited data", "4-5 devices", "7 days validity"] },
    { id: "mtaani-10-weekly", name: "Mtaani-10 Weekly", speed: "2000 Mbps", speedValue: 2000, price: 550, duration: 7, category: "standard", features: ["Unlimited data", "6-8 devices", "7 days validity"] },
    
    // Premium Plans
    { id: "mtaani-25", name: "Mtaani-25", speed: "3500 Mbps", speedValue: 3500, price: 2800, duration: 31, category: "premium", features: ["Unlimited data", "Unlimited devices", "24/7 premium support", "Static IP option"] },
    { id: "mtaani-30", name: "Mtaani-30", speed: "4000 Mbps", speedValue: 4000, price: 3200, duration: 31, category: "premium", features: ["Unlimited data", "Unlimited devices", "24/7 premium support", "Static IP included"] },
    
    // Quarterly Plans
    { id: "mtaani-8-quarterly", name: "Mtaani-8 Quarterly", speed: "1500 Mbps", speedValue: 1500, price: 4200, duration: 90, category: "basic", features: ["Unlimited data", "4-5 devices", "Save 7%", "90 days validity"] },
    { id: "mtaani-10-quarterly", name: "Mtaani-10 Quarterly", speed: "2000 Mbps", speedValue: 2000, price: 5000, duration: 90, category: "standard", features: ["Unlimited data", "6-8 devices", "Save 8%", "90 days validity"] },
    { id: "mtaani-20-quarterly", name: "Mtaani-20 Quarterly", speed: "3000 Mbps", speedValue: 3000, price: 7000, duration: 90, category: "premium", features: ["Unlimited data", "Unlimited devices", "Save 7%", "90 days validity"] },
  ]

  const filteredPlans = allPlans
    .filter((plan) => {
      const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plan.speed.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === "all" || plan.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price
      return b.speedValue - a.speedValue
    })

  const selected = allPlans.find((p) => p.id === selectedPlan)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Recharge Your Plan</h1>
          <p className="text-slate-600 mt-1">Choose from our unlimited internet plans</p>
        </div>
        {selected && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Selected: {selected.name}</p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="p-6 bg-white">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
              className="w-full h-10 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Categories</option>
              <option value="basic">Basic Plans</option>
              <option value="standard">Standard Plans</option>
              <option value="premium">Premium Plans</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full h-10 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="price">Sort by Price</option>
              <option value="speed">Sort by Speed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg relative ${
              selectedPlan === plan.id
                ? "border-blue-600 border-2 bg-blue-50 shadow-lg"
                : "border-slate-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Popular
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-600">{plan.duration} days</p>
              </div>
              {selectedPlan === plan.id && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-blue-600">KSh {plan.price.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">
                ~KSh {Math.round(plan.price / plan.duration)}/day
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4 text-slate-700">
              <Wifi className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">{plan.speed}</span>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <Card className="p-12 text-center bg-white">
          <p className="text-slate-600">No plans found matching your criteria.</p>
        </Card>
      )}

      {/* Payment Section */}
      {selected && (
        <Card className="p-8 bg-white sticky bottom-6 shadow-2xl border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Complete Your Recharge</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="bg-slate-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold mb-4">Plan Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Plan</span>
                    <span className="font-semibold">{selected.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Speed</span>
                    <span className="font-semibold">{selected.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-semibold">{selected.duration} days</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-2xl text-blue-600">KSh {selected.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    paymentMethod === "mpesa" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">M-Pesa</div>
                    <div className="text-xs text-slate-500">Instant payment</div>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("pokopoko")}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    paymentMethod === "pokopoko" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">Kopokopo</div>
                    <div className="text-xs text-slate-500">Quick & easy</div>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("airtel")}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    paymentMethod === "airtel" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">Airtel Money</div>
                    <div className="text-xs text-slate-500">Mobile wallet</div>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    paymentMethod === "card" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">Bank Card</div>
                    <div className="text-xs text-slate-500">Visa/Mastercard</div>
                  </div>
                </button>
              </div>

              <Button
                onClick={() => setConfirmOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Recharge</DialogTitle>
            <DialogDescription>
              Review your selection and confirm payment to activate your plan.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 mt-4">
              {/* Plan Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Plan</span>
                  <span className="font-semibold text-slate-900">{selected.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Speed</span>
                  <span className="font-semibold text-slate-900">{selected.speed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-semibold text-slate-900">{selected.duration} days</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-bold text-lg text-blue-600">KSh {selected.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method Display */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Payment Method</p>
                <div className="flex items-center gap-3 p-3 border-2 border-blue-600 bg-blue-50 rounded-lg">
                  {paymentMethod === "mpesa" && <Phone className="w-5 h-5 text-green-600" />}
                  {paymentMethod === "pokopoko" && <Smartphone className="w-5 h-5 text-blue-600" />}
                  {paymentMethod === "airtel" && <Smartphone className="w-5 h-5 text-red-600" />}
                  {paymentMethod === "card" && <CreditCard className="w-5 h-5 text-indigo-600" />}
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {paymentMethod === "mpesa" && "M-Pesa"}
                      {paymentMethod === "pokopoko" && "Kopokopo"}
                      {paymentMethod === "airtel" && "Airtel Money"}
                      {paymentMethod === "card" && "Bank Card"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // move to payment processing
                setConfirmOpen(false)
                setPaymentOpen(true)
                setProcessing(true)
                // simulate processing
                setTimeout(() => {
                  setProcessing(false)
                  setPaymentOpen(false)
                  setSuccessOpen(true)
                }, 1800)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Confirm & Pay KSh {selected?.price.toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
            <DialogDescription>
              {paymentMethod === "mpesa" && "Check your phone for the M-Pesa prompt and enter your PIN."}
              {paymentMethod === "pokopoko" && "Please complete the payment on your Kopokopo account."}
              {paymentMethod === "airtel" && "Check your phone for the Airtel Money prompt."}
              {paymentMethod === "card" && "Processing your card payment securely..."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 text-center py-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              {paymentMethod === "mpesa" && <Phone className="w-10 h-10 text-green-600 animate-pulse" />}
              {paymentMethod === "pokopoko" && <Smartphone className="w-10 h-10 text-blue-600 animate-pulse" />}
              {paymentMethod === "airtel" && <Smartphone className="w-10 h-10 text-red-600 animate-pulse" />}
              {paymentMethod === "card" && <CreditCard className="w-10 h-10 text-indigo-600 animate-pulse" />}
            </div>
            <p className="text-slate-900 font-medium text-lg mb-2">
              {processing ? "Processing..." : "Almost done"}
            </p>
            <p className="text-sm text-slate-500">This may take a few seconds</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentOpen(false)
              setProcessing(false)
            }} className="bg-transparent">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Successful! 🎉</DialogTitle>
            <DialogDescription>Your recharge was successful. Your plan is now active.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 text-center py-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-slate-900 font-semibold text-lg mb-2">You're all set!</p>
            <p className="text-slate-600">Your unlimited internet is now active and ready to use.</p>
            
            {selected && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600">Plan activated:</p>
                <p className="font-bold text-blue-600 text-lg">{selected.name}</p>
                <p className="text-sm text-slate-500 mt-1">Valid for {selected.duration} days</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setSuccessOpen(false)
                setSelectedPlan(null) // Reset selection
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
