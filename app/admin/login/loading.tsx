import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-lg mx-auto bg-slate-700" />
          <Skeleton className="h-8 w-40 mx-auto bg-slate-700" />
          <Skeleton className="h-4 w-56 mx-auto bg-slate-700" />
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-700" />
            <Skeleton className="h-10 w-full bg-slate-700" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-slate-700" />
            <Skeleton className="h-10 w-full bg-slate-700" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 bg-slate-700" />
            <Skeleton className="h-4 w-32 bg-slate-700" />
          </div>
          <Skeleton className="h-10 w-full bg-slate-700" />
        </div>

        {/* Footer */}
        <Skeleton className="h-4 w-48 mx-auto bg-slate-700" />
      </div>
    </div>
  )
}
