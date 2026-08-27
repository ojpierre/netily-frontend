import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getBlogPost, getRelatedPosts, blogPosts, type ContentBlock } from "@/lib/blog-data"
import BlogLeadModal from "@/components/blog-lead-modal"

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
      images: [{ url: post.coverImage, width: 1400, height: 933, alt: post.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.coverImage],
    },
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
}

function getAuthorBio(post: NonNullable<ReturnType<typeof getBlogPost>>) {
  return `${post.author.name} writes about practical ISP operations, billing automation, MikroTik workflows, and M-Pesa integration for internet service providers in Kenya and East Africa. The focus is helping ISP owners automate daily work, improve subscriber experience, and grow with clearer operating systems.`
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
          className="text-2xl md:text-3xl font-normal text-white mt-12 mb-5 scroll-mt-24"
        >
          {block.text}
        </h2>
      )

    case "h3":
      return (
        <h3 className="text-xl font-medium text-zinc-100 mt-8 mb-3">
          {block.text}
        </h3>
      )

    case "p":
      return (
        // eslint-disable-next-line react/no-danger -- static authored content, not user input
        <p
          className="text-base md:text-[17px] text-zinc-300 leading-relaxed mb-5"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )

    case "ul":
      return (
        <ul className="space-y-2.5 mb-6 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-zinc-300 text-base leading-relaxed">
              <span className="mt-1.5 w-5 h-5 flex-shrink-0 bg-amber-500/15 flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <li key={i} className="flex gap-3 text-zinc-300 text-base leading-relaxed">
              <span className="mt-0.5 w-6 h-6 flex-shrink-0 bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
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
        <div className="overflow-x-auto my-8 border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900">
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-800"
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
                  className={ri % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/70"}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-zinc-300 border-b border-zinc-800 align-top"
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
      return <hr className="my-10 border-zinc-800" />

    case "cta":
      return (
        <div className="my-10 border border-amber-500/30 bg-amber-500 p-8 text-black text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-3">Ready to automate your ISP?</p>
          <h3 className="text-2xl font-normal mb-3">Try Internetily Free for 14 Days</h3>
          <p className="text-black/70 text-sm mb-7 max-w-md mx-auto">
            M-Pesa STK Push, MikroTik PPPoE provisioning, RADIUS, and customer portal — all set up in under 24 hours. No
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <BlogLeadModal
              triggerLabel="Get in Touch"
              triggerClassName="inline-flex items-center gap-2 bg-black text-white font-semibold text-sm px-7 py-3 hover:bg-zinc-900 transition-colors"
            />
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-black/30 text-black font-semibold text-sm px-7 py-3 hover:bg-black/10 transition-colors"
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
    image: { "@type": "ImageObject", url: post.coverImage, width: 1400, height: 933 },
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

      <div className="public-site min-h-screen bg-zinc-950 text-white">
        {/* ── Article Hero ── */}
        <header className="blog-hero relative min-h-[520px] overflow-hidden border-b border-zinc-800 bg-zinc-950 md:min-h-[620px]">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-zinc-950/65" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-white">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/60 text-sm mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-amber-300 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-amber-300 transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-white/80 truncate max-w-xs">{post.category}</span>
            </nav>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-3 py-1">
                <span className="w-1.5 h-1.5 bg-amber-400" />
                {post.category}
              </span>
              <span className="text-white/60 text-sm">{formatDate(post.publishedAt)}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60 text-sm">{post.readTime} min read</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight tracking-tight mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-8">{post.excerpt}</p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 flex items-center justify-center text-black text-sm font-bold ring-2 ring-white/20">
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
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">
                    Table of Contents
                  </p>
                  <nav className="space-y-1" aria-label="Article sections">
                    {post.toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                    className="flex items-start gap-2 text-sm text-zinc-500 hover:text-amber-300 py-1.5 transition-colors leading-snug"
                      >
                        <span className="w-1 h-1 bg-zinc-700 mt-2.5 shrink-0" />
                        {item.text}
                      </a>
                    ))}
                  </nav>

                  {/* Mini CTA in sidebar */}
                  <div className="mt-8 border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-xs font-bold text-amber-200 mb-2">Get Started with Internetily</p>
                    <p className="text-xs text-zinc-400 mb-3">We onboard you personally. No self-signup.</p>
                    <BlogLeadModal
                      triggerLabel="Get in Touch ->"
                      triggerClassName="block w-full text-center bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold py-2.5 transition-colors"
                      showArrow={false}
                    />
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
              <div className="mt-14 pt-8 border-t border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Written by</p>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${post.author.avatarBg} flex items-center justify-center text-white text-lg font-bold shrink-0`}>
                    {post.author.initials}
                  </div>
                  <div>
                    <p className="font-medium text-white">{post.author.name}</p>
                    <p className="text-sm text-zinc-500 mb-2">{post.author.role} at Internetily</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{getAuthorBio(post)}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-20 pt-12 border-t border-zinc-800">
              <h2 className="text-xl font-normal text-white mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((rel) => {
                  const relColors = CATEGORY_COLORS[rel.categoryColor] ?? CATEGORY_COLORS.blue
                  return (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      className="group flex gap-4 p-5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:-translate-y-0.5 transition-all"
                    >
                      <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${rel.coverGradient} shrink-0 overflow-hidden`}>
                        <Image
                          src={rel.coverImage}
                          alt={rel.coverImageAlt}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-slate-950/35" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${relColors.badge}`}>{rel.category}</span>
                        <h3 className="mt-1.5 text-sm font-medium text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">{rel.readTime} min read</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white"
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
