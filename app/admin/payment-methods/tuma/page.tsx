"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTumaReferences } from "@/hooks/use-tuma-references"
import { useTumaConfig, type TumaPageState } from "@/hooks/use-tuma-config"
import { ErrorBanner } from "./_components/error-banner"
import { SaveStatusCard } from "./_components/save-status-card"
import { PaymentConfigForm } from "./_components/payment-config-form"

function ConfigSkeleton() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function TumaConfigPage() {
  const {
    references,
    isLoading: refsLoading,
    error: refsError,
    refetch: refetchRefs,
  } = useTumaReferences()

  const {
    config,
    isLoading: configLoading,
    isSaving,
    error: configError,
    fieldErrors,
    isFirstTimeSetup,
    save,
    refetch: refetchConfig,
    clearFieldErrors,
  } = useTumaConfig()

  // Derive page state
  const pageState: TumaPageState = useMemo(() => {
    if (refsLoading) return "loading_refs"
    if (configLoading) return "loading_config"
    if (refsError || configError) return "error"
    if (isSaving) return "saving"
    if (config && !isSaving) return "saved"
    return "ready"
  }, [refsLoading, configLoading, refsError, configError, isSaving, config])

  const isLoading = pageState === "loading_refs" || pageState === "loading_config"
  const serverError = refsError || configError
  const is500Error =
    serverError?.includes("500") || serverError?.includes("Server error")

  const handleSave = async (data: {
    collection_reference_id: string
    collection_account_number: string
  }) => {
    const success = await save(data)
    if (success) {
      toast.success("Payment configuration saved successfully!", {
        description: "Your collection channel is now active.",
      })
    } else {
      toast.error("Failed to save configuration", {
        description: "Please check the errors below and try again.",
      })
    }
    return success
  }

  const handleRetry = () => {
    refetchRefs()
    refetchConfig()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/payment-methods">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Payment Gateway
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your Tuma collection channel
            </p>
          </div>
        </div>
      </div>

      {/* Server error banner (500s) */}
      {is500Error && serverError && (
        <ErrorBanner message={serverError} onRetry={handleRetry} />
      )}

      {/* Auth / permission error (non-500) */}
      {serverError && !is500Error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 animate-in fade-in duration-300">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {serverError}
          </p>
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <div className="max-w-lg mx-auto">
          <ConfigSkeleton />
        </div>
      ) : (
        !serverError && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Status card (only when config exists) */}
            {config && (
              <SaveStatusCard config={config} references={references} />
            )}

            {/* First time setup hint */}
            {isFirstTimeSetup && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 animate-in fade-in duration-300">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Welcome!</strong> This is your first time setting up a
                  payment collection channel. Select your channel and enter your
                  account details below.
                </p>
              </div>
            )}

            {/* Config form */}
            <PaymentConfigForm
              references={references}
              existingConfig={config}
              isSaving={isSaving}
              fieldErrors={fieldErrors}
              onSave={handleSave}
              onFieldErrorsClear={clearFieldErrors}
            />
          </div>
        )
      )}
    </div>
  )
}
