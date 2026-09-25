"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { ProfileForm } from "@/shop-ui/components/profile-form"
import { djangoApi, MOCK_USER, DjangoUserProfile } from "@/shop-ui/lib/django-api"

export default function ProfilePage() {
  const [user, setUser] = useState<DjangoUserProfile>(MOCK_USER)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profile = await djangoApi.getUserProfile()
        setUser(profile)
      } catch (err) {
        setUser(MOCK_USER)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background text-foreground pt-24 lg:pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground block mb-2">
              Account Overview
            </span>
            <h1 className="font-serif text-3xl lg:text-4xl mb-2">
              My Profile & Organization
            </h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Manage your engineering organization details, dispatch sites, and procurement preferences.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <AccountSidebar />

            <div className="flex-1">
              <div className="max-w-2xl bg-card border border-border p-6 sm:p-8">
                <h2 className="font-serif text-xl mb-6">
                  Personal & Company Details
                </h2>

                <ProfileForm user={user} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </>
  )
}
