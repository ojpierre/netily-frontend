// app/api/manifest/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const hostname = host.split(":")[0]

  // Derive tenant subdomain (e.g. "jelda" from jelda.netily.co.ke)
  const parts = hostname.split(".")
  const isTenantSubdomain = parts.length >= 3 && !["www", "api"].includes(parts[0])
  const rawName = isTenantSubdomain ? parts[0] : "Netily"
  const appName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const manifest = {
    name: `${appName} - ISP Dashboard`,
    short_name: appName,
    description: `${appName} admin dashboard powered by Netily`,
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}