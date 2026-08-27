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
  animationDelay?: number
}

const defaultFormat = (v: number) =>
  `KSh ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`

const sparklineStyle = `
  @keyframes draw {
    from { stroke-dashoffset: 1; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes cardSlideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .spark-line {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .spark-line-delayed-1 { animation-delay: 0.1s; }
  .spark-line-delayed-2 { animation-delay: 0.2s; }
  .spark-line-delayed-3 { animation-delay: 0.3s; }
`

export function RevenueStatCard({
  label,
  value,
  deltaPct,
  sub,
  color = "currentColor",
  sparklineData,
  formatValue = defaultFormat,
  animationDelay = 0,
}: RevenueStatCardProps) {
  const hasDelta = typeof deltaPct === "number" && deltaPct !== 0
  const isPositive = (deltaPct ?? 0) >= 0
  const gradientId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}-${color.replace("#", "")}`
  const delayClass =
    animationDelay === 0.1 ? "spark-line-delayed-1" :
    animationDelay === 0.2 ? "spark-line-delayed-2" :
    animationDelay === 0.3 ? "spark-line-delayed-3" : ""

  return (
    <>
      <style>{sparklineStyle}</style>
      <div
        className="relative overflow-hidden rounded-xl bg-card border border-border/70"
        style={{
          animation: `cardSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${animationDelay}s both`,
        }}
      >
        {/* Thin colored top accent bar */}
        <div className="h-px w-full" style={{ background: color, opacity: 0.5 }} />

        <div className="flex items-stretch">
          {/* Left: label + value + delta */}
          <div className="flex-1 px-3 py-3 flex flex-col justify-center gap-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold uppercase truncate text-muted-foreground" style={{ fontSize: 10, letterSpacing: "0.11em" }}>
                {label}
              </p>
              {hasDelta && (
                <span
                  className="flex items-center gap-0.5 font-semibold shrink-0"
                  style={{ 
                    fontSize: 10, 
                    color: isPositive ? "var(--success)" : "var(--destructive)" 
                  }}
                >
                  {isPositive
                    ? <TrendingUp size={10} strokeWidth={2.5} />
                    : <TrendingDown size={10} strokeWidth={2.5} />}
                  {isPositive ? "+" : ""}{deltaPct}%
                </span>
              )}
            </div>

            <span
              className="font-extrabold tabular-nums leading-none"
              style={{
                fontSize: "clamp(15px, 2vw, 20px)",
                fontWeight: 800,
                color,
                letterSpacing: "-0.02em",
              }}
            >
              {formatValue(value)}
            </span>

            {sub && (
              <p className="font-medium text-muted-foreground" style={{ fontSize: 10 }}>
                {sub}
              </p>
            )}
          </div>

          {/* Right: sparkline panel */}
          <div style={{ width: 72, minWidth: 72 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 8, right: 0, bottom: 8, left: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
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
      </div>
    </>
  )
}