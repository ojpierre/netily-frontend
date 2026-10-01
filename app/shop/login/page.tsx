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
import { ArrowRight, LockKeyhole, ShoppingBag } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      window.localStorage.setItem("netily_shop_customer_session", "authenticated")
      window.localStorage.setItem("netily_shop_customer_email", values.email)
      setIsLoading(false)
      toast.success("Signed in successfully")
      router.push(params.get("next") || "/shop/account/profile")
    }, 600)
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Customer Login</p>
            <h1 className="mt-2 font-serif text-3xl">Sign in to continue shopping</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Access your cart, delivery details, order history, quotes, warranty claims, and shop support.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      <Link
                        href="#"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="min-h-12 rounded-xl border-border bg-muted/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.16em] text-background transition hover:bg-foreground/90 disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </Form>

          <div className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
            New here?{" "}
              <Link href="/shop/register" className="text-foreground underline underline-offset-2">
                Create a customer account
              </Link>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-[#0b42d8] text-white">
          <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={220} height={80} className="absolute left-8 top-8 h-14 w-auto object-contain" />
          <div className="absolute inset-x-8 bottom-8">
            <ShoppingBag className="mb-5 h-10 w-10 stroke-[1.4]" />
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Shop with confidence</p>
            <h2 className="mt-3 font-serif text-3xl">Hardware, checkout, and support in one place</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
              Buy network equipment, track delivery, request quotes, and get help whether you are shopping for a home, office, school, business, or larger rollout project.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
