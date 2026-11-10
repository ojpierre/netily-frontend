"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift, Star } from "lucide-react"
import { toast } from "sonner"
import { customerApi } from "@/lib/customer-api"

type Loyalty = Awaited<ReturnType<typeof customerApi.getLoyalty>>

export default function CustomerRewardsPage() {
  const router = useRouter()
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem("customerToken")) { router.push("/customer/login"); return }
    customerApi.getLoyalty()
      .then(setLoyalty)
      .catch((err: any) => {
        if (err.message?.includes("401")) router.push("/customer/login")
        else toast.error("Failed to load rewards")
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <Skeleton className="h-24 w-full" />

  if (!loyalty?.program_active) {
    return (
      <Card className="p-12 text-center">
        <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-1">Rewards not available</h3>
        <p className="text-sm text-muted-foreground">Your provider has not enabled the loyalty program yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn points on every payment. Redeem them for a discount when you pay or renew.
        </p>
      </div>
      <Card className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center"><Star className="w-6 h-6 text-warning" /></div>
        <div>
          <p className="text-sm text-muted-foreground">Your points · {loyalty.tier_name}</p>
          <p className="text-3xl font-bold">{(loyalty.current_points ?? 0).toLocaleString()}</p>
        </div>
      </Card>
    </div>
  )
}