import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function FupLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      <StatsGridSkeleton count={3} />

      {/* Search & Filters */}
      <SearchFilterSkeleton />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </PageLoadingSkeleton>
  )
}
