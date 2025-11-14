"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"
import { useState } from "react"

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const invoices = [
    { id: "27656", date: "09/11/2025", amount: 1500, status: "Paid", type: "Plan Renewal" },
    { id: "27550", date: "08/11/2025", amount: 1500, status: "Paid", type: "Plan Renewal" },
    { id: "27549", date: "07/11/2025", amount: 1500, status: "Paid", type: "Plan Renewal" },
  ]

  const filtered = invoices.filter(
    (inv) =>
      inv.id.includes(searchTerm) ||
      inv.date.includes(searchTerm) ||
      inv.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>

      <Card className="p-6 bg-white">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Invoice No</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-slate-900 font-medium">{invoice.id}</td>
                  <td className="py-4 px-4 text-slate-600">{invoice.date}</td>
                  <td className="py-4 px-4 text-slate-600">{invoice.type}</td>
                  <td className="py-4 px-4 text-right text-slate-900 font-semibold">KSh {invoice.amount}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
