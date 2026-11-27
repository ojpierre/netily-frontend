"use client"

import { useId, useState } from "react"
import { kindFor, shortModel, tintFor, type ArtKind } from "@/shop-ui/lib/shop-helpers"

interface ArtSource {
  name: string
  brand?: string
  category?: string
  categorySlug?: string
  image?: string
}

interface ProductArtProps extends ArtSource {
  /** card: brand + model label. hero: bigger label. glyph: icon only (menus, thumbnails). */
  variant?: "card" | "hero" | "glyph"
  /** Use the real photo when there is one. */
  useImage?: boolean
  className?: string
  /** Show the brand and model label over the artwork. */
  showLabel?: boolean
  /** Alt text for a real photo. Defaults to the product name. */
  alt?: string
  eager?: boolean
}

/** Line drawings, centred on 0,0 in roughly a 120 x 90 box. */
function Drawing({ kind, name, deep }: { kind: ArtKind; name: string; deep: string }) {
  const lower = name.toLowerCase()
  const stroke = { stroke: deep, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const body = { ...stroke, fill: "#ffffff", fillOpacity: 0.92 }
  const soft = { ...stroke, fill: deep, fillOpacity: 0.12 }
  const led = (cx: number, cy: number, i: number) => <circle key={i} cx={cx} cy={cy} r={1.9} fill={deep} />

  switch (kind) {
    case "router":
      return (
        <g>
          <path d="M-34 -6 L-42 -40" {...stroke} fill="none" />
          <path d="M34 -6 L42 -40" {...stroke} fill="none" />
          <rect x={-46} y={-44} width={8} height={6} rx={3} transform="rotate(-8 -42 -40)" {...soft} />
          <rect x={38} y={-44} width={8} height={6} rx={3} transform="rotate(8 42 -40)" {...soft} />
          <rect x={-54} y={-6} width={108} height={32} rx={9} {...body} />
          {[0, 1, 2, 3].map((i) => led(-40 + i * 9, 10, i))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={6 + i * 10} y={5} width={7} height={9} rx={1.5} {...soft} />
          ))}
          <path d="M-54 26 v5 M54 26 v5" {...stroke} fill="none" />
        </g>
      )
    case "ap":
      return (
        <g>
          <path d="M-14 -22 a20 20 0 0 1 28 0" {...stroke} fill="none" opacity={0.9} />
          <path d="M-24 -32 a34 34 0 0 1 48 0" {...stroke} fill="none" opacity={0.55} />
          <path d="M-34 -42 a48 48 0 0 1 68 0" {...stroke} fill="none" opacity={0.28} />
          <ellipse cx={0} cy={12} rx={50} ry={13} {...body} />
          <path d="M-32 10 C-32 -8 32 -8 32 10" {...body} />
          <ellipse cx={0} cy={22} rx={26} ry={4} {...soft} />
          <circle cx={0} cy={4} r={3} fill={deep} />
        </g>
      )
    case "outdoor": {
      const dish = /litebeam|dish|beam/.test(lower)
      return (
        <g>
          <rect x={-4} y={24} width={8} height={22} rx={2} {...soft} />
          <path d="M-18 46 h36" {...stroke} fill="none" />
          {dish ? (
            <g>
              <ellipse cx={0} cy={-8} rx={34} ry={34} {...body} />
              <ellipse cx={0} cy={-8} rx={22} ry={22} {...soft} />
              <circle cx={0} cy={-8} r={5} fill={deep} />
            </g>
          ) : (
            <g>
              <rect x={-24} y={-38} width={48} height={64} rx={9} {...body} />
              <rect x={-14} y={-28} width={28} height={30} rx={4} {...soft} />
              {[0, 1, 2, 3].map((i) => led(-9 + i * 6, 14, i))}
            </g>
          )}
          <path d="M38 -22 a22 22 0 0 1 0 28" {...stroke} fill="none" opacity={0.7} />
          <path d="M48 -30 a36 36 0 0 1 0 44" {...stroke} fill="none" opacity={0.35} />
        </g>
      )
    }
    case "switch":
      return (
        <g>
          <rect x={-58} y={-16} width={116} height={34} rx={5} {...body} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={-48 + i * 11} y={-8} width={8} height={9} rx={1.5} {...soft} />
          ))}
          <rect x={44} y={-9} width={9} height={11} rx={2} fill={deep} fillOpacity={0.35} stroke={deep} strokeWidth={1.6} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => led(-44 + i * 11, 9, i))}
          <circle cx={-52} cy={0} r={1.6} fill="none" stroke={deep} strokeWidth={1.4} />
          <path d="M-58 18 v5 M58 18 v5" {...stroke} fill="none" />
          <path d="M-8 -34 l-4 10 h8 l-4 10" {...stroke} fill="none" opacity={0.8} />
        </g>
      )
    case "fibre": {
      if (/cable|adss/.test(lower))
        return (
          <g>
            <ellipse cx={0} cy={26} rx={40} ry={7} {...soft} />
            <circle cx={0} cy={-6} r={38} {...body} />
            <circle cx={0} cy={-6} r={27} fill="none" stroke={deep} strokeWidth={1.6} strokeDasharray="3 4" />
            <circle cx={0} cy={-6} r={15} {...soft} />
            <circle cx={0} cy={-6} r={4} fill={deep} />
            <path d="M30 28 C46 28 50 18 58 18" {...stroke} fill="none" />
          </g>
        )
      if (/connector/.test(lower))
        return (
          <g>
            <path d="M-56 4 C-44 4 -40 4 -30 4" {...stroke} fill="none" />
            <rect x={-32} y={-12} width={44} height={32} rx={5} {...body} />
            <rect x={12} y={-5} width={26} height={18} rx={3} {...soft} />
            <rect x={38} y={0} width={14} height={8} rx={2} {...body} />
            <circle cx={52} cy={4} r={2.4} fill={deep} />
            <path d="M-18 -12 v-8 h20 v8" {...stroke} fill="none" />
          </g>
        )
      if (/olt/.test(lower))
        return (
          <g>
            <rect x={-58} y={-20} width={116} height={40} rx={5} {...body} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={-50 + i * 26} y={-12} width={20} height={24} rx={2} {...soft} />
                <circle cx={-40 + i * 26} cy={-3} r={3} fill="#fff" stroke={deep} strokeWidth={1.6} />
                <circle cx={-40 + i * 26} cy={6} r={1.6} fill={deep} />
              </g>
            ))}
            <path d="M-30 20 C-30 38 -50 34 -54 44" {...stroke} fill="none" />
            <path d="M-4 20 C-4 40 20 34 24 46" {...stroke} fill="none" opacity={0.6} />
          </g>
        )
      return (
        <g>
          <rect x={-40} y={-12} width={80} height={36} rx={8} {...body} />
          {[0, 1, 2].map((i) => led(-24 + i * 8, 4, i))}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={2 + i * 8} y={-2} width={5} height={8} rx={1} {...soft} />
          ))}
          <path d="M-14 -12 C-14 -30 -36 -26 -36 -42" {...stroke} fill="none" />
          <path d="M-4 -12 C-4 -26 14 -24 16 -40" {...stroke} fill="none" opacity={0.6} />
          <path d="M-40 24 v5 M40 24 v5" {...stroke} fill="none" />
        </g>
      )
    }
    case "tool": {
      if (/splicer/.test(lower))
        return (
          <g>
            <rect x={-44} y={-8} width={88} height={40} rx={11} {...body} />
            <path d="M-40 -8 L-32 -34 H32 L40 -8 Z" {...body} />
            <rect x={-26} y={-26} width={52} height={14} rx={3} {...soft} />
            <path d="M-12 -19 h24" stroke={deep} strokeWidth={1.8} strokeLinecap="round" />
            <circle cx={-22} cy={16} r={5} {...soft} />
            <circle cx={-6} cy={16} r={5} {...soft} />
            <rect x={10} y={10} width={26} height={12} rx={3} fill={deep} fillOpacity={0.25} stroke={deep} strokeWidth={1.6} />
          </g>
        )
      if (/locator|pen/.test(lower))
        return (
          <g transform="rotate(-24)">
            <rect x={-52} y={-8} width={92} height={16} rx={8} {...body} />
            <rect x={-40} y={-3} width={20} height={6} rx={3} {...soft} />
            <path d="M40 -4 h10 l5 4 l-5 4 h-10" {...body} />
            <path d="M58 0 h12 M60 -9 l10 -7 M60 9 l10 7" stroke="#d1382a" strokeWidth={2.2} strokeLinecap="round" />
          </g>
        )
      return (
        <g>
          <path d="M-18 -12 v-12 a6 6 0 0 1 6 -6 h24 a6 6 0 0 1 6 6 v12" {...stroke} fill="none" />
          <rect x={-48} y={-14} width={96} height={52} rx={8} {...body} />
          <path d="M-48 8 h96" stroke={deep} strokeWidth={1.8} />
          <rect x={-8} y={2} width={16} height={12} rx={3} {...soft} />
          <path d="M-36 -4 h22 M-36 22 h14 M22 22 h14" stroke={deep} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </g>
      )
    }
    case "satellite":
      return (
        <g>
          <path d="M0 18 L-8 46 M0 18 L8 46 M-18 46 h36" {...stroke} fill="none" />
          <ellipse cx={0} cy={-8} rx={46} ry={34} transform="rotate(-18 0 -8)" {...body} />
          <ellipse cx={0} cy={-8} rx={32} ry={23} transform="rotate(-18 0 -8)" {...soft} />
          <ellipse cx={0} cy={-8} rx={16} ry={11} transform="rotate(-18 0 -8)" fill="none" stroke={deep} strokeWidth={1.6} />
          <circle cx={0} cy={-8} r={2.6} fill={deep} />
        </g>
      )
    case "power":
      return (
        <g>
          <path d="M-16 -32 v-8 a4 4 0 0 1 4 -4 h24 a4 4 0 0 1 4 4 v8" {...stroke} fill="none" />
          <rect x={-40} y={-32} width={80} height={72} rx={11} {...body} />
          <rect x={-28} y={-22} width={34} height={14} rx={3} {...soft} />
          <path d="M16 -24 l-8 14 h8 l-6 12" stroke={deep} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={-20 + i * 14} cy={16} r={5.5} fill="#fff" stroke={deep} strokeWidth={1.8} />
          ))}
          <rect x={20} y={11} width={12} height={10} rx={2} {...soft} />
          <path d="M-28 30 h56" stroke={deep} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
        </g>
      )
  }
}

