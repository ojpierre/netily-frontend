"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"

interface AccordionItem {
  title: string
  content: string[]
}

interface ProductDetailsAccordionProps {
  items: AccordionItem[]
}

export function ProductDetailsAccordion({ items }: ProductDetailsAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="divide-y divide-muted">
      {items.map((item, index) => (
        <div key={index} className="py-4">
          <button onClick={() => toggle(index)} className="flex items-center justify-between w-full text-left">
            <span className="text-sm tracking-widest uppercase">{item.title}</span>
            {openIndex === index ? (
              <Minus className="w-4 h-4" strokeWidth={1} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={1} />
            )}
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ul className="pt-4 space-y-2">
                  {item.content.map((line, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
