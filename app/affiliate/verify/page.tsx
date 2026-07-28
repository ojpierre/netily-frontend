"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { affiliateApi } from "@/lib/affiliate-api"

export default function AffiliateVerifyPage() {
  const params = useSearchParams()
  const [state, setState] = useState<"loading" | "verified" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = params.get("token")
    if (!token) {
      setState("error")
      setMessage("The verification token is missing.")
      return
    }
    affiliateApi.verifyEmail(token)
      .then(() => setState("verified"))
      .catch((error) => {
        setState("error")
        setMessage(error instanceof Error ? error.message : "Verification failed.")
      })
  }, [params])

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        {state === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-red-500" />}
        {state === "verified" && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />}
        {state === "error" && <XCircle className="mx-auto h-12 w-12 text-red-400" />}
        <h1 className="mt-5 text-2xl font-bold">
          {state === "loading" ? "Verifying your email" : state === "verified" ? "Email verified" : "Unable to verify"}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {state === "loading" ? "Please wait a moment." : state === "verified" ? "Your affiliate account is ready. You can now sign in." : message}
        </p>
        {state !== "loading" && (
          <Link href="/affiliate/login" className="mt-6 inline-flex rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500">
            Go to affiliate login
          </Link>
        )}
      </section>
    </main>
  )
}
