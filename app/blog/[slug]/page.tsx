import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBlogPost, getRelatedPosts, blogPosts, type ContentBlock } from "@/lib/blog-data"

// ─── Static params for build-time generation ──────────────────────────────
export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

// ─── Per-page metadata ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: post.author.name }],
    alternates: { canonical: `https://netily.co.ke/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://netily.co.ke/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: ["/og-image.svg"],
    },
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
}

const CATEGORY_COLORS: Record<string, { badge: string }> = {
  blue: { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  orange: { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  purple: { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
}

// ─── Content block renderer ────────────────────────────────────────────────

function ContentRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          id={block.id}
          className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-12 mb-5 scroll-mt-24"
        >
          {block.text}
        </h2>
      )

    case "h3":
      return (
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-3">
          {block.text}
        </h3>
      )

    case "p":
      return (
        // eslint-disable-next-line react/no-danger -- static authored content, not user input
        <p
          className="text-base md:text-[17px] text-slate-700 dark:text-slate-300 leading-relaxed mb-5"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )

    case "ul":
      return (
        <ul className="space-y-2.5 mb-6 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
              <span className="mt-1.5 w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {/* eslint-disable-next-line react/no-danger */}
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      )

    case "ol":
      return (
        <ol className="space-y-3 mb-6 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
              <span className="mt-0.5 w-6 h-6 flex-shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {/* eslint-disable-next-line react/no-danger */}
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ol>
      )

    case "table":
      return (
        <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/50"}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 align-top"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "callout": {
      const styles = {
        tip: {
          wrap: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          icon: "text-emerald-600 dark:text-emerald-400",
          title: "text-emerald-800 dark:text-emerald-300",
          text: "text-emerald-700 dark:text-emerald-400",
          path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        info: {
          wrap: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-800 dark:text-blue-300",
          text: "text-blue-700 dark:text-blue-400",
          path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        warning: {
          wrap: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
          icon: "text-amber-600 dark:text-amber-400",
          title: "text-amber-800 dark:text-amber-300",
          text: "text-amber-700 dark:text-amber-400",
          path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
        },
      }[block.variant]

      return (
        <div className={`flex gap-4 border rounded-xl p-5 my-6 ${styles.wrap}`}>
          <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.path} />
          </svg>
          <div>
            <p className={`text-sm font-bold mb-1 ${styles.title}`}>{block.title}</p>
            <p className={`text-sm leading-relaxed ${styles.text}`}>{block.text}</p>
          </div>
        </div>
      )
    }

    case "hr":
      return <hr className="my-10 border-slate-200 dark:border-slate-800" />

    case "cta":
      return (
        <div className="my-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3">Ready to automate your ISP?</p>
          <h3 className="text-2xl font-extrabold mb-3">Try Netily Free for 14 Days</h3>
          <p className="text-blue-100 text-sm mb-7 max-w-md mx-auto">
            M-Pesa STK Push, MikroTik PPPoE provisioning, RADIUS, and customer portal — all set up in under 24 hours. No
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Free Trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold text-sm px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )

    default:
      return null
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug)
  const colors = CATEGORY_COLORS[post.categoryColor] ?? CATEGORY_COLORS.blue

  // JSON-LD BlogPosting schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    url: `https://netily.co.ke/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
      url: "https://netily.co.ke",
    },
    publisher: {
      "@type": "Organization",
      name: "Netily",
      url: "https://netily.co.ke",
      logo: { "@type": "ImageObject", url: "https://netily.co.ke/logo.png" },
    },
    image: { "@type": "ImageObject", url: "https://netily.co.ke/og-image.svg", width: 1200, height: 630 },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "en-KE",
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://netily.co.ke/blog/${post.slug}` },
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* ── Article Hero ── */}
        <header className={`bg-gradient-to-br ${post.coverGradient} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 right-8 w-64 h-64 border-2 border-white/50 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 border-2 border-white/30 rounded-full" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-white">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/60 text-sm mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-white/80 truncate max-w-xs">{post.category}</span>
            </nav>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {post.category}
              </span>
              <span className="text-white/60 text-sm">{formatDate(post.publishedAt)}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60 text-sm">{post.readTime} min read</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-8">{post.excerpt}</p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${post.author.avatarBg} flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/30`}>
                {post.author.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{post.author.name}</p>
                <p className="text-xs text-white/60">{post.author.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Table of Contents — sticky sidebar on desktop */}
            {post.toc.length > 0 && (
              <aside className="lg:w-64 shrink-0 order-2 lg:order-1">
                <div className="lg:sticky lg:top-24">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                    Table of Contents
                  </p>
                  <nav className="space-y-1" aria-label="Article sections">
                    {post.toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 transition-colors leading-snug"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mt-2.5 shrink-0" />
                        {item.text}
                      </a>
                    ))}
                  </nav>

                  {/* Mini CTA in sidebar */}
                  <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">Try Netily Free</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">14-day trial. No credit card.</p>
                    <Link
                      href="/register"
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
                    >
                      Start Free Trial →
                    </Link>
                  </div>
                </div>
              </aside>
            )}

            {/* Article body */}
            <article className="order-1 lg:order-2 flex-1 min-w-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Content blocks */}
              {post.content.map((block, i) => (
                <ContentRenderer key={i} block={block} />
              ))}

              {/* Author bio */}
              <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Written by</p>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${post.author.avatarBg} flex items-center justify-center text-white text-lg font-bold shrink-0`}>
                    {post.author.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{post.author.name}</p>
                    <p className="text-sm text-slate-500 mb-2">{post.author.role} at Netily</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Peter Junior specialises in ISP billing software, MikroTik automation, and M-Pesa integration for
                      internet service providers in Kenya and East Africa. He writes about practical strategies for ISP
                      owners to automate operations and grow their subscriber base.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((rel) => {
                  const relColors = CATEGORY_COLORS[rel.categoryColor] ?? CATEGORY_COLORS.blue
                  return (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      className="group flex gap-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rel.coverGradient} shrink-0 flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${relColors.badge}`}>{rel.category}</span>
                        <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{rel.readTime} min read</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all articles
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
