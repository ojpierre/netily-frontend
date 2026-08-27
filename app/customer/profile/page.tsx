"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Phone, Mail, MapPin, Wifi, Calendar, Loader2 } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { toast } from "sonner"

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
  // UPDATED: Only email is editable
  const [formData, setFormData] = useState({
    email: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
        // UPDATED: Only set email in formData
        setFormData({
          email: data.email || "",
        })
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

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = formData.email.trim().toLowerCase()

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setIsSaving(true)
      // UPDATED: Only send email in payload
      const updated = await customerApi.updateProfile({
        email,
      })
      setProfile(updated)
      // UPDATED: Only update email in formData
      setFormData({
        email: updated.email || "",
      })
      toast.success("Profile updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

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
    ACTIVE: "bg-success/15 text-success dark:bg-green-950 dark:text-success",
    SUSPENDED: "bg-destructive/15 text-destructive dark:bg-red-950 dark:text-destructive",
    PENDING: "bg-warning/15 text-warning dark:bg-yellow-950 dark:text-warning",
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
          <div className="w-12 h-12 bg-primary/15 dark:bg-blue-950 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary dark:text-primary/80" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-bold">{profile.customer_code}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-success/15 dark:bg-green-950 rounded-full flex items-center justify-center">
            <Wifi className="w-6 h-6 text-success dark:text-success" />
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

      <Card className="p-6">
        <div className="mb-6">
          <h3 className="font-semibold">Personal Information</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your contact details up to date for receipts and support follow-ups.
          </p>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            {/* UPDATED: First Name - read-only */}
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                First Name
              </Label>
              <Input id="first_name" value={profile.first_name || ""} disabled />
            </div>

            {/* UPDATED: Last Name - read-only */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={profile.last_name || ""} disabled />
            </div>

            {/* UPDATED: Phone - read-only */}
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input id="phone_number" value={profile.phone_number} disabled />
              <p className="text-xs text-muted-foreground">Phone number is your portal login and is managed by your ISP.</p>
            </div>

            {/* UPDATED: Email - editable */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ email: event.target.value })}
                placeholder="name@example.com"
                disabled={isSaving}
              />
            </div>

            {/* UPDATED: Address - read-only */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Address
              </Label>
              <Input id="address" value={profile.address || ""} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </form>
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