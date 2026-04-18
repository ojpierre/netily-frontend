"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wifi,
  Shield,
  Users,
  ArrowRight,
  Monitor,
  Smartphone,
} from "lucide-react"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Netily Demo
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Live Preview
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Intro */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Experience Netily
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Explore the full ISP management platform. Choose a demo below to see the
              admin dashboard or the customer self-service portal.
            </p>
          </div>

          {/* Demo Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* ISP Admin Demo */}
            <Card className="overflow-hidden border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">ISP Admin</h2>
                    <p className="text-blue-100 text-sm">Management Dashboard</p>
                  </div>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Full control over customers, billing, network equipment, hotspot management, support tickets, and analytics.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span>Customer management &amp; billing</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wifi className="w-4 h-4" />
                    <span>Router &amp; network configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Staff management &amp; analytics</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  asChild
                >
                  <Link href="/demo/admin">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Enter ISP Dashboard
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Customer Portal Demo */}
            <Card className="overflow-hidden border-2 hover:border-green-300 dark:hover:border-green-700 transition-colors">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Customer Portal</h2>
                    <p className="text-green-100 text-sm">Self-Service Dashboard</p>
                  </div>
                </div>
                <p className="text-green-100 text-sm leading-relaxed">
                  See what your customers experience — view plans, make payments, check usage, and manage their account.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Smartphone className="w-4 h-4" />
                    <span>Plan selection &amp; M-Pesa payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span>Usage monitoring &amp; invoices</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Profile &amp; support tickets</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  asChild
                >
                  <Link href="/demo/customer">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Enter Customer Portal
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground">
            This is a live demo environment with sample data. Changes will be reset periodically.
          </p>
        </div>
      </main>
    </div>
  )
}
