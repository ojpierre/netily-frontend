"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shop-ui/components/ui/form"
import { Label } from "@/shop-ui/components/ui/label"
import { Input } from "@/shop-ui/components/ui/input"
import { toast } from "sonner"
import { ArrowRight, ShoppingCart, UserPlus } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  organization: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(7, { message: "Please enter a valid phone number." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organization: "",
      email: "",
      phone: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "netily_user_profile",
        JSON.stringify({
          id: `usr_${Date.now()}`,
          name: values.name,
          email: values.email,
          company: values.organization || "",
          role: "CUSTOMER",
          phone: values.phone,
        })
      )
      localStorage.setItem("netily_shop_customer_session", "authenticated")
      localStorage.setItem("netily_shop_customer_email", values.email)
    }

    setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      setIsLoading(false)
      toast.success("Customer account created")
      router.push(params.get("next") || "/shop/account/profile")
    }, 600)
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted">
              <UserPlus className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Create Account</p>
            <h1 className="mt-2 font-serif text-3xl">Create your shop account</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Anyone can buy from Internetily Shop. Use this account to checkout faster, track orders, save delivery details, and request support.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="Jane Otieno"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Business or Organization (Optional)
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="Home buyer, school, shop, office, or company"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Phone Number
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="+254 700 000 000"
                        type="tel"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.16em] text-background transition hover:bg-foreground/90 disabled:opacity-60"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </Form>

          <div className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/shop/login" className="text-foreground underline underline-offset-2">
                Sign In
              </Link>
          </div>
        </div>

        <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-border bg-[#0b42d8] text-white">
          <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={220} height={80} className="absolute left-8 top-8 h-14 w-auto object-contain" />
          <div className="absolute inset-x-8 bottom-8">
            <ShoppingCart className="mb-5 h-10 w-10 stroke-[1.4]" />
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Made for every buyer</p>
            <h2 className="mt-3 font-serif text-3xl">Buy equipment without complicated forms</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
              Whether you are buying one router, school WiFi equipment, office hardware, or a larger rollout bundle, your account keeps orders and support simple.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
