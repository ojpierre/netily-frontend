"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Star, Bug, Wrench, Sparkles, Megaphone } from "lucide-react"
import { adminApi } from "@/lib/admin-api" // Adjust import path
import type { PlatformChangelog } from "@/lib/types"

export default function WhatsNewPage() {
  const [logs, setLogs] = useState<PlatformChangelog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminApi.getPlatformChangelogs()
        setLogs(data)
      } catch (error) {
        console.error("Failed to load changelogs", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getIcon = (type: string) => {
    switch(type) {
      case 'feature': return <Star className="w-5 h-5 text-warning" />
      case 'improvement': return <Sparkles className="w-5 h-5 text-primary" />
      case 'bugfix': return <Bug className="w-5 h-5 text-rose-500" />
      default: return <Wrench className="w-5 h-5 text-slate-500" />
    }
  }

  if (isLoading) {
    return <div className="flex p-8 justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <div className="bg-primary/15 dark:bg-primary/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-primary dark:text-primary/80" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">What's New in Netily</h1>
        <p className="text-slate-500 mt-2">The latest features, improvements, and bug fixes to your platform.</p>
      </div>

      <div className="space-y-12">
        {logs.length === 0 ? (
          <div className="text-center text-slate-400 py-12 border-2 border-dashed rounded-xl">You're all caught up! No recent updates.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative pl-8 md:pl-0">
              
              {/* Desktop Timeline Line */}
              <div className="hidden md:block absolute left-[120px] top-0 bottom-[-48px] w-px bg-slate-200 dark:bg-slate-700" />

              <div className="md:flex gap-8 relative">
                {/* Date / Version */}
                <div className="md:w-[100px] flex-shrink-0 pt-1 text-left md:text-right mb-2 md:mb-0">
                  <p className="text-sm font-bold text-foreground">{new Date(log.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  {log.version && <p className="text-xs font-mono text-slate-400 mt-1">{log.version}</p>}
                </div>

                {/* Timeline Node Icon */}
                <div className="hidden md:flex absolute left-[120px] -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 items-center justify-center z-10 shadow-sm">
                  {getIcon(log.update_type)}
                </div>

                {/* Content Card */}
                <div className="flex-grow bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="md:hidden">{getIcon(log.update_type)}</span>
                    <h2 className="text-xl font-bold text-foreground">{log.title}</h2>
                  </div>
                  {/* Assuming content is plain text. If you want rich text, use a safe HTML renderer here */}
                  <div className="prose prose-sm text-muted-foreground whitespace-pre-wrap max-w-none">
                    {log.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}