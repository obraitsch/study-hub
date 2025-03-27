import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Universities</h1>
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

