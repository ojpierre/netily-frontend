import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "./auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { NavigationProgress } from "@/components/navigation-progress"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Netily — ISP Management Platform | Billing, M-Pesa & MikroTik Automation for Kenya",
    template: "%s | Netily",
  },
  description:
    "Netily is Kenya's leading ISP management platform. Automate billing, M-Pesa STK Push payments, MikroTik router provisioning, hotspot management, and customer self-service. Built for Kenyan & East African ISPs.",
  keywords: [
    "ISP management software Kenya",
    "ISP billing system",
    "M-Pesa ISP payments",
    "MikroTik automation",
    "hotspot management Kenya",
    "PPPoE billing software",
    "internet service provider software",
    "ISP management platform Africa",
    "automated ISP billing",
    "RADIUS authentication Kenya",
    "Netily",
    "ISP software East Africa",
    "WiFi hotspot billing",
    "captive portal Kenya",
    "ISP customer management",
    "bandwidth management software",
    "internet billing Kenya",
    "STK push integration",
    "ISP solutions Nairobi",
    "fiber ISP management",
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
      <body className={`${geist.className} ${geistMono.className}`} suppressHydrationWarning>
        <NavigationProgress />
        <AuthProvider>
          <AuthGuard>
            {children}
            <Toaster />
          </AuthGuard>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}