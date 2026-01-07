import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function UsersLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      <StatsGridSkeleton count={4} />

      {/* Search & Filters */}
      <SearchFilterSkeleton />

      {/* Table */}
      <TableSkeleton rows={8} columns={7} />
    </PageLoadingSkeleton>
  )
}
