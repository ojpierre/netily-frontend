"use client"

import { Button } from "@/shop-ui/components/ui/button"
import { Switch } from "@/shop-ui/components/ui/switch"
import { Label } from "@/shop-ui/components/ui/label"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { Bell, Shield } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  function handleSavePreferences() {
    toast.success("Preferences updated successfully.")
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background text-foreground pt-24 lg:pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground block mb-2">
              Account Control
            </span>
            <h1 className="font-serif text-3xl lg:text-4xl mb-2">
              Settings & Preferences
            </h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Configure dispatch notifications, restock alerts, and account security.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <AccountSidebar />

            <div className="flex-1 space-y-8 max-w-2xl">
              {/* Notification Preferences */}
              <div className="bg-card border border-border p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Bell className="h-4 w-4 stroke-[1.5]" />
                  <h2 className="font-serif text-xl">
                    Fulfillment & Stock Notifications
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Label className="text-sm font-medium">
                        Dispatch & Tracking Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receive instant SMS and email when equipment leaves our warehouse.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Label className="text-sm font-medium">
                        MikroTik & OLT Restock Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Get alerted when backordered routers or fiber splicing accessories arrive.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm font-medium">
                        B2B Price Sheet Updates
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Monthly proforma pricing updates for bulk cabling spools and SFP+ transceivers.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <button
                    onClick={handleSavePreferences}
                    className="px-8 py-4 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90"
                  >
                    Save Notification Rules
                  </button>
                </div>
              </div>

              {/* Security & Organization */}
              <div className="bg-card border border-border p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Shield className="h-4 w-4 stroke-[1.5]" />
                  <h2 className="font-serif text-xl">
                    Organization Security
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Label className="text-sm font-medium">
                        Two-Factor Authentication (2FA)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Require an OTP code to authorize orders over $5,000 USD.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm font-medium">
                        Multi-User Engineer Procurement
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Allow field technicians to generate draft order requisitions for manager sign-off.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </>
  )
}
