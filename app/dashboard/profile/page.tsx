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

  // Mock user data as fallback
  const mockUser = {
    id: 1,
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone: "+254799538923",
    address: "123 Main Street, Nairobi",
    is_active: true,
    balance: "5000.00",
    expiry_date: "2024-12-31",
    package: {
      id: 1,
      name: "Premium Package",
      speed_down: 100,
      speed_up: 50,
      price: "2000.00"
    }
  }

  const currentUser = user || mockUser

  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      if (user) {
        await api.updateCustomerProfile(formData)
        await refreshUser()
        toast.success("Profile updated successfully!")
      } else {
        // Mock success for demo
        toast.success("Profile updated successfully! (Demo Mode)")
      }
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: currentUser?.full_name || "",
      phone: currentUser?.phone || "",
      address: currentUser?.address || "",
    })
    setIsEditing(false)
  }

  const getInitials = () => {
    return currentUser.full_name
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

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Using mock data. Login to see your actual profile.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-8 md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentUser.full_name}</h2>
            <p className="text-slate-600 mb-4">{currentUser.email}</p>
            <div className="w-full pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Customer ID</span>
                <span className="text-sm font-semibold text-slate-900">#{currentUser.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`text-sm font-semibold ${currentUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {currentUser.is_active ? 'Active' : 'Inactive'}
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
                  <p className="font-medium text-slate-900">{currentUser.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Email Address</p>
                  <p className="font-medium text-slate-900">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Phone Number</p>
                  <p className="font-medium text-slate-900">{currentUser.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Address</p>
                  <p className="font-medium text-slate-900">{currentUser.address}</p>
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
              <p className="font-semibold text-slate-900">{currentUser.package?.name || "No Package"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-green-600">↓</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">Download Speed</p>
              <p className="font-semibold text-slate-900">{currentUser.package?.speed_down || 0} Mbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600">↑</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">Upload Speed</p>
              <p className="font-semibold text-slate-900">{currentUser.package?.speed_up || 0} Mbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Expiry Date</p>
              <p className="font-semibold text-slate-900">
                {new Date(currentUser.expiry_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}