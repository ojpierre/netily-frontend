"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Ctx = { value: string | undefined; id: string }
const TabsCtx = React.createContext<Ctx>({ value: undefined, id: "tabs" })

export function AnimatedTabs({
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof Tabs>) {
  const id = React.useId()
  const [inner, setInner] = React.useState(defaultValue)
  const current = value ?? inner
  const ctx = React.useMemo(() => ({ value: current, id }), [current, id])

  return (
    <TabsCtx.Provider value={ctx}>
      <Tabs
        {...props}
        value={current}
        onValueChange={(v) => {
          setInner(v)
          onValueChange?.(v)
        }}
      />
    </TabsCtx.Provider>
  )
}

export function AnimatedTabsTrigger({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  const { value: active, id } = React.useContext(TabsCtx)
  const reduce = useReducedMotion()
  const isActive = active === value

  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent",
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={`${id}-tab-indicator`}
          className="absolute inset-0 rounded-md border border-border bg-background shadow-sm dark:bg-input/30"
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }
          }
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </TabsTrigger>
  )
}

export function AnimatedTabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsContent>) {
  const reduce = useReducedMotion()
  return (
    <TabsContent {...props}>
      <motion.div
        className={className}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      >
        {children}
      </motion.div>
    </TabsContent>
  )
}