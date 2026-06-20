"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Package,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Wifi,
  DollarSign,
  Activity
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { superadminApi, type NetilyPlan } from "@/lib/superadmin-api"

const emptyPlan: Partial<NetilyPlan> = {
  name: "",
  code: "",
  description: "",
  price_monthly: "0",
  price_yearly: "0",
  max_subscribers: 100,
  max_routers: 5,
  max_staff: 5,
  is_active: true,
  sort_order: 0,
  features: {},
  is_metered: false,
  base_license_fee: "500.00",
  pppoe_unit_price: "25.00",
  pppoe_min_clients: 20,
  hotspot_revenue_share_pct: "3.00",
}

export default function PlansPage() {
  const [plans, setPlans] = useState<NetilyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<NetilyPlan>>(emptyPlan)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await superadminApi.getPlans()
      setPlans(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load plans")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const openCreate = () => {
    setEditing({ ...emptyPlan })
    setIsEdit(false)
    setDialogOpen(true)
  }

  const openEdit = (p: NetilyPlan) => {
    setEditing({ ...p })
    setIsEdit(true)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEdit && editing.id) {
        await superadminApi.updatePlan(editing.id, editing)
        toast.success("Plan updated")
      } else {
        await superadminApi.createPlan(editing)
        toast.success("Plan created")
      }
      setDialogOpen(false)
      fetchPlans()
    } catch (err: any) {
      toast.error(err.message || "Failed to save plan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return
    try {
      await superadminApi.deletePlan(id)
      toast.success("Plan deleted")
      fetchPlans()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan")
    }
  }

  const kes = (n: string | number) =>
    Number(n).toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-violet-400" />
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage Netily subscription tiers — {plans.length} plans
          </p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-20 text-center text-slate-500">
            No plans configured yet. Create your first plan.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-slate-900 border-slate-800 relative overflow-hidden">
              {!plan.is_active && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>
                </div>
              )}
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <Badge variant="outline" className="text-xs text-violet-300 border-violet-500/30">
                      {plan.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{plan.description || "—"}</p>
                </div>

                {/* Metered vs Flat Pricing Display */}
                {plan.is_metered ? (
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Metered Plan
                    </span>
                    <span className="text-slate-400 text-sm">
                      {kes(plan.base_license_fee || 0)} Base + Usage
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{kes(plan.price_monthly)}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>
                    <p className="text-xs text-slate-500">{kes(plan.price_yearly)}/year</p>
                  </div>
                )}

                <div className="space-y-2 text-sm pt-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-violet-400" />
                    {plan.max_subscribers === 0 ? "Unlimited" : plan.max_subscribers.toLocaleString()} subscribers
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Wifi className="w-4 h-4 text-violet-400" />
                    {plan.max_routers === 0 ? "Unlimited" : plan.max_routers} routers
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-violet-400" />
                    {plan.max_staff === 0 ? "Unlimited" : plan.max_staff} staff
                  </div>
                  {plan.subscriber_count !== undefined && (
                    <div className="flex items-center gap-2 text-slate-300 mt-2 pt-2 border-t border-slate-800">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      {plan.subscriber_count} active subscriptions
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(plan)}
                    className="flex-1 border-slate-700 text-slate-300"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="border-red-800 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {isEdit ? "Update plan details and limits" : "Set up a new subscription tier"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Code</Label>
                <Input
                  value={editing.code || ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g. starter"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                rows={2}
              />
            </div>

            {/* METERED BILLING TOGGLE */}
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Metered Billing</Label>
                <p className="text-sm text-slate-400">
                  Enable Pay-As-You-Grow dynamic billing.
                </p>
              </div>
              <Switch
                checked={editing.is_metered || false}
                onCheckedChange={(v) => setEditing({ ...editing, is_metered: v })}
              />
            </div>

            {/* CONDITIONAL PRICING FIELDS */}
            {editing.is_metered ? (
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                  <Label className="text-slate-300">Base Fee (KES)</Label>
                  <Input
                    type="number"
                    value={editing.base_license_fee || ""}
                    onChange={(e) => setEditing({ ...editing, base_license_fee: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">PPPoE Rate (KES)</Label>
                  <Input
                    type="number"
                    value={editing.pppoe_unit_price || ""}
                    onChange={(e) => setEditing({ ...editing, pppoe_unit_price: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Min PPPoE Clients</Label>
                  <Input
                    type="number"
                    value={editing.pppoe_min_clients || ""}
                    onChange={(e) => setEditing({ ...editing, pppoe_min_clients: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Hotspot Share (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editing.hotspot_revenue_share_pct || ""}
                    onChange={(e) => setEditing({ ...editing, hotspot_revenue_share_pct: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Monthly Price (KES)</Label>
                  <Input
                    type="number"
                    value={editing.price_monthly || "0"}
                    onChange={(e) => setEditing({ ...editing, price_monthly: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Yearly Price (KES)</Label>
                  <Input
                    type="number"
                    value={editing.price_yearly || "0"}
                    onChange={(e) => setEditing({ ...editing, price_yearly: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300">Max Subscribers</Label>
                <Input
                  type="number"
                  value={editing.max_subscribers ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, max_subscribers: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0 = Unlimited"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Routers</Label>
                <Input
                  type="number"
                  value={editing.max_routers ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, max_routers: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0 = Unlimited"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Staff</Label>
                <Input
                  type="number"
                  value={editing.max_staff ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, max_staff: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0 = Unlimited"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Switch
                checked={editing.is_active !== false}
                onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
              />
              <Label className="text-slate-300">Plan is Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !editing.name}
                className="bg-violet-600 hover:bg-violet-500"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
