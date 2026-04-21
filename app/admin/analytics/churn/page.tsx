"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UserMinus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function ChurnAnalyticsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState("30d")

  const churnStats = {
    churnRate: 3.5,
    churnRateDelta: -0.4,
    churned: 23,
    churnedDelta: -3,
    atRisk: 87,
    atRiskDelta: 5,
    avgTenureAtChurn: 8.2,
    revenueImpact: 65550,
    revenueImpactDelta: -8.2,
    recoveryRate: 18.5,
  }

  const churnByPlan = [
    { plan: "Basic 10Mbps", churned: 10, rate: 2.5, trend: "up" },
    { plan: "Basic 20Mbps", churned: 7, rate: 1.4, trend: "down" },
    { plan: "Premium 50Mbps", churned: 4, rate: 1.3, trend: "stable" },
    { plan: "Premium 100Mbps", churned: 2, rate: 0.8, trend: "down" },
    { plan: "Enterprise", churned: 0, rate: 0.0, trend: "stable" },
  ]

  const churnReasons = [
    { reason: "Price too high", count: 9, percentage: 39 },
    { reason: "Moved / relocated", count: 5, percentage: 22 },
    { reason: "Switched provider", count: 4, percentage: 17 },
    { reason: "Service quality", count: 3, percentage: 13 },
    { reason: "Other", count: 2, percentage: 9 },
  ]

  const atRiskCustomers = [
    { name: "John Mwangi", plan: "Basic 10Mbps", riskScore: 92, tenure: "14 months", lastPayment: "45 days ago" },
    { name: "Grace Achieng", plan: "Basic 20Mbps", riskScore: 85, tenure: "6 months", lastPayment: "38 days ago" },
    { name: "Peter Kamau", plan: "Premium 50Mbps", riskScore: 78, tenure: "3 months", lastPayment: "32 days ago" },
    { name: "Alice Njeri", plan: "Basic 10Mbps", riskScore: 74, tenure: "22 months", lastPayment: "28 days ago" },
    { name: "David Omondi", plan: "Basic 20Mbps", riskScore: 68, tenure: "9 months", lastPayment: "25 days ago" },
  ]

  const monthlyChurn = [
    { month: "Nov", churned: 19, rate: 1.4 },
    { month: "Dec", churned: 26, rate: 1.9 },
    { month: "Jan", churned: 21, rate: 1.6 },
    { month: "Feb", churned: 18, rate: 1.3 },
    { month: "Mar", churned: 26, rate: 1.9 },
    { month: "Apr", churned: 23, rate: 1.7 },
  ]

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 dark:text-red-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    return "text-green-600 dark:text-green-400"
  }

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>
    if (score >= 60) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Medium</Badge>
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Low</Badge>
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUpRight className="w-3 h-3 text-red-500" />
    if (trend === "down") return <ArrowDownRight className="w-3 h-3 text-green-500" />
    return <Activity className="w-3 h-3 text-slate-400" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Churn Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Customer retention and churn risk analysis</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Churn Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{churnStats.churnRate}%</p>
                <p className={`text-xs flex items-center gap-1 ${churnStats.churnRateDelta < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {churnStats.churnRateDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {Math.abs(churnStats.churnRateDelta)}% vs last period
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Churned</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{churnStats.churned}</p>
                <p className={`text-xs flex items-center gap-1 ${churnStats.churnedDelta < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {churnStats.churnedDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {Math.abs(churnStats.churnedDelta)} vs last period
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">At Risk</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{churnStats.atRisk}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {churnStats.atRiskDelta} new this week
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Revenue Impact</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {churnStats.revenueImpact.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  {Math.abs(churnStats.revenueImpactDelta)}% less than last period
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="at-risk">At-Risk Customers</TabsTrigger>
          <TabsTrigger value="reasons">Churn Reasons</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Churn Trend</CardTitle>
                <CardDescription>Churned customers and rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyChurn.map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400 w-8">{m.month}</span>
                      <Progress value={(m.churned / 30) * 100} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">{m.churned}</span>
                      <Badge variant="outline" className="w-14 justify-center text-xs">{m.rate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Churn by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Churn by Plan</CardTitle>
                <CardDescription>Which plans lose the most customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Churned</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnByPlan.map((row) => (
                      <TableRow key={row.plan}>
                        <TableCell className="font-medium">{row.plan}</TableCell>
                        <TableCell className="text-right">{row.churned}</TableCell>
                        <TableCell className="text-right">{row.rate}%</TableCell>
                        <TableCell className="text-right">{getTrendIcon(row.trend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg Tenure at Churn</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{churnStats.avgTenureAtChurn} months</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recovery Rate</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{churnStats.recoveryRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Retention Rate</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{(100 - churnStats.churnRate).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* At-Risk Tab */}
        <TabsContent value="at-risk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>At-Risk Customers</CardTitle>
              <CardDescription>Customers with high churn probability — intervene early</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tenure</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead className="text-right">Risk Score</TableHead>
                    <TableHead className="text-right">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskCustomers.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.plan}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">{c.tenure}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">{c.lastPayment}</TableCell>
                      <TableCell className={`text-right font-bold ${getRiskColor(c.riskScore)}`}>{c.riskScore}</TableCell>
                      <TableCell className="text-right">{getRiskBadge(c.riskScore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reasons Tab */}
        <TabsContent value="reasons" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Churn Reasons</CardTitle>
              <CardDescription>Why customers are leaving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {churnReasons.map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{r.reason}</span>
                    <span className="text-slate-500 dark:text-slate-400">{r.count} customers ({r.percentage}%)</span>
                  </div>
                  <Progress value={r.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
