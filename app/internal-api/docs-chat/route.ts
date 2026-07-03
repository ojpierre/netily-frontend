import { readFile } from "fs/promises"
import path from "path"
import { NextResponse, type NextRequest } from "next/server"

type DocsSection = {
  title: string
  text: string
  score: number
}

type ChatLogMeta = {
  requestId: string
  question: string
  selectedSources?: { title: string; score: number }[]
  provider?: string
  model?: string
  error?: string
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

const ROUTER_SETUP_TERMS = new Set([
  "add",
  "authentication",
  "connect",
  "first",
  "magic",
  "mikrotik",
  "provision",
  "router",
  "routeros",
  "script",
  "setup",
  "terminal",
  "vpn",
])

function logDocsChat(level: "info" | "warn" | "error", event: string, meta: ChatLogMeta) {
  const safeMeta = {
    ...meta,
    question: meta.question.slice(0, 180),
  }
  const line = `[docs-chat:${event}] ${JSON.stringify(safeMeta)}`
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.info(line)
}

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

function isRouterSetupQuestion(question: string, terms: string[]) {
  const normalized = question.toLowerCase()
  return (
    normalized.includes("first router") ||
    normalized.includes("connect") && normalized.includes("router") ||
    normalized.includes("add") && normalized.includes("router") ||
    normalized.includes("provision") && normalized.includes("router") ||
    terms.some((term) => ROUTER_SETUP_TERMS.has(term))
  )
}

function selectContext(markdown: string, question: string) {
  const terms = questionTerms(question)
  const routerSetupQuestion = isRouterSetupQuestion(question, terms)

  const sections = splitDocs(markdown)
    .map((section) => {
      const haystack = section.text.toLowerCase()
      const title = section.title.toLowerCase()
      const titleBoost = terms.some((term) => title.includes(term)) ? 4 : 0
      const routerSetupBoost =
        routerSetupQuestion && title.includes("routers")
          ? 10 + ["authentication script", "provisioning script", "cloud controller", "mikrotik terminal", "vpn tunnel"]
              .reduce((total, phrase) => total + (haystack.includes(phrase) ? 4 : 0), 0)
          : 0
      const score = terms.reduce((total, term) => {
        const exactHits = haystack.match(new RegExp(`\\b${term}\\b`, "g"))?.length || 0
        return total + Math.min(exactHits, 5)
      }, titleBoost + routerSetupBoost)
      return { ...section, score }
    })
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return sections.length ? sections : splitDocs(markdown).slice(0, 2)
}

function routerSetupFallback() {
  return [
    "**Connect your first MikroTik router**",
    "",
    "1. Open **Admin > Routers** and click **Add Router**.",
    "2. Enter the router name, location, public or reachable IP details, API port, and any required credentials shown in the form.",
    "3. Save the router, then open its details page.",
    "4. Go to **Cloud Controller** and copy the **Provisioning Script** or **Authentication Script**.",
    "5. Open your MikroTik terminal, paste the one-line script, and run it.",
    "6. Return to Netily and click **Refresh Status**. The router should move to online once the VPN/API tunnel responds.",
    "7. After it is online, configure PPPoE, Hotspot, ports, queues, captive portal, and backups from the router tabs.",
    "",
    "**If it remains offline:** confirm the router has internet, the script completed without errors, API access is allowed, and the VPN/provisioning status is visible under **Cloud Controller**.",
  ].join("\n")
}

function localFallback(sections: DocsSection[], question: string) {
  if (isRouterSetupQuestion(question, questionTerms(question))) {
    return routerSetupFallback()
  }

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
  const requestId = crypto.randomUUID()
  let question = ""
  try {
    const { message } = await request.json()
    question = String(message || "").trim()

    if (!question) {
      logDocsChat("warn", "empty-question", { requestId, question })
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

    logDocsChat("info", "request", {
      requestId,
      question,
      selectedSources: sources.map((source) => ({ title: source.title, score: source.score })),
    })

    if (!GEMINI_API_KEY) {
      logDocsChat("warn", "local-no-api-key", { requestId, question, provider: "local" })
      return NextResponse.json({
        answer: localFallback(contextSections, question),
        sources,
        blocked: false,
        provider: "local",
        requestId,
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
      let geminiResponse: Response
      try {
        geminiResponse = await fetchWithTimeout(`${geminiEndpoint(model)}?key=${GEMINI_API_KEY}`, {
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
      } catch (error) {
        lastGeminiError = `${model}: ${error instanceof Error ? error.message : "request failed"}`
        logDocsChat("warn", "provider-request-failed", { requestId, question, provider: "gemini", model, error: lastGeminiError })
        continue
      }

      if (!geminiResponse.ok) {
        lastGeminiError = `${model}: ${geminiResponse.status} ${await geminiResponse.text().catch(() => "unknown error")}`
        logDocsChat("warn", "provider-bad-response", { requestId, question, provider: "gemini", model, error: lastGeminiError })
        continue
      }

      const payload = await geminiResponse.json()
      answer = extractGeminiText(payload) || ""
      modelUsed = model
      if (answer) break
    }

    if (!answer) {
      logDocsChat("error", "fallback-after-provider-failure", {
        requestId,
        question,
        provider: "local",
        error: lastGeminiError || "No model returned an answer",
      })
      return NextResponse.json({
        answer: localFallback(contextSections, question),
        sources,
        blocked: false,
        provider: "local",
        requestId,
      })
    }

    logDocsChat("info", "success", { requestId, question, provider: "gemini", model: modelUsed })
    return NextResponse.json({
      answer,
      sources,
      blocked: answer.toLowerCase().includes("i do not have that in the netily docs yet"),
      provider: "gemini",
      model: modelUsed,
      requestId,
    })
  } catch (error) {
    logDocsChat("error", "unhandled", {
      requestId,
      question,
      error: error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error",
    })
    return NextResponse.json(
      {
        answer: "I'm having trouble connecting right now. Please try again in a moment, or reach out to us at netily.co.ke.",
        blocked: true,
        requestId,
      },
      { status: 500 },
    )
  }
}
