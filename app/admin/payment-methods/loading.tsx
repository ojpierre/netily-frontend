import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentMethodsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="max-w-xl space-y-5">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
