"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Lock, CheckCircle2, ShoppingBag, Plus, CreditCard, Smartphone } from "lucide-react"
import { Button } from "@/shop-ui/components/ui/button"
import { Input } from "@/shop-ui/components/ui/input"
import { Label } from "@/shop-ui/components/ui/label"
import { useCart } from "@/shop-ui/lib/cart-context"
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mpesa">("mpesa")
  const [orderRef, setOrderRef] = useState<string>("")
  const [authReady, setAuthReady] = useState(false)

  const [form, setForm] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "+254 712 345 678",
    address: "",
    apartment: "",
    city: "Nairobi",
    state: "Nairobi County",
    zip: "00100",
    country: "Kenya",
  })

  const shipping = 0
  const orderTotal = total + shipping

  useEffect(() => {
    if (typeof window === "undefined") return
    const session = window.localStorage.getItem("netily_shop_customer_session")
    if (session !== "authenticated") {
      router.replace("/shop/login?next=/shop/checkout")
      return
    }
    setAuthReady(true)
  }, [router])

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
      image: "/shop-assets/products/mikrotik_router.jpg",
      category: "Routers & Gateways",
      selectedStorage: "Standard 1U Rackmount",
      selectedColor: "Matte Black",
    })
    addItem({
      id: "netily-cat6a-outdoor-305m",
      name: "Netily UltraGrade Cat6A Outdoor 305m Drum",
      price: 215,
      image: "/shop-assets/products/cat6a_cable.jpg",
      category: "Cabling & Infrastructure",
      selectedStorage: "305m Wooden Spool (23AWG)",
      selectedColor: "Black UV-Resistant PE",
    })
    toast.success("Sample hardware starter kit loaded into bag!")
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
        <div>
          <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h1 className="font-serif text-2xl">Checking checkout access</h1>
          <p className="mt-2 text-sm text-muted-foreground">You will sign in before placing an order.</p>
        </div>
      </div>
    )
  }

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-6 border border-border">
            <ShoppingBag className="w-8 h-8 text-muted-foreground stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-3xl mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Add routers, cables, tools, or other equipment to your cart before checkout.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleLoadSamplePackage}
              className="w-full py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Load Sample Hardware Package ($710)
            </button>
            <Link href="/shop/catalog" className="block">
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
              href="/shop/catalog"
              className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Continue Shopping
            </Link>

            <Link href="/shop" className="flex flex-col items-center">
              <span className="font-serif text-xl lg:text-2xl tracking-[0.3em] uppercase leading-none">Netily Shop</span>
              <span className="text-[0.6rem] tracking-[0.2em] uppercase font-light mt-1 text-muted-foreground">
                Network Equipment
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
              Order Confirmed - Internetily Shop
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl mb-4">Order received</h2>

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
                <span className="text-muted-foreground uppercase tracking-wider">Payment Method:</span>
                <span className="uppercase tracking-wider font-medium">{paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Delivery Update:</span>
                <span>Shared by the shop team</span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Thanks. We have received your order and will send confirmation details to <strong>{form.email}</strong>. You can track progress from your shop account.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop/account/orders">
                <button className="w-full sm:w-auto px-8 py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90">
                  Track in Orders
                </button>
              </Link>
              <Link href="/shop/catalog">
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
                  Delivery Details
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
                  Payment
                </div>
              </div>

              {step === "shipping" && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleShippingSubmit}
                >
                  <h2 className="font-serif text-2xl mb-8">Delivery information</h2>

                  {/* Company / Contact */}
                  <div className="mb-8 space-y-4">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Contact details</h3>
                    <div>
                      <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Business or Organization (Optional)
                      </Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-xl border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">
                          First Name *
                        </Label>
                        <Input
                          id="firstName"
                          required
                          value={form.firstName}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-xl border-border"
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
                          className="mt-1.5 rounded-xl border-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleFormChange}
                          className="mt-1.5 rounded-xl border-border"
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
                          className="mt-1.5 rounded-xl border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Site Address */}
                  <div className="mb-8 space-y-4">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Delivery address</h3>
                    <div>
                      <Label htmlFor="address" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Street Address *
                      </Label>
                      <Input
                        id="address"
                        required
                        value={form.address}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-xl border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Apartment, suite, floor, or landmark (Optional)
                      </Label>
                      <Input
                        id="apartment"
                        value={form.apartment}
                        onChange={handleFormChange}
                        className="mt-1.5 rounded-xl border-border"
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
                          className="mt-1.5 rounded-xl border-border"
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
                          className="mt-1.5 rounded-xl border-border"
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
                  <h2 className="font-serif text-2xl mb-8">Choose payment method</h2>

                  {/* Review */}
                  <div className="border border-border p-4 mb-8 space-y-2 text-xs">
                    <p className="font-medium text-sm mb-2">Delivery Summary</p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">{form.firstName} {form.lastName}</strong>
                      {form.company ? ` - ${form.company}` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {form.address}{form.apartment ? `, ${form.apartment}` : ""}, {form.city}, {form.country}
                    </p>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-muted-foreground underline underline-offset-2 hover:text-foreground pt-1"
                    >
                      Edit delivery details
                    </button>
                  </div>

                  {/* Method options */}
                  <div className="space-y-3 mb-8">
                    {[
                      {
                        id: "card",
                        title: "Pay by Card",
                        desc: "Use a debit or credit card. Your order will be confirmed after payment is approved.",
                        icon: CreditCard,
                      },
                      {
                        id: "mpesa",
                        title: "Pay by M-Pesa STK Push",
                        desc: "Enter your M-Pesa number and approve the prompt on your phone.",
                        icon: Smartphone,
                      },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id as "card" | "mpesa")}
                        className={`rounded-2xl border p-4 cursor-pointer transition-colors ${
                          paymentMethod === opt.id
                            ? "border-foreground bg-muted/40"
                            : "border-border hover:border-foreground/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="flex items-center gap-3 font-serif text-base">
                            <opt.icon className="h-4 w-4 text-muted-foreground" />
                            {opt.title}
                          </span>
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              paymentMethod === opt.id ? "border-foreground bg-foreground" : "border-border"
                            }`}
                          >
                            {paymentMethod === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <div className="mb-8 rounded-2xl border border-border bg-card p-4">
                      <p className="mb-4 text-sm font-medium">Card details</p>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardName" className="text-xs uppercase tracking-wider text-muted-foreground">Name on card</Label>
                          <Input id="cardName" placeholder="Jane Otieno" className="mt-1.5 rounded-xl border-border" />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber" className="text-xs uppercase tracking-wider text-muted-foreground">Card number</Label>
                          <Input id="cardNumber" inputMode="numeric" placeholder="1234 1234 1234 1234" className="mt-1.5 rounded-xl border-border" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry" className="text-xs uppercase tracking-wider text-muted-foreground">Expiry</Label>
                            <Input id="expiry" placeholder="MM / YY" className="mt-1.5 rounded-xl border-border" />
                          </div>
                          <div>
                            <Label htmlFor="cvc" className="text-xs uppercase tracking-wider text-muted-foreground">CVC</Label>
                            <Input id="cvc" inputMode="numeric" placeholder="123" className="mt-1.5 rounded-xl border-border" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "mpesa" && (
                    <div className="mb-8 rounded-2xl border border-border bg-card p-4">
                      <p className="mb-2 text-sm font-medium">M-Pesa phone number</p>
                      <p className="mb-4 text-xs leading-5 text-muted-foreground">We will send an STK push to this number. Confirm the prompt on your phone to complete payment.</p>
                      <Input
                        id="mpesaPhone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        className="rounded-xl border-border"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleCompletePayment}
                    disabled={isProcessing}
                    className="w-full py-5 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : `Place Order - $${orderTotal.toLocaleString()} USD`}
                  </button>

                  <button
                    onClick={() => setStep("shipping")}
                    className="w-full mt-4 text-center text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to delivery details
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
                    <span className="text-muted-foreground">Delivery and handling</span>
                    <span className="text-emerald-700 dark:text-emerald-400 uppercase text-xs tracking-wider">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-3 border-t border-border">
                    <span>Total</span>
                    <span className="font-serif text-xl">${orderTotal.toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Delivery Promise:</strong> We pack orders carefully and share delivery updates after confirmation.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {["Genuine Items", "Secure Payment", "Delivery Updates"].map((badge) => (
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
