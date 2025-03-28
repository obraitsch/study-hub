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
import { PageContainer } from "@/components/page-container"

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

        // Fetch university courses with their counts
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .eq("university_id", params.id)
          .order("name")
          .limit(6)

        if (coursesError) {
          console.error("Error fetching courses:", coursesError)
        } else {
          // Get accurate counts for each course
          const coursesWithCounts = await Promise.all(
            (coursesData || []).map(async (course) => {
              // Count materials for this course
              const { count: materialsCount, error: materialsError } = await supabase
                .from("materials")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id)

              if (materialsError) {
                console.error(`Error counting materials for course ${course.id}:`, materialsError)
              }

              // Count students for this course
              const { count: studentsCount, error: studentsError } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id)

              if (studentsError) {
                console.error(`Error counting students for course ${course.id}:`, studentsError)
              }

              return {
                ...course,
                materials_count: materialsCount || 0,
                students_count: studentsCount || 0,
              }
            })
          )

          setCourses(coursesWithCounts)
        }

        // Get all course IDs for this university
        const courseIds = coursesData?.map(course => course.id) || []

        // Fetch materials directly linked to this university
        const { data: directMaterialsData, error: directMaterialsError } = await supabase
          .from("materials")
          .select("*, users(name)")
          .eq("university_id", params.id)
          .order("created_at", { ascending: false })

        if (directMaterialsError) {
          console.error("Error fetching direct materials:", directMaterialsError)
        }

        // Fetch materials linked to university's courses
        const { data: courseMaterialsData, error: courseMaterialsError } = await supabase
          .from("materials")
          .select("*, users(name)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false })

        if (courseMaterialsError) {
          console.error("Error fetching course materials:", courseMaterialsError)
        }

        // Combine both sets of materials, removing duplicates based on material ID
        const allMaterials = [...(directMaterialsData || []), ...(courseMaterialsData || [])]
        const uniqueMaterials = Array.from(
          new Map(allMaterials.map(material => [material.id, material])).values()
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setMaterials(uniqueMaterials)

        // Count students for this university
        const { count: studentsCount, error: studentsError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("university_id", params.id)

        if (studentsError) {
          console.error("Error counting students:", studentsError)
        }

        // Update university with accurate counts
        if (universityData) {
          const updatedUniversity = {
            ...universityData,
            materials_count: uniqueMaterials.length,
            courses_count: coursesData?.length || 0,
            students_count: studentsCount || 0
          }
          setUniversity(updatedUniversity)
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
      <PageContainer>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  if (!university) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">University Not Found</h2>
          <p className="text-muted-foreground mb-6">The university you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/universities">Back to Universities</Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/universities">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Universities
          </Link>
        </Button>

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
                <span>{university.students_count || 0} students</span>
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
    </PageContainer>
  )
}

