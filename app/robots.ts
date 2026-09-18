import type { MetadataRoute } from "next"

// Advertise public content and rendering assets without listing private routes.
const publicPages = ["/", "/blog", "/alternatives", "/docs", "/solutions", "/compare", "/demo", "/privacy", "/terms", "/affiliate", "/affiliate/register"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
      allow: [
        ...publicPages.flatMap((path) => [`${path}$`, `${path}?*`]),
        "/blog/", "/alternatives/", "/docs/", "/solutions/", "/compare/",
        "/_next/", "/images/", "/icons/", "/payments-logos/",
        "/internetily", "/video-", "/favicon", "/icon", "/apple-icon",
        "/og-image.svg", "/manifest.json", "/sw.js", "/llms.txt", "/netily-docs.md",
        "/sitemap.xml$", "/sitemap-index.xml$", "/sitemap-gsc.xml$",
        "/.well-known/security.txt$",
      ],
    },
    sitemap: "https://netily.co.ke/sitemap-index.xml",
    host: "https://netily.co.ke",
  }
}
