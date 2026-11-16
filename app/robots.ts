import type { MetadataRoute } from "next"

// Advertise public content and rendering assets without listing private routes.
const publicPages = ["/", "/features", "/pricing", "/contact", "/resources", "/integrations", "/countries", "/academy", "/blog", "/case-studies", "/alternatives", "/docs", "/solutions", "/compare", "/demo", "/privacy", "/terms", "/affiliate", "/affiliate/register", "/faqs", "/one-year"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
      allow: [
        ...publicPages.flatMap((path) => [`${path}$`, `${path}?*`]),
        "/academy/", "/blog/", "/case-studies/", "/alternatives/", "/docs/", "/solutions/", "/compare/",
        "/features/", "/countries/",
        "/_next/", "/images/", "/icons/", "/payments-logos/", "/integrations/",
        "/internetily", "/video-", "/favicon", "/icon", "/apple-icon",
        "/og-image.svg", "/manifest.json", "/sw.js", "/llms.txt", "/netily-docs.md",
        "/sitemap.xml$", "/sitemap-index.xml$", "/sitemap-gsc.xml$",
        "/.well-known/security.txt$",
        "/ceb5d096574f3f8751f33f8f725ed9ed.txt$", // IndexNow key (scripts/indexnow.mjs)
      ],
    },
    sitemap: "https://netily.co.ke/sitemap-index.xml",
    host: "https://netily.co.ke",
  }
}
