"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Wifi,
  Clock,
  Settings,
  Plus,
  X,
  RefreshCw,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function EditPlanPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [features, setFeatures] = useState<string[]>([
    "50Mbps Download Speed",
    "25Mbps Upload Speed",
    "Unlimited Data",
    "24/7 Support",
  ])
  const [newFeature, setNewFeature] = useState("")

  const [formData, setFormData] = useState({
    name: "Premium 50Mbps",
    description: "High-speed internet plan for power users with unlimited data",
    price: "3500",
    type: "pppoe",
    downloadSpeed: "50",
    uploadSpeed: "25",
    dataLimit: "",
    unlimitedData: true,
    validity: "30",
    fupEnabled: true,
    fupThreshold: "500",
    fupSpeed: "10",
    status: "active",
    generateVouchers: false,
    voucherPrefix: "",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures(prev => [...prev, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Plan updated successfully")
      router.push(`/admin/plans/${params.id}`)
    }, 1500)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Edit Plan</h1>
          <p className="text-slate-600 mt-1">Update plan settings and configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Connection Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotspot">Hotspot</SelectItem>
                    <SelectItem value="pppoe">PPPoE</SelectItem>
                    <SelectItem value="static">Static IP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
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
            </CardContent>
          </Card>

          {/* Pricing & Validity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Validity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KSh)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity (Days)</Label>
                <Select
                  value={formData.validity}
                  onValueChange={(value) => handleChange("validity", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                    <SelectItem value="365">365 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generate Vouchers</Label>
                  <p className="text-sm text-slate-500">Create voucher codes for this plan</p>
                </div>
                <Switch
                  checked={formData.generateVouchers}
                  onCheckedChange={(checked) => handleChange("generateVouchers", checked)}
                />
              </div>
              {formData.generateVouchers && (
                <div className="space-y-2">
                  <Label htmlFor="voucherPrefix">Voucher Prefix</Label>
                  <Input
                    id="voucherPrefix"
                    value={formData.voucherPrefix}
                    onChange={(e) => handleChange("voucherPrefix", e.target.value)}
                    placeholder="e.g., PRE50"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Speed Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Speed Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="downloadSpeed">Download Speed (Mbps)</Label>
                  <Input
                    id="downloadSpeed"
                    type="number"
                    value={formData.downloadSpeed}
                    onChange={(e) => handleChange("downloadSpeed", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uploadSpeed">Upload Speed (Mbps)</Label>
                  <Input
                    id="uploadSpeed"
                    type="number"
                    value={formData.uploadSpeed}
                    onChange={(e) => handleChange("uploadSpeed", e.target.value)}
                    required
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Unlimited Data</Label>
                  <p className="text-sm text-slate-500">No data cap for this plan</p>
                </div>
                <Switch
                  checked={formData.unlimitedData}
                  onCheckedChange={(checked) => handleChange("unlimitedData", checked)}
                />
              </div>
              {!formData.unlimitedData && (
                <div className="space-y-2">
                  <Label htmlFor="dataLimit">Data Limit (GB)</Label>
                  <Input
                    id="dataLimit"
                    type="number"
                    value={formData.dataLimit}
                    onChange={(e) => handleChange("dataLimit", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* FUP Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Fair Usage Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable FUP</Label>
                  <p className="text-sm text-slate-500">Throttle speed after threshold</p>
                </div>
                <Switch
                  checked={formData.fupEnabled}
                  onCheckedChange={(checked) => handleChange("fupEnabled", checked)}
                />
              </div>
              {formData.fupEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="fupThreshold">FUP Threshold (GB)</Label>
                    <Input
                      id="fupThreshold"
                      type="number"
                      value={formData.fupThreshold}
                      onChange={(e) => handleChange("fupThreshold", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fupSpeed">Throttled Speed (Mbps)</Label>
                    <Input
                      id="fupSpeed"
                      type="number"
                      value={formData.fupSpeed}
                      onChange={(e) => handleChange("fupSpeed", e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Manage features highlighted in the plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a new feature..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 py-1.5">
                    {feature}
                    <button type="button" onClick={() => removeFeature(index)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
