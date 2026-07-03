"use client"

import React, { useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, BookOpen, CheckCircle2, Copy, FileText, Menu, Moon, Search,
  Sparkles, Sun, X, ChevronRight, ChevronLeft, Bot, Send, Check, Expand, Shrink
} from "lucide-react"

type PageData = {
  id: string
  title: string
  category: string
  content: string
}

type ChatMessage = {
  role: "user" | "assistant"
  text: string
  sources?: { title: string; source: string; score: number }[]
  requestId?: string
  provider?: string
  model?: string
  diagnostics?: {
    reason?: string
    error?: string
    keyEnv?: string
    modelsTried?: string[]
    expectedEnv?: string[]
  }
}

const CATEGORY_MAP: Record<string, string> = {
  "Quickstart": "Getting Started",
  "Dashboard": "Getting Started",
  "What's New": "Getting Started",
  "Settings": "Getting Started",

  "Users": "User Management",
  "Staff Management": "User Management",
  "Leads Management": "User Management",

  "Routers Management": "Network & Devices",
  "IPv4 Networks": "Network & Devices",
  "Fair Usage Policy (FUP)": "Network & Devices",

  "Plans Management": "Billing & Payments",
  "Invoice Management": "Billing & Payments",
  "Payments": "Billing & Payments",
  "Payment Methods": "Billing & Payments",
  "Vouchers": "Billing & Payments",

  "Support Tickets": "Support & Community",
  "SMS Management": "Support & Community",
  "Loyalty Program": "Support & Community",
  "Captive Portal Ads": "Support & Community",
  "Community Board": "Support & Community",
}

const CATEGORY_ORDER = [
  "Getting Started",
  "User Management",
  "Network & Devices",
  "Billing & Payments",
  "Support & Community",
  "Other"
]

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
}

