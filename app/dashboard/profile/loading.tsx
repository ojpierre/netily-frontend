import {
  PageLoadingSkeleton,
  PageHeaderSkeleton,
  FormSkeleton,
} from "@/components/ui/page-loader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <PageLoadingSkeleton>
      {/* Header */}
      <PageHeaderSkeleton showActions={false} />

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={5} />
        </CardContent>
      </Card>
    </PageLoadingSkeleton>
  )
}
