"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Package,
  CreditCard,
  BarChart3,
  ArrowUpRight,
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

export default function RevenueAnalyticsPage() {
  const router = useRouter()

  const revenueStats = {
    total: 4250000,
    growth: 12.5,
    arpu: 2850,
    arpuGrowth: 5.2,
    mrr: 3850000,
    mrrGrowth: 8.3,
    arr: 46200000,
  }

  const monthlyRevenue = [
    { month: "Jan 2024", revenue: 4250000, growth: 12.5, transactions: 1456 },
    { month: "Dec 2023", revenue: 3780000, growth: 8.2, transactions: 1398 },
    { month: "Nov 2023", revenue: 3495000, growth: 6.5, transactions: 1352 },
    { month: "Oct 2023", revenue: 3280000, growth: 4.8, transactions: 1289 },
    { month: "Sep 2023", revenue: 3130000, growth: 3.2, transactions: 1245 },
  ]

  const revenueByPlan = [
    { plan: "Premium 100Mbps", revenue: 1250000, subscribers: 250, percentage: 29 },
    { plan: "Premium 50Mbps", revenue: 1050000, subscribers: 300, percentage: 25 },
    { plan: "Basic 20Mbps", revenue: 980000, subscribers: 490, percentage: 23 },
    { plan: "Basic 10Mbps", revenue: 600000, subscribers: 400, percentage: 14 },
    { plan: "Enterprise", revenue: 370000, subscribers: 37, percentage: 9 },
  ]

  const paymentMethods = [
    { method: "M-Pesa", amount: 2975000, percentage: 70, count: 1020 },
    { method: "Card", amount: 637500, percentage: 15, count: 218 },
    { method: "Bank Transfer", amount: 425000, percentage: 10, count: 145 },
    { method: "Cash", amount: 212500, percentage: 5, count: 73 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Revenue Analytics</h1>
          <p className="text-slate-600 mt-1">Detailed revenue breakdown and trends</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
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
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {(revenueStats.total / 1000000).toFixed(2)}M</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">+{revenueStats.growth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-success/15 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">MRR</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {(revenueStats.mrr / 1000000).toFixed(2)}M</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">+{revenueStats.mrrGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">ARPU</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {revenueStats.arpu.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">+{revenueStats.arpuGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">ARR</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {(revenueStats.arr / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-slate-500 mt-1">Projected</p>
              </div>
              <div className="w-12 h-12 bg-warning/15 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-plan">By Plan</TabsTrigger>
          <TabsTrigger value="by-payment">By Payment Method</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Revenue performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRevenue.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>KSh {item.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.growth >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                          <span className={item.growth >= 0 ? "text-success" : "text-destructive"}>
                            {item.growth >= 0 ? "+" : ""}{item.growth}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.transactions.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Plan Tab */}
        <TabsContent value="by-plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
              <CardDescription>Revenue contribution from each plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByPlan.map((item) => (
                    <TableRow key={item.plan}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.plan}</span>
                        </div>
                      </TableCell>
                      <TableCell>KSh {item.revenue.toLocaleString()}</TableCell>
                      <TableCell>{item.subscribers}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Payment Tab */}
        <TabsContent value="by-payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
              <CardDescription>Payment method breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((item) => (
                    <TableRow key={item.method}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.method}</span>
                        </div>
                      </TableCell>
                      <TableCell>KSh {item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </TableCell>
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
