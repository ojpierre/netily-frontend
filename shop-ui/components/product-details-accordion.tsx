"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { HEADING_FONT } from "@/shop-ui/lib/shop-helpers"

interface AccordionItem {
  title: string
  content: string[]
}

export function ProductDetailsAccordion({ items, defaultOpen = 0 }: { items: AccordionItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen)
  const visible = items.filter((i) => i.content.length > 0)
  return (
    <div className="divide-y divide-[#dce4e8] rounded-xl border border-[#dce4e8] bg-white">
      {visible.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.title}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`pd-panel-${i}`}
                id={`pd-btn-${i}`}
                className={`${HEADING_FONT} flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[15px] font-semibold text-[#17252d] outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0874cf]`}
              >
                {item.title}
                <ChevronDown className={`h-4 w-4 shrink-0 text-[#56656f] transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </h3>
            <div id={`pd-panel-${i}`} role="region" aria-labelledby={`pd-btn-${i}`} hidden={!isOpen}>
              <ul className="space-y-2 px-4 pb-4 text-sm leading-6 text-[#56656f]">
                {item.content.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0874cf]" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
