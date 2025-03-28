"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addCourse } from "@/actions/add-course"
import { useAuth } from "@/hooks/use-auth"

export function AddCourseForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, session } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)

  // Debug logging
  useEffect(() => {
    console.log("Auth state in AddCourseForm:", { 
      user: user ? { id: user.id, name: user.name } : null,
      session: session ? "Session exists" : "No session"
    })
  }, [user, session])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Add the user ID to the form data if user exists
      if (user) {
        formData.append("userId", user.id)
      } else {
        setError("You must be logged in to add a course")
        setIsLoading(false)
        return
      }
      
      console.log("Submitting course form...")
      const result = await addCourse(formData)
      console.log("Course form result:", result)

      if (!result.success) {
        setError(result.error || "Unknown error occurred")
        return
      }

      setSuccess(true)
      toast({
        title: "Course added successfully",
        description: "The course has been added to your university.",
      })

      // Reset the form safely using the ref
      if (formRef.current) {
        formRef.current.reset()
      }

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Course</CardTitle>
        <CardDescription>Add a course to your university to help organize study materials</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Course added successfully!</AlertDescription>
          </Alert>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Course Code *</Label>
            <Input id="code" name="code" placeholder="e.g., CS101" required disabled={isLoading} />
            <p className="text-xs text-muted-foreground">The official course code used by your university</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Introduction to Computer Science"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input
              id="department"
              name="department"
              placeholder="e.g., Computer Science"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a brief description of the course..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding Course...
                </>
              ) : (
                "Add Course"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">* Required fields</CardFooter>
    </Card>
  )
}

