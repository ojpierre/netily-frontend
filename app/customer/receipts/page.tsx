"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Receipt,
  Download,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"

interface ReceiptPayment {
  id: number
  payment_number: string
  amount: string
  payment_method: string
  status: string
  mpesa_receipt?: string
  transaction_id?: string
  reference_number?: string
  invoice_number?: string
  created_at: string
}

export default function CustomerReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<ReceiptPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchReceipts = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getPayments()
        // Filter to only completed payments (these are receipts)
        const allPayments = Array.isArray(data) ? data : data.results || []
        setReceipts(allPayments.filter((p: any) => p.status === "completed"))
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchReceipts()
  }, [router])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Receipts</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View receipts for completed payments
        </p>
      </div>

      {receipts.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-1">No Receipts Yet</h3>
          <p className="text-muted-foreground text-sm">
            Receipts will appear here after completing a payment.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-success/15 dark:bg-green-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success dark:text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">
                      KSh {parseFloat(receipt.amount).toLocaleString()}
                    </p>
                    <Badge className="bg-success/15 dark:bg-green-950 text-success dark:text-success text-xs">
                      Paid
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Payment #</p>
                      <p className="font-medium">{receipt.payment_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium">
                        {new Date(receipt.created_at).toLocaleDateString("en-KE", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Method</p>
                      <p className="font-medium capitalize">
                        {receipt.payment_method?.replace("_", " ")}
                      </p>
                    </div>
                    {(receipt.mpesa_receipt || receipt.transaction_id) && (
                      <div>
                        <p className="text-muted-foreground text-xs">Reference</p>
                        <p className="font-medium font-mono text-xs">
                          {receipt.mpesa_receipt || receipt.transaction_id}
                        </p>
                      </div>
                    )}
                    {receipt.invoice_number && (
                      <div>
                        <p className="text-muted-foreground text-xs">Invoice</p>
                        <p className="font-medium">{receipt.invoice_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