function parseMarkdownPages(markdown: string): PageData[] {
  const parts = markdown.split(/^##\s+/m)
  const pages: PageData[] = []
  
  parts.forEach(part => {
    if (!part.trim()) return
    const lines = part.split("\n")
    const title = lines[0].trim()
    if (title.toLowerCase().includes("table of contents") || title.toLowerCase().includes("netily documentation")) return
    
    const id = slugify(title)
    const category = CATEGORY_MAP[title] || "Other"
    
    // Convert ### headings inside the page back to ## so they are rendered as main sections
    const content = lines.slice(1).join("\n").replace(/^### /gm, "## ").trim()
    
    pages.push({ id, title, category, content })
  })
  
  return pages
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
  const parseRow = (row: string) => row.split("|").map(c => c.trim()).filter(c => c !== "")

  const headers = parseRow(lines[0])
  const body = lines.slice(2)

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
      <ul key={`list-${nodes.length}`} className="my-5 space-y-2 rounded-2xl border border-blue-100/70 bg-slate-50 p-5 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
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
    
    if (trimmed.startsWith("# ")) {
      nodes.push(<h1 key={index} className="mb-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{renderInline(trimmed.slice(2))}</h1>)
    } else if (trimmed.startsWith("## ")) {
      const title = trimmed.slice(3)
      nodes.push(<h2 id={slugify(title)} key={index} className="scroll-mt-28 pt-8 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{renderInline(title)}</h2>)
    } else if (trimmed.startsWith("### ")) {
      const title = trimmed.slice(4)
      nodes.push(<h3 id={slugify(title)} key={index} className="pt-6 text-lg font-bold text-slate-800 dark:text-slate-200">{renderInline(title)}</h3>)
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

// Docked Assistant Component
function DockedAssistant({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    text: "Hi! 👋 I'm the Netily assistant. Ask me anything about getting started, managing your ISP, routers, billing, hotspot, SMS, or any feature in the platform."
  }])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(value = message) {
    const trimmed = value.trim()
    if (!trimmed || loading) return

    setMessage("")
    setMessages((current) => [...current, { role: "user", text: trimmed }])
    setLoading(true)

    try {
      const res = await fetch("/internal-api/docs-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[docs-assistant] request failed", {
          status: res.status,
          requestId: data.requestId,
          answer: data.answer,
        })
      } else if (data.provider === "local") {
        console.warn(
          `[docs-assistant] local fallback reason=${data.diagnostics?.reason || "unknown"} error=${data.diagnostics?.error || "none"}`,
        )
        console.warn("[docs-assistant] using local fallback", {
          requestId: data.requestId,
          sources: data.sources,
          diagnostics: data.diagnostics,
        })
      } else {
        console.info("[docs-assistant] answer received", {
          requestId: data.requestId,
          provider: data.provider,
          model: data.model,
          sources: data.sources,
        })
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.answer || "I don't have a specific answer for that yet. Please contact our support team at netily.co.ke for help.",
          sources: data.sources || [],
          requestId: data.requestId,
          provider: data.provider,
          model: data.model,
          diagnostics: data.diagnostics,
        },
      ])
    } catch (error) {
      console.error("[docs-assistant] network error", error)
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I'm having trouble connecting right now. Please try again in a moment, or reach out to us at netily.co.ke.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMessages([messages[0]])} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" title="Clear chat">
            <Search className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`} className={item.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[90%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                item.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              {item.text}
            </div>
            {item.sources?.length ? (
              <p className="mt-1 text-[10px] text-slate-400">
                Source: {item.sources.map((s) => s.title).join(", ")}
                {item.requestId ? ` · ${item.provider || "assistant"}${item.model ? `/${item.model}` : ""} · ${item.requestId}` : ""}
                {item.diagnostics?.reason ? ` · ${item.diagnostics.reason}` : ""}
              </p>
            ) : null}
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <span className="text-xs font-medium mr-1 tracking-wider uppercase">Thinking</span>
              <span className="flex gap-1 items-center h-4">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600/60" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600/60" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600/60" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        
        {messages.length === 1 && !loading && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suggested questions:</p>
            {["How do I connect my first router?", "How does billing work?", "How do I set up vouchers?"].map(q => (
              <button 
                key={q} 
                onClick={() => sendMessage(q)}
                className="text-left rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage()
            }}
            placeholder="Ask a question..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500/50 focus:bg-white focus:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-950"
          />
          <button 
            onClick={() => sendMessage()} 
            disabled={loading || !message.trim()} 
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [pages, setPages] = useState<PageData[]>([])
  const [activeId, setActiveId] = useState("quickstart")
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [dark, setDark] = useState(false)
  
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedContent, setCopiedContent] = useState(false)

  useEffect(() => {
    fetch("/netily-docs.md")
      .then((res) => res.text())
      .then(markdown => {
        const parsed = parseMarkdownPages(markdown)
        setPages(parsed)
      })
      .catch(() => setPages([{ id: "error", title: "Error", category: "Other", content: "Could not load docs." }]))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? pages.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) : pages
  }, [pages, query])

  const groupedPages = useMemo(() => {
    const groups: Record<string, PageData[]> = {}
    filteredPages.forEach(p => {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    })
    
    // Sort categories based on CATEGORY_ORDER
    return Object.entries(groups).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a[0])
      const idxB = CATEGORY_ORDER.indexOf(b[0])
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
    })
  }, [filteredPages])

  const activePage = pages.find(p => p.id === activeId) || pages[0]
  
  // Pagination
  const activeIndex = pages.findIndex(p => p.id === activeId)
  const prevPage = activeIndex > 0 ? pages[activeIndex - 1] : null
  const nextPage = activeIndex < pages.length - 1 ? pages[activeIndex + 1] : null

  const handleCopyLink = () => {
    const url = new URL(window.location.href)
    url.hash = activeId
    navigator.clipboard.writeText(url.toString())
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyContent = () => {
    if (activePage) {
      navigator.clipboard.writeText(`${activePage.title}\n\n${activePage.content}`)
      setCopiedContent(true)
      setTimeout(() => setCopiedContent(false), 2000)
    }
  }

  const handleAskAI = (provider: 'chatgpt' | 'claude' | 'gemini') => {
    if (!activePage) return
    
    const prompt = `Analyze this section of the Netily ISP Documentation and help me understand it, or draft a good copy based on it:\n\nTitle: ${activePage.title}\n\n${activePage.content}`
    
    navigator.clipboard.writeText(prompt)
    
    const encodedPrompt = encodeURIComponent(prompt)
    let url = ""
    if (provider === 'chatgpt') url = `https://chatgpt.com/?q=${encodedPrompt}`
    else if (provider === 'claude') url = `https://claude.ai/new?q=${encodedPrompt}`
    else if (provider === 'gemini') url = `https://gemini.google.com/app` // relies on clipboard
    
    window.open(url, "_blank")
  }

  // Set initial hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash && pages.some(p => p.id === hash)) {
      setActiveId(hash)
    }
  }, [pages])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white/70 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl border border-slate-200 bg-white/80 p-2 lg:hidden dark:border-white/10 dark:bg-white/10">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Netily Docs</p>
            </Link>
          </div>
          
          <div className="flex flex-1 items-center justify-end gap-3 md:justify-center lg:justify-end">
            <div className="hidden max-w-sm flex-1 relative md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search docs... (Ctrl K)" 
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none ring-blue-500/20 focus:bg-white focus:ring-4 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-950" 
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pl-4">
            <button 
              onClick={() => setAssistantOpen(!assistantOpen)} 
              className={`hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                assistantOpen ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Ask Assistant
            </button>
            <Link href="/#contact" className="hidden rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:block">Create account</Link>
            <button onClick={() => setDark(!dark)} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Navigation) */}
        <aside className={`${menuOpen ? "absolute inset-0 z-30 bg-white dark:bg-slate-950 lg:relative lg:bg-transparent" : "hidden lg:block"} w-full shrink-0 border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 lg:w-[260px] xl:w-[280px]`}>
          <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-6">
            <div className="mb-6 md:hidden">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Search docs..." 
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none dark:border-slate-800 dark:bg-slate-900" 
                />
              </div>
            </div>

            <nav className="space-y-8">
              {groupedPages.map(([category, categoryPages]) => (
                <div key={category}>
                  <h4 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{category}</h4>
                  <ul className="space-y-1">
                    {categoryPages.map(p => (
                      <li key={p.id}>
                        <button
                          onClick={() => {
                            setActiveId(p.id)
                            setMenuOpen(false)
                            window.history.pushState(null, "", `#${p.id}`)
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                            activeId === p.id
                              ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {p.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Middle Column (Content) */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth dark:bg-slate-950">
          <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10 lg:py-16">
            {activePage ? (
              <motion.div 
                key={activePage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Breadcrumb */}
                <p className="mb-3 text-sm font-bold text-blue-600 dark:text-blue-400">{activePage.category}</p>
                
                {/* Title & Actions */}
                <div className="mb-10 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-end">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{activePage.title}</h1>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAskAI('chatgpt')} 
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#10a37f]/30 bg-[#10a37f]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#10a37f] hover:bg-[#10a37f]/20 transition-colors"
                      >
                        <Bot className="h-3 w-3" /> ChatGPT
                      </button>
                      <button 
                        onClick={() => handleAskAI('claude')} 
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d97757]/30 bg-[#d97757]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d97757] hover:bg-[#d97757]/20 transition-colors"
                      >
                        <Bot className="h-3 w-3" /> Claude
                      </button>
                      <button 
                        onClick={() => handleAskAI('gemini')} 
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a73e8]/30 bg-[#1a73e8]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] hover:bg-[#1a73e8]/20 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" /> Gemini
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={handleCopyLink} 
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedLink ? "Copied" : "Copy link"}
                      </button>
                      <button 
                        onClick={handleCopyContent} 
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {copiedContent ? <Check className="h-3.5 w-3.5 text-green-500" /> : <FileText className="h-3.5 w-3.5" />}
                        {copiedContent ? "Copied" : "Copy content"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Markdown Content */}
                <article className="prose prose-slate max-w-none dark:prose-invert">
                  <MarkdownBody markdown={activePage.content} />
                </article>

                {/* Pagination (Next/Prev) */}
                <div className="mt-20 grid gap-4 border-t border-slate-100 pt-8 dark:border-slate-800 sm:grid-cols-2">
                  {prevPage ? (
                    <button 
                      onClick={() => { setActiveId(prevPage.id); window.history.pushState(null, "", `#${prevPage.id}`) }}
                      className="group flex flex-col items-start rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
                    >
                      <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{prevPage.title}</span>
                    </button>
                  ) : <div />}
                  
                  {nextPage ? (
                    <button 
                      onClick={() => { setActiveId(nextPage.id); window.history.pushState(null, "", `#${nextPage.id}`) }}
                      className="group flex flex-col items-end rounded-2xl border border-slate-200 p-5 text-right transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
                    >
                      <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{nextPage.title}</span>
                    </button>
                  ) : <div />}
                </div>

              </motion.div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}
          </div>
        </main>

        {/* Right Column (Docked Assistant) */}
        {assistantOpen && (
          <aside className="absolute bottom-0 right-0 top-16 z-20 w-full border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:relative md:top-0 md:w-[320px] md:shrink-0 md:shadow-none lg:w-[380px]">
            <DockedAssistant onClose={() => setAssistantOpen(false)} />
          </aside>
        )}
      </div>

      {/* Floating Assistant Button for Mobile */}
      {!assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-xl shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700 md:hidden"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
