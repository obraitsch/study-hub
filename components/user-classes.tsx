"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserClasses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return

      setLoading(true)

      try {
        // Fetch enrolled courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("user_id", user.id)

        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError.message)
          console.error("Error details:", enrollmentsError.details)
          console.error("Error hint:", enrollmentsError.hint)
        } else if (enrollments && enrollments.length > 0) {
          // Get course IDs from enrollments
          const courseIds = enrollments.map(e => e.course_id)

          // Fetch course details
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("*, universities(name)")
            .in("id", courseIds)
            .order("name")

          if (coursesError) {
            console.error("Error fetching courses:", coursesError.message)
            console.error("Error details:", coursesError.details)
            console.error("Error hint:", coursesError.hint)
          } else {
            setCourses(coursesData || [])
          }
        } else {
          setCourses([])
        }
      } catch (error) {
        console.error("Error in fetchCourses:", error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Classes</h2>
        <Button variant="outline" asChild>
          <Link href="/courses">View All Classes</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">You haven't joined any classes yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/courses">Browse Classes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{course.code}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{course.name}</p>
                <p className="text-sm text-muted-foreground">{course.department}</p>
                <p className="text-sm text-muted-foreground">{course.universities?.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

