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

export default function DashboardPage() {
  const { user } = useAuth()

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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+3 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials Downloaded</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+8 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Courses you're contributing to</p>
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

