"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface RevenueStatCardProps {
  label: string
  value: number
  deltaPct?: number
  sub?: string
  color?: string
  sparklineData: { amount: number }[]
  formatValue?: (v: number) => string
  animationDelay?: number // in seconds, for staggering cards
}

const defaultFormat = (v: number) =>
  `KSh ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`

// ─── Sparkline drawing animation CSS ─────────────────────────
const sparklineStyle = `
  @keyframes draw {
    from { stroke-dashoffset: 1; }
    to   { stroke-dashoffset: 0; }
  }
  .spark-line {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .spark-line-delayed-1 { animation-delay: 0.1s; }
  .spark-line-delayed-2 { animation-delay: 0.2s; }
  .spark-line-delayed-3 { animation-delay: 0.3s; }
  .spark-line-fast { animation-duration: 0.8s; }
  .spark-line-elastic { animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
`

// ──────────────────────────────────────────────────────────────

export function RevenueStatCard({
  label,
  value,
  deltaPct,
  sub,
  color = "#000000",
  sparklineData,
  formatValue = defaultFormat,
  animationDelay = 0,
}: RevenueStatCardProps) {
  const hasDelta = typeof deltaPct === "number" && deltaPct !== 0
  const isPositive = (deltaPct ?? 0) >= 0

  // Stable gradient ID — scoped to label + color to prevent SVG collisions
  const gradientId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}-${color.replace("#", "")}`

  // Determine delay class based on index (passed from parent)
  const delayClass = animationDelay === 0 ? "" :
    animationDelay === 0.1 ? "spark-line-delayed-1" :
    animationDelay === 0.2 ? "spark-line-delayed-2" :
    animationDelay === 0.3 ? "spark-line-delayed-3" : ""

  return (
    <>
      <style>{sparklineStyle}</style>
      <div
        className="relative overflow-hidden rounded-2xl bg-white"
        style={{ border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="px-4 pt-4 pb-2">
          {/* Label */}
          <p
            className="font-semibold uppercase"
            style={{ fontSize: 11, letterSpacing: "0.11em", color: "#8a8274" }}
          >
            {label}
          </p>

          {/* Value + delta row */}
          <div className="mt-1 flex items-end justify-between gap-2">
            <span
              className="font-extrabold tabular-nums leading-none"
              style={{
                fontSize: "clamp(24px, 4vw, 38px)",
                fontWeight: 800,
                color,
                letterSpacing: "-0.02em",
              }}
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

          {/* Optional sub-label */}
          {sub && (
            <p
              className="mt-0.5 font-medium"
              style={{ fontSize: 11, color: "#8a8274" }}
            >
              {sub}
            </p>
          )}
        </div>

        {/* Sparkline — bleeds edge to edge with drawing animation */}
        <div style={{ height: 32, margin: "0 -4px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparklineData}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
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
                dot={false}
                isAnimationActive={false}
                className={`spark-line ${delayClass}`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}