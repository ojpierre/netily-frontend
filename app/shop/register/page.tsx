"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/shop-ui/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shop-ui/components/ui/form"
import { Label } from "@/shop-ui/components/ui/label"
import { Input } from "@/shop-ui/components/ui/input"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company or ISP name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
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
          company: values.company,
          role: "ISP_ENGINEER",
          phone: "+254 700 000 000",
        })
      )
    }

    setTimeout(() => {
      setIsLoading(false)
      toast.success("Account created successfully!")
      router.push("/shop/account/profile")
    }, 600)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/shop" className="inline-flex flex-col items-center mb-6">
          <span className="font-serif text-2xl lg:text-3xl tracking-[0.3em] uppercase leading-none">
            Netily Shop
          </span>
          <span className="text-[0.6rem] tracking-[0.2em] uppercase font-light mt-1 text-muted-foreground">
            Enterprise & Networking
          </span>
        </Link>
        <h2 className="font-serif text-2xl tracking-wide mb-2">Create Enterprise Account</h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Register your ISP, telecommunications firm, or enterprise
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 border border-border sm:px-10">
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
                        placeholder="Alex Mercer"
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
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      ISP / Organization Name
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="Apex Telecom Ltd"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Work Email
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="alex@company.com"
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
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Already have an enterprise account?{" "}
              <Link href="/shop/login" className="text-foreground underline underline-offset-2 uppercase tracking-wider">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
