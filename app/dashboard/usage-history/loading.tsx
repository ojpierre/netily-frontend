import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsageHistoryLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton showActions={false} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      {/* Date Filter */}
      <SearchFilterSkeleton />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </PageLoadingSkeleton>
  )
}
