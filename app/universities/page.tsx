"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Search } from "lucide-react"
import { PageContainer } from "@/components/page-container"

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabase.from("universities").select("id, name, location").order("name")

        if (error) {
          console.error("Error fetching universities:", error)
        } else {
          // Get accurate counts for each university
          const universitiesWithCounts = await Promise.all(
            (data || []).map(async (university) => {
              // Count materials directly linked to this university
              const { count: directMaterialsCount, error: directMaterialsError } = await supabase
                .from("materials")
                .select("*", { count: "exact", head: true })
                .eq("university_id", university.id)

              if (directMaterialsError) {
                console.error(`Error counting direct materials for university ${university.id}:`, directMaterialsError)
              }

              // Get all courses for this university
              const { data: coursesData, error: coursesError } = await supabase
                .from("courses")
                .select("id")
                .eq("university_id", university.id)

              let courseMaterialsCount = 0
              if (!coursesError && coursesData && coursesData.length > 0) {
                // Get course IDs
                const courseIds = coursesData.map(course => course.id)
                
                // Count materials linked to these courses
                const { count: linkedMaterialsCount, error: linkedMaterialsError } = await supabase
                  .from("materials")
                  .select("*", { count: "exact", head: true })
                  .in("course_id", courseIds)

                if (linkedMaterialsError) {
                  console.error(`Error counting course materials for university ${university.id}:`, linkedMaterialsError)
                } else {
                  courseMaterialsCount = linkedMaterialsCount || 0
                }
              }
              
              // Total materials count (excluding possible duplicates for simplicity)
              const totalMaterialsCount = (directMaterialsCount || 0) + courseMaterialsCount

              // Count students (users) for this university
              const { count: studentsCount, error: studentsError } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("university_id", university.id)

              if (studentsError) {
                console.error(`Error counting students for university ${university.id}:`, studentsError)
              }
              
              // Count courses for this university
              const { count: coursesCount, error: coursesCountError } = await supabase
                .from("courses")
                .select("*", { count: "exact", head: true })
                .eq("university_id", university.id)

              if (coursesCountError) {
                console.error(`Error counting courses for university ${university.id}:`, coursesCountError)
              }

              return {
                ...university,
                materials_count: totalMaterialsCount,
                students_count: studentsCount || 0,
                courses_count: coursesCount || 0,
              }
            })
          )

          setUniversities(universitiesWithCounts)
        }
      } catch (error) {
        console.error("Error in data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUniversities()
  }, [supabase])

  // Filter universities based on search query
  const filteredUniversities = universities.filter((university) => {
    return (
      university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-6">Universities</h1>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search universities by name or location..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredUniversities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniversities.map((university) => (
            <Link key={university.id} href={`/universities/${university.id}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium text-lg">{university.name}</h3>
                    <p className="text-sm text-muted-foreground">{university.location}</p>
                    <div className="flex flex-wrap text-sm text-muted-foreground pt-2 gap-4">
                      <div>{university.materials_count || 0} materials</div>
                      <div>{university.students_count || 0} students</div>
                      <div>{university.courses_count || 0} courses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">No Universities Found</h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? `No universities match "${searchQuery}". Try a different search term.`
              : "No universities are available at the moment."}
          </p>
        </div>
      )}
    </PageContainer>
  )
}

