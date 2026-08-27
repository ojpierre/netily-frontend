"use client"

import { useState, useEffect, useCallback } from "react"
import { adminApi } from "@/lib/admin-api"

export interface TumaConfig {
  collection_reference_id: string
  collection_account_number: string
  // Additional fields the API may return on GET
  reference_name?: string
  reference_code?: string
  business_id?: string
  [key: string]: any
}

export type TumaPageState =
  | "idle"
  | "loading_refs"
  | "loading_config"
  | "ready"
  | "saving"
  | "saved"
  | "error"

interface FieldErrors {
  collection_reference_id?: string
  collection_account_number?: string
}

interface UseTumaConfigReturn {
  config: TumaConfig | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  fieldErrors: FieldErrors
  isFirstTimeSetup: boolean
  save: (data: {
    collection_reference_id: string
    collection_account_number: string
  }) => Promise<boolean>
  refetch: () => Promise<void>
  clearFieldErrors: () => void
}

export function useTumaConfig(): UseTumaConfigReturn {
  const [config, setConfig] = useState<TumaConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.getTumaMode()
      if (data === null) {
        setIsFirstTimeSetup(true)
        setConfig(null)
      } else {
        setIsFirstTimeSetup(false)
        setConfig(data)
      }
    } catch (err: any) {
      if (err.message === "Session expired. Please login again.") {
        setError("Session expired or permission denied. Please log in again.")
      } else {
        setError(err.message || "Failed to load current configuration.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const save = useCallback(
    async (data: {
      collection_reference_id: string
      collection_account_number: string
    }): Promise<boolean> => {
      setIsSaving(true)
      setError(null)
      setFieldErrors({})
      try {
        const result = await adminApi.saveTumaMode(data)
        setConfig(result)
        setIsFirstTimeSetup(false)
        return true
      } catch (err: any) {
        const msg = err.message || ""

        // Parse 400-level field errors from backend
        if (
          msg.includes("collection_reference_id") ||
          msg.includes("collection_account_number")
        ) {
          const errors: FieldErrors = {}
          if (msg.includes("collection_reference_id")) {
            errors.collection_reference_id = msg
          }
          if (msg.includes("collection_account_number")) {
            errors.collection_account_number = msg
          }
          setFieldErrors(errors)
        } else if (
          msg === "Session expired. Please login again." ||
          msg.includes("permission denied") ||
          msg.includes("Access denied")
        ) {
          setError("Session expired or permission denied. Please log in again.")
        } else {
          setError(msg || "Failed to save configuration.")
        }
        return false
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return {
    config,
    isLoading,
    isSaving,
    error,
    fieldErrors,
    isFirstTimeSetup,
    save,
    refetch: fetchConfig,
    clearFieldErrors,
  }
}
