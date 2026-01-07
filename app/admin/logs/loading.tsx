import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  SearchFilterSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function LogsLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search & Filters */}
      <SearchFilterSkeleton />

      {/* Table */}
      <TableSkeleton rows={12} columns={5} />
    </PageLoadingSkeleton>
  )
}
