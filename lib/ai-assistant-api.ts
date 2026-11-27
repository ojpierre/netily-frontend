/**
 * Netily Assistant (tenant AI) API client. Contract: /api/v1/ai/*
 * Reuses admin-api's authenticated fetch (base URL, bearer token, refresh-on-401).
 */
import { adminApi } from "@/lib/admin-api"

export interface AiTool {
  name: string
  label: string
}

export type AiDisabledReason = "disabled_for_tenant" | "not_configured" | "role_not_allowed" | "kill_switch" | null

export interface AiStatus {
  enabled: boolean
  reason: AiDisabledReason
  tenant_name: string
  role: string
  model?: string
  tools: AiTool[]
  suggestions: string[]
  notice: string
}

export interface AiSource {
  tool: string
  label: string
}

export interface AiChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: AiSource[]
  created_at: string
}

export interface AiToolCall {
  tool: string
  label: string
  status: "ok" | "denied" | "error"
  duration_ms: number
}

export interface AiChatResponse {
  conversation_id: string
  title: string
  message: AiChatMessage
  tool_calls: AiToolCall[]
  usage?: { input_tokens: number; output_tokens: number }
}

export interface AiConversationSummary {
  id: string
  title: string
  updated_at: string
  message_count: number
}

export interface AiConversationDetail {
  id: string
  title: string
  messages: AiChatMessage[]
}

export type AiInsightSeverity = "info" | "warning" | "critical"

export interface AiInsight {
  id: string
  /** expiring_soon | routers_offline | payment_failures | sms_wallet_low | revenue_trend | idle_hotspot_plans | expired_recently */
  kind: string
  severity: AiInsightSeverity
  title: string
  body: string
  facts?: Record<string, unknown>
  action?: { label: string; href: string } | null
  created_at: string
}

export type AiErrorCode =
  | "ai_forbidden"
  | "ai_disabled"
  | "rate_limited"
  | "ai_not_configured"
  | "model_unavailable"
  | "invalid_request"
  | "unauthenticated"
  | "not_found"
  | "network"
  | "unknown"

export class AiApiError extends Error {
  status: number
  code: AiErrorCode
  retryAfter?: number
  constructor(status: number, code: AiErrorCode, detail: string, retryAfter?: number) {
    super(detail)
    this.name = "AiApiError"
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

const KNOWN_CODES: string[] = [
  "ai_forbidden",
  "ai_disabled",
  "rate_limited",
  "ai_not_configured",
  "model_unavailable",
  "invalid_request",
]

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await adminApi.authorizedFetch(`/ai${path}`, init)
  } catch {
    throw new AiApiError(0, "network", "Could not reach Netily. Check your connection and try again.")
  }
  if (res.status === 204) return undefined as unknown as T
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const raw = typeof body.code === "string" ? body.code : ""
    let code: AiErrorCode = KNOWN_CODES.includes(raw) ? (raw as AiErrorCode) : "unknown"
    if (code === "unknown") {
      if (res.status === 401) code = "unauthenticated"
      else if (res.status === 404) code = "not_found"
      else if (res.status === 429) code = "rate_limited"
      else if (res.status === 503) code = "ai_not_configured"
      else if (res.status === 502) code = "model_unavailable"
    }
    const retry = Number(body.retry_after)
    throw new AiApiError(
      res.status,
      code,
      typeof body.detail === "string" ? body.detail : `Request failed (${res.status})`,
      Number.isFinite(retry) && retry > 0 ? retry : undefined,
    )
  }
  return (await res.json()) as T
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) })

export const aiApi = {
  getStatus: () => call<AiStatus>("/status/"),
  chat: (input: { message: string; conversation_id?: string | null; page_context?: string | null }) =>
    call<AiChatResponse>("/chat/", post({ conversation_id: null, page_context: null, ...input })),
  listConversations: () => call<AiConversationSummary[]>("/conversations/"),
  getConversation: (id: string) => call<AiConversationDetail>(`/conversations/${encodeURIComponent(id)}/`),
  deleteConversation: (id: string) =>
    call<void>(`/conversations/${encodeURIComponent(id)}/`, { method: "DELETE" }),
  getInsights: () => call<AiInsight[]>("/insights/"),
  dismissInsight: (id: string) =>
    call<void>(`/insights/${encodeURIComponent(id)}/dismiss/`, { method: "POST" }),
  sendFeedback: (input: { message_id: string; rating: "up" | "down"; reason?: string }) =>
    call<void>("/feedback/", post(input)),
}

export type AiClient = typeof aiApi

export interface AiErrorView {
  title: string
  detail: string
  retryable: boolean
  /** Feature is unavailable; replace the composer with a disabled state. */
  terminal: boolean
}

/** Friendly copy for each contract error code. */
export function describeAiError(err: unknown): AiErrorView {
  const e = err instanceof AiApiError ? err : new AiApiError(0, "unknown", "Something went wrong.")
  switch (e.code) {
    case "rate_limited":
      return {
        title: "Slow down a moment",
        detail: e.retryAfter
          ? `You've sent a lot of questions. You can ask again in ${e.retryAfter}s.`
          : "You've sent a lot of questions. Please wait a little before asking again.",
        retryable: true,
        terminal: false,
      }
    case "ai_not_configured":
      return {
        title: "Assistant isn't set up yet",
        detail: "The AI service hasn't been configured for this platform. Please contact Netily support.",
        retryable: false,
        terminal: true,
      }
    case "ai_disabled":
      return {
        title: "Assistant is switched off",
        detail: "The assistant is currently disabled for your workspace. Contact Netily support to turn it on.",
        retryable: false,
        terminal: true,
      }
    case "ai_forbidden":
      return {
        title: "Not available for your role",
        detail: "Your staff role doesn't have access to the assistant. Ask an administrator if you need it.",
        retryable: false,
        terminal: true,
      }
    case "model_unavailable":
      return {
        title: "The AI model is busy",
        detail: "Netily Assistant couldn't get an answer just now. Please try again in a moment.",
        retryable: true,
        terminal: false,
      }
    case "invalid_request":
      return { title: "That message couldn't be sent", detail: e.message, retryable: false, terminal: false }
    case "unauthenticated":
      return {
        title: "Session expired",
        detail: "Please sign in again to keep using the assistant.",
        retryable: false,
        terminal: false,
      }
    case "network":
      return { title: "Connection problem", detail: e.message, retryable: true, terminal: false }
    default:
      return {
        title: "Something went wrong",
        detail: "We couldn't complete that request. Please try again.",
        retryable: true,
        terminal: false,
      }
  }
}
