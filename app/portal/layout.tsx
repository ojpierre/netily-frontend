import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "WiFi Portal",
  description: "Connect to WiFi — powered by Netily",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/**
 * Portal Layout — No sidebar, no auth, no header.
 * These pages are shown to WiFi captive portal users on their phones.
 * Must be as lightweight and fast-loading as possible.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
