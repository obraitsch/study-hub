"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Users, BookOpen, GraduationCap, FileText } from "lucide-react"

interface StatsData {
  totalUsers: number
  totalMaterials: number
  totalUniversities: number
  totalCourses: number
  recentMaterials: any[]
  popularUniversities: any[]
}

export function StatsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      try {
        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (usersError) {
          console.error("Error fetching users count:", usersError)
        }

        // Get total materials count
        const { count: materialsCount, error: materialsError } = await supabase
          .from("materials")
          .select("*", { count: "exact", head: true })

        if (materialsError) {
          console.error("Error fetching materials count:", materialsError)
        }

        // Get total universities count
        const { count: universitiesCount, error: universitiesError } = await supabase
          .from("universities")
          .select("*", { count: "exact", head: true })

        if (universitiesError) {
          console.error("Error fetching universities count:", universitiesError)
        }

        // Get total courses count
        const { count: coursesCount, error: coursesError } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })

        if (coursesError) {
          console.error("Error fetching courses count:", coursesError)
        }

        // Get recent materials
        const { data: recentMaterials, error: recentMaterialsError } = await supabase
          .from("materials")
          .select("*, users(name), universities(name)")
          .order("created_at", { ascending: false })
          .limit(5)

        if (recentMaterialsError) {
          console.error("Error fetching recent materials:", recentMaterialsError)
        }

        // Get popular universities
        const { data: popularUniversities, error: popularUniversitiesError } = await supabase
          .from("universities")
          .select("id, name, location")
          .order("name")
          .limit(5)

        if (popularUniversitiesError) {
          console.error("Error fetching popular universities:", popularUniversitiesError)
        }

        setStats({
          totalUsers: usersCount || 0,
          totalMaterials: materialsCount || 0,
          totalUniversities: universitiesCount || 0,
          totalCourses: coursesCount || 0,
          recentMaterials: recentMaterials || [],
          popularUniversities: popularUniversities || [],
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!stats) {
    return <div>Failed to load statistics</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Students sharing knowledge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Resources available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUniversities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Educational institutions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Academic courses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentMaterials.length > 0 ? (
              <div className="space-y-4">
                {stats.recentMaterials.map((material) => (
                  <div key={material.id} className="border-b pb-2 last:border-0">
                    <h3 className="font-medium">{material.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>By {material.users?.name}</p>
                      <p>{material.universities?.name}</p>
                      <p className="text-xs">{new Date(material.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No materials available yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Universities</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.popularUniversities.length > 0 ? (
              <div className="space-y-4">
                {stats.popularUniversities.map((university) => (
                  <div key={university.id} className="border-b pb-2 last:border-0">
                    <h3 className="font-medium">{university.name}</h3>
                    <p className="text-sm text-muted-foreground">{university.location || "Location not specified"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No universities available yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

