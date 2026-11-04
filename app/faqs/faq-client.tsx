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
    return faqItems.filter((item) =>
      (category === "All" || item.category === category) &&
      (!needle || `${item.question} ${item.answer} ${item.steps?.join(" ") || ""}`.toLowerCase().includes(needle)),
    )
  }, [category, query])

  async function ask(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setAsking(true)
    setError("")
    setAnswer("")
    try {
      const response = await fetch("/internal-api/docs-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.answer || "The assistant could not answer right now.")
      setAnswer(String(data.answer || ""))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not answer right now.")
    } finally {
      setAsking(false)
    }
  }

  const filterClass = (active: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"}`

  return <>
    <section className="border-b border-border bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <p className="text-sm font-semibold text-primary">Internetily answers</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Practical answers for running your ISP.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Search the questions operators ask about MikroTik, Hotspot, billing, payments and customer support.</p>
        <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-lg border border-input bg-background px-4 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Search FAQs</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" placeholder="Search a question, feature or task" />
        </label>
      </div>
    </section>

    <section className="bg-background py-10 text-foreground sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setCategory("All")} className={filterClass(category === "All")}>All</button>
            {faqCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={filterClass(category === item)}>{item}</button>)}
          </div>
          {visible.length ? <div className="divide-y divide-border border-y border-border">
            {visible.map((item) => <details key={item.id} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-foreground marker:hidden">{item.question}<span className="float-right text-primary transition-transform group-open:rotate-45">+</span></summary>
              <div className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                <p>{item.answer}</p>
                {item.steps?.length ? <ol className="mt-4 space-y-2">{item.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="font-semibold text-primary">{index + 1}.</span><span>{step}</span></li>)}</ol> : null}
                {item.note && <p className="mt-4 border-l-2 border-primary pl-3 text-foreground"><strong>Remember:</strong> {item.note}</p>}
                {item.href && <Link href={item.href} className="mt-4 inline-flex items-center gap-2 font-semibold text-primary">Learn more <ArrowRight className="h-4 w-4" /></Link>}
              </div>
            </details>)}
          </div> : <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">No answer matches that search yet. Ask the assistant or contact support.</div>}
        </div>

        <aside className="h-fit rounded-lg border border-primary/20 bg-card p-5 text-card-foreground shadow-sm lg:sticky lg:top-28">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h2 className="font-semibold">Ask Internetily</h2></div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask a follow-up in your own words. The assistant uses approved Internetily documentation and these operator answers.</p>
          <form onSubmit={ask} className="mt-4">
            <label className="sr-only" htmlFor="faq-question">Your question</label>
            <textarea id="faq-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="How do I…" />
            <button disabled={asking || !question.trim()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Ask</button>
          </form>
          {answer && <div className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-6 text-foreground">{answer.replace(/\*\*/g, "")}</div>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </aside>
      </div>
    </section>
  </>
}
