"use client"

import { useState, useEffect } from "react"
import { api, Invoice } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, Eye, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all")

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await api.getInvoices()
      setInvoices(response.results || [])
    } catch (error) {
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "paid") return inv.paid
    if (filter === "unpaid") return !inv.paid
    return true
  })
  
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const paidAmount = filteredInvoices
    .filter((inv) => inv.paid)
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const unpaidAmount = totalAmount - paidAmount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-600 mt-1">View and manage your billing invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                KSh {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                KSh {paidAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Unpaid</p>
              <p className="text-2xl font-bold text-orange-600">
                KSh {unpaidAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({invoices.length})
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("paid")}
          >
            Paid ({invoices.filter((i) => i.paid).length})
          </Button>
          <Button
            variant={filter === "unpaid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unpaid")}
          >
            Unpaid ({invoices.filter((i) => !i.paid).length})
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold">Invoice History</h2>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">#{invoice.id}</TableCell>
                  <TableCell>
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    KSh {parseFloat(invoice.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {invoice.paid ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}