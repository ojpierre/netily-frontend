"use client"

import { AlertTriangle, RefreshCw, MailIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-2 shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Something went wrong
          </h4>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {message}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
            <span className="text-xs text-red-500 dark:text-red-500 flex items-center gap-1">
              <MailIcon className="h-3 w-3" />
              Contact support if this persists
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
