"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { MpesaPaymentModal } from "@/components/mpesa-payment-modal"

interface InvoiceRecord {
  id: number
  invoice_number: string
  total_amount: string
  amount_paid?: string
  balance_due?: string
  status: string
  invoice_date: string
  due_date: string
  period_start?: string
  period_end?: string
  items?: Array<{ description: string; quantity: number; unit_price: string; total: string }>
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  paid: { color: "text-success dark:text-success", bg: "bg-success/15 dark:bg-green-950" },
  pending: { color: "text-warning dark:text-warning", bg: "bg-warning/15 dark:bg-yellow-950" },
  issued: { color: "text-primary dark:text-primary/80", bg: "bg-primary/15 dark:bg-blue-950" },
  sent: { color: "text-primary dark:text-primary/80", bg: "bg-primary/15 dark:bg-blue-950" },
  overdue: { color: "text-destructive dark:text-destructive", bg: "bg-destructive/15 dark:bg-red-950" },
  partial: { color: "text-warning dark:text-warning", bg: "bg-warning/15 dark:bg-orange-950" },
  draft: { color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  cancelled: { color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
}

export default function CustomerInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payInvoice, setPayInvoice] = useState<InvoiceRecord | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getInvoices()
        if (Array.isArray(data)) {
          setInvoices(data)
        } else if (data.results) {
          setInvoices(data.results)
        }
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [router])

  const handlePayInvoice = (invoice: InvoiceRecord) => {
    setPayInvoice(invoice)
    setShowPaymentModal(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and pay your invoices
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-1">No Invoices</h3>
          <p className="text-muted-foreground text-sm">
            Your invoices will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const config = statusConfig[invoice.status] || statusConfig.draft
            const balance = parseFloat(invoice.balance_due || invoice.total_amount || "0")
            const isPayable = ["pending", "issued", "sent", "overdue", "partial"].includes(invoice.status) && balance > 0

            return (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/15 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary dark:text-primary/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <Badge variant="outline" className={`text-xs ${config.color} ${config.bg}`}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>
                        Issued: {new Date(invoice.invoice_date).toLocaleDateString("en-KE", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                      <span>
                        Due: {new Date(invoice.due_date).toLocaleDateString("en-KE", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span>
                        Total: <strong>KSh {parseFloat(invoice.total_amount).toLocaleString()}</strong>
                      </span>
                      {invoice.balance_due && parseFloat(invoice.balance_due) > 0 && (
                        <span className="text-destructive dark:text-destructive">
                          Balance: KSh {parseFloat(invoice.balance_due).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isPayable && (
                    <Button
                      size="sm"
                      onClick={() => handlePayInvoice(invoice)}
                      className="flex-shrink-0"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Modal */}
      {payInvoice && (
        <MpesaPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPayInvoice(null)
          }}
          planId={0}
          planName={`Invoice ${payInvoice.invoice_number}`}
          amount={payInvoice.balance_due || payInvoice.total_amount}
          billingPeriod="once"
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
