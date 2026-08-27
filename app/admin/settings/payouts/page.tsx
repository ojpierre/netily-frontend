"use client"

import React, { useState, useEffect } from "react"
import {
  Building,
  Smartphone,
  Phone,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Shield,
  Calendar,
  DollarSign,
  ArrowRight,
  Copy,
  Info,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { adminApi } from "@/lib/admin-api"
import type { ISPPayoutConfig, PayoutMethod, SettlementSummary } from "@/lib/types"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// ==========================================
// PAYOUT METHOD OPTIONS
// ==========================================

const PAYOUT_METHODS = [
  {
    id: "mpesa" as PayoutMethod,
    name: "M-Pesa",
    description: "Receive payments directly to your M-Pesa",
    icon: Smartphone,
  },
  {
    id: "bank" as PayoutMethod,
    name: "Bank Transfer",
    description: "Receive payments to your bank account",
    icon: Building,
  },
]

const KENYAN_BANKS = [
  "Equity Bank",
  "Kenya Commercial Bank (KCB)",
  "Co-operative Bank",
  "Standard Chartered Bank",
  "Barclays Bank of Kenya",
  "Diamond Trust Bank",
  "I&M Bank",
  "Family Bank",
  "NCBA Bank",
  "Stanbic Bank",
  "National Bank of Kenya",
  "Prime Bank",
  "Bank of Baroda",
  "Ecobank",
  "GT Bank",
  "Credit Bank",
  "Sidian Bank",
  "Victoria Commercial Bank",
  "Guardian Bank",
  "Trans-National Bank",
]

const PAYOUT_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PayoutSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [config, setConfig] = useState<ISPPayoutConfig | null>(null)
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  
  // Form state
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaName, setMpesaName] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [bankBranch, setBankBranch] = useState("")
  const [swiftCode, setSwiftCode] = useState("")
  const [minPayoutAmount, setMinPayoutAmount] = useState("1000")
  const [autoPayout, setAutoPayout] = useState(true)
  const [autoPayoutDay, setAutoPayoutDay] = useState(25)

  // Load config and summary on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configData, summaryData] = await Promise.all([
        adminApi.getPayoutConfig(),
        adminApi.getSettlementSummary(),
      ])

      setSummary(summaryData)

      if (configData) {
        setConfig(configData)
        // Populate form with existing config
        setPayoutMethod(configData.payout_method)
        setMpesaPhone(configData.mpesa_phone || "")
        setMpesaName(configData.mpesa_name || "")
        setBankName(configData.bank_name || "")
        setAccountNumber(configData.bank_account_number || "")
        setAccountName(configData.bank_account_name || "")
        setBankBranch(configData.bank_branch || "")
        setSwiftCode(configData.bank_swift_code || "")
        setMinPayoutAmount(configData.min_payout_amount || "1000")
        setAutoPayout(configData.auto_payout_enabled)
        setAutoPayoutDay(configData.auto_payout_day)
      }
    } catch (error) {
      console.error("Failed to load payout config:", error)
      toast.error("Failed to load payout settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate based on payment method
    if (payoutMethod === "mpesa") {
      if (!mpesaPhone || !mpesaName) {
        toast.error("Please fill in all M-Pesa details")
        return
      }
      // Validate phone format
      if (!/^(?:254|0)?[17]\d{8}$/.test(mpesaPhone.replace(/\s/g, ""))) {
        toast.error("Please enter a valid Kenyan phone number")
        return
      }
    } else {
      if (!bankName || !accountNumber || !accountName) {
        toast.error("Please fill in all bank details")
        return
      }
    }

    setSaving(true)
    try {
      const data: Partial<ISPPayoutConfig> = {
        payout_method: payoutMethod,
        mpesa_phone: payoutMethod === "mpesa" ? mpesaPhone : null,
        mpesa_name: payoutMethod === "mpesa" ? mpesaName : null,
        bank_name: payoutMethod === "bank" ? bankName : null,
        bank_account_number: payoutMethod === "bank" ? accountNumber : null,
        bank_account_name: payoutMethod === "bank" ? accountName : null,
        bank_branch: payoutMethod === "bank" ? bankBranch : null,
        bank_swift_code: payoutMethod === "bank" ? swiftCode : null,
        min_payout_amount: minPayoutAmount,
        auto_payout_enabled: autoPayout,
        auto_payout_day: autoPayoutDay,
      }

      const updatedConfig = await adminApi.updatePayoutConfig(data)
      setConfig(updatedConfig)
      toast.success("Payout settings saved successfully!")
    } catch (error) {
      console.error("Failed to save payout config:", error)
      toast.error("Failed to save payout settings")
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const result = await adminApi.verifyPayoutConfig()
      if (result.verified) {
        toast.success(result.message || "Payout method verified successfully!")
        // Reload to get updated verification status
        await loadData()
      } else {
        toast.error(result.message || "Verification failed")
      }
    } catch (error) {
      console.error("Failed to verify payout config:", error)
      toast.error("Verification failed. Please check your details.")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Payout Settings</h1>
        <p className="text-muted-foreground">
          Configure how and when you receive payments from customer transactions.
        </p>
      </div>

      {/* Pending Balance Card */}
      {summary && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20 dark:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Available for Payout</p>
                <p className="text-2xl font-bold text-primary dark:text-primary/80">
                  {formatCurrency(summary.pending_balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gross</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(summary.total_gross)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Commission (5%)</p>
                <p className="text-xl font-semibold text-warning">
                  {formatCurrency(summary.total_commission)}
                </p>
              </div>
            </div>
            {summary.next_payout_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Next scheduled payout: <strong>{formatDate(summary.next_payout_date)}</strong>
              </div>
            )}
            {summary.last_payout && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                Last payout: {formatCurrency(summary.last_payout.amount)} on {formatDate(summary.last_payout.date)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert for unverified config */}
      {config && !config.is_verified && (
        <Alert variant="destructive" className="border-warning/20 bg-warning/10 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Verification Required</AlertTitle>
          <AlertDescription>
            Your payout details need to be verified before you can receive settlements. 
            Please verify your details below.
          </AlertDescription>
        </Alert>
      )}

      {/* Payout Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Payout Method
          </CardTitle>
          <CardDescription>
            Choose how you want to receive your earnings from customer payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={payoutMethod}
            onValueChange={(value) => setPayoutMethod(value as PayoutMethod)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {PAYOUT_METHODS.map((method) => (
              <div key={method.id}>
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={method.id}
                  className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <method.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Separator />

          {/* M-Pesa Fields */}
          {payoutMethod === "mpesa" && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                M-Pesa Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-phone">M-Pesa Phone Number *</Label>
                  <Input
                    id="mpesa-phone"
                    placeholder="e.g., 254712345678"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter with country code (254) or starting with 07/01
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa-name">Registered Name *</Label>
                  <Input
                    id="mpesa-name"
                    placeholder="Name as registered on M-Pesa"
                    value={mpesaName}
                    onChange={(e) => setMpesaName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer Fields */}
          {payoutMethod === "bank" && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Bank Account Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name *</Label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {KENYAN_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number *</Label>
                  <Input
                    id="account-number"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name *</Label>
                  <Input
                    id="account-name"
                    placeholder="Name on the account"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch (Optional)</Label>
                  <Input
                    id="branch"
                    placeholder="Bank branch"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift">SWIFT Code (Optional)</Label>
                  <Input
                    id="swift"
                    placeholder="For international transfers"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Payout Schedule */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Payout Schedule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-payout">Automatic Payouts</Label>
                  <Switch
                    id="auto-payout"
                    checked={autoPayout}
                    onCheckedChange={setAutoPayout}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically transfer available balance on schedule
                </p>
              </div>
              {autoPayout && (
                <div className="space-y-2">
                  <Label htmlFor="payout-day">Payout Day of Month</Label>
                  <Select
                    value={autoPayoutDay.toString()}
                    onValueChange={(v) => setAutoPayoutDay(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYOUT_DAYS.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day === 1 ? "1st" : day === 2 ? "2nd" : day === 3 ? "3rd" : `${day}th`} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="min-payout">Minimum Payout Amount (KES)</Label>
                <Input
                  id="min-payout"
                  type="number"
                  min="100"
                  step="100"
                  value={minPayoutAmount}
                  onChange={(e) => setMinPayoutAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Payouts will only be made when balance exceeds this amount
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            {config?.is_verified ? (
              <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifying || !config}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Details
                  </>
                )}
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/10/50 dark:border-primary/20 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-primary dark:text-primary/40">
            <Info className="w-4 h-4" />
            How Payouts Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-primary dark:text-primary/60 space-y-2">
          <p>
            When your customers make payments (subscriptions, recharges, or hotspot purchases), 
            the funds are collected by Netily&apos;s payment processor.
          </p>
          <p>
            <strong>Settlement:</strong> Based on your payout schedule, funds are automatically 
            transferred to your configured M-Pesa or bank account.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
