"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Users,
  RefreshCw,
  ChevronRight,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type ImportStatus = "idle" | "preview" | "importing" | "done"

interface ImportRow {
  row: number
  fullName: string
  email: string
  phone: string
  plan: string
  status: "valid" | "error"
  error?: string
}

const TEMPLATE_HEADERS = ["full_name", "email", "phone", "plan_name", "address", "notes"]

const SAMPLE_ROWS: ImportRow[] = [
  { row: 1, fullName: "Jane Doe", email: "jane@example.com", phone: "0712345678", plan: "Premium 50Mbps", status: "valid" },
  { row: 2, fullName: "John Mwangi", email: "john@example.com", phone: "0723456789", plan: "Basic 10Mbps", status: "valid" },
  { row: 3, fullName: "Alice Njeri", email: "", phone: "0734567890", plan: "Basic 20Mbps", status: "error", error: "Email is required" },
  { row: 4, fullName: "Peter Kamau", email: "peter@example.com", phone: "0745678901", plan: "Premium 100Mbps", status: "valid" },
  { row: 5, fullName: "Grace Achieng", email: "grace@example.com", phone: "", plan: "Basic 10Mbps", status: "error", error: "Phone is required" },
]

export default function UsersImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [failed, setFailed] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const validRows = rows.filter((r) => r.status === "valid")
  const errorRows = rows.filter((r) => r.status === "error")

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file")
      return
    }
    setFileName(file.name)
    // Simulate parsing — in production this would parse the CSV
    setRows(SAMPLE_ROWS)
    setImportStatus("preview")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleImport = async () => {
    setImportStatus("importing")
    setProgress(0)
    // Simulate import progress
    let done = 0
    for (const row of validRows) {
      await new Promise((res) => setTimeout(res, 300))
      done++
      setProgress(Math.round((done / validRows.length) * 100))
    }
    setImported(validRows.length)
    setFailed(errorRows.length)
    setImportStatus("done")
    toast.success(`${validRows.length} users imported successfully`)
  }

  const handleReset = () => {
    setImportStatus("idle")
    setFileName(null)
    setRows([])
    setProgress(0)
    setImported(0)
    setFailed(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(",") + "\nJane Doe,jane@example.com,0712345678,Premium 50Mbps,Westlands,\n"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Import Users</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bulk import customers from a CSV file</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-medium ${importStatus === "idle" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
          1. Upload File
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className={`font-medium ${importStatus === "preview" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
          2. Preview & Validate
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className={`font-medium ${importStatus === "importing" || importStatus === "done" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
          3. Import
        </span>
      </div>

      {/* Step 1 — Upload */}
      {importStatus === "idle" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file with your customer data. Download the template below to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Drop your CSV file here, or click to browse
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports .csv files up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>

              <Separator />

              {/* Template download */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">users_import_template.csv</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Required columns: {TEMPLATE_HEADERS.join(", ")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
              <Badge variant="outline">{rows.length} rows</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Upload Different File
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{rows.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Valid</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{validRows.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Errors</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{errorRows.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {errorRows.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorRows.length} rows have errors and will be skipped. Only {validRows.length} valid rows will be imported.</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Review the data before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.row} className={row.status === "error" ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                      <TableCell className="text-slate-400 text-xs">{row.row}</TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell>{row.email || <span className="text-red-500 text-xs italic">missing</span>}</TableCell>
                      <TableCell>{row.phone || <span className="text-red-500 text-xs italic">missing</span>}</TableCell>
                      <TableCell>{row.plan}</TableCell>
                      <TableCell>
                        {row.status === "valid" ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="w-3 h-3" /> {row.error}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Importing Users...</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we import your users</p>
            <div className="max-w-sm mx-auto space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{progress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Done */}
      {importStatus === "done" && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Import Complete!</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Successfully imported <span className="font-bold text-green-600 dark:text-green-400">{imported}</span> users.
              {failed > 0 && (
                <> <span className="font-bold text-red-500">{failed}</span> rows were skipped due to errors.</>
              )}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={handleReset}>
                <Upload className="w-4 h-4 mr-2" />
                Import More
              </Button>
              <Button onClick={() => router.push("/admin/users")}>
                <Users className="w-4 h-4 mr-2" />
                View Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
