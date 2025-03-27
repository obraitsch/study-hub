"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { ArrowLeft, BookOpen, Download, GraduationCap, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function UniversityPage({ params }: { params: { id: string } }) {
  const [university, setUniversity] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchUniversityData = async () => {
      setLoading(true)

      try {
        // Fetch university details
        const { data: universityData, error: universityError } = await supabase
          .from("universities")
          .select("*")
          .eq("id", params.id)
          .single()

        if (universityError) {
          console.error("Error fetching university:", universityError)
        } else {
          setUniversity(universityData)
        }

        // Fetch university courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .eq("university_id", params.id)
          .order("name")
          .limit(6)

        if (coursesError) {
          console.error("Error fetching courses:", coursesError)
        } else {
          setCourses(coursesData || [])
        }

        // Fetch university materials
        const { data: materialsData, error: materialsError } = await supabase
          .from("materials")
          .select("*, users(name)")
          .eq("university_id", params.id)
          .order("created_at", { ascending: false })
          .limit(6)

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

    fetchUniversityData()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="container py-10">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">University Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The university you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/universities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Universities
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/universities" className="text-sm text-muted-foreground hover:underline flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Universities
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{university.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{university.location || "Location not specified"}</span>
          </div>
          <p className="mb-6">{university.description || "No description available for this university."}</p>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 text-primary mr-2" />
              <span>{university.students_count || "N/A"} students</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-primary mr-2" />
              <span>{university.courses_count || courses.length} courses</span>
            </div>
            <div className="flex items-center">
              <Download className="h-5 w-5 text-primary mr-2" />
              <span>{university.materials_count || materials.length} materials</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>University Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={`/upload?university=${university.id}`}>Upload Materials</Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/forums?university=${university.id}`}>University Forums</Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/groups?university=${university.id}`}>Study Groups</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Popular Courses</TabsTrigger>
          <TabsTrigger value="materials">Recent Materials</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Popular Courses</h2>
            <Button variant="outline" asChild>
              <Link href={`/courses?university=${university.id}`}>View All Courses</Link>
            </Button>
          </div>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No courses available for this university yet.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="materials">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Materials</h2>
            <Button variant="outline" asChild>
              <Link href={`/materials?university=${university.id}`}>View All Materials</Link>
            </Button>
          </div>
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
              <p className="text-muted-foreground mb-4">No materials available for this university yet.</p>
              <Button asChild>
                <Link href={`/upload?university=${university.id}`}>Be the first to upload</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

