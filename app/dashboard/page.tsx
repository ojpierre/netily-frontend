"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../auth-context"
import { api, Invoice, Payment } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Wifi, 
  Gauge, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        api.getInvoices(),
        api.getPayments(),
      ])
      setInvoices(invoicesRes.results || [])
      setPayments(paymentsRes.results || [])
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!user?.expiry_date) return 0
    const expiry = new Date(user.expiry_date)
    const today = new Date()
    const diff = expiry.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = () => {
    const days = getDaysUntilExpiry()
    if (days <= 0) return "destructive"
    if (days <= 7) return "warning"
    return "success"
  }

  const getStatusText = () => {
    const days = getDaysUntilExpiry()
    if (days <= 0) return "Expired"
    if (days <= 7) return "Expiring Soon"
    return "Active"
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const recentTransactions = [...payments, ...invoices]
    .sort((a, b) => {
      const dateA = new Date('payment_date' in a ? a.payment_date : a.invoice_date)
      const dateB = new Date('payment_date' in b ? b.payment_date : b.invoice_date)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-2">
          Welcome, {user.full_name}
        </h2>
        <p className="text-blue-100">Here's your internet service overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <Badge variant={getStatusColor() as any}>
                {getStatusText()}
              </Badge>
            </div>
            {user.is_active ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Speed</p>
              <p className="text-2xl font-bold text-gray-900">
                {user.package?.speed_down || 0} Mbps
              </p>
              <p className="text-xs text-gray-400">
                ↑ {user.package?.speed_up || 0} Mbps
              </p>
            </div>
            <Gauge className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Days Left</p>
              <p className="text-2xl font-bold text-gray-900">
                {getDaysUntilExpiry()}
              </p>
              <p className="text-xs text-gray-400">
                Expires: {new Date(user.expiry_date).toLocaleDateString()}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                KSh {parseFloat(user.balance || "0").toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Available credit</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Plan Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Wifi className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Current Plan</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Package Name</p>
              <p className="text-2xl font-bold text-blue-600">
                {user.package?.name || "No Package"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Download</p>
                <p className="text-lg font-semibold">
                  {user.package?.speed_down || 0} Mbps
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Upload</p>
                <p className="text-lg font-semibold">
                  {user.package?.speed_up || 0} Mbps
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Monthly Price</p>
              <p className="text-lg font-semibold">
                KSh {user.package?.price || "0"}
              </p>
            </div>

            <Button className="w-full mt-4">Upgrade Plan</Button>
          </div>
        </Card>

        <Card className="p-8 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="w-4 h-4 mr-2" />
              View Usage History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Wifi className="w-4 h-4 mr-2" />
              Change Package
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-8 bg-white">
        <h3 className="text-xl font-semibold mb-6">Recent Transactions</h3>
        
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => {
              const isPayment = 'payment_method' in transaction
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isPayment ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${
                        isPayment ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {isPayment ? 'Payment Received' : 'Invoice Generated'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(
                          isPayment ? transaction.payment_date : transaction.invoice_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    KSh {parseFloat(transaction.amount).toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}