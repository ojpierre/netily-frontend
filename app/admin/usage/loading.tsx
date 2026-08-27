import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsageLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Date Range */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Table */}
      <TableSkeleton rows={8} columns={5} />
    </PageLoadingSkeleton>
  )
}
