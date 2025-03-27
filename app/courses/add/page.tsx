"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AddCourseForm } from "@/components/add-course-form"
import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft } from "lucide-react"

export default function AddCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/courses/add")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-muted-foreground hover:underline flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Add a Course</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AddCourseForm />
        </div>

        <div>
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Why Add Courses?</h2>
            <ul className="space-y-2 text-sm">
              <li>Help organize study materials by course</li>
              <li>Make it easier for students to find relevant materials</li>
              <li>Create a more complete resource for your university</li>
              <li>Enable course-specific discussions and study groups</li>
            </ul>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Use the official course code from your university</li>
                <li>Provide accurate and complete information</li>
                <li>Check if the course already exists before adding</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

