"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TumaReference } from "@/hooks/use-tuma-references"
import type { TumaConfig } from "@/hooks/use-tuma-config"

interface PaymentConfigFormProps {
  references: TumaReference[]
  existingConfig: TumaConfig | null
  isSaving: boolean
  fieldErrors: {
    collection_reference_id?: string
    collection_account_number?: string
  }
  onSave: (data: {
    collection_reference_id: string
    collection_account_number: string
  }) => Promise<boolean>
  onFieldErrorsClear: () => void
}

interface FormErrors {
  collection_reference_id?: string
  collection_account_number?: string
}

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

export function PaymentConfigForm({
  references,
  existingConfig,
  isSaving,
  fieldErrors,
  onSave,
  onFieldErrorsClear,
}: PaymentConfigFormProps) {
  const [selectedRefId, setSelectedRefId] = useState(
    existingConfig?.collection_reference_id || ""
  )
  const [accountNumber, setAccountNumber] = useState(
    existingConfig?.collection_account_number || ""
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const accountInputRef = useRef<HTMLInputElement>(null)

  // Sync with external config changes
  useEffect(() => {
    if (existingConfig) {
      setSelectedRefId(existingConfig.collection_reference_id || "")
      setAccountNumber(existingConfig.collection_account_number || "")
    }
  }, [existingConfig])

  const selectedRef = references.find((r) => r.id === selectedRefId)
  const selectedCode = selectedRef?.code || ""

  const validate = useCallback(
    (
      refId: string,
      account: string,
      code: string
    ): FormErrors => {
      const errs: FormErrors = {}
      if (!refId) {
        errs.collection_reference_id = "Please select a collection channel."
      }
      if (!account.trim()) {
        errs.collection_account_number = `${getAccountLabel(code)} is required.`
      } else if (!/^\d+$/.test(account.trim())) {
        errs.collection_account_number = "Must contain digits only."
      } else {
        const [min, max] = getDigitRange(code)
        if (account.trim().length < min || account.trim().length > max) {
          errs.collection_account_number = `Must be between ${min} and ${max} digits.`
        }
      }
      return errs
    },
    []
  )

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const code =
      field === "collection_reference_id"
        ? references.find((r) => r.id === selectedRefId)?.code || ""
        : selectedCode
    const validationErrors = validate(selectedRefId, accountNumber, code)
    setErrors((prev) => ({
      ...prev,
      [field]: validationErrors[field as keyof FormErrors],
    }))
    onFieldErrorsClear()
  }

  const handleRefChange = (value: string) => {
    setSelectedRefId(value)
    setErrors((prev) => ({ ...prev, collection_reference_id: undefined }))
    onFieldErrorsClear()
    // Clear account if switching channel types (different validation)
    const newRef = references.find((r) => r.id === value)
    const oldRef = references.find((r) => r.id === selectedRefId)
    if (newRef?.code !== oldRef?.code) {
      setAccountNumber("")
      setErrors((prev) => ({ ...prev, collection_account_number: undefined }))
      setTouched((prev) => ({ ...prev, collection_account_number: false }))
    }
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setAccountNumber(value)
    if (touched.collection_account_number) {
      const validationErrors = validate(selectedRefId, value, selectedCode)
      setErrors((prev) => ({
        ...prev,
        collection_account_number:
          validationErrors.collection_account_number,
      }))
    }
    onFieldErrorsClear()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(selectedRefId, accountNumber, selectedCode)
    setErrors(validationErrors)
    setTouched({
      collection_reference_id: true,
      collection_account_number: true,
    })

    if (Object.keys(validationErrors).length > 0) return

    // If there's an existing config and the user is changing it, show confirmation
    if (
      existingConfig &&
      (existingConfig.collection_reference_id !== selectedRefId ||
        existingConfig.collection_account_number !== accountNumber.trim())
    ) {
      setShowConfirmDialog(true)
      return
    }

    await doSave()
  }

  const doSave = async () => {
    setShowConfirmDialog(false)
    await onSave({
      collection_reference_id: selectedRefId,
      collection_account_number: accountNumber.trim(),
    })
  }

  const refError =
    errors.collection_reference_id || fieldErrors.collection_reference_id
  const accountError =
    errors.collection_account_number || fieldErrors.collection_account_number

  return (
    <>
      <Card className="transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Configure Collection Channel</CardTitle>
          <CardDescription>
            {existingConfig
              ? "Update your Tuma payment collection settings below."
              : "Set up your Tuma payment collection channel to start receiving payments."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Collection Channel Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="collection-channel"
                className="text-sm font-medium"
              >
                Collection Channel <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedRefId}
                onValueChange={handleRefChange}
              >
                <SelectTrigger
                  id="collection-channel"
                  className={`w-full transition-colors duration-200 ${
                    refError
                      ? "border-red-400 focus-visible:ring-red-400/30"
                      : "focus-visible:border-primary"
                  }`}
                  onBlur={() => handleBlur("collection_reference_id")}
                  aria-invalid={!!refError}
                  aria-describedby={refError ? "ref-error" : undefined}
                >
                  <SelectValue placeholder="Select a channel…" />
                </SelectTrigger>
                <SelectContent>
                  {references.map((ref) => (
                    <SelectItem key={ref.id} value={ref.id}>
                      {ref.name}
                      {ref.code && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({ref.code})
                        </span>
                      )}
                    </SelectItem>
                  ))}
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

            {/* Dynamic Account Number Input */}
            <div className="space-y-2">
              <Label htmlFor="account-number" className="text-sm font-medium">
                {getAccountLabel(selectedCode)}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={accountInputRef}
                id="account-number"
                type="text"
                inputMode="numeric"
                placeholder={getAccountPlaceholder(selectedCode)}
                value={accountNumber}
                onChange={handleAccountChange}
                onBlur={() => handleBlur("collection_account_number")}
                className={`transition-colors duration-200 ${
                  accountError
                    ? "border-red-400 focus-visible:ring-red-400/30"
                    : "focus-visible:border-primary"
                }`}
                aria-invalid={!!accountError}
                aria-describedby={accountError ? "account-error" : undefined}
                maxLength={20}
                autoComplete="off"
              />
              {accountError && (
                <p
                  id="account-error"
                  className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"
                  role="alert"
                >
                  {accountError}
                </p>
              )}
              {selectedCode && !accountError && (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const [min, max] = getDigitRange(selectedCode)
                    return `${min}–${max} digits required`
                  })()}
                </p>
              )}
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog (only when changing existing active config) */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Configuration?</DialogTitle>
            <DialogDescription>
              You are about to change an active payment collection channel. This
              may affect ongoing payment processing. Are you sure you want to
              continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={doSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Yes, Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
