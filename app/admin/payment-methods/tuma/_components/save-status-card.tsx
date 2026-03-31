"use client"

import { CheckCircle, Shield, Building2, Hash, CreditCard } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TumaConfig } from "@/hooks/use-tuma-config"
import type { TumaReference } from "@/hooks/use-tuma-references"

interface SaveStatusCardProps {
  config: TumaConfig
  references: TumaReference[]
}

function maskAccountNumber(value: string): string {
  if (!value || value.length <= 4) return value
  return "•".repeat(value.length - 4) + value.slice(-4)
}

export function SaveStatusCard({ config, references }: SaveStatusCardProps) {
  const matchedRef = references.find(
    (r) => r.id === config.collection_reference_id
  )
  const channelName = matchedRef?.name || config.reference_name || "Unknown"
  const channelCode = matchedRef?.code || config.reference_code || ""

  return (
    <Card className="border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 animate-in fade-in slide-in-from-top-3 duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1.5">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Payment Gateway
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {config.business_id && (
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Business ID</span>
            <span className="ml-auto font-mono text-foreground">
              {config.business_id}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Channel</span>
          <span className="ml-auto font-medium text-foreground">
            {channelName}
            {channelCode && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({channelCode})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Account</span>
          <span className="ml-auto font-mono text-foreground tracking-wider">
            {maskAccountNumber(config.collection_account_number)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
