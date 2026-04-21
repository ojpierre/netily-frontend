"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Printer,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  QrCode,
  DollarSign,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Voucher {
  id: string
  code: string
  plan: string
  price: number
  validity: number
  status: "unused" | "used" | "expired"
  createdAt: string
  usedAt?: string
  usedBy?: string
  expiresAt?: string
  batch: string
}

export default function VouchersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateDialog, setGenerateDialog] = useState(false)

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    plan: "",
    quantity: "10",
    prefix: "",
    length: "8",
  })

  const vouchers: Voucher[] = [
    { id: "1", code: "PRE50-A8X2K9M3", plan: "Premium 50Mbps", price: 3500, validity: 30, status: "unused", createdAt: "2024-01-15", batch: "BATCH-001" },
    { id: "2", code: "PRE50-B9Y3L0N4", plan: "Premium 50Mbps", price: 3500, validity: 30, status: "unused", createdAt: "2024-01-15", batch: "BATCH-001" },
    { id: "3", code: "BAS20-C1Z4M5P6", plan: "Basic 20Mbps", price: 2000, validity: 30, status: "used", createdAt: "2024-01-10", usedAt: "2024-01-12", usedBy: "john.doe", batch: "BATCH-002" },
    { id: "4", code: "BAS10-D2A5N6Q7", plan: "Basic 10Mbps", price: 1500, validity: 30, status: "expired", createdAt: "2023-12-01", expiresAt: "2024-01-01", batch: "BATCH-003" },
    { id: "5", code: "PRE100-E3B6O7R8", plan: "Premium 100Mbps", price: 5000, validity: 30, status: "unused", createdAt: "2024-01-14", batch: "BATCH-001" },
  ]

  const stats = {
    total: vouchers.length,
    unused: vouchers.filter(v => v.status === "unused").length,
    used: vouchers.filter(v => v.status === "used").length,
    expired: vouchers.filter(v => v.status === "expired").length,
  }

  const filteredVouchers = vouchers.filter(v =>
    v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.plan.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleGenerateVouchers = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setGenerateDialog(false)
      toast.success(`Generated ${generateForm.quantity} vouchers`)
    }, 2000)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Voucher code copied")
  }

  const handleSelectAll = () => {
    if (selectedVouchers.length === filteredVouchers.length) {
      setSelectedVouchers([])
    } else {
      setSelectedVouchers(filteredVouchers.map(v => v.id))
    }
  }

  const handleSelectVoucher = (id: string) => {
    if (selectedVouchers.includes(id)) {
      setSelectedVouchers(selectedVouchers.filter(v => v !== id))
    } else {
      setSelectedVouchers([...selectedVouchers, id])
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Voucher Management</h1>
          <p className="text-slate-600 mt-1">Generate and manage prepaid vouchers</p>
        </div>
        <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Vouchers
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Vouchers</DialogTitle>
              <DialogDescription>Create new voucher codes for a plan</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={generateForm.plan}
                  onValueChange={(value) => setGenerateForm(prev => ({ ...prev, plan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic-10">Basic 10Mbps - KSh 1,500</SelectItem>
                    <SelectItem value="basic-20">Basic 20Mbps - KSh 2,000</SelectItem>
                    <SelectItem value="premium-50">Premium 50Mbps - KSh 3,500</SelectItem>
                    <SelectItem value="premium-100">Premium 100Mbps - KSh 5,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={generateForm.quantity}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, quantity: e.target.value }))}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code Length</Label>
                  <Select
                    value={generateForm.length}
                    onValueChange={(value) => setGenerateForm(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 characters</SelectItem>
                      <SelectItem value="8">8 characters</SelectItem>
                      <SelectItem value="10">10 characters</SelectItem>
                      <SelectItem value="12">12 characters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prefix (Optional)</Label>
                <Input
                  value={generateForm.prefix}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PRE50"
                  maxLength={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateVouchers} disabled={isGenerating || !generateForm.plan}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Vouchers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Unused</p>
                <p className="text-2xl font-bold text-green-800">{stats.unused}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Used</p>
                <p className="text-2xl font-bold text-slate-800">{stats.used}</p>
              </div>
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Expired</p>
                <p className="text-2xl font-bold text-red-800">{stats.expired}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vouchers</CardTitle>
              <CardDescription>Manage all voucher codes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              {selectedVouchers.length > 0 && (
                <>
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print ({selectedVouchers.length})
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedVouchers.length === filteredVouchers.length && filteredVouchers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Voucher Code</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedVouchers.includes(voucher.id)}
                      onCheckedChange={() => handleSelectVoucher(voucher.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                      {voucher.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      {voucher.plan}
                    </div>
                  </TableCell>
                  <TableCell>KSh {voucher.price.toLocaleString()}</TableCell>
                  <TableCell>{voucher.validity} days</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        voucher.status === "unused" ? "bg-green-100 text-green-700" :
                        voucher.status === "used" ? "bg-slate-100 text-slate-700" :
                        "bg-red-100 text-red-700"
                      }
                    >
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(voucher.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {voucher.usedBy ? (
                      <Link href={`/admin/users?q=${voucher.usedBy}`} className="text-blue-600 hover:underline">
                        {voucher.usedBy}
                      </Link>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(voucher.code)}
                      disabled={voucher.status !== "unused"}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
