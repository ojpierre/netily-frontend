"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CreditCard,
  Download,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"

interface PaymentRecord {
  id: number
  payment_number: string
  amount: string
  payment_method: string
  status: string
  reference_number?: string
  mpesa_receipt?: string
  transaction_id?: string
  created_at: string
  invoice_number?: string
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950" },
  pending: { icon: Clock, color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-950" },
  processing: { icon: Loader2, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
  failed: { icon: XCircle, color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
  cancelled: { icon: XCircle, color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
}

export default function CustomerPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getPayments()
        // API may return paginated or array
        if (Array.isArray(data)) {
          setPayments(data)
          setTotalPages(1)
        } else if (data.results) {
          setPayments(data.results)
          setTotalPages(Math.ceil(data.count / 20))
        }
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [router, page])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Payment History</h1>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all your past transactions
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-1">No Payments Yet</h3>
          <p className="text-muted-foreground text-sm">
            Your payment history will appear here once you make a payment.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const config = statusConfig[payment.status] || statusConfig.pending
            const StatusIcon = config.icon
            return (
              <Card key={payment.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        KSh {parseFloat(payment.amount).toLocaleString()}
                      </p>
                      <Badge variant="outline" className={`text-xs ${config.color} ${config.bg}`}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>{new Date(payment.created_at).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                      <span className="capitalize">{payment.payment_method?.replace("_", " ")}</span>
                      {payment.mpesa_receipt && <span>Receipt: {payment.mpesa_receipt}</span>}
                      {payment.transaction_id && <span>Ref: {payment.transaction_id}</span>}
                      {payment.invoice_number && <span>Invoice: {payment.invoice_number}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
