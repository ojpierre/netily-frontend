"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { AddressesList } from "@/shop-ui/components/addresses-list"
import { djangoApi, MOCK_ADDRESSES, DjangoAddress } from "@/shop-ui/lib/django-api"

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<DjangoAddress[]>(MOCK_ADDRESSES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await djangoApi.getAddresses()
        setAddresses(data)
      } catch (err) {
        setAddresses(MOCK_ADDRESSES)
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
          <div className="mb-10">
            <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground block mb-2">
              Site Logistics
            </span>
            <h1 className="font-serif text-3xl lg:text-4xl mb-2">
              Dispatch & Tower Delivery Sites
            </h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Manage your regional warehouses, tower station enclosures, and office delivery addresses.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <AccountSidebar />

            <div className="flex-1">
              <AddressesList initialAddresses={addresses} />
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </>
  )
}
