import type { MetadataRoute } from "next"

const privateDisallow = [
  "/dashboard/",
  "/admin/",
  "/superadmin/",
  "/customer/",
  "/hotspot/",
  "/portal/",
  "/api/",
  "/affiliate/dashboard/",
  "/affiliate/referrals/",
  "/affiliate/analytics/",
  "/affiliate/payouts/",
  "/affiliate/marketing/",
  "/affiliate/payment-settings/",
  "/affiliate/tiers/",
  "/affiliate/guide/",
  "/affiliate/login",
  "/affiliate/verify",
  "/affiliate/admin-access",
]

const allowPublicOnly = (userAgent: string) => ({
  userAgent,
  allow: "/",
  disallow: privateDisallow,
})

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      allowPublicOnly("*"),
      allowPublicOnly("GPTBot"),
      allowPublicOnly("ChatGPT-User"),
      allowPublicOnly("OAI-SearchBot"),
      allowPublicOnly("Google-Extended"),
      allowPublicOnly("Googlebot"),
      allowPublicOnly("ClaudeBot"),
      allowPublicOnly("anthropic-ai"),
      allowPublicOnly("Claude-Web"),
      allowPublicOnly("PerplexityBot"),
      allowPublicOnly("Meta-ExternalAgent"),
      allowPublicOnly("Meta-ExternalFetcher"),
      allowPublicOnly("Bingbot"),
      allowPublicOnly("msnbot"),
      allowPublicOnly("cohere-ai"),
      allowPublicOnly("YouBot"),
      allowPublicOnly("Bytespider"),
      allowPublicOnly("CCBot"),
      allowPublicOnly("DataForSeoBot"),
      allowPublicOnly("ImagesiftBot"),
      allowPublicOnly("omgili"),
    ],
    sitemap: [
      "https://netily.co.ke/sitemap-index.xml",
      "https://netily.co.ke/sitemap.xml",
      "https://netily.co.ke/sitemap-gsc.xml",
    ],
    host: "https://netily.co.ke",
  }
}
