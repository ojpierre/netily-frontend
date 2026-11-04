"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  MessageSquare,
  Minus,
  Package,
  PlayCircle,
  Router,
  UserPlus,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/admin-api"

type AdminOnboardingUser = {
  id?: string | number | null
  email?: string | null
  username?: string | null
  role?: string | null
  access_level?: string | null
  is_staff?: boolean | null
  is_superuser?: boolean | null
  account_created_at?: string | null
  onboarding_tour_started_at?: string | null
  onboarding_tour_dismissed_at?: string | null
  onboarding_tour_completed_at?: string | null
  onboarding_video_viewed_at?: string | null
}

type TaskId = "router" | "plan" | "payment" | "customer" | "sms"
type Checks = Record<TaskId, boolean>

type GuideStep = {
  /** CSS selector of the control to point at. */
  target: string
  text: string
  /** Page event that opens the relevant form for the user. */
  event?: string
  eventLabel?: string
}

type Task = {
  id: TaskId
  day: 1 | 2 | 3
  icon: React.ComponentType<{ className?: string }>
  title: string
  why: string
  steps: string[]
  route: string
  doneText: string
  guide: GuideStep[]
}

const STORAGE_PREFIX = "netily-admin-setup-tour"
const NEW_ACCOUNT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 15_000
const SETUP_VIDEO_URL = "https://www.youtube-nocookie.com/embed/cGfHPU1tJWM?rel=0"
const EMPTY_CHECKS: Checks = { router: false, plan: false, payment: false, customer: false, sms: false }

const DAY_LABELS: Record<Task["day"], string> = {
  1: "Day 1 · Network and plans",
  2: "Day 2 · Payments and customers",
  3: "Day 3 · Customer messages",
}

