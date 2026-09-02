import HotspotClientView from "./HotspotClientView"
import type { CaptivePortalResponse } from "./HotspotClientView"

async function fetchCaptivePortalServerSide(
  routerId: string,
  tenant: string
): Promise<CaptivePortalResponse | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
  try {
    const res = await fetch(
      `${apiBase}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`,
      {
        next: { revalidate: 15 }, // matches backend cache_version TTL window
        // Server-to-server: no mobile radio, no WebView, no per-hop TLS cost for the user's device
      }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function HotspotPage({
  params,
  searchParams,
}: {
  params: Promise<{ router_id: string }>
  searchParams: Promise<{ tenant?: string; mac?: string; login_url?: string; error?: string }>
}) {
  const { router_id: routerId } = await params
  const sp = await searchParams
  const tenant = sp.tenant || ""

  // Resolved BEFORE any HTML reaches the device — the phone's WebView gets
  // one cold DNS+TCP+TLS round trip and a fully-populated page, no second
  // client fetch, no window for an Android watchdog relaunch to strand it in.
  const initialData = tenant ? await fetchCaptivePortalServerSide(routerId, tenant) : null

  // ── Claude's SSR safety net ──────────────────────────────────────────────
  // Compute initialLoginUrl:
  // - Prefer sp.login_url if present (MikroTik supplied it)
  // - Otherwise, reconstruct from gateway_ip (since rlogin.html fast version omits it)
  const initialLoginUrl =
    sp.login_url ||
    (initialData?.portal_config?.gateway_ip
      ? `http://${initialData.portal_config.gateway_ip.trim()}/login`
      : "")

  return (
    <HotspotClientView
      routerId={routerId}
      initialTenant={tenant}
      initialPlans={initialData?.plans ?? []}
      initialPortalConfig={initialData?.portal_config ?? null}
      initialBranding={initialData?.branding ?? null}
      initialRouterError={sp.error || null}
      initialLoginUrl={initialLoginUrl}
    />
  )
}