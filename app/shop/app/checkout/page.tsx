"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, ShoppingBag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Step = "shipping" | "payment" | "success"

interface ShippingForm {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  address: string
  apartment: string
  city: string
  state: string
  zip: string
  country: string
}

export default function CheckoutPage() {
  const { items, total, clearCart, addItem } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<Step>("shipping")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"invoice" | "card" | "mpesa">("invoice")
  const [orderRef, setOrderRef] = useState<string>("")

  const [form, setForm] = useState<ShippingForm>({
    firstName: "Alex",
    lastName: "Mercer",
    company: "Apex Telecom Networks",
    email: "alex.mercer@netily.io",
    phone: "+254 712 345 678",
    address: "Westlands Commercial Center, 4th Floor",
    apartment: "NOC Data Room Suite 4B",
    city: "Nairobi",
    state: "Nairobi County",
    zip: "00100",
    country: "Kenya",
  })

  const shipping = 0
  const orderTotal = total + shipping

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep("payment")
  }

  function handleCompletePayment() {
    setIsProcessing(true)
    const generatedRef = `NTL-${Date.now().toString().slice(-6)}`
    setOrderRef(generatedRef)

    setTimeout(() => {
      setIsProcessing(false)
      clearCart()
      setStep("success")
      toast.success("Order placed successfully!")
    }, 1000)
  }

  function handleLoadSamplePackage() {
    addItem({
      id: "mikrotik-ccr2004-16g-2s",
      name: "MikroTik Cloud Core Router CCR2004-16G-2S+PC",
      price: 495,
      image: "/products/mikrotik_router.jpg",
      category: "Routers & Gateways",
      selectedStorage: "Standard 1U Rackmount",
      selectedColor: "Matte Black",
    })
    addItem({
      id: "netily-cat6a-outdoor-305m",
      name: "Netily UltraGrade Cat6A Outdoor 305m Drum",
      price: 215,
      image: "/products/cat6a_cable.jpg",
      category: "Cabling & Infrastructure",
      selectedStorage: "305m Wooden Spool (23AWG)",
      selectedColor: "Black UV-Resistant PE",
    })
    toast.success("Sample hardware starter kit loaded into bag!")
  }

  // If cart is empty and not on success screen, show empty state
  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-6 border border-border">
            <ShoppingBag className="w-8 h-8 text-muted-foreground stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-3xl mb-3">Your Bag is Empty</h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Add routers, cabling, or equipment to your bag, or load our starter ISP deployment package to preview checkout.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleLoadSamplePackage}
              className="w-full py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Load Sample ISP Hardware Package ($710)
            </button>
            <Link href="/shop" className="block">
              <button className="w-full py-4 text-xs tracking-[0.2em] uppercase border border-border text-foreground hover:bg-muted">
                Browse Full Catalog
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/shop"
              className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Continue Shopping
            </Link>

            <Link href="/" className="flex flex-col items-center">
              <span className="font-serif text-xl lg:text-2xl tracking-[0.3em] uppercase leading-none">Netily Shop</span>
              <span className="text-[0.6rem] tracking-[0.2em] uppercase font-light mt-1 text-muted-foreground">
                Enterprise & Networking
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider uppercase">
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Success State */}
      {step === "success" && (
        <div className="flex items-center justify-center min-h-[70vh] py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg px-6"
          >
            <div className="w-20 h-20 bg-muted border border-border flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-10 w-10 text-foreground" />
            </div>

            <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-2 block">
              Order Confirmed • Netily Shop
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl mb-4">Order Received</h2>

            <div className="border border-border p-6 my-6 text-left space-y-2 text-xs bg-muted/30">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground uppercase tracking-wider">Order Reference:</span>
                <span className="font-mono font-semibold">{orderRef || "NTL-894201"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground uppercase tracking-wider">Destination:</span>
                <span className="truncate max-w-[200px]">{form.city}, {form.country}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground uppercase tracking-wider">Payment Term:</span>
                <span className="uppercase tracking-wider font-medium">{paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Dispatch Window:</span>
                <span>Within 24 Hours</span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              We have generated your proforma equipment manifest and transmitted it to <strong>{form.email}</strong>. Our logistics hub is preparing hardware for carrier dispatch.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/account/orders">
                <button className="w-full sm:w-auto px-8 py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90">
                  Track in Orders
                </button>
              </Link>
              <Link href="/shop">
                <button className="w-full sm:w-auto px-8 py-4 text-xs tracking-[0.2em] uppercase border border-border hover:bg-muted">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Checkout Layout */}
      {step !== "success" && (
        <main className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left - Forms */}
            <div className="order-2 lg:order-1">
              {/* Steps indicator */}
              <div className="flex items-center gap-4 mb-10">
                <div
                  className={`flex items-center gap-2 text-xs tracking-[0.2em] uppercase ${
                    step === "shipping" ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center text-xs ${
                      step === "shipping" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    1
                  </span>
                  Site & Delivery
                </div>
                <div className="h-px w-8 bg-border" />
                <div
                  className={`flex items-center gap-2 text-xs tracking-[0.2em] uppercase ${
                    step === "payment" ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center text-xs ${
                      step === "payment" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    2
                  </span>
                  Payment & Terms
                </div>
              </div>

              {step === "shipping" && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleShippingSubmit}
                >
                  <h2 className="font-serif text-2xl mb-8">Delivery & Site Information</h2>

                  {/* Company / Contact */}
                  <div className="mb-8 space-y-4">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Organization & Contact</h3>
                    <div>
                      <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">
                        ISP / Enterprise Company Name *
                      </Label>
                      <Input
                        id="company"
                        required
                        value={form.company}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-none border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Contact First Name *
                        </Label>
                        <Input
                          id="firstName"
                          required
                          value={form.firstName}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Last Name *
                        </Label>
                        <Input
                          id="lastName"
                          required
                          value={form.lastName}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Corporate Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Site Address */}
                  <div className="mb-8 space-y-4">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">NOC / Tower Delivery Site</h3>
                    <div>
                      <Label htmlFor="address" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Street Address / Tower Location *
                      </Label>
                      <Input
                        id="address"
                        required
                        value={form.address}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-none border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Server Room / Rack Enclosure / Suite (Optional)
                      </Label>
                      <Input
                        id="apartment"
                        value={form.apartment}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-none border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-xs uppercase tracking-wider text-muted-foreground">
                          City *
                        </Label>
                        <Input
                          id="city"
                          required
                          value={form.city}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Country *
                        </Label>
                        <Input
                          id="country"
                          required
                          value={form.country}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-none border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90"
                  >
                    Continue to Payment
                  </button>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                  <h2 className="font-serif text-2xl mb-8">Payment & Settlement</h2>

                  {/* Review */}
                  <div className="border border-border p-4 mb-8 space-y-2 text-xs">
                    <p className="font-medium text-sm mb-2">Delivery Summary</p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">{form.company}</strong> ({form.firstName} {form.lastName})
                    </p>
                    <p className="text-muted-foreground">
                      {form.address}{form.apartment ? `, ${form.apartment}` : ""}, {form.city}, {form.country}
                    </p>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-muted-foreground underline underline-offset-2 hover:text-foreground pt-1"
                    >
                      Edit Site Information
                    </button>
                  </div>

                  {/* Method options */}
                  <div className="space-y-3 mb-8">
                    {[
                      {
                        id: "invoice",
                        title: "B2B Proforma Invoice (Net 30 / Wire)",
                        desc: "Official commercial invoice with VAT registration for corporate accounting and bank wire settlement.",
                      },
                      {
                        id: "card",
                        title: "Credit / Debit Card (Instant Authorization)",
                        desc: "Direct corporate card processing with instant dispatch manifest generation.",
                      },
                      {
                        id: "mpesa",
                        title: "M-Pesa STK Push (East Africa)",
                        desc: "Instant mobile carrier settlement via Safaricom M-Pesa business till.",
                      },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id as any)}
                        className={`p-4 border cursor-pointer transition-colors ${
                          paymentMethod === opt.id
                            ? "border-foreground bg-muted/40"
                            : "border-border hover:border-foreground/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-base">{opt.title}</span>
                          <span
                            className={`w-3.5 h-3.5 border flex items-center justify-center ${
                              paymentMethod === opt.id ? "border-foreground bg-foreground" : "border-border"
                            }`}
                          >
                            {paymentMethod === opt.id && <span className="w-1.5 h-1.5 bg-background" />}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCompletePayment}
                    disabled={isProcessing}
                    className="w-full py-5 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {isProcessing ? "Transmitting Manifest..." : `Confirm Order — $${orderTotal.toLocaleString()} USD`}
                  </button>

                  <button
                    onClick={() => setStep("shipping")}
                    className="w-full mt-4 text-center text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to Site Info
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right - Order Summary */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-32">
                <h2 className="font-serif text-2xl mb-8">Order Summary</h2>

                <div className="space-y-6 mb-8 max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.selectedStorage}-${item.selectedColor}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex gap-4 border-b border-border/40 pb-4"
                    >
                      <div className="w-20 h-24 bg-muted flex-shrink-0 relative overflow-hidden border border-border">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] flex items-center justify-center font-mono">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm mb-1 leading-tight">{item.name}</h3>
                        {item.selectedStorage && (
                          <p className="text-xs text-muted-foreground">{item.selectedStorage}</p>
                        )}
                        {item.selectedColor && (
                          <p className="text-xs text-muted-foreground">{item.selectedColor}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">${item.price.toLocaleString()} each</p>
                      </div>
                      <div className="text-sm font-medium">
                        ${(item.price * item.quantity).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-border pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} units)</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Express Dispatch & Insurance</span>
                    <span className="text-emerald-700 dark:text-emerald-400 uppercase text-xs tracking-wider">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-3 border-t border-border">
                    <span>Total Due</span>
                    <span className="font-serif text-xl">${orderTotal.toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    📦 <strong>Carrier Guarantee:</strong> All orders are packed in heavy-duty anti-static boxes and insured with official traceable serial numbers.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {["100% Genuine", "Tax Compliant", "Free Dispatch"].map((badge) => (
                    <div key={badge} className="border border-border p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{badge}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
