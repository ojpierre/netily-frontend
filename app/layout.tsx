import type React from "react"
import type { Metadata } from "next"
import {
  IBM_Plex_Sans,
  Inter,
  Lato,
  Montserrat,
  Open_Sans,
  Outfit,
  Roboto,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google"
import Script from "next/script"
import { AuthProvider } from "./auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { NavigationProgress } from "@/components/navigation-progress"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { APPEARANCE_FONT_STORAGE_KEY, DEFAULT_APPEARANCE_FONT } from "@/lib/appearance-fonts"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap" })
const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-lato", display: "swap" })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" })
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3", display: "swap" })
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

const fontVariables = [
  outfit.variable,
  montserrat.variable,
  spaceGrotesk.variable,
  inter.variable,
  roboto.variable,
  lato.variable,
  openSans.variable,
  sourceSans3.variable,
  ibmPlexSans.variable,
].join(" ")

export const metadata: Metadata = {
  title: {
    default: "Internetily, formerly Netily - ISP Management Platform | Billing, M-Pesa & MikroTik Automation for Kenya",
    template: "%s | Internetily",
  },
  description:
    "Internetily, formerly Netily, is Kenya's ISP management platform. Automate billing, M-Pesa STK Push payments, MikroTik router provisioning, hotspot management, and customer self-service. Built for Kenyan & East African ISPs.",
  keywords: [
    // â”€â”€ Core product â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "ISP management software Kenya 2026",
    "ISP Billing Software Kenya",
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
    // â”€â”€ Exact-match Ahrefs targets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // â”€â”€ M-Pesa & Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // â”€â”€ MikroTik & Network â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // â”€â”€ Hotspot & Captive Portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // â”€â”€ RADIUS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "RADIUS authentication platform",
    "FreeRADIUS management Kenya",
    "RADIUS server Kenya ISP",
    "RADIUS billing software",
    "cloud RADIUS Kenya",
    // â”€â”€ Fiber ISPs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "fiber ISP billing software Kenya",
    "fiber internet billing automation",
    "fiber broadband subscriber management",
    "fiber ISP management platform Kenya",
    // â”€â”€ WISPs & Rural â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "WISP billing software Kenya",
    "rural ISP management Kenya",
    "wireless ISP billing system Kenya",
    "affordable WISP billing Africa",
    // â”€â”€ Customer Portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "ISP customer self-service portal",
    "subscriber self-service portal Kenya",
    "ISP customer portal Kenya",
    "ISP subscriber portal M-Pesa",
    "PPPoE client portal Kenya",
    // â”€â”€ Automation & Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "automated fiber ISP billing",
    "ISP bandwidth management software",
    "ISP auto-provisioning Kenya",
    "ISP invoice automation Kenya",
    "ISP revenue management Kenya",
    "ISP churn reduction software",
    "ISP subscription management Kenya",
    "ISP lead generation software Kenya",
    "ISP growth marketing platform Kenya",
    "ISP staff role management",
    "ISP dashboard themes",
    "ISP role based access control Kenya",
    "AI-powered ISP billing Kenya",
    "cloud ISP management platform",
    "ISP analytics dashboard Kenya",
    // â”€â”€ Location-specific â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "Nairobi ISP software",
    "Nairobi enterprise ISP billing",
    "Nairobi co-working WiFi billing",
    "Nairobi hotel WiFi billing",
    "Mombasa ISP billing system",
    "Mombasa tourist hotel WiFi billing",
    "Mombasa beach resort WiFi billing",
    "Mombasa apartment internet billing",
    "Kisumu internet provider software",
    "Kisumu WISP billing software",
    "Kisumu student hostel WiFi billing",
    "Nakuru ISP management software",
    "Nakuru shopping mall WiFi billing",
    "Nakuru residential complex internet billing",
    "Eldoret internet provider billing",
    "Eldoret agricultural business internet billing",
    "Eldoret retail chain WiFi billing",
    "ISP billing software all Kenya counties",
    "county ISP billing software Kenya",
    "rural WISP billing Kenya",
    "estate WiFi billing Kenya",
    "apartment WiFi billing Kenya",
    "hotel captive portal billing Kenya",
    "Kenya broadband billing system",
    "Tanzania ISP billing software",
    "Uganda ISP management platform",
    "Rwanda internet billing software",
    "Burundi ISP billing software",
    "South Sudan ISP billing software",
    "ISP billing software Uganda",
    "ISP billing software Tanzania",
    "ISP billing software Rwanda",
    "ISP billing software Burundi",
    "ISP billing software South Sudan",
    "WISP billing software Uganda",
    "WISP billing software Tanzania",
    "hotspot billing software Uganda",
    "hotspot billing software Tanzania",
    "East Africa ISP SaaS",
    "affordable ISP billing software Africa",
    // â”€â”€ Messaging & Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "ISP SMS notifications Kenya",
    "ISP payment reminder SMS",
    "bulk SMS internet provider Kenya",
    "automated SMS expiry reminder ISP",
    // â”€â”€ Buyer evaluation terms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "ISP billing software comparison Kenya",
    "ISP management software evaluation Kenya",
    "local ISP billing tool comparison Kenya",
    "affordable ISP billing software Africa",
    "ISP billing platform evaluation 2026",
    // â”€â”€ 2026-specific emerging tech â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "isp billing software 2026",
    "isp management platform 2026",
    "ai-powered isp billing kenya 2026",
    "machine learning isp analytics 2026",
    "predictive isp billing 2026",
    "isp automation software 2026",
    "cloud-native isp platform 2026",
    "next-generation isp billing 2026",
    "smart isp management 2026",
    "isp digital transformation 2026",
    "isp revenue optimization 2026",
    "isp business intelligence 2026",
    "modern isp stack 2026",
    "isp saas platform 2026",
    "api-first isp billing 2026",
    "microservices isp architecture 2026",
    "serverless isp billing 2026",
    "kubernetes isp deployment 2026",
    "docker isp platform 2026",
    "isp devops automation 2026",
    "5g isp billing kenya 2026",
    "starlink isp integration kenya 2026",
    "fiber 2026 isp billing kenya",
    "isp billing trends 2026",
    "best isp software 2026 kenya",
    // â”€â”€ Vertical / use-case â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "school WiFi billing software Kenya",
    "hotel WiFi billing system",
    "matatu WiFi billing Kenya",
    "apartment building WiFi billing Kenya",
    "estate WiFi management Kenya",
    "fiber to the home billing Kenya",
    "FTTH billing software Kenya",
    "fixed wireless access billing Kenya",
    // â”€â”€ Long-tail operational â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "how to automate ISP billing Kenya",
    "ISP billing software with M-Pesa integration",
    "PPPoE subscriber management software",
    "mikrotik pppoe auto suspend on expiry",
    "radius server billing software Kenya",
    "mikrotik hotspot billing with mpesa",
    "automated internet billing system Kenya",
    "ISP reconciliation software M-Pesa",
    // â”€â”€ More cities/regions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "Thika ISP billing software",
    "Machakos ISP management",
    "Nyeri ISP billing system",
    "Kampala ISP billing software",
    "Dar es Salaam ISP billing",
    "Kigali ISP management software",
    // â”€â”€ Brand â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    "Internetily",
    "Internetily ISP platform",
    "Internetily billing software",
    "Internetily Kenya",
    "Internetily formerly Netily",
    "Netily now Internetily",
    "Internetily Netily",
    "Internetily M-Pesa billing",
    "Internetily MikroTik integration",
    "Internetily hotspot billing",
    "Netily",
    "Netily ISP platform",
    "Netily billing software",
    "Netily Kenya",
    "Netily vs Splynx",
    "Netily hotspot billing",
    "Netily MikroTik integration",
  ],
  authors: [{ name: "Internetily (formerly Netily)", url: "https://netily.co.ke" }],
  creator: "Internetily",
  publisher: "Internetily",
  metadataBase: new URL("https://netily.co.ke"),
  // NOTE: Do NOT set alternates.canonical here â€” each page sets its own canonical.
  // A layout-level canonical would apply the same URL to every route.
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://netily.co.ke",
    siteName: "Internetily, formerly Netily",
    title: "Internetily, formerly Netily - ISP Management Platform | Billing & MikroTik Automation",
    description:
      "Internetily, formerly Netily, automates ISP billing, M-Pesa payments, MikroTik provisioning, and hotspot management for Kenyan & East African ISPs.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Internetily, formerly Netily - ISP Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Internetily, formerly Netily - ISP Management Platform",
    description:
      "Automate ISP billing, M-Pesa payments, and MikroTik provisioning. Internetily continues the Netily platform for Kenyan ISPs.",
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
        url: "/internetily-icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/internetily-icon-192.png",
    shortcut: "/internetily-icon-32.png",
  },
  verification: {
    google: "JmnoOQB07DNEMx_AykZvg-6Uag8fmxSiXvxT69RpHNY",
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Nairobi",
    "geo.position": "-1.286389;36.817223",
    "ICBM": "-1.286389, 36.817223",
    // LLM / AI crawler discovery â€” points to llms.txt
    "llms": "https://netily.co.ke/llms.txt",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableVercelAnalytics =
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true" || process.env.VERCEL === "1"

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Internetily" />
        <link rel="apple-touch-icon" href="/internetily-icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const colorTheme = localStorage.getItem('netily-color-theme');
                if (colorTheme) {
                  document.documentElement.setAttribute('data-theme', colorTheme);
                }
                const font = localStorage.getItem('${APPEARANCE_FONT_STORAGE_KEY}') || '${DEFAULT_APPEARANCE_FONT}';
                document.documentElement.setAttribute('data-font', font);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={fontVariables} suppressHydrationWarning>
        {/* â”€â”€ Google Analytics â”€â”€ */}
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NavigationProgress />
          <AuthProvider>
            <AuthGuard>
              {children}
              <Toaster />
            </AuthGuard>
          </AuthProvider>
          {enableVercelAnalytics ? <Analytics /> : null}
        </ThemeProvider>
      </body>
    </html>
  )
}
