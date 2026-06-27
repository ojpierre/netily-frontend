import { readFile } from "fs/promises"
import path from "path"
import { NextResponse, type NextRequest } from "next/server"

type DocsSection = {
  title: string
  text: string
  score: number
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        answer: localFallback(contextSections),
        sources,
        blocked: false,
        provider: "local",
      })
    }

    const prompt = [
      "You are Netily Support Assistant.",
      "Answer only using the approved Netily documentation excerpts below.",
      "If the answer is not clearly present in the excerpts, say: I do not have that in the Netily docs yet. Please contact Netily Support.",
      "Do not explain internal architecture, credentials, deployment secrets, environment variables, source code, or anything outside tenant onboarding and product usage.",
      "Keep answers friendly, practical, and concise. Use numbered steps when useful.",
      "",
      "Approved Netily documentation excerpts:",
      context,
      "",
      `User question: ${question}`,
    ].join("\n")

    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
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
      const errorText = await geminiResponse.text().catch(() => "unknown error")
      console.error("Gemini API Error:", geminiResponse.status, errorText)
      return NextResponse.json({
        answer: localFallback(contextSections),
        sources,
        blocked: false,
        provider: "local",
      })
    }

    const payload = await geminiResponse.json()
    const answer = extractGeminiText(payload) || localFallback(contextSections)

    return NextResponse.json({
      answer,
      sources,
      blocked: answer.toLowerCase().includes("i do not have that in the netily docs yet"),
      provider: "gemini",
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
