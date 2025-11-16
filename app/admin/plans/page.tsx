"use client"

import React, { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Check,
  Zap,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Plan = {
  id: string
  name: string
  speed: string
  duration: number
  price: number
  description: string
  isPopular: boolean
  features: string[]
  status: "active" | "inactive"
}

const generateMockPlans = (): Plan[] => {
  return [
    {
      id: "PLAN-001",
      name: "Mtaani-8 Weekly",
      speed: "1000 Mbps",
      duration: 7,
      price: 350,
      description: "Perfect for individuals and small households",
      isPopular: false,
      features: ["Unlimited data", "24/7 support", "No throttling"],
      status: "active",
    },
    {
      id: "PLAN-002",
      name: "Mtaani-10 Monthly",
      speed: "2000 Mbps",
      duration: 30,
      price: 1200,
      description: "Best value for families and remote workers",
      isPopular: true,
      features: ["Unlimited data", "Priority support", "No throttling", "Free router"],
      status: "active",
    },
    {
      id: "PLAN-003",
      name: "Mtaani-12 Quarterly",
      speed: "4000 Mbps",
      duration: 90,
      price: 3200,
      description: "Premium speed for power users and businesses",
      isPopular: false,
      features: [
        "Unlimited data",
        "Premium support",
        "No throttling",
        "Free router",
        "Static IP",
      ],
      status: "active",
    },
    {
      id: "PLAN-004",
      name: "Mtaani-5 Daily",
      speed: "500 Mbps",
      duration: 1,
      price: 50,
      description: "Quick daily access for light usage",
      isPopular: false,
      features: ["Unlimited data", "Standard support"],
      status: "active",
    },
    {
      id: "PLAN-005",
      name: "Legacy Plan",
      speed: "250 Mbps",
      duration: 30,
      price: 800,
      description: "Old plan - no longer offered",
      isPopular: false,
      features: ["Limited data", "Basic support"],
      status: "inactive",
    },
  ]
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    speed: "",
    duration: "7",
    price: "",
    description: "",
    features: "",
    status: "active" as "active" | "inactive",
  })

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 600))
        setPlans(generateMockPlans())
      } catch (err) {
        setError("Failed to load plans. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  const handleAddPlan = () => {
    setEditingPlan(null)
    setFormData({
      name: "",
      speed: "",
      duration: "7",
      price: "",
      description: "",
      features: "",
      status: "active",
    })
    setDialogOpen(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      speed: plan.speed,
      duration: plan.duration.toString(),
      price: plan.price.toString(),
      description: plan.description,
      features: plan.features.join("\n"),
      status: plan.status,
    })
    setDialogOpen(true)
  }

  const handleSavePlan = () => {
    // Simulate save
    console.log("Saving plan:", formData)
    setDialogOpen(false)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-500 mt-1">Create and manage internet plans</p>
        </div>
        <Button onClick={handleAddPlan}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{plans.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {plans.filter((p) => p.status === "active").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                KSh {Math.min(...plans.map((p) => p.price))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No plans configured</p>
              <p className="text-slate-500 text-sm mt-1">
                Create your first subscription plan
              </p>
              <Button className="mt-4" onClick={handleAddPlan}>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative hover:shadow-lg transition-shadow ${
                plan.status === "inactive" ? "opacity-60" : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.id}</CardDescription>
                  </div>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                    className={
                      plan.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : ""
                    }
                  >
                    {plan.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        KSh {plan.price.toLocaleString()}
                      </span>
                      <span className="text-slate-500">
                        /{plan.duration === 1 ? "day" : plan.duration === 7 ? "week" : plan.duration === 30 ? "month" : `${plan.duration} days`}
                      </span>
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Speed</p>
                      <p className="font-bold text-blue-600">{plan.speed}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600">{plan.description}</p>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Update subscription plan details"
                : "Configure a new internet subscription plan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mtaani-10 Monthly"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speed">Speed</Label>
                <Input
                  id="speed"
                  placeholder="e.g., 2000 Mbps"
                  value={formData.speed}
                  onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">7 Days (Weekly)</SelectItem>
                    <SelectItem value="30">30 Days (Monthly)</SelectItem>
                    <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KSh)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 1200"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the plan benefits..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                placeholder="Unlimited data&#10;24/7 support&#10;No throttling"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-slate-500">Enter each feature on a new line</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan}>
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
