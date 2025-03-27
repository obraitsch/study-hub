"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { ArrowLeft, BookOpen, Download, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageContainer } from "@/components/page-container"

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true)

      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*, universities(name)")
          .eq("id", params.id)
          .single()

        if (courseError) {
          console.error("Error fetching course:", courseError)
        } else {
          setCourse(courseData)
        }

        // Fetch course materials
        const { data: materialsData, error: materialsError } = await supabase
          .from("materials")
          .select("*, users(name)")
          .eq("course_id", params.id)
          .order("created_at", { ascending: false })

        if (materialsError) {
          console.error("Error fetching materials:", materialsError)
        } else {
          setMaterials(materialsData || [])
        }
      } catch (error) {
        console.error("Error in data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [params.id, supabase])

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  if (!course) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-muted-foreground hover:underline flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">
            {course.code}: {course.name}
          </h1>
          <p className="text-muted-foreground mb-4">
            {course.department} • {course.universities?.name}
          </p>
          <p className="mb-6">{course.description || "No description available for this course."}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {course.tags?.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-primary mr-2" />
                <span>{materials.length} study materials</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                <span>{course.students_count || 0} enrolled students</span>
              </div>
              <div className="mt-6">
                <Button className="w-full" asChild>
                  <Link href={`/upload?course=${course.id}`}>Upload Materials for this Course</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <h2 className="text-2xl font-bold mb-4">Study Materials</h2>
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <Card key={material.id} className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{material.type}</Badge>
                    </div>
                    <div className="mt-2 line-clamp-2 font-semibold">
                      <Link href={`/materials/${material.id}`} className="hover:underline">
                        {material.title}
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="text-xs">By {material.users?.name}</p>
                      <p className="text-xs">Uploaded on {new Date(material.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-between items-center mt-auto">
                    <div className="text-xs text-muted-foreground">{material.downloads} downloads</div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/materials/${material.id}`}>
                        <Download className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No materials available for this course yet.</p>
              <Button asChild>
                <Link href={`/upload?course=${course.id}`}>Be the first to upload</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="discussions">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Course Discussions</h2>
            <p className="text-muted-foreground mb-4">Join discussions about this course with other students.</p>
            <Button asChild>
              <Link href={`/forums?course=${course.id}`}>View Course Discussions</Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="groups">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Study Groups</h2>
            <p className="text-muted-foreground mb-4">Join or create study groups for this course.</p>
            <Button asChild>
              <Link href={`/groups?course=${course.id}`}>Find Study Groups</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

