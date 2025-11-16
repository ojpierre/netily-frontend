"use client"

import React, { useState, useEffect } from "react"
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data generator
const generateMockStats = () => ({
  totalUsers: 2847,
  activeUsers: 1923,
  expiredUsers: 924,
  bandwidthUsage: { value: 45.6, unit: "TB", percentage: 68 },
  revenue: { today: 125450, thisMonth: 3245780, growth: 12.5 },
  recentActivity: [
    { id: 1, user: "John Doe", action: "Subscribed to Mtaani-8 Weekly", time: "2 mins ago" },
    { id: 2, user: "Jane Smith", action: "Payment received KSh 2000", time: "5 mins ago" },
    { id: 3, user: "Mike Johnson", action: "Subscription expired", time: "12 mins ago" },
    { id: 4, user: "Sarah Wilson", action: "New user registration", time: "18 mins ago" },
    { id: 5, user: "Tom Brown", action: "Upgraded to Mtaani-12 Monthly", time: "25 mins ago" },
  ],
})

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ReturnType<typeof generateMockStats> | null>(null)

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        setStats(generateMockStats())
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your ISP operations</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your ISP operations</p>
        </div>
        <Button>
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">
                  All registered users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.activeUsers.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span>
                    {stats && ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expired Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Users</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.expiredUsers.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span>Requires renewal</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bandwidth Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.bandwidthUsage.value} {stats?.bandwidthUsage.unit}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats?.bandwidthUsage.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.bandwidthUsage.percentage}% of capacity
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue
            </CardTitle>
            <CardDescription>Payment statistics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      KSh {stats?.revenue.today.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KSh {stats?.revenue.thisMonth.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    +{stats?.revenue.growth}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user actions and events</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.user}
                      </p>
                      <p className="text-sm text-slate-600">{activity.action}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
