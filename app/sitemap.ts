import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-data"
import { publicAlternativePages } from "@/lib/alternatives-data"

const BASE = "https://netily.co.ke"
const solutionSlugs = [
  "isp-billing-software-kenya",
  "hotspot-billing-software-kenya",
  "mikrotik-billing-software",
  "mpesa-isp-billing",
  "isp-billing-software-uganda",
  "isp-billing-software-tanzania",
  "isp-billing-software-south-africa",
  "isp-billing-software-united-kingdom",
  "isp-billing-software-usa",
  "isp-billing-software-australia",
  "isp-billing-software-new-zealand",
  "isp-billing-software-rwanda",
  "isp-billing-software-burundi",
  "isp-billing-software-south-sudan",
  "isp-billing-software-nairobi",
  "isp-billing-software-mombasa",
  "isp-billing-software-kisumu",
  "isp-billing-software-eldoret",
  "isp-billing-software-nakuru",
  "isp-billing-software-kenya-counties",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const alternativeEntries: MetadataRoute.Sitemap = publicAlternativePages.map((page) => ({
    url: `${BASE}/alternatives/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.82,
  }))

  const solutionEntries: MetadataRoute.Sitemap = solutionSlugs.map((slug) => ({
    url: `${BASE}/solutions/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.84,
  }))

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/alternatives`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${BASE}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...blogEntries,
    ...alternativeEntries,
    ...solutionEntries,
    {
      url: `${BASE}/affiliate`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/affiliate/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/compare/splynx`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE}/compare/platypus`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE}/blog/isp-billing-software-nigeria`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ]
}
