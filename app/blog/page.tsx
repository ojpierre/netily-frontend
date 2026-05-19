import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { blogPosts } from "@/lib/blog-data"
import BlogLeadModal from "@/components/blog-lead-modal"

export const metadata: Metadata = {
  title: "ISP Billing & Management Blog — Guides for Kenyan ISPs | Netily",
  description:
    "Expert guides on ISP billing software, MikroTik automation, M-Pesa integration, and ISP management for Kenya and East Africa. Written by ISP specialists.",
  keywords: [
    "isp billing software kenya blog",
    "isp management guides kenya",
    "mikrotik isp billing guide",
    "m-pesa isp integration guide",
    "isp billing software comparison",
    "kenyan isp resources",
  ],
  alternates: {
    canonical: "https://netily.co.ke/blog",
  },
  openGraph: {
    title: "ISP Billing & Management Blog | Netily",
    description: "Expert guides on ISP billing, MikroTik automation, and M-Pesa integration for Kenyan ISPs.",
    url: "https://netily.co.ke/blog",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Netily Blog" }],
  },
}

const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  blue: { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dot: "bg-blue-500" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500" },
  orange: { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", dot: "bg-orange-500" },
  purple: { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", dot: "bg-purple-500" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Netily
            </Link>
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              Netily Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
              Guides for Kenyan ISP Owners
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              In-depth guides on ISP billing software, MikroTik automation, M-Pesa integration, and growing your internet
              service provider business in Kenya and East Africa.
            </p>
          </div>
        </div>
      </div>

      {/* ── Posts grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => {
            const colors = CATEGORY_COLORS[post.categoryColor] ?? CATEGORY_COLORS.blue
            return (
              <article
                key={post.slug}
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient hero */}
                <div className={`h-44 bg-gradient-to-br ${post.coverGradient} relative overflow-hidden flex items-end p-5`}>
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-70 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-slate-900/10" />
                  <span className={`relative inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-white`} />
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readTime} min read</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                    {post.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colors.badge}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Author row + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${post.author.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {post.author.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                          {post.author.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{post.author.role}</p>
                      </div>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
                      aria-label={`Read ${post.title}`}
                    >
                      Read more
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* CTA strip */}
        <div className="mt-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Run a Better ISP</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Get started with Netily — ISP billing software built for Kenya and East Africa. M-Pesa
            native, MikroTik integrated. We onboard you personally.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <BlogLeadModal
              triggerLabel="Get in Touch"
              triggerClassName="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            />
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold text-sm px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
