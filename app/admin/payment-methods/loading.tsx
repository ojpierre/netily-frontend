import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/page-loader"

export default function PaymentMethodsLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </PageLoadingSkeleton>
  )
}
