"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  X,
  AlertCircle,
  Users,
  RefreshCw,
  Eye,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

interface ImportRow {
  id: number
  fullName: string
  username: string
  email: string
  phone: string
  package: string
  status: "valid" | "warning" | "error"
  errors: string[]
}

export default function ImportUsersPage() {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  const [previewData, setPreviewData] = useState<ImportRow[]>([
    { id: 1, fullName: "John Doe", username: "john.doe", email: "john@example.com", phone: "+254712345678", package: "Premium 50Mbps", status: "valid", errors: [] },
    { id: 2, fullName: "Jane Smith", username: "jane.smith", email: "jane@example.com", phone: "+254722345678", package: "Basic 20Mbps", status: "valid", errors: [] },
    { id: 3, fullName: "Mike Wilson", username: "mike", email: "mike@example", phone: "+254732345678", package: "Premium 100Mbps", status: "error", errors: ["Invalid email format"] },
    { id: 4, fullName: "Sarah Johnson", username: "sarah.j", email: "sarah@example.com", phone: "+254742345678", package: "Unknown Plan", status: "warning", errors: ["Package not found - will use default"] },
    { id: 5, fullName: "Tom Brown", username: "tom.brown", email: "tom@example.com", phone: "+254752345678", package: "Basic 10Mbps", status: "valid", errors: [] },
  ])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile)
    } else {
      toast.error("Please upload a CSV or Excel file")
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handlePreview = () => {
    // Simulate file parsing
    setStep("preview")
    setSelectedRows(previewData.filter(row => row.status !== "error").map(row => row.id))
  }

  const handleImport = () => {
    setStep("importing")
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setImportProgress(progress)
      setImportedCount(Math.floor((progress / 100) * selectedRows.length))
      if (progress >= 100) {
        clearInterval(interval)
        setStep("complete")
      }
    }, 500)
  }

  const toggleRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleAllRows = () => {
    if (selectedRows.length === previewData.filter(r => r.status !== "error").length) {
      setSelectedRows([])
    } else {
      setSelectedRows(previewData.filter(r => r.status !== "error").map(r => r.id))
    }
  }

  const validRows = previewData.filter(r => r.status === "valid").length
  const warningRows = previewData.filter(r => r.status === "warning").length
  const errorRows = previewData.filter(r => r.status === "error").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Import Users</h1>
          <p className="text-slate-600 mt-1">Bulk import users from CSV or Excel file</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/templates/users-import-template.csv" download>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </a>
        </Button>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4">
        {["Upload File", "Preview Data", "Import"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${(step === "upload" && index === 0) || 
                (step === "preview" && index === 1) || 
                ((step === "importing" || step === "complete") && index === 2)
                ? "bg-blue-600 text-white" 
                : index < (step === "preview" ? 1 : step === "importing" || step === "complete" ? 2 : 0)
                ? "bg-green-600 text-white"
                : "bg-slate-200 text-slate-600"}`}
            >
              {index < (step === "preview" ? 1 : step === "importing" || step === "complete" ? 2 : 0) ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {index < 2 && <div className="w-16 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file with user data. Download the template to see the required format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                {file ? file.name : "Drop your file here"}
              </h3>
              <p className="text-slate-500 mt-2">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
              />
              <div className="mt-4">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Check className="w-3 h-3 mr-1" />
                      File ready
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="file-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Required Columns</AlertTitle>
              <AlertDescription>
                Your file must include: Full Name, Username, Email, Phone, Package. 
                Optional: Address, Router, Expiry Date, PPPoE Username
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handlePreview} disabled={!file}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Valid</p>
                    <p className="text-2xl font-bold text-green-800">{validRows}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-800">{warningRows}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">Errors</p>
                    <p className="text-2xl font-bold text-red-800">{errorRows}</p>
                  </div>
                  <X className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Data ({selectedRows.length} selected)</CardTitle>
              <CardDescription>Review and select rows to import. Rows with errors cannot be imported.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedRows.length === previewData.filter(r => r.status !== "error").length}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row) => (
                    <TableRow key={row.id} className={row.status === "error" ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedRows.includes(row.id)}
                          disabled={row.status === "error"}
                          onCheckedChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell>{row.username}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.package}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.status === "valid" && (
                            <Badge className="bg-green-100 text-green-700">Valid</Badge>
                          )}
                          {row.status === "warning" && (
                            <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                          )}
                          {row.status === "error" && (
                            <Badge className="bg-red-100 text-red-700">Error</Badge>
                          )}
                          {row.errors.length > 0 && (
                            <span className="text-xs text-slate-500">{row.errors[0]}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleImport} disabled={selectedRows.length === 0}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {selectedRows.length} Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Importing Step */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-6" />
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">Importing Users...</h3>
            <p className="text-slate-500 mb-6">Please wait while we import your users.</p>
            <div className="max-w-md mx-auto">
              <Progress value={importProgress} className="h-2 mb-2" />
              <p className="text-sm text-slate-500">
                {importedCount} of {selectedRows.length} users imported
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">Import Complete!</h3>
            <p className="text-slate-500 mb-6">
              Successfully imported {selectedRows.length} users.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => {
                setStep("upload")
                setFile(null)
                setImportProgress(0)
                setImportedCount(0)
              }}>
                Import More
              </Button>
              <Button asChild>
                <Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  View Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