function buildTasks(country: string): Task[] {
  const uganda = country === "UG"
  return [
    {
      id: "router",
      day: 1,
      icon: Router,
      title: "Add your router",
      why: "Plans, hotspot logins and PPPoE accounts all run through your router.",
      steps: [
        "Go to Routers and select Add router.",
        "Enter a name and location, then save.",
      ],
      route: "/admin/routers",
      doneText: "Router added.",
      guide: [
        { target: "[data-onboarding='routers-add-button']", text: "Select Add router to open the form.", event: "netily:onboarding:open-router", eventLabel: "Open the form" },
        { target: "[data-onboarding='router-form']", text: "Enter a name your team will recognise (for example Main Gateway) and the location. Then save." },
      ],
    },
    {
      id: "plan",
      day: 1,
      icon: Package,
      title: "Create your first plan",
      why: "Plans set the speed, price and duration customers pay for.",
      steps: [
        "Go to Plans and select Create plan.",
        "Choose PPPoE for monthly home internet, or Hotspot for pay-as-you-go Wi-Fi.",
        uganda
          ? "Enter a name, speed and price in UGX, then save. Hotspot prices must be at least UGX 500."
          : "Enter a name, speed and price, then save. For example: Home 10Mbps, monthly, KES 1,500.",
      ],
      route: "/admin/plans",
      doneText: "Plan created.",
      guide: [
        { target: "[data-onboarding='plans-create-button']", text: "Select Create plan.", event: "netily:onboarding:open-plan-picker", eventLabel: "Open it" },
        { target: "[data-onboarding='plan-type-picker']", text: "Pick PPPoE for monthly accounts or Hotspot for Wi-Fi packages." },
        { target: "[data-onboarding='plan-form']", text: "Fill in the name, speed and price. Leave anything you are unsure of on its default, then save." },
      ],
    },
    uganda
      ? {
          id: "payment",
          day: 2,
          icon: Banknote,
          title: "Connect Mobile Money",
          why: "Customers pay with MTN MoMo or Airtel Money and their accounts renew on their own.",
          steps: [
            "Go to Payment Methods and enter your Payment Methods PIN.",
            "Open iotec and enter your client ID, client secret and wallet ID.",
            "Test the connection, then activate it.",
          ],
          route: "/admin/payment-methods",
          doneText: "Mobile Money is active.",
          guide: [
            { target: "[data-onboarding='payment-methods-iotec-card']", text: "Open the iotec card.", event: "netily:onboarding:open-iotec", eventLabel: "Open it" },
            { target: "[data-onboarding='iotec-config-form']", text: "Enter your iotec details, test the connection, then activate." },
          ],
        }
      : {
          id: "payment",
          day: 2,
          icon: Banknote,
          title: "Connect M-Pesa",
          why: "Customers pay with M-Pesa and their accounts renew on their own.",
          steps: [
            "Go to Payment Methods and enter your Payment Methods PIN.",
            "Open M-Pesa and enter your Paybill or Till number, consumer key, consumer secret and passkey from Daraja.",
            "Test the connection, then activate it.",
          ],
          route: "/admin/payment-methods",
          doneText: "M-Pesa is active.",
          guide: [
            { target: "[data-onboarding='payment-methods-daraja-card']", text: "Open the M-Pesa card.", event: "netily:onboarding:open-daraja", eventLabel: "Open it" },
            { target: "[data-onboarding='daraja-config-form']", text: "Enter your Daraja details, test the connection, then activate." },
          ],
        },
    {
      id: "customer",
      day: 2,
      icon: UserPlus,
      title: "Add your first customer",
      why: "Start with one real customer to check that billing and access work end to end.",
      steps: [
        "Go to Users and select Add User.",
        "Choose the plan and router, enter the customer's name and phone number, then save.",
      ],
      route: "/admin/users",
      doneText: "First customer added.",
      guide: [
        { target: "[data-onboarding='users-add-button']", text: "Select Add User, then fill in the customer's details and save." },
      ],
    },
    {
      id: "sms",
      day: 3,
      icon: MessageSquare,
      title: "Turn on SMS alerts",
      why: "Customers get a text when they pay, and a reminder before their account expires.",
      steps: [
        "Go to SMS and choose Netily SMS (quickest) or connect your own provider.",
        "Open Notifications and switch on payment confirmations and expiry reminders.",
      ],
      route: "/admin/sms",
      doneText: "SMS alerts are on.",
      guide: [
        { target: "[data-onboarding='sms-gateway-tab']", text: "Choose Netily SMS or add your own provider.", event: "netily:onboarding:sms-gateway", eventLabel: "Open the tab" },
        { target: "[data-onboarding='sms-notifications-tab'], [data-onboarding='sms-notifications-panel']", text: "Switch on payment confirmations and expiry reminders.", event: "netily:onboarding:sms-notifications", eventLabel: "Open the tab" },
      ],
    },
  ]
}

function hasRecords(response: { count?: number; results?: unknown[] } | unknown[] | null | undefined) {
  if (!response) return false
  if (Array.isArray(response)) return response.length > 0
  return Number(response.count ?? response.results?.length ?? 0) > 0
}

async function loadChecks(country: string, previous: Checks): Promise<Checks> {
  const [routers, plans, payment, customers, smsSettings, smsGateways] = await Promise.allSettled([
    adminApi.getRouters({ page_size: "1" }),
    adminApi.getPlans({ page_size: "1" }),
    country === "UG"
      ? adminApi.getIotecConfigurations().then((configs) => configs.some((config: { is_active?: boolean }) => config.is_active))
      : adminApi.getActiveMpesaSummary().then((summary) => Boolean(summary?.is_active && summary.business_shortcode)),
    adminApi.getCustomers({ page_size: "1" }),
    adminApi.getSMSNotificationSettings(),
    adminApi.getSMSGatewayConfigs(),
  ])

  // A failed request keeps the last known answer rather than un-ticking a task.
  const pick = <T,>(result: PromiseSettledResult<T>, read: (value: T) => boolean, fallback: boolean) =>
    result.status === "fulfilled" ? read(result.value) : fallback

  const smsReady = (() => {
    if (smsSettings.status !== "fulfilled") return previous.sms
    const settings = smsSettings.value
    const gatewayActive = smsGateways.status === "fulfilled" && smsGateways.value.some((gateway) => gateway.is_active)
    const hasSender = Boolean(settings.use_inbuilt_system || gatewayActive)
    const alertsOn = Boolean(settings.pppoe_payment_confirmation || settings.pppoe_expiry_reminder)
    return hasSender && alertsOn
  })()

  return {
    router: pick(routers, hasRecords, previous.router),
    plan: pick(plans, hasRecords, previous.plan),
    payment: pick(payment, Boolean, previous.payment),
    customer: pick(customers, hasRecords, previous.customer),
    sms: smsReady,
  }
}

