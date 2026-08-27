import AffiliateAdminAccessClient from "./access-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

type AdminAccessPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function AffiliateAdminAccessPage({ searchParams }: AdminAccessPageProps) {
  const params = await searchParams
  const value = params.token
  const token = Array.isArray(value) ? value[0] : value
  return <AffiliateAdminAccessClient token={token || ""} />
}
