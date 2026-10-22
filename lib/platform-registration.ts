const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_API_PORT || "8000"}/api/v1`
    : "http://localhost:8000/api/v1")

const REGISTRATION_PATH = "/superadmin/tenants/register/"

type PlatformSession = {
  tokenKey: "superadminToken" | "supportToken"
  refreshKey: "superadminRefreshToken" | "supportRefreshToken"
  token: string
}

export class RegistrationError extends Error {
  constructor(
    public status: number,
    public errors: Record<string, unknown>,
  ) {
    super(String(errors.detail || errors.error || "Tenant registration failed."))
  }
}

function storedValue(key: string): string | null {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function getSession(): PlatformSession {
  const superadminToken = storedValue("superadminToken")
  if (superadminToken) {
    return {
      tokenKey: "superadminToken",
      refreshKey: "superadminRefreshToken",
      token: superadminToken,
    }
  }

  const supportToken = storedValue("supportToken")
  if (supportToken) {
    return {
      tokenKey: "supportToken",
      refreshKey: "supportRefreshToken",
      token: supportToken,
    }
  }

  throw new RegistrationError(401, {
    detail: "Sign in to Superadmin or Support before registering a tenant.",
  })
}

async function refreshSession(session: PlatformSession): Promise<boolean> {
  const refresh = storedValue(session.refreshKey)
  if (!refresh) return false

  try {
    const response = await fetch(`${API_BASE}/core/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    })
    if (!response.ok) return false

    const data = await response.json()
    if (typeof data.access !== "string") return false

    const storage = localStorage.getItem(session.refreshKey) ? localStorage : sessionStorage
    storage.setItem(session.tokenKey, data.access)
    if (typeof data.refresh === "string") storage.setItem(session.refreshKey, data.refresh)
    document.cookie = `${session.tokenKey}=${data.access}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`
    session.token = data.access
    return true
  } catch {
    return false
  }
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.text()
  let result: Record<string, unknown> = {}
  try {
    result = JSON.parse(body)
  } catch {
    result = {
      detail: response.status === 404
        ? "Tenant registration endpoint is unavailable on this deployment."
        : `Registration service returned HTTP ${response.status}.`,
    }
  }

  if (response.status === 404 && result.detail === "Not found.") {
    result.detail = "Tenant registration is not available on the deployed API. Contact Netily support."
  }

  if (!response.ok) {
    throw new RegistrationError(response.status, result)
  }
  return result as T
}

async function requestRegistration<T>(
  path: string,
  method: "GET" | "POST",
  payload?: object,
): Promise<T> {
  const session = getSession()
  const url = `${API_BASE}${path}`
  const send = () => fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(payload ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${session.token}`,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(method === "POST" ? 295_000 : 15_000),
  })

  try {
    let response = await send()
    if (response.status === 401 && await refreshSession(session)) {
      response = await send()
    }
    return await readResult<T>(response)
  } catch (error) {
    if (error instanceof RegistrationError) throw error
    throw new RegistrationError(503, {
      detail: "Could not reach the registration service. Check your connection and try again.",
    })
  }
}

export function registerTenant<T>(data: object): Promise<T> {
  return requestRegistration<T>(REGISTRATION_PATH, "POST", data)
}

export function lookupTenantRegistration<T>(companyName: string, companyEmail: string): Promise<T> {
  const query = new URLSearchParams({ company_name: companyName, company_email: companyEmail })
  return requestRegistration<T>(`${REGISTRATION_PATH}status/?${query}`, "GET")
}

export type TenantActivationPayment = {
  id: string
  status: "pending" | "processing" | "completed" | "provisioning" | "consumed" | "failed" | "expired"
  amount: string
  currency: string
  company_name: string
  phone_number: string
  receipt?: string | null
  failure_reason?: string | null
  can_set_password: boolean
  account_created: boolean
  created_at: string
  completed_at?: string | null
}

export function startTenantActivation(
  data: object,
): Promise<TenantActivationPayment> {
  return requestRegistration<TenantActivationPayment>(
    `${REGISTRATION_PATH}activation/`,
    "POST",
    data,
  )
}

export function getTenantActivation(
  paymentId: string,
): Promise<TenantActivationPayment> {
  return requestRegistration<TenantActivationPayment>(
    `${REGISTRATION_PATH}activation/${paymentId}/`,
    "GET",
  )
}

export function finishTenantActivation<T>(
  paymentId: string,
  password: string,
  passwordConfirm: string,
): Promise<T> {
  return requestRegistration<T>(
    `${REGISTRATION_PATH}activation/${paymentId}/finish/`,
    "POST",
    { admin_password: password, admin_password_confirm: passwordConfirm },
  )
}
