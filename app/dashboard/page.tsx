"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Download, CreditCard, BookOpen } from "lucide-react"
import Link from "next/link"
import UserMaterials from "@/components/user-materials"
import UserClasses from "@/components/user-classes"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { PageContainer } from "@/components/page-container"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    materialsUploaded: 0,
    materialsDownloaded: 0,
    courses: 0,
    lastMonthUploads: 0,
    lastMonthDownloads: 0
  })
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        // Get current date and first day of last month
        const now = new Date()
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Fetch materials uploaded by user
        const { count: uploadedCount } = await supabase
          .from("materials")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch materials uploaded last month
        const { count: lastMonthUploads } = await supabase
          .from("materials")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", firstDayLastMonth.toISOString())
          .lt("created_at", firstDayThisMonth.toISOString())

        // Fetch materials downloaded by user
        const { count: downloadedCount } = await supabase
          .from("user_downloads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch materials downloaded last month
        const { count: lastMonthDownloads } = await supabase
          .from("user_downloads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", firstDayLastMonth.toISOString())
          .lt("created_at", firstDayThisMonth.toISOString())

        // Fetch courses user is contributing to (courses where user has uploaded materials)
        const { count: coursesCount } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        setStats({
          materialsUploaded: uploadedCount || 0,
          materialsDownloaded: downloadedCount || 0,
          courses: coursesCount || 0,
          lastMonthUploads: lastMonthUploads || 0,
          lastMonthDownloads: lastMonthDownloads || 0
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    fetchStats()
  }, [user, supabase])

  return (
    <ProtectedRoute>
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">Use credits to download materials</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials Uploaded</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materialsUploaded}</div>
              <p className="text-xs text-muted-foreground">+{stats.lastMonthUploads} from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials Downloaded</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materialsDownloaded}</div>
              <p className="text-xs text-muted-foreground">+{stats.lastMonthDownloads} from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courses}</div>
              <p className="text-xs text-muted-foreground">Courses you're enrolled in</p>
            </CardContent>
          </Card>
        </div>

        {/* My Classes Section */}
        <div className="mb-10">
          <UserClasses />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Materials</h2>
          <Button asChild>
            <Link href="/upload">Upload New Material</Link>
          </Button>
        </div>

        <Tabs defaultValue="uploaded" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
            <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          <TabsContent value="uploaded">
            <UserMaterials type="uploaded" />
          </TabsContent>
          <TabsContent value="downloaded">
            <UserMaterials type="downloaded" />
          </TabsContent>
          <TabsContent value="saved">
            <UserMaterials type="saved" />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </ProtectedRoute>
  )
}