function scopedKey(user: AdminOnboardingUser | null | undefined, suffix: string) {
  const host = typeof window !== "undefined" ? window.location.hostname : "local"
  const userKey = user?.id || user?.email || user?.username || "admin"
  return `${STORAGE_PREFIX}:${host}:${userKey}:${suffix}`
}

function readLocal(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Private windows can block storage; the guide still works for this visit.
  }
}

function isPrincipalAdmin(user: AdminOnboardingUser | null | undefined) {
  const role = String(user?.role || "").toLowerCase()
  const accessLevel = String(user?.access_level || "").toLowerCase()
  if (!user) return false
  if (role.includes("super")) return false
  if (accessLevel.includes("super")) return false
  return role === "admin" || accessLevel === "admin" || (!role && !!user.is_staff)
}

function isNewAccount(user: AdminOnboardingUser | null | undefined) {
  if (!user?.account_created_at) return false
  const createdAt = new Date(user.account_created_at).getTime()
  if (!Number.isFinite(createdAt)) return false
  const age = Date.now() - createdAt
  return age >= -5 * 60 * 1000 && age <= NEW_ACCOUNT_WINDOW_MS
}

function accountDay(user: AdminOnboardingUser | null | undefined): 1 | 2 | 3 {
  if (!user?.account_created_at) return 1
  const age = Date.now() - new Date(user.account_created_at).getTime()
  if (!Number.isFinite(age) || age < 0) return 1
  return Math.min(3, Math.floor(age / (24 * 60 * 60 * 1000)) + 1) as 1 | 2 | 3
}

function findTarget(selector?: string) {
  if (!selector || typeof document === "undefined") return null
  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector))
  return targets.filter((target) => target.getClientRects().length > 0).at(-1) || null
}

type PanelMode = "hidden" | "collapsed" | "expanded"

