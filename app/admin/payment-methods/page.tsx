"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  AlertCircle,
  Loader2,
  Shield,
  CreditCard,
  RefreshCw,
  Building2,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useTumaReferences } from "@/hooks/use-tuma-references"
import { useTumaConfig } from "@/hooks/use-tuma-config"

// --- Helpers -----------------------------------------------------------------

function getAccountLabel(code: string): string {
  if (code === "BUYGOODS") return "Till Number"
  if (code === "PAYBILL") return "Paybill Number"
  return "Account Number"
}

function getAccountPlaceholder(code: string): string {
  if (code === "BUYGOODS") return "e.g. 123456"
  if (code === "PAYBILL") return "e.g. 600100"
  return "e.g. 1234567890"
}

function getDigitRange(code: string): [number, number] {
  if (code === "BUYGOODS" || code === "PAYBILL") return [5, 12]
  return [6, 20]
}

function maskAccount(value: string): string {
  if (!value || value.length <= 4) return value
  return "\u2022".repeat(value.length - 4) + value.slice(-4)
}

type FieldErrors = {
  collection_reference_id?: string
  collection_account_number?: string
}

// --- Page Component ----------------------------------------------------------

export default function PaymentMethodsPage() {
  // Data hooks
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
    fieldErrors: serverFieldErrors,
    isFirstTimeSetup,
    save,
    refetch: refetchConfig,
    clearFieldErrors,
  } = useTumaConfig()

  // Form state
  const [selectedRefId, setSelectedRefId] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const accountRef = useRef<HTMLInputElement>(null)

  // Sync loaded config into form
  useEffect(() => {
    if (config) {
      setSelectedRefId(String(config.collection_reference_id ?? ""))
      setAccountNumber(config.collection_account_number ?? "")
    }
  }, [config])

  // Derived
  const isLoading = refsLoading || configLoading
  const serverError = refsError || configError
  const is500 = serverError?.includes("500") || serverError?.includes("Server error")
  const isAuth = serverError?.includes("Session expired") || serverError?.includes("permission")

  const selectedRef = useMemo(
    () => references.find((r) => r.id === selectedRefId),
    [references, selectedRefId]
  )
  const selectedCode = selectedRef?.code ?? ""

  // Validation
  const validate = useCallback(
    (refId: string, account: string, code: string): FieldErrors => {
      const errs: FieldErrors = {}
      if (!refId) errs.collection_reference_id = "Please select a collection channel."
      if (!account.trim()) {
        errs.collection_account_number = getAccountLabel(code) + " is required."
      } else if (!/^\d+$/.test(account.trim())) {
        errs.collection_account_number = "Must contain digits only."
      } else {
        const [min, max] = getDigitRange(code)
        if (account.trim().length < min || account.trim().length > max) {
          errs.collection_account_number = "Must be between " + min + " and " + max + " digits."
        }
      }
      return errs
    },
    []
  )

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const errs = validate(selectedRefId, accountNumber, selectedCode)
    setClientErrors((prev) => ({ ...prev, [field]: errs[field] }))
    clearFieldErrors()
  }

  const handleRefChange = (value: string) => {
    setSelectedRefId(value)
    setClientErrors((prev) => ({ ...prev, collection_reference_id: undefined }))
    clearFieldErrors()
    const newRef = references.find((r) => r.id === value)
    if (newRef?.code !== selectedCode) {
      setAccountNumber("")
      setClientErrors((prev) => ({ ...prev, collection_account_number: undefined }))
      setTouched((prev) => ({ ...prev, collection_account_number: false }))
    }
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "")
    setAccountNumber(cleaned)
    if (touched.collection_account_number) {
      const errs = validate(selectedRefId, cleaned, selectedCode)
      setClientErrors((prev) => ({
        ...prev,
        collection_account_number: errs.collection_account_number,
      }))
    }
    clearFieldErrors()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(selectedRefId, accountNumber, selectedCode)
    setClientErrors(errs)
    setTouched({ collection_reference_id: true, collection_account_number: true })
    if (Object.keys(errs).length > 0) return

    // Confirmation when changing existing config
    if (
      config &&
      (String(config.collection_reference_id) !== selectedRefId ||
        config.collection_account_number !== accountNumber.trim())
    ) {
      setShowConfirmDialog(true)
      return
    }
    await doSave()
  }

  const doSave = async () => {
    setShowConfirmDialog(false)
    const success = await save({
      collection_reference_id: selectedRefId,
      collection_account_number: accountNumber.trim(),
    })
    if (success) {
      toast.success("Payment configuration saved", {
        description: "Your collection channel is now active.",
      })
    } else {
      toast.error("Failed to save configuration", {
        description: "Please check the form for errors and try again.",
      })
    }
  }

  const handleRetry = () => {
    refetchRefs()
    refetchConfig()
  }

  // Merge errors (client first, then server)
  const refError = clientErrors.collection_reference_id || serverFieldErrors.collection_reference_id
  const accountError = clientErrors.collection_account_number || serverFieldErrors.collection_account_number

  // --- Loading state ---------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="max-w-xl space-y-5">
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  // --- Main render -----------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up how you receive payments from your customers.
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Error banner */}
        {serverError && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 animate-in fade-in slide-in-from-top-2 duration-300 ${
              isAuth
                ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
            }`}
          >
            <AlertCircle
              className={`h-5 w-5 shrink-0 mt-0.5 ${isAuth ? "text-amber-600" : "text-red-600"}`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  isAuth
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {serverError}
              </p>
              {is500 && (
                <p className="text-xs text-muted-foreground mt-1">
                  If this persists, contact support.
                </p>
              )}
            </div>
            {is500 && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Status card */}
        {config && (
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-green-950/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      Payment Collection Active
                    </p>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                      Connected
                    </Badge>
                  </div>
                  <Separator className="my-3 bg-emerald-200/60 dark:bg-emerald-800/40" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {config.business_id && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Business ID</p>
                          <p className="font-medium text-emerald-900 dark:text-emerald-100 break-all">
                            {config.business_id}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Channel</p>
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">
                          {references.find(
                            (r) => r.id === String(config.collection_reference_id)
                          )?.name || config.reference_name || "\u2014"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Account</p>
                        <p className="font-medium font-mono tracking-wider text-emerald-900 dark:text-emerald-100">
                          {maskAccount(config.collection_account_number || "")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Collection Method</CardTitle>
            <CardDescription>
              {isFirstTimeSetup
                ? "Choose your collection channel and enter account details to start receiving payments."
                : "Update your collection channel or account details below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Collection Channel */}
              <div className="space-y-2">
                <Label htmlFor="collection-channel" className="text-sm font-medium">
                  Collection Channel <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedRefId} onValueChange={handleRefChange}>
                  <SelectTrigger
                    id="collection-channel"
                    className={`w-full transition-colors ${
                      refError
                        ? "border-red-400 focus-visible:ring-red-400/30"
                        : "focus-visible:border-primary"
                    }`}
                    onBlur={() => handleBlur("collection_reference_id")}
                    aria-invalid={!!refError}
                    aria-describedby={refError ? "ref-error" : undefined}
                  >
                    <SelectValue placeholder="Select a channel\u2026" />
                  </SelectTrigger>
                  <SelectContent>
                    {references.length === 0 ? (
                      <div className="p-3 text-sm text-center text-muted-foreground">
                        No channels available.
                      </div>
                    ) : (
                      references.map((ref) => (
                        <SelectItem key={ref.id} value={ref.id}>
                          <span className="flex items-center gap-2">
                            {ref.name}
                            {ref.code && (
                              <span className="text-xs text-muted-foreground">({ref.code})</span>
                            )}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {refError && (
                  <p
                    id="ref-error"
                    className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"
                    role="alert"
                  >
                    {refError}
                  </p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-sm font-medium">
                  {getAccountLabel(selectedCode)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={accountRef}
                  id="account-number"
                  type="text"
                  inputMode="numeric"
                  placeholder={getAccountPlaceholder(selectedCode)}
                  value={accountNumber}
                  onChange={handleAccountChange}
                  onBlur={() => handleBlur("collection_account_number")}
                  className={`transition-colors ${
                    accountError
                      ? "border-red-400 focus-visible:ring-red-400/30"
                      : "focus-visible:border-primary"
                  }`}
                  aria-invalid={!!accountError}
                  aria-describedby={
                    accountError ? "account-error" : selectedCode ? "account-hint" : undefined
                  }
                  maxLength={20}
                  autoComplete="off"
                />
                {accountError ? (
                  <p
                    id="account-error"
                    className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"
                    role="alert"
                  >
                    {accountError}
                  </p>
                ) : selectedCode ? (
                  <p id="account-hint" className="text-xs text-muted-foreground">
                    {(() => {
                      const [min, max] = getDigitRange(selectedCode)
                      return min + "\u2013" + max + " digits required"
                    })()}
                  </p>
                ) : null}
              </div>

              {/* Save */}
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Payment Channel?</DialogTitle>
            <DialogDescription>
              You are about to change your active payment collection configuration. This will
              update how customer payments are routed.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">New channel:</span>{" "}
              <span className="font-medium">{selectedRef?.name ?? "\u2014"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{getAccountLabel(selectedCode)}:</span>{" "}
              <span className="font-medium font-mono">{accountNumber}</span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}