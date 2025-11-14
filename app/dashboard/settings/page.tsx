"use client"

import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, MapPin, Code, Lock, Shield, Bell, CreditCard } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    zipcode: user?.zipcode || "",
  })

  const handleSave = () => {
    // Save logic here
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account preferences and security</p>
      </div>

      {/* Profile Information */}
      <Card className="p-8 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className={isEditing ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </div>

        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900">{user?.name}</h3>
            <p className="text-slate-600">Customer ID: {user?.id}</p>
            <p className="text-sm text-green-600 mt-2">✓ Email Verified</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Full Name</span>
              </div>
            </label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">{user?.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email Address</span>
              </div>
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">{user?.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Phone Number</span>
              </div>
            </label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">{user?.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-blue-600" />
                <span>Zipcode</span>
              </div>
            </label>
            {isEditing ? (
              <Input
                value={formData.zipcode}
                onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
              />
            ) : (
              <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">{user?.zipcode}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Address</span>
              </div>
            </label>
            {isEditing ? (
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            ) : (
              <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">{user?.address}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Change Password</p>
                <p className="text-sm text-slate-600">Update your password regularly</p>
              </div>
            </div>
            <Button variant="ghost" className="text-blue-600">Change</Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-600">Add an extra layer of security</p>
              </div>
            </div>
            <Button variant="ghost" className="text-blue-600">Enable</Button>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-600">Receive updates via email</p>
              </div>
            </div>
            <button className="w-12 h-6 bg-blue-600 rounded-full">
              <div className="w-5 h-5 bg-white rounded-full shadow translate-x-6" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-slate-900">SMS Notifications</p>
                <p className="text-sm text-slate-600">Get text alerts</p>
              </div>
            </div>
            <button className="w-12 h-6 bg-blue-600 rounded-full">
              <div className="w-5 h-5 bg-white rounded-full shadow translate-x-6" />
            </button>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Methods</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">M-Pesa</p>
                <p className="text-sm text-slate-600">+254 799 538 923</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">Default</span>
          </div>

          <Button variant="outline" className="w-full bg-transparent">
            + Add Payment Method
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-8 bg-white border-2 border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-semibold text-slate-900">Delete Account</p>
              <p className="text-sm text-slate-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
