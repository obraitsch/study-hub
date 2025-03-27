"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Search } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageContainer } from "@/components/page-container"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
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
          setCourses(data || [])
        }
      } catch (error) {
        console.error("Error in data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [supabase])

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
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors">
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
              </Card>
            </Link>
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

