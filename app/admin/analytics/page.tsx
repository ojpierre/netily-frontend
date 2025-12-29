"use client"

import React, { useState, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Wifi,
  Globe,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Clock,
  Zap,
  CreditCard,
  UserPlus,
  UserMinus,
  Percent,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Revenue data by month
const revenueData = [
  { month: "Jan", revenue: 1250000, target: 1200000, users: 890 },
  { month: "Feb", revenue: 1380000, target: 1300000, users: 920 },
  { month: "Mar", revenue: 1420000, target: 1400000, users: 985 },
  { month: "Apr", revenue: 1550000, target: 1500000, users: 1050 },
  { month: "May", revenue: 1620000, target: 1600000, users: 1120 },
  { month: "Jun", revenue: 1780000, target: 1700000, users: 1200 },
]

// User growth data
const userGrowthData = [
  { month: "Jan", newUsers: 85, churn: 12, netGrowth: 73 },
  { month: "Feb", newUsers: 92, churn: 15, netGrowth: 77 },
  { month: "Mar", newUsers: 110, churn: 18, netGrowth: 92 },
  { month: "Apr", newUsers: 125, churn: 20, netGrowth: 105 },
  { month: "May", newUsers: 145, churn: 22, netGrowth: 123 },
  { month: "Jun", newUsers: 160, churn: 25, netGrowth: 135 },
]

// Plan distribution
const planDistribution = [
  { name: "Daily Surf", type: "hotspot", users: 234, revenue: 11700, color: "bg-blue-500" },
  { name: "Weekly Unlimited", type: "hotspot", users: 456, revenue: 159600, color: "bg-blue-400" },
  { name: "Monthly Value", type: "hotspot", users: 789, revenue: 946800, color: "bg-blue-300" },
  { name: "Home Basic", type: "pppoe", users: 345, revenue: 517500, color: "bg-purple-500" },
  { name: "Home Premium", type: "pppoe", users: 234, revenue: 585000, color: "bg-purple-400" },
  { name: "Business Pro", type: "pppoe", users: 56, revenue: 448000, color: "bg-purple-300" },
  { name: "Static Basic", type: "static", users: 89, revenue: 311500, color: "bg-orange-500" },
  { name: "Static Premium", type: "static", users: 34, revenue: 255000, color: "bg-orange-400" },
]

// Top locations
const topLocations = [
  { name: "Nairobi CBD", users: 450, revenue: 675000, growth: 12.5 },
  { name: "Westlands", users: 380, revenue: 570000, growth: 8.3 },
  { name: "Kilimani", users: 320, revenue: 480000, growth: 15.2 },
  { name: "Lavington", users: 280, revenue: 420000, growth: 6.7 },
  { name: "South B", users: 240, revenue: 360000, growth: 9.1 },
]

// Router performance
const routerPerformance = [
  { name: "Router-Nairobi-01", users: 320, uptime: 99.9, bandwidth: 85, status: "healthy" },
  { name: "Router-Westlands-02", users: 280, uptime: 99.5, bandwidth: 72, status: "healthy" },
  { name: "Router-Kilimani-03", users: 245, uptime: 98.8, bandwidth: 90, status: "warning" },
  { name: "Router-Mombasa-04", users: 180, uptime: 99.7, bandwidth: 65, status: "healthy" },
  { name: "Router-Kisumu-05", users: 150, uptime: 97.5, bandwidth: 45, status: "warning" },
]

// Payment methods
const paymentMethods = [
  { method: "M-Pesa", transactions: 4520, amount: 1350000, percentage: 68 },
  { method: "Airtel Money", transactions: 890, amount: 267000, percentage: 13 },
  { method: "Card", transactions: 450, amount: 225000, percentage: 11 },
  { method: "Bank Transfer", transactions: 320, amount: 156000, percentage: 8 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  // Calculate totals
  const totalRevenue = revenueData.reduce((acc, d) => acc + d.revenue, 0)
  const totalTarget = revenueData.reduce((acc, d) => acc + d.target, 0)
  const totalUsers = planDistribution.reduce((acc, p) => acc + p.users, 0)
  const totalNewUsers = userGrowthData.reduce((acc, d) => acc + d.newUsers, 0)
  const totalChurn = userGrowthData.reduce((acc, d) => acc + d.churn, 0)
  const churnRate = ((totalChurn / totalUsers) * 100).toFixed(1)
  const avgRevenuePerUser = Math.round(totalRevenue / totalUsers)
  const conversionRate = 23.5

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`
    return `KES ${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">Business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12.5%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500">Total Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                8.3%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                15%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalNewUsers}</p>
            <p className="text-xs text-slate-500">New Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(avgRevenuePerUser)}</p>
            <p className="text-xs text-slate-500">ARPU</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                2.1%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{churnRate}%</p>
            <p className="text-xs text-slate-500">Churn Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                3.2%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-slate-500">Lead Conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Revenue Chart Placeholder */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-4 pt-4">
                  {revenueData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end justify-center h-48">
                        <div 
                          className="w-5 bg-blue-500 rounded-t transition-all"
                          style={{ height: `${(data.revenue / 2000000) * 100}%` }}
                          title={`Revenue: ${formatCurrency(data.revenue)}`}
                        />
                        <div 
                          className="w-5 bg-slate-200 rounded-t transition-all"
                          style={{ height: `${(data.target / 2000000) * 100}%` }}
                          title={`Target: ${formatCurrency(data.target)}`}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{data.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-xs text-slate-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-200 rounded" />
                    <span className="text-xs text-slate-600">Target</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Target */}
            <Card>
              <CardHeader>
                <CardTitle>Target Progress</CardTitle>
                <CardDescription>Q2 2024 Revenue Goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-slate-500">of {formatCurrency(totalTarget)} target</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round((totalRevenue / totalTarget) * 100)}%</span>
                  </div>
                  <Progress value={(totalRevenue / totalTarget) * 100} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monthly Average</span>
                    <span className="font-medium">{formatCurrency(totalRevenue / 6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Best Month</span>
                    <span className="font-medium text-green-600">{formatCurrency(1780000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Projected Annual</span>
                    <span className="font-medium">{formatCurrency(totalRevenue * 2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Location</CardTitle>
              <CardDescription>Top performing areas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLocations.map((loc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>{loc.users.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(loc.revenue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loc.growth > 10 ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {loc.growth}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(loc.revenue / totalRevenue) * 100} className="h-2 w-20" />
                          <span className="text-xs text-slate-500">{((loc.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New users vs churn over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-4 pt-4">
                  {userGrowthData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end justify-center h-48">
                        <div 
                          className="w-5 bg-green-500 rounded-t"
                          style={{ height: `${(data.newUsers / 200) * 100}%` }}
                          title={`New: ${data.newUsers}`}
                        />
                        <div 
                          className="w-5 bg-red-400 rounded-t"
                          style={{ height: `${(data.churn / 200) * 100}%` }}
                          title={`Churn: ${data.churn}`}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{data.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-xs text-slate-600">New Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span className="text-xs text-slate-600">Churn</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{totalNewUsers}</p>
                      <p className="text-sm text-green-600">New Users</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserMinus className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{totalChurn}</p>
                      <p className="text-sm text-red-600">Churned</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-700">+{totalNewUsers - totalChurn}</p>
                      <p className="text-sm text-blue-600">Net Growth</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Type Distribution */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Wifi className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1,479</p>
                    <p className="text-slate-500">Hotspot Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Globe className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">635</p>
                    <p className="text-slate-500">PPPoE Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">27%</span>
                  </div>
                  <Progress value={27} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Server className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">123</p>
                    <p className="text-slate-500">Static IP Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">11%</span>
                  </div>
                  <Progress value={11} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Users and revenue by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{plan.name}</span>
                          <span className="text-sm text-slate-500">{plan.users} users</span>
                        </div>
                        <Progress value={(plan.users / totalUsers) * 100} className="h-2" />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">{formatCurrency(plan.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Type Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Hotspot Plans</span>
                      </div>
                      <span className="font-bold text-blue-600">{formatCurrency(1118100)}</span>
                    </div>
                    <Progress value={35} className="h-3" />
                    <p className="text-xs text-slate-500 mt-1">35% of total revenue</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">PPPoE Plans</span>
                      </div>
                      <span className="font-bold text-purple-600">{formatCurrency(1550500)}</span>
                    </div>
                    <Progress value={49} className="h-3" />
                    <p className="text-xs text-slate-500 mt-1">49% of total revenue</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">Static IP Plans</span>
                      </div>
                      <span className="font-bold text-orange-600">{formatCurrency(566500)}</span>
                    </div>
                    <Progress value={16} className="h-3" />
                    <p className="text-xs text-slate-500 mt-1">16% of total revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>ARPU</TableHead>
                    <TableHead>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planDistribution.map((plan, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          plan.type === "hotspot" ? "bg-blue-100 text-blue-700" :
                          plan.type === "pppoe" ? "bg-purple-100 text-purple-700" :
                          "bg-orange-100 text-orange-700"
                        }>
                          {plan.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.users.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(plan.revenue)}</TableCell>
                      <TableCell>{formatCurrency(Math.round(plan.revenue / plan.users))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(plan.users / totalUsers) * 100} className="h-2 w-16" />
                          <span className="text-xs">{((plan.users / totalUsers) * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">99.5%</p>
                    <p className="text-xs text-slate-500">Avg Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Server className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-xs text-slate-500">Active Routers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">72%</p>
                    <p className="text-xs text-slate-500">Avg Bandwidth</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">2</p>
                    <p className="text-xs text-slate-500">Warnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Router Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Router Performance</CardTitle>
              <CardDescription>Health status and metrics for all routers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Bandwidth</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerPerformance.map((router, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{router.name}</TableCell>
                      <TableCell>{router.users}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={router.uptime >= 99 ? "text-green-600" : "text-amber-600"}>
                            {router.uptime}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={router.bandwidth} 
                            className={`h-2 w-20 ${router.bandwidth > 80 ? "[&>div]:bg-amber-500" : ""}`} 
                          />
                          <span className="text-xs text-slate-500">{router.bandwidth}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          router.status === "healthy" 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }>
                          {router.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Transaction volume by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{method.method}</span>
                          <span className="text-slate-500">{method.transactions} txns</span>
                        </div>
                        <Progress value={method.percentage} className="h-2" />
                      </div>
                      <span className="font-medium w-28 text-right">{formatCurrency(method.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Successful</p>
                    <p className="text-2xl font-bold text-green-700">98.5%</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-700">1.5%</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Transactions</span>
                    <span className="font-medium">6,180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Transaction</span>
                    <span className="font-medium">KES 1,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Highest Transaction</span>
                    <span className="font-medium">KES 8,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collection Rate</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>Projected revenue for next 3 months based on current trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">July 2024</p>
                  <p className="text-3xl font-bold text-blue-700">{formatCurrency(1900000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +6.7%
                  </Badge>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">August 2024</p>
                  <p className="text-3xl font-bold text-purple-700">{formatCurrency(2050000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +7.9%
                  </Badge>
                </div>
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-1">September 2024</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(2200000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +7.3%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
