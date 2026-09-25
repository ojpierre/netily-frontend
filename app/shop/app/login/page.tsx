"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Shield, User, ArrowRight } from "lucide-react"

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
      email: "alex.mercer@netily.io",
      password: "password123",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Successfully authenticated!")
      router.push("/account/profile")
    }, 600)
  }

  function handleQuickDemoLogin(role: "engineer" | "admin") {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (role === "admin") {
        toast.success("Signed in as Store Administrator")
        router.push("/admin")
      } else {
        toast.success("Signed in as ISP Engineer (Alex Mercer)")
        router.push("/account/profile")
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center mb-6">
          <span className="font-serif text-2xl lg:text-3xl tracking-[0.3em] uppercase leading-none">
            Netily Shop
          </span>
          <span className="text-[0.6rem] tracking-[0.2em] uppercase font-light mt-1 text-muted-foreground">
            Enterprise & Networking
          </span>
        </Link>
        <h2 className="font-serif text-2xl tracking-wide mb-2">Welcome Back</h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Sign in to access your NOC orders, proforma quotes, and site addresses
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 border border-border sm:px-10">
          {/* 1-Click Demo Login Box */}
          <div className="mb-6 p-4 border border-border bg-muted/30">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3 font-semibold">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("engineer")}
                className="py-2.5 px-3 text-[11px] uppercase tracking-wider border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                ISP Engineer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("admin")}
                className="py-2.5 px-3 text-[11px] uppercase tracking-wider border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Panel
              </button>
            </div>
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
                        placeholder="engineer@company.com"
                        type="email"
                        className="rounded-none border-border"
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
                        Forgot?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        className="rounded-none border-border"
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
                className="w-full py-5 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an enterprise account?{" "}
              <Link href="/register" className="text-foreground underline underline-offset-2 uppercase tracking-wider">
                Register Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
