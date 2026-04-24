// app/admin/users/import/page.tsx
"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Upload, FileText, CheckCircle, XCircle,
  AlertTriangle, Download, Users, RefreshCw, ChevronRight, Loader2,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Plan, Router } from "@/lib/types"

type ImportStatus = "idle" | "preview" | "importing" | "done"

interface ParsedRow {
  row: number
  first_name: string
  last_name: string
  phone: string
  email: string
  password: string
  plan_name: string
  pppoe_username: string
  pppoe_password: string
  expires_at: string        // ← ADDED
  expires_at_parsed?: Date  // ← ADDED
  plan_id?: number
  status: "valid" | "error" | "warning"
  errors: string[]
  warnings: string[]
}

interface ImportResult {
  row: number
  name: string
  phone: string
  status: "success" | "failed"
  error?: string
  billing_account?: string
  customer_code?: string
}

// UPDATED: Added expires_at to optional headers
const REQUIRED_HEADERS = ["first_name", "last_name", "phone"]
const OPTIONAL_HEADERS = ["email", "password", "plan_name", "pppoe_username", "pppoe_password", "expires_at"]
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]))
  })
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits
  if (digits.startsWith("254") && digits.length === 12) return digits
  return digits
}

function parseExpiryDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Accept: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59Z`)

  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T23:59:59Z`)

  return null
}

// UPDATED: Extract expires_at from raw row
function validateRow(raw: Record<string, string>, rowNum: number, plans: Plan[]): ParsedRow {
  const errors: string[] = []
  const warnings: string[] = []

  const first_name = raw.first_name?.trim() || ""
  const last_name = raw.last_name?.trim() || ""
  const phone = raw.phone?.trim() || ""
  const email = raw.email?.trim() || ""
  const password = raw.password?.trim() || ""
  const plan_name = raw.plan_name?.trim() || ""
  const pppoe_username = raw.pppoe_username?.trim() || ""
  const pppoe_password = raw.pppoe_password?.trim() || ""
  const expires_at_raw = raw.expires_at?.trim() || ""          // ← ADDED

  if (!first_name) errors.push("first_name required")
  if (!last_name) errors.push("last_name required")
  if (!phone) errors.push("phone required")

  const formatted = phone ? formatPhone(phone) : ""
  if (phone && formatted.length !== 12) errors.push("Invalid phone format (use 07XXXXXXXX)")

  let plan_id: number | undefined
  if (plan_name) {
    const match = plans.find(
      (p) => p.name.toLowerCase() === plan_name.toLowerCase() && p.is_active
    )
    if (match) {
      plan_id = match.id
    } else {
      warnings.push(`Plan "${plan_name}" not found — user will be created without a plan`)
    }
  } else {
    warnings.push("No plan_name — user will be created without a service")
  }

  // ── Expiry date validation ──────────────────────────────────
  let expires_at_parsed: Date | undefined
  if (expires_at_raw) {
    const parsed = parseExpiryDate(expires_at_raw)
    if (!parsed || isNaN(parsed.getTime())) {
      warnings.push(`expires_at "${expires_at_raw}" is not a valid date — plan default will be used`)
    } else if (parsed < new Date()) {
      warnings.push(`expires_at ${expires_at_raw} is in the past — user will be imported as expired`)
      expires_at_parsed = parsed
    } else {
      expires_at_parsed = parsed
    }
  }
  // ────────────────────────────────────────────────────────────

  // Optional: Validate PPPoE username format (should be alphanumeric, no spaces)
  if (pppoe_username && /\s/.test(pppoe_username)) {
    warnings.push(`PPPoE username "${pppoe_username}" contains spaces — will be trimmed`)
  }

  return {
    row: rowNum,
    first_name,
    last_name,
    phone: formatted || phone,
    email,
    password,
    plan_name,
    pppoe_username,
    pppoe_password,
    expires_at: expires_at_raw,
    expires_at_parsed,
    plan_id,
    status: errors.length > 0 ? "error" : "valid",
    errors,
    warnings,
  }
}

