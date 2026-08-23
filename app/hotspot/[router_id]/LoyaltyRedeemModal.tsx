"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import type { HotspotLoyaltyData, LoyaltyRewardItem } from "./page"

interface LoyaltyRedeemModalProps {
  loyaltyData: HotspotLoyaltyData | null
  redeemLoading: boolean
  redeemError: string | null
  canonicalUsername: string
  routerId: string
  loginUrl: string
  onRedeem: (reward: LoyaltyRewardItem) => Promise<void>
  onClose: () => void
}

export default function LoyaltyRedeemModal({
  loyaltyData,
  redeemLoading,
  redeemError,
  onRedeem,
  onClose,
}: LoyaltyRedeemModalProps) {
  if (!loyaltyData) return null

  const rewards = loyaltyData.all_hotspot_rewards.length > 0
    ? loyaltyData.all_hotspot_rewards
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md mx-auto bg-white rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:opacity-70"
        >
          ✕
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">🎁 Loyalty Rewards</h3>
          <p className="text-sm text-gray-500">
            You have <span className="font-bold text-violet-600">{loyaltyData.current_points.toLocaleString()} points</span>
          </p>
        </div>

        {redeemError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {redeemError}
          </div>
        )}

        <div className="space-y-3">
          {rewards.map(reward => {
            const canAfford = loyaltyData.current_points >= reward.points_cost
            return (
              <div
                key={reward.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  canAfford
                    ? 'border-violet-200 bg-violet-50'
                    : 'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 text-xl">
                  🌐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{reward.name}</p>
                  <p className="text-xs text-gray-500">
                    {reward.reward_minutes} min · {reward.reward_speed_mbps} Mbps
                    {reward.description ? ` · ${reward.description}` : ''}
                  </p>
                  <p className={`text-xs font-bold mt-0.5 ${canAfford ? 'text-violet-600' : 'text-gray-400'}`}>
                    {reward.points_cost.toLocaleString()} points
                    {!canAfford && ` (need ${(reward.points_cost - loyaltyData.current_points).toLocaleString()} more)`}
                  </p>
                </div>
                {canAfford && (
                  <button
                    disabled={redeemLoading}
                    onClick={() => onRedeem(reward)}
                    className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    {redeemLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : 'Redeem'}
                  </button>
                )}
              </div>
            )
          })}

          {rewards.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm">No hotspot rewards configured yet.</p>
              <p className="text-xs mt-1">Keep purchasing to earn points!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}