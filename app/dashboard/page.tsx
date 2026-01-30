"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/auth-context"
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
  Clock,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { customerApi } from "@/lib/customer-api"
import type { CustomerDashboardData } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getDashboard()
        setDashboardData(data)
      } catch (err: any) {
        console.error("Failed to fetch dashboard:", err)
        setError(err.message || "Failed to load dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we have an access token
    const token = localStorage.getItem("access_token")
    if (token) {
      fetchDashboard()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Mock data fallback for demo
  const mockData: CustomerDashboardData = {
    customer: {
      id: 1,
      customer_code: "CUST-0001",
      full_name: user?.first_name ? `${user.first_name} ${user.last_name}` : "Demo User",
      email: user?.email || "demo@example.com",
      phone_number: "254712345678",
      status: "ACTIVE",
      balance: "5000.00",
      created_at: new Date().toISOString(),
    },
    current_plan: {
      id: 1,
      name: "Premium 100Mbps",
      price: "2999.00",
      speed_down: "100",
      speed_up: "50",
      expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 15,
    },
    usage: {
      data_used: "45.5 GB",
      data_limit: "100 GB",
      percentage: 45.5,
    },
    recent_payments: [
      { id: 1, amount: "2999.00", method: "M-Pesa", status: "completed", created_at: new Date().toISOString() },
    ],
    pending_invoices: [],
  }

  const data = dashboardData || mockData
  const daysUntilExpiry = data.current_plan?.days_remaining ?? 0

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {data.customer.full_name.split(" ")[0]}!
        </h1>
        <p className="text-slate-600 mt-1">Here&apos;s what&apos;s happening with your account</p>
      </div>

      {/* Demo Mode Notice */}
      {!dashboardData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Using mock data. Login to see your actual dashboard.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Account Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                KSh {parseFloat(data.customer.balance || "0").toLocaleString()}
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
              <p className="text-sm text-slate-600 mb-1">Current Plan</p>
              {data.current_plan ? (
                <p className="text-xl font-bold text-slate-900">{data.current_plan.name}</p>
              ) : (
                <p className="text-xl font-bold text-orange-600">No Plan</p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Days Remaining</p>
              <p className="text-2xl font-bold text-slate-900">
                {data.current_plan ? daysUntilExpiry : "—"}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Speed</p>
              {data.current_plan ? (
                <p className="text-xl font-bold text-slate-900">
                  {data.current_plan.speed_down} Mbps
                </p>
              ) : (
                <p className="text-xl font-bold text-gray-400">—</p>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Usage */}
      {data.usage && data.usage.data_limit && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Data Usage</h3>
            <Badge variant="outline">{data.usage.data_used} / {data.usage.data_limit}</Badge>
          </div>
          <Progress value={data.usage.percentage} className="h-3" />
          <p className="text-sm text-slate-500 mt-2">
            {data.usage.percentage.toFixed(1)}% of your data limit used
          </p>
        </Card>
      )}

      {/* Expiry Warning */}
      {data.current_plan && daysUntilExpiry < 7 && daysUntilExpiry >= 0 && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">Service Expiring Soon!</h3>
              <p className="text-sm text-orange-800 mb-3">
                Your internet service will expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. 
                Recharge now to avoid interruption.
              </p>
              <Link href="/dashboard/recharge">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Recharge Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Invoices */}
      {data.pending_invoices && data.pending_invoices.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                {data.pending_invoices.length} Pending Invoice{data.pending_invoices.length > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-red-800 mb-3">
                You have unpaid invoices. Pay now to avoid service interruption.
              </p>
              <Link href="/dashboard/invoices">
                <Button size="sm" variant="destructive">
                  View Invoices
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions & Plan Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/recharge">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Recharge Account
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Invoices
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/usage-history">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Usage History
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/support">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Contact Support
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
          {data.current_plan ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Plan Name</span>
                <span className="font-semibold">{data.current_plan.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Download Speed</span>
                <span className="font-semibold">{data.current_plan.speed_down} Mbps</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Upload Speed</span>
                <span className="font-semibold">{data.current_plan.speed_up} Mbps</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Price</span>
                <span className="font-semibold">KSh {parseFloat(data.current_plan.price).toLocaleString()}</span>
              </div>
              {data.current_plan.expiry_date && (
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Expires</span>
                  <span className="font-semibold">
                    {new Date(data.current_plan.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Wifi className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No active plan</p>
              <Link href="/dashboard/recharge">
                <Button className="mt-4" size="sm">
                  Subscribe to a Plan
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Payments */}
      {data.recent_payments && data.recent_payments.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Payments</h3>
            <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_payments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      KSh {parseFloat(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.method} • {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={payment.status === "completed" ? "default" : "secondary"}
                  className={
                    payment.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : ""
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}