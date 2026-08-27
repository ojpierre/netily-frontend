"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Reusable skeleton components for consistent loading states

export function PageHeaderSkeleton({ 
  showActions = true,
  showDescription = true 
}: { 
  showActions?: boolean
  showDescription?: boolean 
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        {showDescription && <Skeleton className="h-5 w-64" />}
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn(
      "grid gap-4",
      count === 4 ? "md:grid-cols-2 lg:grid-cols-4" :
      count === 3 ? "md:grid-cols-3" :
      count === 5 ? "md:grid-cols-2 lg:grid-cols-5" :
      "md:grid-cols-2 lg:grid-cols-4"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 6,
  showHeader = true 
}: { 
  rows?: number
  columns?: number
  showHeader?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            {showHeader && (
              <thead className="bg-muted/50">
                <tr>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="p-4 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function SearchFilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function TabsSkeleton({ tabCount = 4 }: { tabCount?: number }) {
  return (
    <div className="flex gap-2 border-b pb-2">
      {Array.from({ length: tabCount }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24" />
      ))}
    </div>
  )
}

export function CardContentSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn("h-4", i % 2 === 0 ? "w-full" : "w-3/4")} 
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function ActivityListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="p-0">
        {Array.from({ length: count }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  )
}

// Full page loading skeleton with shimmer effect
export function PageLoadingSkeleton({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {children}
    </div>
  )
}

// Spinner loader for smaller components
export function SpinnerLoader({ 
  size = "default",
  text 
}: { 
  size?: "sm" | "default" | "lg"
  text?: string 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <div className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size]
      )} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  )
}

// Progress loader for operations
export function ProgressLoader({ 
  progress,
  text 
}: { 
  progress: number
  text?: string 
}) {
  return (
    <div className="space-y-2 py-4">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  )
}
