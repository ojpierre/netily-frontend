import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function OltLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      <StatsGridSkeleton count={4} />

      {/* Search & Filters */}
      <SearchFilterSkeleton />

      {/* Table */}
      <TableSkeleton rows={6} columns={6} />
    </PageLoadingSkeleton>
  )
}
