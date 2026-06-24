"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Package, Zap, Users, Clock, Wifi, Briefcase } from "lucide-react"

const plans = [
  { id: 1, name: "Starter 5Mbps", type: "Home", price: 500, speed: "5 / 5 Mbps", validity: "30 Days", subscribers: 56, popular: false, description: "Entry plan for light browsing and messaging." },
  { id: 2, name: "Home 10Mbps", type: "Home", price: 1000, speed: "10 / 10 Mbps", validity: "30 Days", subscribers: 187, popular: true, description: "Balanced home package for work, streaming, and everyday use." },
  { id: 3, name: "Family 25Mbps", type: "Home", price: 2000, speed: "25 / 25 Mbps", validity: "30 Days", subscribers: 142, popular: false, description: "Great for multiple active devices and home offices." },
  { id: 4, name: "Business 50Mbps", type: "SME", price: 5000, speed: "50 / 50 Mbps", validity: "30 Days", subscribers: 98, popular: false, description: "Higher throughput and support expectations for SMEs." },
]

export default function DemoAdminPlansPage() {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => plans.filter((plan) => plan.name.toLowerCase().includes(query.toLowerCase()) || plan.type.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">Demo plan catalog mirroring the visual cadence of the live plans experience.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Published plans</CardTitle><Package className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">8</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Most popular</CardTitle><Zap className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold">Home 10Mbps</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active subscribers</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">483</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Billing cycle</CardTitle><Clock className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">Monthly</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Plan library</CardTitle>
            <CardDescription>Read-only examples using demo prices, speeds, and uptake.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plans" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((plan) => (
            <Card key={plan.id} className={`border ${plan.popular ? "border-primary ring-1 ring-ring/20" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  {plan.popular && <Badge className="bg-primary text-white">Popular</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">KSh {plan.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">per {plan.validity.toLowerCase()}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" />{plan.speed}</p>
                  <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-emerald-600" />{plan.type}</p>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4 text-warning" />{plan.subscribers} subscribers</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
