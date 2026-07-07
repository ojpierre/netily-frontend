"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface RevenueStatCardProps {
  label: string
  value: number
  deltaPct?: number
  color?: string
  sparklineData: { amount: number }[]
  formatValue?: (v: number) => string
}

const defaultFormat = (v: number) =>
  `KSh ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`

export function RevenueStatCard({
  label,
  value,
  deltaPct,
  color = "#000000",
  sparklineData,
  formatValue = defaultFormat,
}: RevenueStatCardProps) {
  const hasDelta = typeof deltaPct === "number" && deltaPct !== 0
  const isPositive = (deltaPct ?? 0) >= 0
  const gradientId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white"
      style={{ border: "1px solid rgba(0,0,0,0.07)" }}
    >
      <div className="px-4 pt-4 pb-2">
        {/* Label */}
        <p
          className="font-semibold uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.11em",
            color: "#8a8274",
          }}
        >
          {label}
        </p>

        {/* Value + delta row */}
        <div className="mt-1 flex items-end justify-between gap-2">
          <span
            className="font-extrabold tabular-nums leading-none"
            style={{ fontSize: 38, fontWeight: 800, color, letterSpacing: "-0.02em" }}
          >
            {formatValue(value)}
          </span>

          {hasDelta && (
            <span
              className="mb-1 flex items-center gap-1 font-semibold shrink-0"
              style={{
                fontSize: 11,
                color: isPositive ? "#3d7a5f" : "#c0392b",
              }}
            >
              {isPositive ? (
                <TrendingUp size={11} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={11} strokeWidth={2.5} />
              )}
              {isPositive ? "+" : ""}
              {deltaPct}%
            </span>
          )}
        </div>
      </div>

      {/* Sparkline — bleeds edge to edge */}
      <div style={{ height: 32, margin: "0 -4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="amount"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}