import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen } from "lucide-react"
import { blogPosts } from "@/lib/blog-data"
import BlogLeadModal from "@/components/blog-lead-modal"

export const metadata: Metadata = {
  title: "ISP Billing & Management Blog | Internetily, formerly Netily",
  description:
    "Expert guides on ISP billing software, MikroTik automation, M-Pesa integration, and ISP management for Kenya and East Africa.",
  keywords: [
    "isp billing software kenya blog",
    "isp management guides kenya",
    "mikrotik isp billing guide",
    "m-pesa isp integration guide",
    "isp billing software comparison",
    "kenyan isp resources",
    "Internetily blog",
    "Netily blog",
  ],
  alternates: {
    canonical: "https://netily.co.ke/blog",
  },
  openGraph: {
    title: "ISP Billing & Management Blog | Internetily",
    description: "Expert guides on ISP billing, MikroTik automation, and M-Pesa integration for Kenyan ISPs.",
    url: "https://netily.co.ke/blog",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Internetily Blog" }],
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
}

export default function BlogPage() {
  return (
    <div className="public-site min-h-screen bg-zinc-950 text-white">
      <header className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>')",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="max-w-3xl">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-white">
              Back to Internetily
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mb-6 inline-flex items-center gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200">
              <BookOpen className="h-4 w-4" />
              Internetily Blog
            </div>
            <h1 className="text-4xl font-normal tracking-tight md:text-6xl">Guides for Kenyan ISP Owners</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              In-depth guides on ISP billing software, MikroTik automation, M-Pesa integration, and growing your internet
              service provider business in Kenya and East Africa.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden border border-zinc-800 bg-zinc-900 transition hover:-translate-y-1 hover:border-amber-500/50"
            >
              <div className="relative flex h-44 items-end overflow-hidden border-b border-zinc-800 p-5">
                <Image
                  src={post.coverImage}
                  alt={post.coverImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover opacity-70 transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/35 to-zinc-950/10" />
                <span className="relative inline-flex items-center gap-2 border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 bg-amber-400" />
                  {post.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>/</span>
                  <span>{post.readTime} min read</span>
                </div>

                <h2 className="mb-3 line-clamp-3 text-base font-medium leading-snug text-white transition group-hover:text-amber-300">
                  {post.title}
                </h2>

                <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>

                <div className="mb-5 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center bg-amber-500 text-xs font-bold text-black`}>
                      {post.author.initials}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-none text-zinc-300">{post.author.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">{post.author.role}</p>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 transition-all hover:gap-2"
                    aria-label={`Read ${post.title}`}
                  >
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 border border-amber-500/30 bg-amber-500 p-8 text-center text-black md:p-12">
          <h2 className="mb-3 text-2xl font-normal md:text-3xl">Run a better ISP</h2>
          <p className="mx-auto mb-8 max-w-xl text-black/70">
            Get started with Internetily, formerly Netily. M-Pesa native, MikroTik integrated, and personally onboarded.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BlogLeadModal
              triggerLabel="Get in Touch"
              triggerClassName="inline-flex items-center gap-2 bg-black text-white font-semibold text-sm px-7 py-3 hover:bg-zinc-900 transition-colors"
            />
            <Link href="/demo" className="inline-flex items-center gap-2 border border-black/30 px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-black/10">
              Request a Demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
