"use client"

import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Wifi, TrendingDown, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h2>
        <p className="text-blue-100">Here's your internet service overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Status</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">Active</p>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Online
              </span>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Internet Speed</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">1500 Mbps</p>
              <p className="text-xs text-slate-500 mt-2">Unlimited data</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Plan Duration</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">31 Days</p>
              <p className="text-xs text-slate-500 mt-2">Expires 10/12/2025</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Account Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">KSh 0.00</p>
              <p className="text-xs text-slate-500 mt-2">No arrears</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Plan Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 bg-white">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Current Plan</h3>
                      <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Plan Name</span>
              <span className="font-semibold text-slate-900">mtaani-8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Speed</span>
              <span className="font-semibold text-slate-900">1500 Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Data</span>
              <span className="font-semibold text-slate-900">Unlimited</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Price</span>
              <span className="font-semibold text-slate-900">KSh 1,500/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Validity</span>
              <span className="font-semibold text-slate-900">31 Days</span>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <span className="inline-flex items-center gap-2 font-semibold text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Active & Unlimited
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-white">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/recharge" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">Recharge Plan</Button>
            </Link>
            <Link href="/dashboard/support" className="block">
              <Button variant="outline" className="w-full py-6 bg-transparent">
                Contact Support
              </Button>
            </Link>
            <Link href="/dashboard/invoices" className="block">
              <Button variant="outline" className="w-full py-6 bg-transparent">
                View Invoices
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-8 bg-white">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Transactions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-slate-900">Plan Renewal</p>
              <p className="text-sm text-slate-500">mtaani-8 (1500.00)</p>
            </div>
            <span className="text-green-600 font-semibold">+ KSh 1,500</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-slate-900">Data Bonus</p>
              <p className="text-sm text-slate-500">Extra 10 GB allocated</p>
            </div>
            <span className="text-blue-600 font-semibold">+ 10 GB</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
