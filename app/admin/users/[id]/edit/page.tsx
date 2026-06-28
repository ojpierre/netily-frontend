"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Wifi,
  Package,
  Calendar,
  Key,
  Globe,
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

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "John Doe",
    username: "john.doe",
    email: "john.doe@example.com",
    phone: "+254712345678",
    address: "123 Main Street, Nairobi",
    type: "pppoe",
    status: "active",
    packageId: "premium-50",
    routerId: "router-001",
    expiryDate: "2024-02-15",
    pppoeUsername: "john.doe@netily",
    pppoePassword: "",
    staticIp: "",
    macAddress: "AA:BB:CC:DD:EE:FF",
    balance: "2500",
    loyaltyPoints: "450",
    sendWelcomeSms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success("User updated successfully")
      router.push(`/admin/users/${params.id}`)
    }, 1500)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
          <p className="text-slate-600 mt-1">Update user information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-slate-400 font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Leave blank if not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="router">Router</Label>
                <Select
                  value={formData.routerId}
                  onValueChange={(value) => handleChange("routerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="router-001">Router-001 (Main Office)</SelectItem>
                    <SelectItem value="router-002">Router-002 (Branch 1)</SelectItem>
                    <SelectItem value="router-003">Router-003 (Branch 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input
                  id="macAddress"
                  value={formData.macAddress}
                  onChange={(e) => handleChange("macAddress", e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>

              {formData.type === "pppoe" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="pppoeUsername">PPPoE Username</Label>
                    <Input
                      id="pppoeUsername"
                      value={formData.pppoeUsername}
                      onChange={(e) => handleChange("pppoeUsername", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pppoePassword">New PPPoE Password (leave blank to keep)</Label>
                    <Input
                      id="pppoePassword"
                      type="password"
                      value={formData.pppoePassword}
                      onChange={(e) => handleChange("pppoePassword", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {formData.type === "static" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="staticIp">Static IP Address</Label>
                    <Input
                      id="staticIp"
                      value={formData.staticIp}
                      onChange={(e) => handleChange("staticIp", e.target.value)}
                      placeholder="192.168.1.100"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Package & Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package">Package</Label>
                <Select
                  value={formData.packageId}
                  onValueChange={(value) => handleChange("packageId", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic-10">Basic 10Mbps - KSh 1,500</SelectItem>
                    <SelectItem value="basic-20">Basic 20Mbps - KSh 2,000</SelectItem>
                    <SelectItem value="premium-50">Premium 50Mbps - KSh 3,500</SelectItem>
                    <SelectItem value="premium-100">Premium 100Mbps - KSh 5,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="balance">Balance (KSh)</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) => handleChange("balance", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
                  <Input
                    id="loyaltyPoints"
                    type="number"
                    value={formData.loyaltyPoints}
                    onChange={(e) => handleChange("loyaltyPoints", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Send SMS Notification</Label>
                  <p className="text-sm text-slate-500">Notify user of changes via SMS</p>
                </div>
                <Switch
                  checked={formData.sendWelcomeSms}
                  onCheckedChange={(checked) => handleChange("sendWelcomeSms", checked)}
                />
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