export function AdminOnboardingTour({
  user,
  disabled = false,
  country = "KE",
}: {
  user?: AdminOnboardingUser | null
  disabled?: boolean
  country?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const tasks = useMemo(() => buildTasks(country), [country])

  const [mode, setMode] = useState<PanelMode>("hidden")
  const [checks, setChecks] = useState<Checks | null>(null)
  const [skipped, setSkipped] = useState<TaskId[]>([])
  const [openTask, setOpenTask] = useState<TaskId | null>(null)
  const [guide, setGuide] = useState<{ task: TaskId; step: number } | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const checksRef = useRef<Checks | null>(null)

  const eligible = !disabled && isPrincipalAdmin(user)

  // ── Decide whether the checklist shows on its own ─────────────────────
  useEffect(() => {
    if (!eligible || typeof window === "undefined") return
    try {
      setSkipped(JSON.parse(readLocal(scopedKey(user, "skipped")) || "[]"))
    } catch {
      setSkipped([])
    }
    if (!isNewAccount(user)) return
    if (user?.onboarding_tour_completed_at || user?.onboarding_tour_dismissed_at) return
    if (readLocal(scopedKey(user, "complete")) === "1" || readLocal(scopedKey(user, "dismissed")) === "1") return

    // First visit opens the checklist; later visits keep the size the admin chose.
    const saved = readLocal(scopedKey(user, "panel"))
    const timer = window.setTimeout(() => {
      setMode(saved === "collapsed" ? "collapsed" : "expanded")
      if (!user?.onboarding_tour_started_at) void adminApi.recordOnboardingEvent("started").catch(() => undefined)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [eligible, user])

  // ── Manual start from the profile menu ────────────────────────────────
  useEffect(() => {
    const start = () => {
      writeLocal(scopedKey(user, "dismissed"), null)
      setGuide(null)
      setVideoOpen(false)
      setMode("expanded")
      void adminApi.recordOnboardingEvent("started").catch(() => undefined)
    }
    window.addEventListener("netily:onboarding:start", start)
    return () => window.removeEventListener("netily:onboarding:start", start)
  }, [user])

  // ── Check real progress (router exists, plan exists, …) ───────────────
  const refreshChecks = useCallback(async () => {
    const previous = checksRef.current || EMPTY_CHECKS
    const next = await loadChecks(country, previous)
    const wasLoaded = checksRef.current !== null
    checksRef.current = next
    setChecks(next)
    if (!wasLoaded) return

    const finished = tasks.find((task) => next[task.id] && !previous[task.id])
    if (finished) {
      const upcoming = tasks.find((task) => !next[task.id])
      toast.success(`${finished.doneText} ${upcoming ? `Next: ${upcoming.title.toLowerCase()}.` : "Setup is complete."}`)
      setGuide((current) => (current?.task === finished.id ? null : current))
      setMode((current) => (current === "hidden" ? current : "expanded"))
    }
  }, [country, tasks])

  useEffect(() => {
    if (mode === "hidden") return
    void refreshChecks()
  }, [mode, pathname, refreshChecks])

  useEffect(() => {
    if (mode === "hidden") return
    const onFocus = () => void refreshChecks()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshChecks()
    }, CHECK_INTERVAL_MS)
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [mode, refreshChecks])

  const isDone = useCallback((id: TaskId) => Boolean(checks?.[id]), [checks])
  const isSettled = useCallback((id: TaskId) => isDone(id) || skipped.includes(id), [isDone, skipped])
  const currentTask = tasks.find((task) => !isSettled(task.id)) || null
  const doneCount = tasks.filter((task) => isDone(task.id)).length
  const allDone = checks !== null && doneCount === tasks.length
  const visibleTask = openTask ? tasks.find((task) => task.id === openTask) || currentTask : currentTask

  useEffect(() => {
    setOpenTask(null)
  }, [currentTask?.id])

  // ── Panel actions ──────────────────────────────────────────────────────
  const setPanel = (next: PanelMode) => {
    setMode(next)
    if (next !== "hidden") writeLocal(scopedKey(user, "panel"), next)
  }

  const hideGuide = () => {
    writeLocal(scopedKey(user, "dismissed"), "1")
    void adminApi.recordOnboardingEvent("dismissed").catch(() => undefined)
    setGuide(null)
    setMode("hidden")
    toast.info("Setup guide hidden. Reopen it from your profile menu → Setup guide.")
  }

  const finishGuide = () => {
    writeLocal(scopedKey(user, "complete"), "1")
    void adminApi.recordOnboardingEvent("completed").catch(() => undefined)
    setMode("hidden")
  }

  const skipTask = (id: TaskId) => {
    const next = Array.from(new Set([...skipped, id]))
    setSkipped(next)
    writeLocal(scopedKey(user, "skipped"), JSON.stringify(next))
  }

  const unskipTask = (id: TaskId) => {
    const next = skipped.filter((item) => item !== id)
    setSkipped(next)
    writeLocal(scopedKey(user, "skipped"), JSON.stringify(next))
    setOpenTask(id)
  }

  const toggleVideo = () => {
    if (!videoOpen && !user?.onboarding_video_viewed_at) {
      void adminApi.recordOnboardingEvent("video_viewed").catch(() => undefined)
    }
    setVideoOpen((open) => !open)
  }

  const showMe = (task: Task) => {
    setVideoOpen(false)
    setGuide({ task: task.id, step: 0 })
    if (pathname !== task.route) router.push(task.route)
  }

  const goToPage = (task: Task) => {
    if (pathname !== task.route) router.push(task.route)
  }

  if (!eligible || mode === "hidden") return null

  if (guide) {
    const task = tasks.find((item) => item.id === guide.task)
    if (task) {
      return (
        <GuideSpotlight
          task={task}
          stepIndex={guide.step}
          onRoute={pathname === task.route}
          onStep={(step) => setGuide({ task: task.id, step })}
          onClose={() => setGuide(null)}
        />
      )
    }
  }

  if (mode === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => setPanel("expanded")}
        className="fixed bottom-4 right-4 z-[110] flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-2 pr-4 text-sm font-medium text-card-foreground shadow-lg transition-colors hover:bg-muted sm:bottom-6 sm:right-6"
        aria-label={`Open setup checklist, ${doneCount} of ${tasks.length} done`}
      >
        <ProgressRing value={doneCount} total={tasks.length} />
        <span>Setup</span>
        <span className="text-muted-foreground">
          {doneCount} of {tasks.length}
        </span>
      </button>
    )
  }

  const today = accountDay(user)

  return (
    <section
      aria-label="Setup checklist"
      onPointerDown={(event) => event.stopPropagation()}
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[110] flex max-h-[min(640px,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
    >
      <header className="border-b border-border px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold leading-tight">
              {allDone ? "Your workspace is set up" : "Set up your workspace"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {allDone
                ? "Everything customers need to connect and pay is in place."
                : `${doneCount} of ${tasks.length} done · Day ${today} of 3`}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanel("collapsed")} aria-label="Minimise setup checklist">
              <Minus className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={allDone ? finishGuide : hideGuide} aria-label="Close setup checklist">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {tasks.map((task) => (
            <span key={task.id} className={`h-1 flex-1 rounded-full ${isDone(task.id) ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {checks === null ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Checking your setup…</p>
        ) : (
          ([1, 2, 3] as const).map((day) => {
            const dayTasks = tasks.filter((task) => task.day === day)
            return (
              <div key={day} className="py-1">
                <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{DAY_LABELS[day]}</p>
                <ol>
                  {dayTasks.map((task) => {
                    const done = isDone(task.id)
                    const wasSkipped = !done && skipped.includes(task.id)
                    const isCurrent = currentTask?.id === task.id
                    const locked = !done && !wasSkipped && !isCurrent
                    const expanded = !done && !locked && visibleTask?.id === task.id
                    const number = tasks.indexOf(task) + 1
                    return (
                      <li key={task.id} className={`rounded-lg ${expanded ? "bg-muted/60" : ""}`}>
                        <button
                          type="button"
                          disabled={locked || done}
                          onClick={() => (wasSkipped ? unskipTask(task.id) : setOpenTask(task.id))}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left disabled:cursor-default"
                          aria-expanded={expanded}
                        >
                          <StatusDot done={done} current={isCurrent} locked={locked} number={number} />
                          <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through decoration-muted-foreground/50" : locked ? "text-muted-foreground" : "font-medium"}`}>
                            {task.title}
                          </span>
                          {wasSkipped && <span className="text-xs text-muted-foreground">Skipped</span>}
                          {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/70" aria-label="Finish the step above first" />}
                          {!done && !locked && !wasSkipped && (expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
                        </button>
                        {expanded && (
                          <div className="px-2 pb-3 pl-11">
                            <p className="text-sm text-muted-foreground">{task.why}</p>
                            <ol className="mt-3 space-y-2 text-sm">
                              {task.steps.map((step, index) => (
                                <li key={step} className="flex gap-2">
                                  <span className="w-4 shrink-0 text-muted-foreground">{index + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button type="button" size="sm" onClick={() => showMe(task)}>
                                Show me where
                              </Button>
                              {pathname !== task.route && (
                                <Button type="button" size="sm" variant="outline" onClick={() => goToPage(task)}>
                                  Go to page
                                </Button>
                              )}
                              <button type="button" onClick={() => skipTask(task.id)} className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                                Skip for now
                              </button>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">This ticks itself off once it is saved.</p>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            )
          })
        )}
      </div>

      <footer className="border-t border-border px-4 py-3">
        {videoOpen && (
          <div className="mb-3 overflow-hidden rounded-lg border border-border bg-black">
            <iframe
              className="aspect-video w-full"
              src={SETUP_VIDEO_URL}
              title="Netily setup walkthrough"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={toggleVideo} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <PlayCircle className="h-4 w-4" />
            {videoOpen ? "Hide video" : "Watch the walkthrough"}
          </button>
          {allDone ? (
            <Button type="button" size="sm" onClick={finishGuide}>Done</Button>
          ) : (
            <button type="button" onClick={hideGuide} className="text-xs text-muted-foreground hover:text-foreground">
              Hide guide
            </button>
          )}
        </div>
      </footer>
    </section>
  )
}

function StatusDot({ done, current, locked, number }: { done: boolean; current: boolean; locked: boolean; number: number }) {
  if (done) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3.5 w-3.5" />
      </span>
    )
  }
  return (
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-medium ${
        current ? "border-primary text-primary" : locked ? "border-border text-muted-foreground/70" : "border-border text-muted-foreground"
      }`}
    >
      {number}
    </span>
  )
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const radius = 11
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (total ? value / total : 0))
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="-rotate-90">
      <circle cx="14" cy="14" r={radius} fill="none" strokeWidth="3" className="stroke-muted" />
      <circle cx="14" cy="14" r={radius} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary transition-all" strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
  )
}

function GuideSpotlight({
  task,
  stepIndex,
  onRoute,
  onStep,
  onClose,
}: {
  task: Task
  stepIndex: number
  onRoute: boolean
  onStep: (step: number) => void
  onClose: () => void
}) {
  const step = task.guide[Math.min(stepIndex, task.guide.length - 1)]
  const [rect, setRect] = useState<DOMRect | null>(null)
  const scrolledFor = useRef<string | null>(null)

  useEffect(() => {
    let frame = 0
    const sync = () => {
      const target = onRoute ? findTarget(step.target) : null
      if (target && scrolledFor.current !== step.target) {
        scrolledFor.current = step.target
        target.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      const next = target?.getBoundingClientRect() || null
      setRect((current) => {
        if (!next || !current) return next
        const same = Math.abs(current.top - next.top) < 1 && Math.abs(current.left - next.left) < 1 &&
          Math.abs(current.width - next.width) < 1 && Math.abs(current.height - next.height) < 1
        return same ? current : next
      })
      frame = window.requestAnimationFrame(sync)
    }
    frame = window.requestAnimationFrame(sync)
    return () => window.cancelAnimationFrame(frame)
  }, [onRoute, step.target])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const last = stepIndex >= task.guide.length - 1
  const calloutStyle: React.CSSProperties = (() => {
    if (!rect || typeof window === "undefined") return { left: "50%", bottom: 24, transform: "translateX(-50%)" }
    const width = Math.min(340, window.innerWidth - 32)
    const left = Math.min(Math.max(rect.left, 16), window.innerWidth - width - 16)
    if (window.innerHeight - rect.bottom > 220) return { left, top: rect.bottom + 12, width }
    if (rect.top > 220) return { left, bottom: window.innerHeight - rect.top + 12, width }
    return { left: "50%", bottom: 24, transform: "translateX(-50%)", width }
  })()

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]">
      {rect ? (
        <div
          className="absolute rounded-lg ring-2 ring-primary transition-[top,left,width,height] duration-150"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/30" />
      )}
      <div
        role="dialog"
        aria-label={`${task.title}: step ${stepIndex + 1} of ${task.guide.length}`}
        className="pointer-events-auto absolute w-[calc(100vw-2rem)] max-w-[340px] rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xl"
        style={calloutStyle}
        // Keeps an open form dialog from treating clicks here as "click outside" and closing.
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {task.title} · {stepIndex + 1} of {task.guide.length}
          </p>
          <button type="button" onClick={onClose} className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close guide">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm">{onRoute ? step.text : "Opening the page…"}</p>
        {onRoute && !rect && (
          <p className="mt-2 text-xs text-muted-foreground">
            {task.id === "payment"
              ? "Enter your Payment Methods PIN first. The guide will point to the right place after that."
              : "Waiting for this part of the page to appear."}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2">
          {step.event && onRoute && (
            <Button type="button" size="sm" variant="outline" onClick={() => {
              window.dispatchEvent(new CustomEvent(step.event!))
              if (!last) onStep(stepIndex + 1)
            }}>
              {step.eventLabel || "Open it"}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1">
            {stepIndex > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onStep(stepIndex - 1)}>
                Back
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => (last ? onClose() : onStep(stepIndex + 1))}>
              {last ? "Got it" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
