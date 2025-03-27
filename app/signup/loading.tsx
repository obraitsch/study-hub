import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading sign-up page...</p>
      </div>
    </div>
  )
}

