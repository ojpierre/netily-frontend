// "Bubbles" plan circles (template 18), shared by the portal and the admin Live Preview.
// Pastel circles in two columns; the right column sits about a fifth of a circle lower.
// Everything inside a circle is sized to the circle (cqw), so it matches on any width.

import type { HotspotPlan } from "./HotspotClientView"
import { bubblesSerif } from "./bubbles-fonts"

/** Grid the circles sit in; the bottom padding leaves room for the lowered right column. */
export const BUBBLE_GRID_CLASS = "grid grid-cols-2 gap-x-3 gap-y-2 pb-[11%]"

// Pastel fills cycle pink, peach, lavender, mint, matching the reference design.
const BUBBLE_FILLS = ["bg-[#f9cad4]", "bg-[#fedcc1]", "bg-[#e4d3f5]", "bg-[#d4e6ce]"]

/** Renders the circle buttons only; place them inside a BUBBLE_GRID_CLASS container. */
export default function BubblePlans({
  plans,
  selectedId,
  formatPrice,
  onPick,
}: {
  plans: HotspotPlan[]
  selectedId?: string | null
  formatPrice: (plan: HotspotPlan) => string
  onPick: (plan: HotspotPlan) => void
}) {
  return (
    <>
      {plans.map((plan, i) => {
        const isSel = selectedId === plan.id
        const priceText = formatPrice(plan)
        const sp = priceText.indexOf(" ")
        const currencyPart = sp > 0 ? priceText.slice(0, sp) : ""
        const amountPart = sp > 0 ? priceText.slice(sp + 1) : priceText
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onPick(plan)}
            aria-pressed={isSel}
            aria-label={`${plan.name}, ${priceText}, for ${plan.duration_display}`}
            className={`@container aspect-square w-full rounded-full transition-[scale,box-shadow,background-color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a1f5c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fdf1f4] ${
              i % 2 === 1 ? "translate-y-[21.8%]" : ""
            } ${
              isSel
                ? "bg-[#7a1f5c] text-white ring-2 ring-[#7a1f5c] ring-offset-4 ring-offset-[#fdf1f4]"
                : `${BUBBLE_FILLS[i % BUBBLE_FILLS.length]} text-[#3b0f2f]`
            }`}
          >
            <span className="flex h-full w-full flex-col items-center justify-center px-[12cqw] text-center">
              {plan.is_popular && (
                <span className="mb-[2.5cqw] text-[4.6cqw] font-semibold uppercase tracking-wider opacity-75">★ Popular</span>
              )}
              <span className="line-clamp-2 break-words text-[7.2cqw] font-bold leading-[1.15]">{plan.name}</span>
              <span className={`mt-[3.5cqw] flex max-w-full items-baseline justify-center gap-[2.6cqw] whitespace-nowrap ${bubblesSerif.className}`}>
                {currencyPart && <span className="text-[7cqw] font-semibold">{currencyPart}</span>}
                <span
                  className={`font-semibold leading-none ${
                    amountPart.length > 7 ? "text-[10cqw]" : amountPart.length > 5 ? "text-[12cqw]" : "text-[15cqw]"
                  }`}
                >
                  {amountPart}
                </span>
              </span>
              <span className={`mt-[2.5cqw] line-clamp-1 text-[5.8cqw] leading-tight ${isSel ? "text-white/85" : "text-[#6b4b5f]"}`}>
                for {plan.duration_display}
              </span>
            </span>
          </button>
        )
      })}
    </>
  )
}
