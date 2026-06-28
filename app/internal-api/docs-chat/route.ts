import { readFile } from "fs/promises"
import path from "path"
import { NextResponse, type NextRequest } from "next/server"

type DocsSection = {
  title: string
  text: string
  score: number
}

const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"]

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""

const geminiEndpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const STOP_WORDS = new Set([
  "about",
  "after",
  "and",
  "are",
  "can",
  "does",
  "for",
  "from",
  "how",
  "into",
  "netily",
  "the",
  "this",
  "what",
  "when",
  "where",
  "with",
  "your",
])

function splitDocs(markdown: string): DocsSection[] {
  return markdown.split(/\n(?=##\s+)/g).map((section) => ({
    title: section.match(/^##\s+(.+)$/m)?.[1]?.trim() || "Netily Documentation",
    text: section.trim(),
    score: 0,
  }))
}

function questionTerms(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term))
}

function selectContext(markdown: string, question: string) {
  const terms = questionTerms(question)

  const sections = splitDocs(markdown)
    .map((section) => {
      const haystack = section.text.toLowerCase()
      const titleBoost = terms.some((term) => section.title.toLowerCase().includes(term)) ? 3 : 0
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), titleBoost)
      return { ...section, score }
    })
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return sections.length ? sections : splitDocs(markdown).slice(0, 2)
}

function localFallback(sections: DocsSection[]) {
  const best = sections[0]
  if (!best) {
    return "I don't have a specific answer for that yet. Please reach out to our support team at netily.co.ke for help."
  }

  const excerpt = best.text
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join("\n\n")

  return `${best.title}\n\n${excerpt}`.slice(0, 1200)
}

function extractGeminiText(payload: any) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim()
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 20_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const question = String(message || "").trim()

    if (!question) {
      return NextResponse.json({ answer: "Please ask a Netily support question.", blocked: true }, { status: 400 })
    }

    const docsPath = path.join(process.cwd(), "public", "netily-docs.md")
    const markdown = await readFile(docsPath, "utf8")
    const contextSections = selectContext(markdown, question)
    const context = contextSections
      .map((section) => `## ${section.title}\n${section.text.slice(0, 3500)}`)
      .join("\n\n---\n\n")

    const sources = contextSections.map((section) => ({
      title: section.title,
      source: "/docs",
      score: section.score,
    }))

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        answer: localFallback(contextSections),
        sources,
        blocked: false,
        provider: "local",
      })
    }

    const prompt = [
      "You are Netily Support Assistant, an expert technical writer.",
      "Answer only using the approved Netily documentation excerpts below.",
      "If the answer is not clearly present in the excerpts, say: I do not have that in the Netily docs yet. Please contact Netily Support.",
      "Do not explain internal architecture, credentials, deployment secrets, environment variables, source code, or anything outside tenant onboarding and product usage.",
      "Format your responses beautifully using Markdown. Use bold headings (e.g., **Navigate to:**) and numbered step-by-step lists. Make it look professional and highly structured.",
      "",
      "Approved Netily documentation excerpts:",
      context,
      "",
      `User question: ${question}`,
    ].join("\n")

    let answer = ""
    let modelUsed = ""
    let lastGeminiError = ""

    for (const model of GEMINI_MODELS) {
      const geminiResponse = await fetchWithTimeout(`${geminiEndpoint(model)}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 700,
          },
        }),
      })

      if (!geminiResponse.ok) {
        lastGeminiError = `${model}: ${geminiResponse.status} ${await geminiResponse.text().catch(() => "unknown error")}`
        continue
      }

      const payload = await geminiResponse.json()
      answer = extractGeminiText(payload) || ""
      modelUsed = model
      if (answer) break
    }

    if (!answer) {
      console.error("Gemini API Error:", lastGeminiError || "No model returned an answer")
      return NextResponse.json({
        answer: localFallback(contextSections),
        sources,
        blocked: false,
        provider: "local",
      })
    }

    return NextResponse.json({
      answer,
      sources,
      blocked: answer.toLowerCase().includes("i do not have that in the netily docs yet"),
      provider: "gemini",
      model: modelUsed,
    })
  } catch (error) {
    console.error("Docs Chat API Error:", error)
    return NextResponse.json(
      {
        answer: "I'm having trouble connecting right now. Please try again in a moment, or reach out to us at netily.co.ke.",
        blocked: true,
      },
      { status: 500 },
    )
  }
}
