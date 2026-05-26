"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Search, Users, UserCheck, UserX, Wifi, ArrowUpRight } from "lucide-react"

const demoUsers = [
  { id: "CUST-0483", name: "Alice Wanjiru", email: "alice@demo.net", phone: "+254 712 555 101", plan: "Home 10Mbps", status: "active", router: "Westlands POP", balance: 0, usage: 68, expiry: "Jun 10, 2026" },
  { id: "CUST-0482", name: "James Mwangi", email: "james@demo.net", phone: "+254 712 555 102", plan: "Family 25Mbps", status: "online", router: "Kilimani Core", balance: 1500, usage: 42, expiry: "Jun 06, 2026" },
  { id: "CUST-0481", name: "Grace Akinyi", email: "grace@demo.net", phone: "+254 712 555 103", plan: "Business 50Mbps", status: "active", router: "Industrial Node", balance: 0, usage: 76, expiry: "Jun 21, 2026" },
  { id: "CUST-0480", name: "Peter Kamau", email: "peter@demo.net", phone: "+254 712 555 104", plan: "Starter 5Mbps", status: "expired", router: "Ngong Road Edge", balance: 500, usage: 100, expiry: "May 18, 2026" },
  { id: "CUST-0479", name: "Faith Njeri", email: "faith@demo.net", phone: "+254 712 555 105", plan: "Home 10Mbps", status: "suspended", router: "South B Relay", balance: 2000, usage: 13, expiry: "May 30, 2026" },
  { id: "CUST-0478", name: "David Ochieng", email: "david@demo.net", phone: "+254 712 555 106", plan: "Family 25Mbps", status: "active", router: "Westlands POP", balance: 0, usage: 57, expiry: "Jun 12, 2026" },
]

const stats = [
  { label: "Total", value: "483", icon: Users },
  { label: "Active", value: "461", icon: UserCheck },
  { label: "Expired", value: "12", icon: UserX },
  { label: "Online now", value: "294", icon: Wifi },
]

function statusClass(status: string) {
  switch (status) {
    case "online":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
    case "active":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
    case "expired":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
  }
}

export default function DemoAdminUsersPage() {
  const [search, setSearch] = useState("")
  const filtered = demoUsers.filter((user) => {
    const q = search.toLowerCase()
    return user.name.toLowerCase().includes(q) || user.id.toLowerCase().includes(q) || user.plan.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">Demo customer management in the same general format as the live admin users screen.</p>
        </div>
        <Button variant="outline" disabled>
          Export Demo CSV
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Customer Directory</CardTitle>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search demo users" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Router</th>
                  <th className="pb-3 font-medium">Usage</th>
                  <th className="pb-3 font-medium">Expiry</th>
                  <th className="pb-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{user.name.split(" ").map((part) => part[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.id} · {user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium">{user.plan}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge className={statusClass(user.status)}>{user.status}</Badge>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{user.router}</td>
                    <td className="py-4 pr-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{user.usage}% used</span>
                        </div>
                        <Progress value={user.usage} className="h-2" />
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{user.expiry}</td>
                    <td className="py-4 text-right font-medium">
                      {user.balance === 0 ? "KSh 0" : `KSh ${user.balance.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
