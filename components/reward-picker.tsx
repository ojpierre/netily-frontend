"use client"

import { useEffect, useState } from "react"
import { Gift, Check, Star } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { formatPaymentAmount } from "@/lib/tenant-locale"

type Loyalty = Awaited<ReturnType<typeof customerApi.getLoyalty>>

export const discountedPrice = (amount: number, percent: number | string) =>
  Math.max(1, Math.round((amount * (100 - Number(percent))) / 100))

interface Props {
  amount: number
  currency: string
  value: number | null
  onChange: (rewardId: number | null, payable: number) => void
  disabled?: boolean
}

export function RewardPicker({ amount, currency, value, onChange, disabled }: Props) {
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null)

  useEffect(() => {
    let on = true
    customerApi.getLoyalty().then(d => on && setLoyalty(d)).catch(() => {})
    return () => { on = false }
  }, [])

  const rewards = loyalty?.program_active ? loyalty.rewards ?? [] : []
  if (!rewards.length) return null

  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium"><Gift className="h-4 w-4 text-primary" /> Use a reward</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Star className="h-3.5 w-3.5 text-warning" />{(loyalty?.current_points ?? 0).toLocaleString()} pts</span>
      </div>
      {rewards.map(r => {
        const selected = value === r.id
        const payable = discountedPrice(amount, r.discount_percent)
        return (
          <button
            key={r.id}
            type="button"
            disabled={disabled || !r.affordable}
            onClick={() => onChange(selected ? null : r.id, selected ? amount : payable)}
            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition
              ${selected ? "border-primary bg-primary/10" : "border-border bg-card"}
              ${!r.affordable ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}`}
          >
            <span>
              <span className="block font-medium">{r.name} · {Number(r.discount_percent)}% off</span>
              <span className="text-xs text-muted-foreground">
                {r.affordable ? `${r.points_cost.toLocaleString()} pts · pay ${formatPaymentAmount(payable, currency)}` : `Needs ${r.points_cost.toLocaleString()} pts`}
              </span>
            </span>
            {selected && <Check className="h-4 w-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}