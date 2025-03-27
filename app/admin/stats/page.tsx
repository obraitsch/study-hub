"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { StatsDashboard } from "@/components/stats-dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function AdminStatsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Check if user is admin (in a real app, you'd have an admin flag in the user object)
  const isAdmin = user?.email === "admin@studyhub.com" // This is just a placeholder check

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/")
    }
  }, [user, loading, isAdmin, router])

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <StatsDashboard />
    </div>
  )
}

