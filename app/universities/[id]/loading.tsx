import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="container py-10">
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

