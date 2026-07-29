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
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-4 text-gray-900">
      <section className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white/90 p-8 text-center shadow-xl shadow-gray-100/50 backdrop-blur-xl">
        {error ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-700" />
            <h1 className="mt-5 text-2xl font-black">Access link unavailable</h1>
            <p className="mt-3 text-sm text-gray-500">{error}</p>
            <Button asChild variant="outline" className="mt-6 rounded-xl border-gray-200 text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
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
            <p className="mt-3 text-sm text-gray-500">Validating the one-time audited access grant.</p>
          </>
        )}
      </section>
    </main>
  )
}
