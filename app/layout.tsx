import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { AuthProvider } from "./auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { NavigationProgress } from "@/components/navigation-progress"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: {
    default: "Netily — ISP Management Platform | Billing, M-Pesa & MikroTik Automation for Kenya",
    template: "%s | Netily",
  },
  description:
    "Netily is Kenya's leading ISP management platform. Automate billing, M-Pesa STK Push payments, MikroTik router provisioning, hotspot management, and customer self-service. Built for Kenyan & East African ISPs.",
  keywords: [
    // Core product — Kenya/EA ISP SaaS
    "ISP management software Kenya 2026",
    "ISP billing system Kenya",
    "ISP management platform Africa",
    "internet service provider software Kenya",
    "ISP SaaS platform East Africa",
    // Payments & integrations
    "M-Pesa ISP billing automation",
    "M-Pesa STK push integration",
    "automated ISP billing M-Pesa",
    "mpesa internet payments Kenya",
    // Router / network
    "MikroTik automation Kenya",
    "MikroTik PPPoE billing software",
    "hotspot management system Kenya",
    "captive portal billing Kenya",
    "WiFi hotspot billing software",
    "RADIUS authentication platform",
    // 2026 trending terms
    "AI-powered ISP billing Kenya",
    "cloud ISP management platform",
    "ISP customer self-service portal",
    "automated fiber ISP billing",
    "ISP bandwidth management software",
    "Nairobi ISP software",
    "Kenya broadband billing system",
    "affordable ISP billing software Africa",
    "ISP subscription management Kenya",
    // Brand
    "Netily",
    "Netily ISP platform",
  ],
  authors: [{ name: "Netily", url: "https://netily.co.ke" }],
  creator: "Netily",
  publisher: "Netily",
  metadataBase: new URL("https://netily.co.ke"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://netily.co.ke",
    siteName: "Netily",
    title: "Netily — ISP Management Platform | Billing & MikroTik Automation",
    description:
      "Automate your ISP billing, M-Pesa payments, MikroTik provisioning, and hotspot management. Built for Kenyan & East African ISPs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Netily — ISP Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Netily — ISP Management Platform",
    description:
      "Automate ISP billing, M-Pesa payments, and MikroTik provisioning. Built for Kenyan ISPs.",
    images: ["/og-image.png"],
    creator: "@netily",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  verification: {
    google: "JmnoOQB07DNEMx_AykZvg-6Uag8fmxSiXvxT69RpHNY",
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Nairobi",
    "geo.position": "-1.286389;36.817223",
    "ICBM": "-1.286389, 36.817223",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={outfit.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NavigationProgress />
          <AuthProvider>
            <AuthGuard>
              {children}
              <Toaster />
            </AuthGuard>
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}