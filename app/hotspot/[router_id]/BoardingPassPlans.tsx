// "Boarding Pass" plan list (template 20).
// Every plan is an airline boarding pass flying from OFF(line) to ON(line): the trip
// details on the left, the fare on a tear-off stub with a barcode on the right.

import { Plane } from "lucide-react"
import type { HotspotPlan } from "./HotspotClientView"

// Page colour, reused to "cut" the perforation notches out of each pass
export const PASS_PAGE_BG = "#e7edf5"

// Colour band per pass, cycling: navy, coral, teal, amber
const BANDS = [
  { band: "bg-[#13294b]", ink: "text-[#13294b]", stub: "bg-[#13294b]" },
  { band: "bg-[#e4572e]", ink: "text-[#c2410c]", stub: "bg-[#e4572e]" },
  { band: "bg-[#0f766e]", ink: "text-[#0f766e]", stub: "bg-[#0f766e]" },
  { band: "bg-[#d97706]", ink: "text-[#b45309]", stub: "bg-[#d97706]" },
]

export default function BoardingPassPlans({
  plans,
  formatPrice,
  hideSpeed,
  carrier,
  onPay,
}: {
  plans: HotspotPlan[]
  formatPrice: (plan: HotspotPlan) => string
  hideSpeed?: boolean
  /** Shown as the "airline", e.g. the hotspot name */
  carrier: string
  onPay: (plan: HotspotPlan) => void
}) {
  return (
    <div className="space-y-4">
      {plans.map((plan, i) => {
        const c = BANDS[i % BANDS.length]
        const price = formatPrice(plan)
        const sp = price.indexOf(" ")
        const currency = sp > 0 ? price.slice(0, sp) : ""
        const amount = sp > 0 ? price.slice(sp + 1) : price
        const speed = plan.download_speed ? `${plan.download_speed} ${plan.speed_unit || "Mbps"}` : plan.speed_display || "—"
        const data = plan.limitation_type !== "UNLIMITED" && plan.data_limit_value ? plan.data_limit_display : "Unlimited"
        const devices = plan.simultaneous_devices && plan.simultaneous_devices > 0 ? String(plan.simultaneous_devices) : "1"
        const fields = [
          { label: "Duration", value: plan.duration_display },
          hideSpeed ? { label: "Data", value: data } : { label: "Speed", value: speed },
          { label: "Devices", value: devices },
        ]
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onPay(plan)}
            aria-label={`${plan.name}, ${price}, ${plan.duration_display}`}
            className="group relative flex w-full overflow-hidden rounded-2xl bg-white text-left shadow-[0_10px_30px_-12px_rgba(19,41,75,0.35)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13294b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7edf5]"
          >
            {/* Main ticket */}
            <div className="min-w-0 flex-1">
              <div className={`flex items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white ${c.band}`}>
                <span className="truncate">{carrier}</span>
                <span className="shrink-0 pl-2">{plan.is_popular ? "★ Priority" : `Gate ${String(i + 1).padStart(2, "0")}`}</span>
              </div>

              <div className="px-4 pb-3 pt-3">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-2xl font-bold leading-none tracking-tight text-slate-900">OFF</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Offline</p>
                  </div>
                  <div className="relative mx-1 flex flex-1 items-center" aria-hidden="true">
                    <span className="h-px w-full border-t-2 border-dashed border-slate-300" />
                    <Plane className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white transition-transform duration-500 group-hover:translate-x-3 ${c.ink}`} />
                  </div>
                  <div className="text-right">
                    <p className={`font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-2xl font-bold leading-none tracking-tight ${c.ink}`}>ON</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Online</p>
                  </div>
                </div>

                <p className="mt-3 truncate text-sm font-semibold text-slate-900">{plan.name}</p>

                <dl className="mt-2 grid grid-cols-3 gap-2">
                  {fields.map((f) => (
                    <div key={f.label} className="min-w-0">
                      <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{f.label}</dt>
                      <dd className="truncate font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-xs font-bold text-slate-800">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Perforation with notches cut out at top and bottom */}
            <div className="relative w-0 border-l-2 border-dashed border-slate-200" aria-hidden="true">
              <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full" style={{ backgroundColor: PASS_PAGE_BG }} />
              <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full" style={{ backgroundColor: PASS_PAGE_BG }} />
            </div>

            {/* Fare stub */}
            <div className="flex w-[92px] shrink-0 flex-col items-center justify-between bg-slate-50 px-2 py-3 text-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Fare</span>
              <span className="leading-none">
                {currency && <span className="block text-[10px] font-semibold uppercase text-slate-500">{currency}</span>}
                <span className={`block font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] font-bold tracking-tight ${c.ink} ${amount.length > 5 ? "text-lg" : "text-2xl"}`}>{amount}</span>
              </span>
              {/* Barcode */}
              <span
                aria-hidden="true"
                className="mt-1 block h-6 w-[68px] opacity-80"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg,#0f172a 0 2px,transparent 2px 3px,#0f172a 3px 4px,transparent 4px 6px,#0f172a 6px 9px,transparent 9px 10px)",
                }}
              />
              <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${c.stub}`}>Board</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
