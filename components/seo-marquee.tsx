"use client"

import { motion } from "framer-motion"

const keywords = [
  "MikroTik Auto-Provisioning",
  "M-Pesa STK Push",
  "Hotspot Billing",
  "PPPoE Management",
  "Automated Suspensions",
  "Custom Invoicing",
  "Client Portal",
  "Ticketing System",
  "Real-time Analytics",
  "RADIUS Server",
  "Bandwidth Control",
  "Network Topology",
]

export function SeoMarquee() {
  return (
    <div className="relative flex w-full overflow-hidden bg-slate-50 dark:bg-slate-900/50 py-6 border-y border-slate-200 dark:border-slate-800">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />

      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 35,
        }}
      >
        {/* Duplicate array to create infinite seamless loop */}
        {[...keywords, ...keywords].map((keyword, idx) => (
          <span
            key={idx}
            className="mx-8 text-lg font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest"
          >
            {keyword}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
