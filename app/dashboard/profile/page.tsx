"use client"

import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, Code } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Profile</h1>

      <Card className="p-8 bg-white">
        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-600">Customer ID: {user?.id}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-slate-600 text-sm">Email Address</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-slate-600 text-sm">Phone Number</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.phone}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-slate-600 text-sm">Address</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.address}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Code className="w-5 h-5 text-blue-600" />
              <span className="text-slate-600 text-sm">Zipcode</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.zipcode}</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6">Edit Profile</Button>
        </div>
      </Card>
    </div>
  )
}
