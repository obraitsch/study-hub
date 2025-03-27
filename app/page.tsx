"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Users, School } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Download } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PageContainer } from "@/components/page-container"

export default function Home() {
  const { user } = useAuth()
  const [featuredMaterials, setFeaturedMaterials] = useState<any[]>([])
  const [popularUniversities, setPopularUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch featured materials
        const { data: materialsData, error: materialsError } = await supabase
          .from("materials")
          .select(`
            *,
            users(name),
            universities(name)
          `)
          .order("downloads", { ascending: false })
          .limit(4)

        if (materialsError) {
          console.error("Error fetching materials:", materialsError)
        } else {
          setFeaturedMaterials(materialsData || [])
        }

        // To get real counts, you would need to modify the query:
        // Fetch universities with actual counts of materials and students
        const { data: universitiesData, error: universitiesError } = await supabase
          .from("universities")
          .select("id, name")
          .order("name")
          .limit(6)

        if (universitiesError) {
          console.error("Error fetching universities:", universitiesError)
        } else {
          // Process each university to get real counts
          const universitiesWithCounts = await Promise.all(
            (universitiesData || []).map(async (university) => {
              // Count materials for this university
              const { count: materialsCount, error: materialsError } = await supabase
                .from("materials")
                .select("*", { count: "exact", head: true })
                .eq("university_id", university.id)

              if (materialsError) {
                console.error(`Error counting materials for university ${university.id}:`, materialsError)
              }

              // Count students (users) for this university
              const { count: studentsCount, error: studentsError } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("university_id", university.id)

              if (studentsError) {
                console.error(`Error counting students for university ${university.id}:`, studentsError)
              }

              return {
                ...university,
                materials_count: materialsCount || 0,
                students_count: studentsCount || 0,
              }
            }),
          )

          setPopularUniversities(universitiesWithCounts)
        }
      } catch (error) {
        console.error("Error in data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-24">
        <PageContainer>
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Share and Discover College Study Materials
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Access notes, study guides, and more from students at your university. Upload your own materials to help
              others and earn credits.
            </p>
            <div className="w-full max-w-md space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for materials, courses, or universities..."
                  className="w-full pl-8"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm">
                  Mathematics
                </Button>
                <Button variant="outline" size="sm">
                  Computer Science
                </Button>
                <Button variant="outline" size="sm">
                  Biology
                </Button>
                <Button variant="outline" size="sm">
                  Engineering
                </Button>
                <Button variant="outline" size="sm">
                  Business
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button asChild size="lg">
                <Link href="/materials">Browse Materials</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/upload">Upload Materials</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Featured Materials Section */}
      <section className="py-12">
        <PageContainer>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Featured Study Materials</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredMaterials.map((material) => (
                <Card key={material.id} className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{material.type}</Badge>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                        <span>{material.rating}</span>
                      </div>
                    </div>
                    <div className="mt-2 line-clamp-2 font-semibold">
                      <Link href={`/materials/${material.id}`} className="hover:underline">
                        {material.title}
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {material.course_id ? material.course_id : "General"} • {material.subject}
                      </p>
                      <p>{material.universities?.name}</p>
                      <p className="text-xs">By {material.users?.name}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">{material.downloads.toLocaleString()} downloads</div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/materials/${material.id}`}>
                        <Download className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </PageContainer>
      </section>

      {/* University Community Features Section */}
      <section className="py-12 bg-muted/50">
        <PageContainer>
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">
            <span className="flex items-center justify-center gap-2">
              <School className="h-6 w-6 text-primary" />
              University-Exclusive Community
            </span>
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with students from your university in private forums and study groups. Share course-specific
            materials and collaborate with your peers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">University Forums</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Connect with fellow students from your university, ask questions about specific courses, and share
                knowledge in private forums exclusive to your school.
              </p>
              <Button asChild>
                <Link href="/forums">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  University Forums
                </Link>
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">University Study Groups</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Form or join study groups with students from your university. Collaborate on course materials, organize
                study sessions, and prepare for exams together.
              </p>
              <Button asChild>
                <Link href="/groups">
                  <Users className="h-4 w-4 mr-2" />
                  University Study Groups
                </Link>
              </Button>
            </div>
          </div>
          {!user && (
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">Sign up with your email to access these features</p>
              <Button asChild>
                <Link href="/signup">Sign Up Now</Link>
              </Button>
            </div>
          )}
        </PageContainer>
      </section>

      {/* Popular Universities Section */}
      <section className="py-12">
        <PageContainer>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Popular Universities</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularUniversities.map((university) => (
                <Link key={university.id} href={`/universities/${university.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-2">
                        <h3 className="font-medium text-lg">{university.name}</h3>
                        <div className="flex text-sm text-muted-foreground">
                          <div className="mr-4">{university.materials_count || 0} materials</div>
                          <div>{university.students_count || 0} students</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </PageContainer>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted/50">
        <PageContainer>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">How StudyHub Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Materials</h3>
              <p className="text-muted-foreground">
                Share your notes, study guides, and other materials to help fellow students at your university.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Discover Resources</h3>
              <p className="text-muted-foreground">
                Find high-quality study materials for your specific courses and university.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Credits</h3>
              <p className="text-muted-foreground">
                Get credits when others download your materials, which you can use to access more content.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  )
}

