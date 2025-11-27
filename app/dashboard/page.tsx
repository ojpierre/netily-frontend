"use client"

import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  Wifi, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()

  // Mock data fallback (only when not logged in)
  const mockUser = {
    full_name: "John Doe",
    balance: "5000.00",
    expiry_date: "2024-12-31",
    package: {
      name: "Premium Package",
      speed_down: 100,
      speed_up: 50,
      price: "2000.00"
    }
  }

  const currentUser = user || mockUser

  // Safely get package or null
  const userPackage = currentUser?.package ?? null

  // Safely calculate days until expiry
  const expiryDate = userPackage ? new Date(currentUser.expiry_date) : new Date()
  const daysUntilExpiry = Math.max(0, Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {currentUser.full_name.split(" ")[0]}!
        </h1>
        <p className="text-slate-600 mt-1">Here's what's happening with your account</p>
      </div>

      {/* Demo Mode Notice */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">Info</span>
          </div>
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Using mock data. Login to see your actual dashboard.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Account Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                KSh {parseFloat(currentUser.balance || "0").toFixed(2)}
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
              <p className="text-sm text-slate-600 mb-1">Current Package</p>
              {userPackage ? (
                <p className="text-xl font-bold text-slate-900">{userPackage.name}</p>
              ) : (
                <p className="text-xl font-bold text-orange-600">No Package</p>
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
              <p className="text-sm text-slate-600 mb-1">Days Until Expiry</p>
              <p className="text-2xl font-bold text-slate-900">
                {userPackage ? daysUntilExpiry : "—"}
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
              {userPackage ? (
                <p className="text-xl font-bold text-slate-900">
                  {userPackage.speed_down} Mbps
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

      {/* Expiry Warning (only show if package exists and near expiry) */}
      {userPackage && daysUntilExpiry < 7 && daysUntilExpiry >= 0 && (
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

      {/* Quick Actions & Package Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/recharge">
              <Button variant="outline" className="w-full justify-between">
                Recharge Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button variant="outline" className="w-full justify-between">
                View Invoices
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/support">
              <Button variant="outline" className="w-full justify-between">
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-semibold mb-4">Package Details</h3>
          {userPackage ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Package Name</span>
                <span className="font-semibold">{userPackage.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Download Speed</span>
                <span className="font-semibold">{userPackage.speed_down} Mbps</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Upload Speed</span>
                <span className="font-semibold">{userPackage.speed_up} Mbps</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Monthly Price</span>
                <span className="font-semibold">KSh {userPackage.price}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Wifi className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No active package</p>
              <p className="text-sm mt-2">Contact admin to assign a package</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}