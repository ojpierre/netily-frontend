"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, CheckCircle2, Copy, FileText, Menu, Moon, Search, Sparkles, Sun, X } from "lucide-react"
import { NetilySupportChat } from "@/components/netily-support-chat"

type Heading = { id: string; title: string; level: number }

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
}

function parseHeadings(markdown: string): Heading[] {
  return markdown
    .split("\n")
    .filter((line) => /^#{2,3}\s+/.test(line))
    .map((line) => {
      const level = line.startsWith("###") ? 3 : 2
      const title = line.replace(/^#{2,3}\s+/, "").trim()
      return { id: slugify(title), title, level }
    })
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-700 dark:bg-slate-800 dark:text-blue-300">{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) return <a key={index} href={link[2]} className="font-semibold text-blue-600 hover:underline dark:text-blue-300">{link[1]}</a>
    return part
  })
}

function parseTable(lines: string[]): React.ReactNode | null {
  if (lines.length < 2) return null
  const parseRow = (row: string) =>
    row.split("|").map(c => c.trim()).filter(c => c !== "")

  const headers = parseRow(lines[0])
  const body = lines.slice(2) // skip separator row

  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/50">
          {body.map((row, ri) => (
            <tr key={ri} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
              {parseRow(row).map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarkdownBody({ markdown }: { markdown: string }) {
  const nodes: React.ReactNode[] = []
  let list: string[] = []
  let tableLines: string[] = []

  const flushList = () => {
    if (!list.length) return
    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-5 space-y-2 rounded-2xl border border-blue-100/70 bg-white/70 p-5 text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {list.map((item, index) => (
          <li key={index} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    )
    list = []
  }

  const flushTable = () => {
    if (!tableLines.length) return
    const table = parseTable(tableLines)
    if (table) nodes.push(<React.Fragment key={`table-${nodes.length}`}>{table}</React.Fragment>)
    tableLines = []
  }

  const lines = markdown.split("\n")
  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Detect table rows
    if (trimmed.startsWith("|")) {
      flushList()
      tableLines.push(trimmed)
      return
    } else {
      flushTable()
    }

    if (!trimmed || trimmed === "---") {
      flushList()
      return
    }
    if (trimmed.startsWith("- ")) {
      list.push(trimmed.slice(2))
      return
    }
    flushList()
    if (trimmed.startsWith("# ")) nodes.push(<h1 key={index} className="mb-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{renderInline(trimmed.slice(2))}</h1>)
    else if (trimmed.startsWith("## ")) {
      const title = trimmed.slice(3)
      nodes.push(<h2 id={slugify(title)} key={index} className="scroll-mt-28 pt-12 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{renderInline(title)}</h2>)
    } else if (trimmed.startsWith("### ")) {
      const title = trimmed.slice(4)
      nodes.push(<h3 id={slugify(title)} key={index} className="scroll-mt-28 pt-8 text-xl font-bold text-slate-900 dark:text-slate-100">{renderInline(title)}</h3>)
    } else if (trimmed.startsWith("#### ")) {
      const title = trimmed.slice(5)
      nodes.push(<h4 key={index} className="pt-5 text-base font-bold text-slate-800 dark:text-slate-200">{renderInline(title)}</h4>)
    } else if (trimmed.startsWith("> ")) {
      nodes.push(<blockquote key={index} className="my-5 rounded-2xl border-l-4 border-blue-500 bg-blue-50/80 p-4 text-sm text-blue-950 dark:bg-blue-950/40 dark:text-blue-100">{renderInline(trimmed.slice(2))}</blockquote>)
    } else {
      nodes.push(<p key={index} className="my-4 leading-8 text-slate-600 dark:text-slate-300">{renderInline(trimmed)}</p>)
    }
  })
  flushList()
  flushTable()
  return <>{nodes}</>
}

export default function DocsPage() {
  const [markdown, setMarkdown] = useState("")
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    fetch("/netily-docs.md")
      .then((res) => res.text())
      .then(setMarkdown)
      .catch(() => setMarkdown("# Netily Documentation\n\nWe could not load the docs right now. Please refresh."))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  const headings = useMemo(() => parseHeadings(markdown), [markdown])
  const filteredHeadings = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? headings.filter((heading) => heading.title.toLowerCase().includes(q)) : headings
  }, [headings, query])

  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target?.id) setActiveId(visible.target.id)
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#f8fafc,#eff6ff_45%,#ffffff)] text-slate-950 transition-colors dark:bg-[radial-gradient(circle_at_top_left,#0f3f8a,transparent_30%),linear-gradient(135deg,#020617,#07152f_48%,#020617)] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Netily</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Documentation</p>
            </div>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <a href="#quickstart" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10">Quickstart</a>
            <Link href="/#contact" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Get Started</Link>
            <button onClick={() => setDark((value) => !value)} className="rounded-full border border-slate-200 bg-white/70 p-2 dark:border-white/10 dark:bg-white/10">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={() => setMenuOpen((value) => !value)} className="rounded-xl border border-slate-200 bg-white/80 p-2 md:hidden dark:border-white/10 dark:bg-white/10">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[290px_1fr] lg:px-8">
        <aside className={`${menuOpen ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-24 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-xl shadow-blue-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search docs..." className="h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pl-10 pr-3 text-sm outline-none ring-blue-500/20 focus:ring-4 dark:border-white/10 dark:bg-slate-950/60" />
            </div>
            <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto pr-1">
              {filteredHeadings.map((heading) => (
                <a key={heading.id} href={`#${heading.id}`} onClick={() => setMenuOpen(false)} className={`block rounded-2xl px-3 py-2 text-sm transition ${activeId === heading.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : heading.level === 3 ? "ml-3 text-slate-500 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-white/10" : "font-semibold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-white/10"}`}>
                  {heading.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                  <Sparkles className="h-3.5 w-3.5" /> Platform Documentation
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Everything you need to get the most from Netily.</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Step-by-step guides covering setup, routers, billing, hotspot, SMS, and every feature in your dashboard — written for ISP operators at every level.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href="#quickstart" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700">Start with Quickstart <ArrowRight className="h-4 w-4" /></a>
                  <Link href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white">Register your ISP</Link>
                </div>
              </div>
              <div className="rounded-[2rem] border border-blue-100 bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/20 dark:border-blue-400/20">
                <FileText className="mb-4 h-8 w-8" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">How registration works</p>
                <p className="mt-3 text-sm leading-7 text-blue-50">Fill the contact form at <strong>netily.co.ke/#contact</strong>. Our team reviews your details, sets up your account, and sends your login credentials by email — usually within one business day.</p>
              </div>
            </div>
          </motion.div>

          <article className="rounded-[2.5rem] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-blue-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10">
            <div className="mb-4 flex justify-end">
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
            </div>
            <MarkdownBody markdown={markdown} />
          </article>
        </section>
      </main>

      {markdown ? <NetilySupportChat /> : null}
    </div>
  )
}
