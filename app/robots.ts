import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
    ],
    sitemap: "https://netily.co.ke/sitemap.xml",
    host: "https://netily.co.ke",
  }
}
