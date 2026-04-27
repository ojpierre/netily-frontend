import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import Script from "next/script"
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
    // ── Core product ──────────────────────────────────
    "ISP management software Kenya 2026",
    "ISP billing system Kenya",
    "ISP management platform Africa",
    "internet service provider software Kenya",
    "ISP SaaS platform East Africa",
    "best ISP billing software Kenya",
    "ISP software for small ISPs Kenya",
    "affordable ISP management Kenya",
    "ISP automation platform Kenya",
    "ISP operations software East Africa",
    "cloud-based ISP billing Kenya",
    "ISP management dashboard Kenya",
    // ── Exact-match Ahrefs targets ────────────────────
    "isp billing software",
    "isp billing software kenya",
    "isp billing software free",
    "free isp billing software",
    "best isp billing software",
    "open source isp billing software",
    "isp billing software mikrotik",
    "mikrotik isp billing software",
    "wireless isp billing software",
    "isp billing software open source",
    "isp billing software india",
    "isp billing software github",
    "isp management system",
    "isp management software",
    "isp management software free",
    "free isp management software",
    "free isp management system",
    "best isp management software",
    "open source isp management software",
    "isp management system php",
    "isp management system github",
    "radius isp management system",
    "isp management system with mikrotik api",
    "mikrotik isp management software",
    "isp management",
    // ── M-Pesa & Payments ─────────────────────────────
    "M-Pesa ISP billing automation",
    "M-Pesa STK push integration",
    "automated ISP billing M-Pesa",
    "mpesa internet payments Kenya",
    "Safaricom Daraja API ISP",
    "M-Pesa paybill internet provider",
    "M-Pesa till number ISP billing",
    "automatic M-Pesa reconciliation ISP",
    "internet subscription M-Pesa payment",
    "PayHero ISP integration",
    "ISP payment automation Kenya",
    "online payment ISP Kenya",
    // ── MikroTik & Network ────────────────────────────
    "MikroTik automation Kenya",
    "MikroTik PPPoE billing software",
    "MikroTik RouterOS API integration",
    "MikroTik PPPoE auto-provisioning",
    "MikroTik zero-touch provisioning",
    "MikroTik subscriber management",
    "MikroTik bandwidth control software",
    "MikroTik ISP management tool",
    "PPPoE billing Kenya",
    "PPPoE auto-suspend Kenya",
    "MikroTik hotspot billing Kenya",
    // ── Hotspot & Captive Portal ──────────────────────
    "hotspot management system Kenya",
    "captive portal billing Kenya",
    "WiFi hotspot billing software",
    "hotspot billing solution Africa",
    "branded captive portal Kenya",
    "WiFi voucher management Kenya",
    "hotspot session management software",
    "captive portal M-Pesa payment",
    "public WiFi billing Kenya",
    "hotel WiFi billing system Kenya",
    "school WiFi management Kenya",
    // ── RADIUS ────────────────────────────────────────
    "RADIUS authentication platform",
    "FreeRADIUS management Kenya",
    "RADIUS server Kenya ISP",
    "RADIUS billing software",
    "cloud RADIUS Kenya",
    // ── Fiber ISPs ────────────────────────────────────
    "fiber ISP billing software Kenya",
    "fiber internet billing automation",
    "fiber broadband subscriber management",
    "fiber ISP management platform Kenya",
    // ── WISPs & Rural ─────────────────────────────────
    "WISP billing software Kenya",
    "rural ISP management Kenya",
    "wireless ISP billing system Kenya",
    "affordable WISP billing Africa",
    // ── Customer Portal ───────────────────────────────
    "ISP customer self-service portal",
    "subscriber self-service portal Kenya",
    "ISP customer portal Kenya",
    "ISP subscriber portal M-Pesa",
    "PPPoE client portal Kenya",
    // ── Automation & Operations ───────────────────────
    "automated fiber ISP billing",
    "ISP bandwidth management software",
    "ISP auto-provisioning Kenya",
    "ISP invoice automation Kenya",
    "ISP revenue management Kenya",
    "ISP churn reduction software",
    "ISP subscription management Kenya",
    "AI-powered ISP billing Kenya",
    "cloud ISP management platform",
    "ISP analytics dashboard Kenya",
    // ── Location-specific ─────────────────────────────
    "Nairobi ISP software",
    "Mombasa ISP billing system",
    "Kisumu internet provider software",
    "Nakuru ISP management software",
    "Eldoret internet provider billing",
    "Kenya broadband billing system",
    "Tanzania ISP billing software",
    "Uganda ISP management platform",
    "Rwanda internet billing software",
    "East Africa ISP SaaS",
    "affordable ISP billing software Africa",
    // ── Messaging & Notifications ─────────────────────
    "ISP SMS notifications Kenya",
    "ISP payment reminder SMS",
    "bulk SMS internet provider Kenya",
    // ── Brand ─────────────────────────────────────────
    "Netily",
    "Netily ISP platform",
    "Netily billing software",
    "Netily Kenya",
  ],
  authors: [{ name: "Netily", url: "https://netily.co.ke" }],
  creator: "Netily",
  publisher: "Netily",
  metadataBase: new URL("https://netily.co.ke"),
  // NOTE: Do NOT set alternates.canonical here — each page sets its own canonical.
  // A layout-level canonical would apply the same URL to every route.
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
        url: "/og-image.svg",
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
    images: ["/og-image.svg"],
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
    apple: "/apple-icon.svg",
    shortcut: "/favicon.svg",
  },
  verification: {
    google: "JmnoOQB07DNEMx_AykZvg-6Uag8fmxSiXvxT69RpHNY",
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Nairobi",
    "geo.position": "-1.286389;36.817223",
    "ICBM": "-1.286389, 36.817223",
    // LLM / AI crawler discovery — points to llms.txt
    "llms": "https://netily.co.ke/llms.txt",
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
        {/* ── Google Analytics ── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-55Q1Q3H14M"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-55Q1Q3H14M');
          `}
        </Script>
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