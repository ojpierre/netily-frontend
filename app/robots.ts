import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default crawlers ────────────────────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/superadmin/",
          "/customer/",
          "/hotspot/",
          "/portal/",
          "/api/",
        ],
      },
      // ── AI / LLM crawlers — explicitly allowed on all public pages ──────────
      // OpenAI / ChatGPT
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      // Google Gemini / AI Overviews
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      // Anthropic / Claude
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/" },
      // Meta AI
      { userAgent: "Meta-ExternalAgent", allow: "/" },
      { userAgent: "Meta-ExternalFetcher", allow: "/" },
      // Microsoft Copilot / Bing
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "msnbot", allow: "/" },
      // Cohere
      { userAgent: "cohere-ai", allow: "/" },
      // You.com
      { userAgent: "YouBot", allow: "/" },
      // Bytespider (ByteDance/TikTok AI)
      { userAgent: "Bytespider", allow: "/" },
      // Common LLM training / index crawlers
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "DataForSeoBot", allow: "/" },
      { userAgent: "ImagesiftBot", allow: "/" },
      { userAgent: "omgili", allow: "/" },
    ],
    sitemap: "https://netily.co.ke/sitemap.xml",
    host: "https://netily.co.ke",
  }
}
