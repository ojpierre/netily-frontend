import type { Metadata } from "next"
import type React from "react"
import { Playfair_Display, Urbanist } from "next/font/google"
import { Toaster } from "sonner"
import { CartProvider } from "@/shop-ui/lib/cart-context"
import { SmoothScrollProvider } from "@/shop-ui/components/smooth-scroll-provider"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Internetily Shop | ISP Hardware and Network Equipment",
  description:
    "Shop ISP-ready routers, PoE switches, fiber tools, wireless backhaul equipment, racks, and cabling for growing internet providers.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const shopTheme = {
    "--background": "#f9f9f9",
    "--foreground": "#0a0a0a",
    "--card": "#f9f9f9",
    "--card-foreground": "#0a0a0a",
    "--popover": "#f9f9f9",
    "--popover-foreground": "#0a0a0a",
    "--primary": "#0a0a0a",
    "--primary-foreground": "#f9f9f9",
    "--secondary": "#f9f9f9",
    "--secondary-foreground": "#0a0a0a",
    "--muted": "#f5f5f5",
    "--muted-foreground": "#6b7280",
    "--accent": "#f5f5f5",
    "--accent-foreground": "#0a0a0a",
    "--border": "#e5e5e5",
    "--input": "#e5e5e5",
    "--ring": "#6b7280",
    "--radius": "0rem",
  } as React.CSSProperties

  return (
    <div
      className={`${urbanist.variable} ${playfair.variable} bg-background text-foreground font-sans antialiased`}
      style={shopTheme}
    >
      <CartProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </CartProvider>
      <Toaster position="bottom-right" richColors theme="light" />
    </div>
  )
}