export default function UsersImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [routers, setRouters] = useState<Router[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<string>("")
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [currentRowLabel, setCurrentRowLabel] = useState("")

  // 🔧 FIX 1: Prevent browser from opening/downloading dropped files globally
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault()
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  useEffect(() => {
    setLoadingPlans(true)
    Promise.all([
      adminApi.getPlans({ is_active: "true", page_size: "200" }),
      adminApi.getRouters({ page_size: "100" }),
    ]).then(([plansRes, routersRes]) => {
      setPlans(plansRes.results || [])
      setRouters(routersRes.results || [])
    }).finally(() => setLoadingPlans(false))
  }, [])

  const validRows = rows.filter((r) => r.status === "valid")
  const errorRows = rows.filter((r) => r.status === "error")
  const warningRows = rows.filter((r) => r.status === "valid" && r.warnings.length > 0)

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const raw = parseCSV(text)
      const parsed = raw.map((r, i) => validateRow(r, i + 1, plans))
      setRows(parsed)
      setImportStatus("preview")
    }
    reader.readAsText(file)
  }

  // UPDATED: Pass expires_at to importSingleUser
  const handleImport = async () => {
    setImportStatus("importing")
    setProgress(0)
    setResults([])
    const importResults: ImportResult[] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      setCurrentRowLabel(`${row.first_name} ${row.last_name} (${row.phone})`)

      const result = await adminApi.importSingleUser({
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.email || undefined,
        password: row.password || undefined,
        radius_username: row.pppoe_username || undefined,
        radius_password: row.pppoe_password || undefined,
        plan_id: row.plan_id,
        router_id: selectedRouterId ? parseInt(selectedRouterId) : undefined,
        expires_at: row.expires_at_parsed?.toISOString(),   // ← ADDED
      })

      importResults.push({
        row: row.row,
        name: `${row.first_name} ${row.last_name}`,
        phone: row.phone,
        status: result.success ? "success" : "failed",
        error: result.error,
        billing_account: result.billing_account,
        customer_code: (result.customer as any)?.customer_code,
      })

      setProgress(Math.round(((i + 1) / validRows.length) * 100))
      setResults([...importResults])

      // Small delay to avoid hammering the API
      await new Promise((r) => setTimeout(r, 300))
    }

    setImportStatus("done")
    const succeeded = importResults.filter((r) => r.status === "success").length
    toast.success(`Import complete: ${succeeded}/${validRows.length} users created`)
  }

  const handleReset = () => {
    setImportStatus("idle"); setFileName(null); setRows([])
    setProgress(0); setResults([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // UPDATED: Template includes expires_at column
  const downloadTemplate = () => {
    const csv = [
      ALL_HEADERS.join(","),
      "John,Doe,0712345678,john@example.com,password123,Home Basic 20Mbps,712345678,mypassword,2025-06-15",
      "Jane,Smith,0723456789,,secretpass,Premium 50Mbps,,,2025-05-30",
      "Bob,Kamau,0734567890,,,,,,",  // no expiry = use plan default
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "users_import_template.csv"
    a.click(); URL.revokeObjectURL(url)
  }

  const successCount = results.filter((r) => r.status === "success").length
  const failedCount = results.filter((r) => r.status === "failed").length

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Import Users</h1>
          <p className="text-slate-500 text-sm mt-1">Bulk import PPPoE customers from CSV</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {["Upload File", "Preview & Validate", "Import"].map((step, i) => (
          <React.Fragment key={step}>
            <span className={`font-medium ${
              (i === 0 && importStatus === "idle") ||
              (i === 1 && importStatus === "preview") ||
              (i === 2 && (importStatus === "importing" || importStatus === "done"))
                ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
            }`}>{i + 1}. {step}</span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-400" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Upload */}
      {importStatus === "idle" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                <span className="text-red-500">*</span> Required: <code className="bg-slate-100 px-1 rounded text-xs">{REQUIRED_HEADERS.join(", ")}</code>
                <br />
                Optional: <code className="bg-slate-100 px-1 rounded text-xs">{OPTIONAL_HEADERS.join(", ")}</code>
                <br />
                <span className="text-xs text-slate-500 mt-1 block">
                  <Wifi className="w-3 h-3 inline mr-1" />
                  <strong>pppoe_username/pppoe_password</strong>: Leave blank to auto-generate from phone number/portal password
                </span>
                <br />
                <span className="text-xs text-slate-500 mt-1 block">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  <strong>expires_at</strong>: Custom expiry date (YYYY-MM-DD) — overrides plan default
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Router selector */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Default Router (for IP pool assignment)</Label>
                  <p className="text-xs text-slate-500">Optional — applied to all imported users</p>
                </div>
                <Select 
                  value={selectedRouterId || "none"} 
                  onValueChange={(value) => setSelectedRouterId(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-64 bg-white">
                    <SelectValue placeholder="No router selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No router</SelectItem>
                    {routers.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name} ({r.ip_address})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 🔧 FIX 2: Replaced drag zone with proper label-based file picker */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleFileSelect(file)
                }}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                }`}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-base font-medium text-slate-700">Drop CSV here, or</p>
                <label
                  htmlFor="csv-file-input"
                  className="mt-2 inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Choose File
                </label>
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                    e.target.value = "" // reset so same file can be re-selected
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium">users_import_template.csv</p>
                    <p className="text-xs text-slate-500">
                      Plans must match names exactly as they appear in your Plans page
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      💡 <strong>New:</strong> Add pppoe_username and pppoe_password columns for custom RADIUS credentials
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      📅 <strong>expires_at:</strong> Add custom expiry date (YYYY-MM-DD) to override plan default
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />Download Template
                </Button>
              </div>

              {loadingPlans && (
                <p className="text-xs text-slate-500 text-center">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading {plans.length} plans…
                </p>
              )}

              {plans.length > 0 && (
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer hover:text-slate-700">
                    Available plan names ({plans.length})
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plans.map((p) => (
                      <code key={p.id} className="bg-slate-100 px-1.5 py-0.5 rounded">{p.name}</code>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2 — Preview */}
      {importStatus === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium">{fileName}</span>
              <Badge variant="outline">{rows.length} rows</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />Upload Different File
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold">{rows.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div><p className="text-xs text-slate-500">Valid</p><p className="text-xl font-bold">{validRows.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div><p className="text-xs text-slate-500">Errors</p><p className="text-xl font-bold">{errorRows.length}</p></div>
            </CardContent></Card>
          </div>

          {errorRows.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorRows.length} rows have errors and will be skipped. {validRows.length} valid rows will be imported.</span>
            </div>
          )}
          {warningRows.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{warningRows.length} rows have warnings (e.g. plan not found) — they'll still be imported.</span>
            </div>
          )}

          {/* UPDATED: Preview table with PPPoE credentials column AND Expires column */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Review before importing — PPPoE credentials and custom expiry dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>PPPoE Creds</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.row} className={row.status === "error" ? "bg-red-50/50" : ""}>
                        <TableCell className="text-slate-400 text-xs">{row.row}</TableCell>
                        <TableCell className="font-medium">
                          {row.first_name} {row.last_name}
                          {row.email && <span className="block text-xs text-slate-400">{row.email}</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.phone || <span className="text-red-500 text-xs italic">missing</span>}</TableCell>
                        <TableCell>
                          {row.plan_id
                            ? <Badge className="bg-green-100 text-green-700 text-xs">{row.plan_name}</Badge>
                            : row.plan_name
                            ? <Badge className="bg-amber-100 text-amber-700 text-xs">{row.plan_name} (not found)</Badge>
                            : <span className="text-slate-400 text-xs">no plan</span>
                          }
                        </TableCell>
                        <TableCell>
                          {row.pppoe_username || row.pppoe_password ? (
                            <div className="space-y-0.5">
                              {row.pppoe_username && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                  user: {row.pppoe_username}
                                </Badge>
                              )}
                              {row.pppoe_password && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs ml-1">
                                  pass: custom
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Wifi className="w-3 h-3" />
                              auto-generate
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.expires_at_parsed ? (
                            <div>
                              <Badge className={
                                row.expires_at_parsed < new Date()
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }>
                                {row.expires_at_parsed.toLocaleDateString()}
                              </Badge>
                              {row.expires_at_parsed > new Date() && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {Math.ceil((row.expires_at_parsed.getTime() - Date.now()) / 86400000)}d left
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">plan default</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.status === "valid"
                            ? <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>
                            : <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />{row.errors[0]}
                              </Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>Cancel</Button>
            <Button onClick={handleImport} disabled={validRows.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              Import {validRows.length} Users
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Importing */}
      {importStatus === "importing" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-10 pb-10 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-semibold">Importing Users...</h3>
              <p className="text-slate-500 text-sm">{currentRowLabel}</p>
              <div className="max-w-sm mx-auto space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-slate-500">
                  {results.length} / {validRows.length} — {progress}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Live results */}
          {results.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Live Results</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results.map((r) => (
                    <div key={r.row} className={`flex items-center justify-between text-xs p-1.5 rounded ${
                      r.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      <span className="font-medium">{r.name} ({r.phone})</span>
                      <span>
                        {r.status === "success"
                          ? `✓ ${r.customer_code || "created"} ${r.billing_account ? `· ${r.billing_account}` : ""}`
                          : `✗ ${r.error}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3 — Done */}
      {importStatus === "done" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-10 pb-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold">Import Complete!</h3>
              <p className="text-slate-500">
                <span className="font-bold text-green-600">{successCount}</span> created
                {failedCount > 0 && <>, <span className="font-bold text-red-500">{failedCount}</span> failed</>}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={handleReset}><Upload className="w-4 h-4 mr-2" />Import More</Button>
                <Button onClick={() => router.push("/admin/users")}><Users className="w-4 h-4 mr-2" />View Users</Button>
              </div>
            </CardContent>
          </Card>

          {/* Full results table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Customer Code</TableHead>
                      <TableHead>Billing Account</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.row}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="font-mono text-sm">{r.phone}</TableCell>
                        <TableCell>{r.customer_code || "—"}</TableCell>
                        <TableCell>
                          {r.billing_account
                            ? <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono">{r.billing_account}</code>
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          {r.status === "success"
                            ? <Badge className="bg-green-100 text-green-700">Created</Badge>
                            : <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}