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
      <TabsSkeleton tabCount={5} />

      {/* Settings Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={4} />
          </CardContent>
        </Card>
      </div>
    </PageLoadingSkeleton>
  )
}
