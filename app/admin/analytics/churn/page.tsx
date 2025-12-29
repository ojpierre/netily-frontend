"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UserMinus,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  DollarSign,
  MessageSquare,
  ArrowDownRight,
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

  const churnStats = {
    churnRate: 3.5,
    churnedThisMonth: 23,
    atRisk: 45,
    revenueLost: 85000,
    avgLifetimeBeforeChurn: 8,
    winbackRate: 12,
  }

  const churnReasons = [
    { reason: "Price too high", count: 8, percentage: 35 },
    { reason: "Poor connectivity", count: 5, percentage: 22 },
    { reason: "Moving to new location", count: 4, percentage: 17 },
    { reason: "Switching to competitor", count: 3, percentage: 13 },
    { reason: "No longer needed", count: 2, percentage: 9 },
    { reason: "Other", count: 1, percentage: 4 },
  ]

  const atRiskCustomers = [
    { name: "Alice Brown", plan: "Basic 20Mbps", daysInactive: 25, lastPayment: "45 days ago", riskScore: 85 },
    { name: "Bob Wilson", plan: "Premium 50Mbps", daysInactive: 18, lastPayment: "32 days ago", riskScore: 72 },
    { name: "Carol Davis", plan: "Basic 10Mbps", daysInactive: 22, lastPayment: "38 days ago", riskScore: 68 },
    { name: "David Lee", plan: "Premium 100Mbps", daysInactive: 15, lastPayment: "28 days ago", riskScore: 55 },
    { name: "Eve Martin", plan: "Basic 20Mbps", daysInactive: 20, lastPayment: "35 days ago", riskScore: 62 },
  ]

  const churnTrend = [
    { month: "Jan 2024", churned: 23, rate: 3.5, revenue: 85000 },
    { month: "Dec 2023", churned: 28, rate: 4.2, revenue: 98000 },
    { month: "Nov 2023", churned: 31, rate: 4.8, revenue: 112000 },
    { month: "Oct 2023", churned: 25, rate: 3.9, revenue: 92000 },
    { month: "Sep 2023", churned: 22, rate: 3.4, revenue: 78000 },
  ]

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-700"
    if (score >= 50) return "bg-yellow-100 text-yellow-700"
    return "bg-green-100 text-green-700"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Churn Analytics</h1>
          <p className="text-slate-600 mt-1">Customer churn analysis and at-risk identification</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Churn Rate</p>
                <p className="text-2xl font-bold text-red-600">{churnStats.churnRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">-0.7% vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Churned This Month</p>
                <p className="text-2xl font-bold text-slate-900">{churnStats.churnedThisMonth}</p>
                <p className="text-xs text-slate-500 mt-1">customers</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">{churnStats.atRisk}</p>
                <p className="text-xs text-slate-500 mt-1">customers</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Revenue Lost</p>
                <p className="text-2xl font-bold text-slate-900">KSh {(churnStats.revenueLost / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500 mt-1">this month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="at-risk">
        <TabsList>
          <TabsTrigger value="at-risk">At-Risk Customers ({churnStats.atRisk})</TabsTrigger>
          <TabsTrigger value="reasons">Churn Reasons</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        {/* At-Risk Tab */}
        <TabsContent value="at-risk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>At-Risk Customers</CardTitle>
              <CardDescription>Customers with high churn probability</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Days Inactive</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskCustomers.map((customer) => (
                    <TableRow key={customer.name}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.plan}</TableCell>
                      <TableCell>{customer.daysInactive}</TableCell>
                      <TableCell>{customer.lastPayment}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(customer.riskScore)}>
                          {customer.riskScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Reach Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reasons Tab */}
        <TabsContent value="reasons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Reasons</CardTitle>
              <CardDescription>Why customers leave</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churnReasons.map((item) => (
                    <TableRow key={item.reason}>
                      <TableCell className="font-medium">{item.reason}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.percentage} className="w-20 h-2" />
                          <span className="text-sm text-slate-500">{item.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Trend</CardTitle>
              <CardDescription>Monthly churn history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Churned</TableHead>
                    <TableHead>Churn Rate</TableHead>
                    <TableHead>Revenue Lost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churnTrend.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{item.churned}</TableCell>
                      <TableCell>
                        <Badge className={item.rate > 4 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                          {item.rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>KSh {item.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
