import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, Zap, Check, ArrowRight, Star, Clock, HardDrive } from "lucide-react"

const currentPlanId = 2
const plans = [
  { id: 1, name: "Starter 5Mbps", description: "Light use for messaging and everyday browsing.", price: 500, validity: "30 days", speedDown: 5, speedUp: 5, dataLimit: "80 GB", features: ["Basic browsing", "Email and chat", "Single household"], isPopular: false },
  { id: 2, name: "Home 10Mbps", description: "A balanced plan for work, streaming, and social apps.", price: 1000, validity: "30 days", speedDown: 10, speedUp: 10, dataLimit: "Unlimited", features: ["Unlimited data", "Streaming ready", "24/7 support"], isPopular: true },
  { id: 3, name: "Family 25Mbps", description: "For busy homes with more devices and more video.", price: 2000, validity: "30 days", speedDown: 25, speedUp: 25, dataLimit: "Unlimited", features: ["Multiple screens", "Work from home", "Priority support"], isPopular: false },
]

export default function DemoCustomerPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Available Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">Demo plan selection using the same overall presentation style as the real portal.</p>
      </div>

      <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-200">Your current plan: Home 10Mbps</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">10 Mbps · KSh 1,000 / 30 days · 22 days left</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          return (
            <Card key={plan.id} className={`relative overflow-hidden ${isCurrent ? "border-blue-500 ring-2 ring-blue-500/20" : plan.isPopular ? "border-orange-400" : ""}`}>
              {plan.isPopular && !isCurrent && (
                <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3" />
                  Popular
                </div>
              )}
              {isCurrent && <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Current Plan</div>}
              <div className="p-6">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5">
                  <span className="text-3xl font-bold">KSh {plan.price.toLocaleString()}</span>
                  <span className="ml-1 text-sm text-muted-foreground">/{plan.validity}</span>
                </div>
                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5"><Zap className="h-4 w-4 text-blue-500" /><span><strong>{plan.speedDown}</strong> Mbps download / <strong>{plan.speedUp}</strong> Mbps upload</span></div>
                  <div className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-emerald-500" /><span>Valid for {plan.validity}</span></div>
                  <div className="flex items-center gap-2.5"><HardDrive className="h-4 w-4 text-violet-500" /><span>{plan.dataLimit}</span></div>
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500" /><span>{feature}</span></div>
                  ))}
                </div>
                {isCurrent ? (
                  <Button variant="outline" className="mt-6 w-full" disabled>Current Plan</Button>
                ) : (
                  <Button className={`mt-6 w-full ${plan.isPopular ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700"}`} disabled>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Switch to {plan.name}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
