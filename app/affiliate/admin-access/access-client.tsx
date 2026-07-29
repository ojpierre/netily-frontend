"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ShieldCheck, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { affiliateApi } from "@/lib/affiliate-api"

export default function AffiliateAdminAccessClient({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState(token ? "" : "The temporary access token is missing.")

  useEffect(() => {
    if (!token) return
    affiliateApi.exchangeAdminAccess(token)
      .then(() => router.replace("/affiliate/dashboard"))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Temporary access failed."))
  }, [router, token])

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 text-red-950">
      <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-700" />
            <h1 className="mt-5 text-2xl font-black">Access link unavailable</h1>
            <p className="mt-3 text-sm text-red-800">{error}</p>
            <Button asChild variant="outline" className="mt-6 rounded-xl border-red-300 text-red-800">
              <Link href="/superadmin/referrals">Return to affiliate management</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="relative mx-auto h-14 w-14">
              <ShieldCheck className="h-14 w-14 text-red-700" />
              <Loader2 className="absolute inset-3 h-8 w-8 animate-spin text-red-400" />
            </div>
            <h1 className="mt-5 text-2xl font-black">Opening affiliate account</h1>
            <p className="mt-3 text-sm text-red-800">Validating the one-time audited access grant.</p>
          </>
        )}
      </section>
    </main>
  )
}
