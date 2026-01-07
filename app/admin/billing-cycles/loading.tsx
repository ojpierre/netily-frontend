import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function BillingCyclesLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      <StatsGridSkeleton count={3} />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </PageLoadingSkeleton>
  )
}
