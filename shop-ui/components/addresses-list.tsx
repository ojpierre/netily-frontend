"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X, MapPin } from "lucide-react"
import { Input } from "@/shop-ui/components/ui/input"
import { Label } from "@/shop-ui/components/ui/label"
import { DjangoAddress } from "@/shop-ui/lib/django-api"
import { toast } from "sonner"

export function AddressesList({ initialAddresses }: { initialAddresses: DjangoAddress[] }) {
  const [addresses, setAddresses] = useState<DjangoAddress[]>(initialAddresses)
  const [isAdding, setIsAdding] = useState(false)
  const [newAddr, setNewAddr] = useState({
    label: "",
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "Kenya",
    phone: "",
    isDefault: false,
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const item: DjangoAddress = {
      id: `addr_${Date.now()}`,
      userId: "usr_netily_8842",
      label: newAddr.label || "ISP Field Site",
      name: newAddr.name,
      street: newAddr.street,
      city: newAddr.city,
      state: newAddr.state,
      zip: newAddr.zip,
      country: newAddr.country,
      phone: newAddr.phone,
      isDefault: newAddr.isDefault,
    }

    const updated = newAddr.isDefault
      ? [item, ...addresses.map((a) => ({ ...a, isDefault: false }))]
      : [item, ...addresses]

    setAddresses(updated)
    if (typeof window !== "undefined") {
      localStorage.setItem("netily_addresses", JSON.stringify(updated))
    }
    toast.success("New site delivery address registered successfully.")
    setIsAdding(false)
    setNewAddr({
      label: "",
      name: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "Kenya",
      phone: "",
      isDefault: false,
    })
  }

  function handleDelete(id: string) {
    const updated = addresses.filter((a) => a.id !== id)
    setAddresses(updated)
    if (typeof window !== "undefined") {
      localStorage.setItem("netily_addresses", JSON.stringify(updated))
    }
    toast.success("Site address removed")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h2 className="font-serif text-2xl mb-1">
            Dispatch Sites & NOC Locations
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Designate tower locations, telecom mast hubs, and central datacenter delivery coordinates.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.2em] uppercase px-5 py-3 flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Site
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="border border-border bg-card p-6 relative">
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-serif text-lg mb-4">
                Register New Dispatch Site
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="label" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Site Label (e.g. Mombasa Central NOC, Tower Mast #4)
                    </Label>
                    <Input
                      id="label"
                      required
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      placeholder="Mombasa Fiber Hub"
                      className="mt-1.5 rounded-none border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Recipient / Site Engineer Name
                    </Label>
                    <Input
                      id="name"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      placeholder="David Kimani (Field Lead)"
                      className="mt-1.5 rounded-none border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="street" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Physical Street / Tower GPS Coordinate Reference
                  </Label>
                  <Input
                    id="street"
                    required
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    placeholder="Moi Avenue, Telecom Tower Enclosure Level 3"
                    className="mt-1.5 rounded-none border-border"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-xs uppercase tracking-wider text-muted-foreground">
                      City
                    </Label>
                    <Input
                      id="city"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      placeholder="Mombasa"
                      className="mt-1.5 rounded-none border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Gate / Site Phone
                    </Label>
                    <Input
                      id="phone"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      placeholder="+254 711 222 333"
                      className="mt-1.5 rounded-none border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Country
                    </Label>
                    <Input
                      id="country"
                      required
                      value={newAddr.country}
                      onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                      className="mt-1.5 rounded-none border-border"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2.5 text-xs tracking-wider uppercase border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs tracking-[0.15em] uppercase bg-foreground text-background hover:bg-foreground/90"
                  >
                    Save Site
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="p-5 border border-border bg-card relative space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-base">{addr.label}</span>
              {addr.isDefault && (
                <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 border border-border bg-muted">
                  Default NOC
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-medium">{addr.name}</p>
              <p>{addr.street}</p>
              <p>{addr.city}, {addr.country}</p>
              <p className="font-mono">{addr.phone}</p>
            </div>

            <div className="pt-2 border-t border-border/50 flex justify-end">
              <button
                onClick={() => handleDelete(addr.id)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                aria-label="Delete site"
              >
                <Trash2 className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
