"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Search, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageContainer } from "@/components/page-container"
import { toast } from "sonner"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set())
  const supabase = getSupabaseBrowserClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabase.from("courses").select("*, universities(name)").order("name")

        if (error) {
          console.error("Error fetching courses:", error)
        } else {
          // Get accurate counts for each course
          const coursesWithCounts = await Promise.all(
            (data || []).map(async (course) => {
              // Count materials for this course
              const { count: materialsCount, error: materialsError } = await supabase
                .from("materials")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id)

              if (materialsError) {
                console.error(`Error counting materials for course ${course.id}:`, materialsError)
              }

              // Count students for this course (users who have uploaded materials or are enrolled)
              const { data: studentData, error: studentsError } = await supabase
                .from("materials")
                .select("user_id")
                .eq("course_id", course.id)

              if (studentsError) {
                console.error(`Error counting students for course ${course.id}:`, studentsError)
              }

              // Get enrolled students count
              const { count: enrolledCount, error: enrolledError } = await supabase
                .from("course_enrollments")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id)

              if (enrolledError) {
                console.error(`Error counting enrolled students for course ${course.id}:`, enrolledError)
              }

              // Count unique users who have uploaded materials
              const uniqueStudents = new Set(studentData?.map(material => material.user_id) || []).size
              // Add enrolled students to the count
              const totalStudents = uniqueStudents + (enrolledCount || 0)

              return {
                ...course,
                materials_count: materialsCount || 0,
                students_count: totalStudents,
              }
            })
          )

          setCourses(coursesWithCounts)
        }

        // If user is logged in, fetch their enrolled courses
        if (user) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from("course_enrollments")
            .select("course_id")
            .eq("user_id", user.id)

          if (enrollmentsError) {
            console.error("Error fetching enrollments:", enrollmentsError)
          } else {
            const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])
            setEnrolledCourses(enrolledCourseIds)
          }
        }
      } catch (error) {
        console.error("Error in data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [supabase, user])

  const handleJoinCourse = async (courseId: string) => {
    if (!user) {
      toast.error("You must be logged in to join a course")
      return
    }

    try {
      // Check if already enrolled
      if (enrolledCourses.has(courseId)) {
        toast.error("You are already enrolled in this course")
        return
      }

      // Add enrollment
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: user.id,
          course_id: courseId,
        })

      if (error) {
        console.error("Error joining course:", error)
        toast.error("Failed to join course. Please try again.")
        return
      }

      // Update local state
      setEnrolledCourses(prev => new Set([...prev, courseId]))
      
      // Update course student count
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, students_count: (course.students_count || 0) + 1 }
          : course
      ))

      toast.success("Successfully joined the course!")
    } catch (error) {
      console.error("Error in handleJoinCourse:", error)
      toast.error("An unexpected error occurred")
    }
  }

  // Filter courses based on search query
  const filteredCourses = courses.filter((course) => {
    return (
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.universities?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-6">Courses</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses by name, code, or department..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {user && (
            <Button asChild>
              <Link href="/courses/add">Add Course</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/courses/browse">Browse by Department</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="h-full hover:bg-muted/50 transition-colors">
              <Link href={`/courses/${course.id}`}>
                <CardHeader>
                  <CardTitle className="flex flex-col">
                    <span className="text-lg">{course.code}</span>
                    <span className="text-xl">{course.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{course.department}</p>
                    <p className="text-sm text-muted-foreground">{course.universities?.name}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm">{course.materials_count || 0} materials</span>
                      <span className="text-sm">{course.students_count || 0} students</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
              {user && (
                <div className="p-4 pt-0">
                  {enrolledCourses.has(course.id) ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Enrolled
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleJoinCourse(course.id)}
                    >
                      Join Class
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">No Courses Found</h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? `No courses match "${searchQuery}". Try a different search term.`
              : "No courses are available at the moment."}
          </p>
        </div>
      )}
    </PageContainer>
  )
}

