"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  Wifi, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  AlertCircle,
  CreditCard,
  FileText,
  User,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { MpesaPaymentModal } from "@/components/mpesa-payment-modal"
import type { CustomerDashboardData } from "@/lib/types"

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getDashboard()
        setDashboardData(data)
      } catch (err: any) {
        console.error("Failed to fetch dashboard:", err)
        if (err.message?.includes("unauthorized") || err.message?.includes("401")) {
          // Token expired, redirect to login
          localStorage.removeItem("customerToken")
          localStorage.removeItem("customerRefreshToken")
          router.push("/customer/login")
          return
        }
        setError(err.message || "Failed to load dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    fetchDashboard()
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    )
  }

  if (!dashboardData) return null

  const data = dashboardData
  const daysRemaining = data.current_plan?.days_remaining ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
          <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Welcome, {data.customer.full_name}</h1>
          <p className="text-xs text-muted-foreground">{data.customer.customer_code}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="text-2xl font-bold">
                  KSh {parseFloat(data.customer.balance || "0").toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                {data.current_plan ? (
                  <p className="text-xl font-bold">{data.current_plan.name}</p>
                ) : (
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">No Plan</p>
                )}
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Days Left</p>
                <p className={`text-2xl font-bold ${daysRemaining < 3 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {data.current_plan ? daysRemaining : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Speed</p>
                {data.current_plan ? (
                  <p className="text-xl font-bold">
                    {data.current_plan.speed_down} Mbps
                  </p>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                )}
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Data Usage */}
        {data.usage && data.usage.data_limit && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Data Usage</h3>
              <Badge variant="outline">{data.usage.data_used} / {data.usage.data_limit}</Badge>
            </div>
            <Progress value={data.usage.percentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {data.usage.percentage.toFixed(1)}% used
            </p>
          </Card>
        )}

        {/* Expiry Warning */}
        {data.current_plan && daysRemaining <= 5 && daysRemaining >= 0 && (
          <Card className="p-5 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                  {daysRemaining === 0 ? "Service Expired!" : "Expiring Soon!"}
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-400 mb-3">
                  {daysRemaining === 0 
                    ? "Your subscription has expired. Renew now to restore service."
                    : `Your service expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Renew now.`}
                </p>
                <Button 
                  size="sm" 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Renew Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Pending Invoices */}
        {data.pending_invoices && data.pending_invoices.length > 0 && (
          <Card className="p-5 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-300">
                  {data.pending_invoices.length} Unpaid Invoice{data.pending_invoices.length > 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-red-800 dark:text-red-400 mb-3">
                  Pay your outstanding invoices to avoid service interruption.
                </p>
                <Button size="sm" variant="destructive" onClick={() => setShowPaymentModal(true)}>
                  Pay Now
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions & Plan Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => setShowPaymentModal(true)}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Make Payment
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/customer/profile">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    My Profile
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/customer/payments">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Payment History
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Plan Details</h3>
            {data.current_plan ? (
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground text-sm">Plan</span>
                  <span className="font-medium text-sm">{data.current_plan.name}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground text-sm">Download</span>
                  <span className="font-medium text-sm">{data.current_plan.speed_down} Mbps</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground text-sm">Upload</span>
                  <span className="font-medium text-sm">{data.current_plan.speed_up} Mbps</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground text-sm">Price</span>
                  <span className="font-medium text-sm">KSh {parseFloat(data.current_plan.price).toLocaleString()}</span>
                </div>
                {data.current_plan.expiry_date && (
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground text-sm">Expires</span>
                    <span className="font-medium text-sm">
                      {new Date(data.current_plan.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Wifi className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active plan</p>
                <Button 
                  className="mt-3" 
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Subscribe
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Payments */}
        {data.recent_payments && data.recent_payments.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Payments</h3>
              <Link href="/customer/payments" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {data.recent_payments.slice(0, 3).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        KSh {parseFloat(payment.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.method} • {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={payment.status === "completed" ? "default" : "secondary"}
                    className={payment.status === "completed" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : ""}
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* M-Pesa Payment Modal */}
      {data.current_plan && (
        <MpesaPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          planId={data.current_plan.id}
          planName={data.current_plan.name}
          amount={data.current_plan.price}
          billingPeriod="monthly"
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
