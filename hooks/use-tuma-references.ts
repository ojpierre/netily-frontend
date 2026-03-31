"use client"

import { useState, useEffect, useCallback } from "react"
import { adminApi } from "@/lib/admin-api"

export interface TumaReference {
  id: string
  name: string
  code: string
}

interface UseTumaReferencesReturn {
  references: TumaReference[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTumaReferences(): UseTumaReferencesReturn {
  const [references, setReferences] = useState<TumaReference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRefs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.getTumaBanks()
      // Normalize: API may return numeric ids or different field names
      const normalize = (item: any): TumaReference => ({
        id: String(item.id ?? item.reference_id ?? item.pk ?? ""),
        name: item.name ?? item.reference_name ?? item.label ?? String(item.id ?? ""),
        code: item.code ?? item.reference_code ?? "",
      })
      setReferences(Array.isArray(data) ? data.map(normalize) : [])
    } catch (err: any) {
      if (err.message === "Session expired. Please login again.") {
        setError("Session expired or permission denied. Please log in again.")
      } else {
        setError(err.message || "Failed to load collection channels.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRefs()
  }, [fetchRefs])

  return { references, isLoading, error, refetch: fetchRefs }
}
