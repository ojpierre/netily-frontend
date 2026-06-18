"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Phone, Mail, MapPin, Wifi, Calendar } from "lucide-react"
import { customerApi } from "@/lib/customer-api"

interface ProfileData {
  id: number
  customer_code: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  phone_number: string
  address?: string
  status: string
  category?: string
  balance: string
  created_at: string
}

export default function CustomerProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getProfile()
        setProfile(data)
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (!profile) return null

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    INACTIVE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your account information
        </p>
      </div>

      {/* Account Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-bold">{profile.customer_code}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
            <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={statusColor[profile.status] || statusColor.INACTIVE}>
              {profile.status}
            </Badge>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="font-bold">
              {new Date(profile.created_at).toLocaleDateString("en-KE", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </p>
          </div>
        </Card>
      </div>

      {/* Profile Details — read only */}
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="font-medium">{profile.phone_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{profile.address || "Not set"}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          To update your details, contact your ISP support team.
        </p>
      </Card>

      {/* Balance Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Account Balance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              KSh {parseFloat(profile.balance || "0").toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.category && `${profile.category} account`}
            </p>
          </div>
          <Button asChild>
            <a href="/customer/payments">View Payment History</a>
          </Button>
        </div>
      </Card>
    </div>
  )
}