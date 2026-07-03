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
  config?: string
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PREFERRED_GEMINI_MODEL = "gemini-3-flash-preview"
const DEFAULT_GEMINI_MODELS = [PREFERRED_GEMINI_MODEL, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"]
const GEMINI_KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_API_KEY",
] as const

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

function getGeminiConfig() {
  const envModels = (process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)
  const models = Array.from(new Set([PREFERRED_GEMINI_MODEL, ...envModels, ...DEFAULT_GEMINI_MODELS]))

  const keyName = GEMINI_KEY_ENV_NAMES.find((name) => Boolean(process.env[name]?.trim()))

  return {
    apiKey: keyName ? process.env[keyName]?.trim() || "" : "",
    keyName,
    models,
  }
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
    "1. Open <u>Admin > Routers</u> and click **Add Router**.",
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
    return "I may need a little more detail to guide you properly. You can ask me about Netily setup, routers, billing, hotspot, SMS, staff roles, or dashboards. For direct help, contact Netily Support on **0111 325 479** or **0799538923**."
  }

  const excerpt = best.text
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join("\n\n")

  return `Here is what I found for **${best.title}**:\n\n${excerpt}\n\nIf you want, ask me a more specific question and I will guide you step by step. For direct support, contact **0111 325 479** or **0799538923**.`.slice(0, 1400)
}

function extractGeminiText(payload: any) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim()
}

function summarizeGeminiResponse(payload: any) {
  const candidate = payload?.candidates?.[0]
  const finishReason = candidate?.finishReason
  const blockReason = payload?.promptFeedback?.blockReason
  const safetyRatings = candidate?.safetyRatings || payload?.promptFeedback?.safetyRatings
  return JSON.stringify({ finishReason, blockReason, safetyRatings }).slice(0, 500)
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

export async function GET() {
  const geminiConfig = getGeminiConfig()
  return NextResponse.json({
    ok: true,
    provider: geminiConfig.apiKey ? "gemini" : "local",
    geminiConfigured: Boolean(geminiConfig.apiKey),
    keyEnv: geminiConfig.keyName || null,
    models: geminiConfig.models,
  })
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

    const geminiConfig = getGeminiConfig()

    if (!geminiConfig.apiKey) {
      logDocsChat("warn", "local-no-api-key", {
        requestId,
        question,
        provider: "local",
        config: `missing one of ${GEMINI_KEY_ENV_NAMES.join(", ")}`,
      })
      return NextResponse.json({
        answer: localFallback(contextSections, question),
        sources,
        blocked: false,
        provider: "local",
        requestId,
        diagnostics: {
          reason: "missing_gemini_api_key",
          expectedEnv: GEMINI_KEY_ENV_NAMES,
        },
      })
    }

    const prompt = [
      "You are the public Netily Assistant for prospects, customers, and tenant admins.",
      "Your job is to help people navigate Netily clearly and warmly.",
      "Use the approved Netily documentation excerpts as your source of truth, but answer conversationally instead of copying whole sections.",
      "You may make reasonable product-navigation inferences from the excerpts, but do not invent credentials, pricing, legal terms, hidden settings, integrations, or internal architecture.",
      "Do not mention documentation excerpts, sources, request ids, models, internal APIs, environment variables, or implementation details.",
      "If the user is unclear, casual, or says something like 'slowly slowly', respond naturally and ask what they would like help with next.",
      "If the question is far outside Netily or cannot be answered from the docs, politely say you may not have enough detail and invite them to contact Netily Support on **0111 325 479** or **0799538923**.",
      "Format for the chat UI: short paragraphs, direct answers, numbered steps when useful, **bold** for important labels, *italic* sparingly, and <u>underline</u> for navigation paths such as <u>Admin > Routers</u>.",
      "Avoid markdown tables unless the user asks. Avoid long bullet lists. Keep most answers under 180 words unless the user asks for detail.",
      "",
      "Approved Netily documentation excerpts:",
      context,
      "",
      `User question: ${question}`,
    ].join("\n")

    let answer = ""
    let modelUsed = ""
    let lastGeminiError = ""

    for (const model of geminiConfig.models) {
      let geminiResponse: Response
      try {
        geminiResponse = await fetchWithTimeout(`${geminiEndpoint(model)}?key=${geminiConfig.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              topP: 0.9,
              maxOutputTokens: 1100,
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
      lastGeminiError = `${model}: empty answer ${summarizeGeminiResponse(payload)}`
      logDocsChat("warn", "provider-empty-answer", { requestId, question, provider: "gemini", model, error: lastGeminiError })
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
        diagnostics: {
          reason: "gemini_provider_failed",
          error: lastGeminiError,
          keyEnv: geminiConfig.keyName,
          modelsTried: geminiConfig.models,
        },
      })
    }

    logDocsChat("info", "success", {
      requestId,
      question,
      provider: "gemini",
      model: modelUsed,
      config: `key=${geminiConfig.keyName}`,
    })
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
