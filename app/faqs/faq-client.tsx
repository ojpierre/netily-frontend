"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bot, Loader2, Search, Send } from "lucide-react"
import { faqCategories, faqItems, type FaqCategory } from "@/lib/faq-data"

export function FaqClient() {
  const [category, setCategory] = useState<FaqCategory | "All">("All")
  const [query, setQuery] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState("")

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return faqItems.filter((item) => (category === "All" || item.category === category) && (!needle || `${item.question} ${item.answer} ${item.steps?.join(" ") || ""}`.toLowerCase().includes(needle)))
  }, [category, query])

  async function ask(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setAsking(true); setError(""); setAnswer("")
    try {
      const response = await fetch("/internal-api/docs-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question.trim() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.answer || "The assistant could not answer right now.")
      setAnswer(String(data.answer || ""))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not answer right now.")
    } finally { setAsking(false) }
  }

  return <>
    <section className="border-b border-slate-200 bg-slate-50 py-10 sm:py-14"><div className="mx-auto max-w-6xl px-5 sm:px-6"><p className="text-sm font-semibold text-blue-700">Internetily answers</p><h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Practical answers for running your ISP.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Search the questions operators ask about MikroTik, Hotspot, billing, payments and customer support.</p><label className="mt-7 flex max-w-2xl items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"><Search className="h-5 w-5 text-slate-400" /><span className="sr-only">Search FAQs</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none" placeholder="Search a question, feature or task" /></label></div></section>
    <section className="py-10 sm:py-14"><div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div><div className="mb-6 flex flex-wrap gap-2"><button onClick={() => setCategory("All")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === "All" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 text-slate-700"}`}>All</button>{faqCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === item ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 text-slate-700"}`}>{item}</button>)}</div>
        {visible.length ? <div className="divide-y divide-slate-200 border-y border-slate-200">{visible.map((item) => <details key={item.id} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-slate-950 marker:hidden">{item.question}<span className="float-right text-blue-700 group-open:rotate-45">+</span></summary><div className="mt-4 max-w-3xl text-sm leading-6 text-slate-600"><p>{item.answer}</p>{item.steps?.length ? <ol className="mt-4 space-y-2">{item.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="font-semibold text-blue-700">{index + 1}.</span><span>{step}</span></li>)}</ol> : null}{item.note && <p className="mt-4 border-l-2 border-blue-600 pl-3 text-slate-700"><strong>Remember:</strong> {item.note}</p>}{item.href && <Link href={item.href} className="mt-4 inline-flex items-center gap-2 font-semibold text-blue-700">Learn more <ArrowRight className="h-4 w-4" /></Link>}</div></details>)}</div> : <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No answer matches that search yet. Ask the assistant or contact support.</div>}</div>
      <aside className="h-fit rounded-lg border border-slate-200 bg-slate-950 p-5 text-white lg:sticky lg:top-28"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-sky-400" /><h2 className="font-semibold">Ask Internetily</h2></div><p className="mt-2 text-sm leading-6 text-slate-300">Ask a follow-up in your own words. The assistant uses approved Internetily documentation and these operator answers.</p><form onSubmit={ask} className="mt-4"><label className="sr-only" htmlFor="faq-question">Your question</label><textarea id="faq-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-sky-400" placeholder="How do I…" /><button disabled={asking || !question.trim()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold disabled:opacity-50">{asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Ask</button></form>{answer && <div className="mt-4 whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-sm leading-6 text-slate-200">{answer.replace(/\*\*/g, "")}</div>}{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}</aside>
    </div></section>
  </>
}
