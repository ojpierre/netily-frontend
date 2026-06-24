"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Bell, CreditCard, Shield, Save } from "lucide-react"

export default function DemoAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Demo tabs modeled after the real admin settings area, kept intentionally read-only.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[560px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" />Company profile</CardTitle>
              <CardDescription>Sample branding and operator details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Company name</Label><Input value="Demo ISP Ltd" readOnly /></div>
              <div className="space-y-2"><Label>Support email</Label><Input value="support@demoisp.co.ke" readOnly /></div>
              <div className="space-y-2"><Label>Billing phone</Label><Input value="+254 700 123 456" readOnly /></div>
              <div className="space-y-2"><Label>Default timezone</Label><Input value="Africa/Nairobi" readOnly /></div>
            </CardContent>
            <CardFooter><Button disabled><Save className="mr-2 h-4 w-4" />Save changes</Button></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-600" />Billing preferences</CardTitle>
              <CardDescription>Illustrative settlement and invoicing controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Auto-generate monthly invoices</p>
                  <p className="text-sm text-muted-foreground">Create invoices on the first day of each cycle.</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Suspend overdue services</p>
                  <p className="text-sm text-muted-foreground">Apply service restrictions after grace period expiry.</p>
                </div>
                <Switch checked disabled />
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">Grace period: 3 days</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-warning" />Operator alerts</CardTitle>
              <CardDescription>Notification switches presented in the live style.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Router offline alerts",
                "Daily payment digest",
                "New customer registration alerts",
                "Trial and billing reminders",
              ].map((label) => (
                <div key={label} className="flex items-center justify-between rounded-lg border p-4">
                  <p className="font-medium">{label}</p>
                  <Switch checked disabled />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-rose-600" />Security posture</CardTitle>
              <CardDescription>Key controls surfaced for demos without exposing real secrets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="font-medium">Two-factor authentication</p>
                <p className="mt-1 text-sm text-muted-foreground">Enabled for all admin operators in this demo tenant.</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">API credentials</p>
                <p className="mt-1 text-sm text-muted-foreground">Redacted in demo mode. Production screens expose the same management surface.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