export function ProductArt({
  name,
  brand,
  category,
  categorySlug,
  image,
  variant = "card",
  useImage = true,
  showLabel = true,
  alt,
  className = "",
  eager = false,
}: ProductArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [failed, setFailed] = useState(false)
  const kind = kindFor({ categorySlug, category, name })
  const tint = tintFor(kind)
  const model = shortModel(name, brand)

  if (useImage && image && !failed) {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt ?? name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-4"
        />
      </div>
    )
  }

  const glyph = variant === "glyph"
  const hero = variant === "hero"
  return (
    <div
      role="img"
      aria-label={`${name}${brand ? ` by ${brand}` : ""}, illustration`}
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${tint.from}, ${tint.to})` }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern id={`dots-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill={tint.deep} fillOpacity="0.14" />
          </pattern>
          <radialGradient id={`glow-${uid}`} cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#dots-${uid})`} />
        <rect width="400" height="300" fill={`url(#glow-${uid})`} />
        <ellipse cx="200" cy="232" rx="92" ry="9" fill={tint.deep} fillOpacity="0.12" />
        <g transform={`translate(200 ${glyph ? 142 : 134}) scale(${glyph ? 1.95 : hero ? 2.05 : 1.85})`}>
          <Drawing kind={kind} name={name} deep={tint.deep} />
        </g>
      </svg>
      {showLabel && !glyph && (
        <>
          {brand && (
            <span
              className={`absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 font-semibold uppercase tracking-[0.12em] backdrop-blur-sm ${
                hero ? "text-[11px]" : "text-[9.5px]"
              }`}
              style={{ color: tint.deep }}
            >
              {brand}
            </span>
          )}
          <span
            className={`absolute bottom-3 left-3 right-3 truncate font-medium tracking-tight ${
              hero ? "text-sm" : "text-[11px]"
            }`}
            style={{ color: tint.deep, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
          >
            {model.length > 26 ? `${model.slice(0, 25)}…` : model}
          </span>
        </>
      )}
    </div>
  )
}

/** Small square icon tile for menus and lists. */
export function CategoryGlyph({ slug, name, className = "" }: { slug?: string; name?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <ProductArt name={name || ""} categorySlug={slug} category={name} variant="glyph" showLabel={false} useImage={false} />
    </div>
  )
}
