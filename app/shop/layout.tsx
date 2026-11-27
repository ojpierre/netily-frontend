import type { Metadata } from "next"
import type React from "react"
import { Playfair_Display, Urbanist } from "next/font/google"
import { Toaster } from "sonner"
import { CartProvider } from "@/shop-ui/lib/cart-context"
import { SmoothScrollProvider } from "@/shop-ui/components/smooth-scroll-provider"
import { ShopSupportChat } from "@/shop-ui/components/shop-support-chat"

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
  title: { absolute: "Internetily Shop | ISP Hardware and Network Equipment" },
  description:
    "Shop ISP-ready routers, PoE switches, fiber tools, wireless backhaul equipment, racks, and cabling for growing internet providers.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const shopTheme = {
    "--background": "#ffffff",
    "--foreground": "#17252d",
    "--card": "#ffffff",
    "--card-foreground": "#17252d",
    "--popover": "#ffffff",
    "--popover-foreground": "#17252d",
    "--primary": "#17252d",
    "--primary-foreground": "#ffffff",
    "--secondary": "#f3f7f8",
    "--secondary-foreground": "#17252d",
    "--muted": "#f3f7f8",
    "--muted-foreground": "#56656f",
    "--accent": "#f3f7f8",
    "--accent-foreground": "#17252d",
    "--border": "#dce4e8",
    "--input": "#dce4e8",
    "--ring": "#0874cf",
    "--radius": "0.75rem",
    fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
  } as React.CSSProperties

  return (
    <div
      className={`${urbanist.variable} ${playfair.variable} bg-background text-foreground font-sans antialiased`}
      style={shopTheme}
    >
      <CartProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <ShopSupportChat />
      </CartProvider>
      <Toaster position="bottom-right" richColors theme="light" />
    </div>
  )
}
