"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { superadminApi, type TenantCreatePayload } from "@/lib/superadmin-api"

export default function CreateTenantPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TenantCreatePayload>({
    company_name: "",
    company_type: "isp",
    company_email: "",
    company_phone: "",
    subdomain: "",
    admin_email: "",
    admin_password: "",
    admin_phone: "",
    admin_first_name: "",
    admin_last_name: "",
    status: "trial",
    max_users: 50,
    max_customers: 500,
    billing_cycle: "monthly",
    monthly_rate: "0",
    address: "",
    city: "",
    county: "",
  })

  const update = (key: keyof TenantCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const tenant = await superadminApi.createTenant(form)
      toast.success(`Tenant "${tenant.subdomain}" created successfully!`)
      router.push(`/superadmin/tenants/${tenant.id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to create tenant")
    } finally {
      setSaving(false)
    }
  }

  // Auto-generate subdomain from company name
  const autoSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/superadmin/tenants")}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-400" />
            Create New Tenant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Onboard a new ISP onto the Netily platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Details */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Company Name *</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => {
                    update("company_name", e.target.value)
                    if (!form.subdomain || form.subdomain === autoSubdomain(form.company_name)) {
                      update("subdomain", autoSubdomain(e.target.value))
                    }
                  }}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Acme Internet Services"
                />
              </div>
              <div>
                <Label className="text-slate-300">Company Type</Label>
                <Select
                  value={form.company_type}
                  onValueChange={(v) => update("company_type", v)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isp">ISP</SelectItem>
                    <SelectItem value="wisp">WISP</SelectItem>
                    <SelectItem value="fiber">Fiber Provider</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Company Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={form.company_email}
                    onChange={(e) => update("company_email", e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white pl-10"
                    placeholder="info@acme.co.ke"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Company Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <Input
                    value={form.company_phone}
                    onChange={(e) => update("company_phone", e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white pl-10"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">County</Label>
                <Input
                  value={form.county}
                  onChange={(e) => update("county", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Config */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              Tenant Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.subdomain}
                    onChange={(e) =>
                      update("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="acme"
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">.netily.co.ke</span>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Max Users</Label>
                <Input
                  type="number"
                  value={form.max_users}
                  onChange={(e) => update("max_users", parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Customers</Label>
                <Input
                  type="number"
                  value={form.max_customers}
                  onChange={(e) => update("max_customers", parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Monthly Rate (KES)</Label>
                <Input
                  type="number"
                  value={form.monthly_rate}
                  onChange={(e) => update("monthly_rate", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Billing Cycle</Label>
              <Select
                value={form.billing_cycle}
                onValueChange={(v) => update("billing_cycle", v)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Admin Account */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">First Name</Label>
                <Input
                  value={form.admin_first_name}
                  onChange={(e) => update("admin_first_name", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Last Name</Label>
                <Input
                  value={form.admin_last_name}
                  onChange={(e) => update("admin_last_name", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Admin Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => update("admin_email", e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white pl-10"
                    placeholder="admin@acme.co.ke"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Admin Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <Input
                    value={form.admin_phone}
                    onChange={(e) => update("admin_phone", e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Admin Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => update("admin_password", e.target.value)}
                  required
                  minLength={8}
                  className="bg-slate-800 border-slate-700 text-white pl-10"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/superadmin/tenants")}
            className="border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-white min-w-[160px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
