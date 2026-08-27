import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  TabsSkeleton,
  FormSkeleton,
} from "@/components/ui/page-loader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton showActions={false} />

      {/* Tabs */}
      <TabsSkeleton tabCount={4} />

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={5} />
        </CardContent>
      </Card>
    </PageLoadingSkeleton>
  )
}
