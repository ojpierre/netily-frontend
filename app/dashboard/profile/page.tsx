"use client"

import { useState } from "react"
import { useAuth } from "@/app/auth-context"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Calendar, Wifi, Edit2, Save, X } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  })

  if (!user) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateCustomerProfile(formData)
      await refreshUser()
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    })
    setIsEditing(false)
  }

  const getInitials = () => {
    return user.full_name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-8 md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.full_name}</h2>
            <p className="text-slate-600 mb-4">{user.email}</p>
            <div className="w-full pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Customer ID</span>
                <span className="text-sm font-semibold text-slate-900">#{user.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`text-sm font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="p-8 md:col-span-2">
          <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={loading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Full Name</p>
                  <p className="font-medium text-slate-900">{user.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Email Address</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Phone Number</p>
                  <p className="font-medium text-slate-900">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Address</p>
                  <p className="font-medium text-slate-900">{user.address}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Package Information */}
      <Card className="p-8">
        <h3 className="text-xl font-semibold mb-6">Current Package</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Package</p>
              <p className="font-semibold text-slate-900">{user.package?.name || "No Package"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-green-600">↓</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">Download Speed</p>
              <p className="font-semibold text-slate-900">{user.package?.speed_down || 0} Mbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600">↑</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">Upload Speed</p>
              <p className="font-semibold text-slate-900">{user.package?.speed_up || 0} Mbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Expiry Date</p>
              <p className="font-semibold text-slate-900">
                {new Date(user.expiry_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}