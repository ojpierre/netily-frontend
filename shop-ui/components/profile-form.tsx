"use client"

import { useState, useEffect } from "react"
import { Button } from "@/shop-ui/components/ui/button"
import { Input } from "@/shop-ui/components/ui/input"
import { Label } from "@/shop-ui/components/ui/label"
import { djangoApi, DjangoUserProfile } from "@/shop-ui/lib/django-api"
import { toast } from "sonner"
import { Check } from "lucide-react"

export function ProfileForm({ user }: { user: DjangoUserProfile }) {
  const [profile, setProfile] = useState<DjangoUserProfile>(user)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setProfile(user)
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      const updated = await djangoApi.updateProfile(profile)
      setProfile(updated)
      toast.success("Profile details updated successfully.")
    } catch (err) {
      toast.error("Failed to update profile.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border bg-foreground text-background font-serif text-sm flex items-center justify-center">
            {profile.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-serif text-base text-foreground">{profile.name}</p>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">{profile.company}</p>
          </div>
        </div>
        <span className="text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 border border-border text-muted-foreground">
          {profile.role}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground">
            Full Name
          </Label>
          <Input
            id="fullName"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
            className="mt-1.5 rounded-none border-border"
          />
        </div>

        <div>
          <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">
            Company / Organization
          </Label>
          <Input
            id="company"
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            required
            className="mt-1.5 rounded-none border-border"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
            Corporate Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            required
            className="mt-1.5 rounded-none border-border"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">
            Direct Phone
          </Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="mt-1.5 rounded-none border-border"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Profile Details"}
        </button>
      </div>
    </form>
  )
}
