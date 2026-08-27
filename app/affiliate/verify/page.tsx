import AffiliateVerificationClient from "./verification-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

type AffiliateVerifyPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function AffiliateVerifyPage({ searchParams }: AffiliateVerifyPageProps) {
  const params = await searchParams
  const tokenValue = params.token
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue

  return <AffiliateVerificationClient token={token || ""} />
}
