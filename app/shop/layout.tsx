import type { Metadata } from "next"
import type React from "react"
import { Urbanist } from "next/font/google"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-shop-urbanist",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Internetily Shop | ISP Hardware and Network Equipment",
  description:
    "Shop ISP-ready routers, PoE switches, fiber tools, wireless backhaul equipment, racks, and cabling for growing internet providers.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${urbanist.variable} font-[var(--font-shop-urbanist)]`}>
      {children}
    </div>
  )
}
