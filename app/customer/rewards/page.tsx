"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift, Star, Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { customerApi } from "@/lib/customer-api"
import { useCustomerPaymentLocale } from "@/hooks/use-customer-payment-locale"
import { formatPaymentAmount, isValidPaymentPhone, normalizePaymentPhone } from "@/lib/tenant-locale"
import type { CustomerDashboardData } from "@/lib/types"

type Loyalty = Awaited<ReturnType<typeof customerApi.getLoyalty>>
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function CustomerRewardsPage() {
  const { locale } = useCustomerPaymentLocale()
  const router = useRouter()
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null)
  const [dash, setDash] = useState<CustomerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [phone, setPhone] = useState("")
  const [paying, setPaying] = useState(false)
  const [payMsg, setPayMsg] = useState("")
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  const load = useCallback(async () => {
    try {
      const [l, d] = await Promise.all([customerApi.getLoyalty(), customerApi.getDashboard()])
      if (!mounted.current) return
      setLoyalty(l); setDash(d)
      setPhone(prev => prev || d.customer.phone_number || "")
    } catch (err: any) {
      if (err.message?.includes("401")) { router.push("/customer/login"); return }
      toast.error("Failed to load rewards")
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!localStorage.getItem("customerToken")) { router.push("/customer/login"); return }
    load()
  }, [load, router])

  const redeem = async (id: number) => {
    setRedeemingId(id)
    try {
      const r = await customerApi.redeemLoyaltyReward(id)
      toast.success(`${Number(r.discount_percent)}% discount coupon added`)
      await load()
    } catch (e: any) {
      toast.error(e.message || "Could not redeem")
    } finally {
      setRedeemingId(null)
    }
  }

  const payWithDiscount = async () => {
    if (!dash?.current_plan) return
    if (!isValidPaymentPhone(phone, locale)) { toast.error("Enter a valid phone number"); return }
    setPaying(true); setPayMsg("Sending payment prompt…")
    try {
      const res = await customerApi.initiateIspPayment({
        amount: Number(dash.current_plan.price),
        phone_number: normalizePaymentPhone(phone, locale),
        use_loyalty_discount: true,
      })
      setPayMsg("Check your phone and enter your PIN…")
      for (let i = 0; i < 40 && mounted.current; i++) {
        await sleep(3000)
        const s = await customerApi.getIspPaymentStatus(res.payment_id)
        if (s.status === "completed") { toast.success("Payment received - your plan is renewed"); await load(); break }
        if (s.status === "failed" || s.status === "cancelled") { toast.error(s.message || "Payment failed"); break }
      }
    } catch (e: any) {
      toast.error(e.message || "Payment failed")
    } finally {
      if (mounted.current) { setPaying(false); setPayMsg("") }
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>
  }
  if (!loyalty?.program_active) {
    return (
      <Card className="p-12 text-center">
        <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-1">Rewards not available</h3>
        <p className="text-sm text-muted-foreground">Your provider has not enabled the loyalty program yet.</p>
      </Card>
    )
  }

  const coupon = loyalty.discounts?.[0]
  const price = dash?.current_plan ? Number(dash.current_plan.price) : 0
  const discounted = coupon ? Math.max(1, Math.round(price * (100 - Number(coupon.percent)) / 100)) : price

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-sm text-muted-foreground mt-1">Earn points on every payment and redeem them for discounts.</p>
      </div>

      <Card className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center"><Star className="w-6 h-6 text-warning" /></div>
        <div>
          <p className="text-sm text-muted-foreground">Your points · {loyalty.tier_name}</p>
          <p className="text-3xl font-bold">{(loyalty.current_points ?? 0).toLocaleString()}</p>
        </div>
      </Card>

      {coupon && dash?.current_plan && (
        <Card className="p-5 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{Number(coupon.percent)}% discount ready ({loyalty.discounts!.length} coupon{loyalty.discounts!.length > 1 ? "s" : ""})</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Renew <strong>{dash.current_plan.name}</strong>:{" "}
            <span className="line-through">{formatPaymentAmount(price, locale.currency)}</span>{" "}
            <strong className="text-foreground">{formatPaymentAmount(discounted, locale.currency)}</strong>
          </p>
          <div className="flex gap-2">
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder={locale.phonePlaceholder} disabled={paying} />
            <Button onClick={payWithDiscount} disabled={paying} className="shrink-0">
              {paying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Pay now
            </Button>
          </div>
          {payMsg && <p className="text-xs text-muted-foreground">{payMsg}</p>}
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Redeem points</h3>
        {(loyalty.rewards ?? []).length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No rewards available right now.</Card>
        ) : (
          loyalty.rewards!.map(r => (
            <Card key={r.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><Tag className="w-5 h-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.name} · {Number(r.discount_percent)}% off</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{r.points_cost.toLocaleString()} pts</p>
                <Button size="sm" className="mt-1" disabled={!r.affordable || redeemingId === r.id} onClick={() => redeem(r.id)}>
                  {redeemingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : r.affordable ? "Redeem" : "Not enough points"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}