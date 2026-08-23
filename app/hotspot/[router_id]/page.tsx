// app/hotspot/[router_id]/page.tsx  (Server Component — NO "use client")
import HotspotPortalClient from "./HotspotPortalClient"

async function getCaptivePortal(routerId: string, tenant: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  const res = await fetch(
    `${apiBase}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`,
    { next: { revalidate: 20 } } // matches your Django cache_version TTL window
  )
  if (!res.ok) return null
  return res.json()
}

export default async function HotspotPage({
  params,
  searchParams,
}: {
  params: Promise<{ router_id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { router_id: routerId } = await params
  const sp = await searchParams
  const tenant = (sp.tenant as string) || ""

  const initialData = await getCaptivePortal(routerId, tenant)

  return (
    <HotspotPortalClient
      routerId={routerId}
      initialPlans={initialData?.plans ?? []}
      initialPortalConfig={initialData?.portal_config ?? null}
      initialBranding={initialData?.branding ?? null}
      fetchFailed={!initialData}
    />
  )
}