"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/components/ui/use-toast"

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const courseId = searchParams.get("course")
  const universityId = searchParams.get("university")
  
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [universityInfo, setUniversityInfo] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "notes",
    course_id: courseId,
    university_id: universityId,
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true)
      
      try {
        console.log("Fetching table information...")
        if (courseId) {
          const { data, error } = await supabase
            .from("courses")
            .select("*, universities(name)")
            .eq("id", courseId)
            .single()
          
          if (error) {
            console.error("Error fetching course:", error)
            toast({
              title: "Error",
              description: "Failed to load course information",
              variant: "destructive",
            })
          } else {
            setCourseInfo(data)
          }
        }
        
        if (universityId) {
          const { data, error } = await supabase
            .from("universities")
            .select("*")
            .eq("id", universityId)
            .single()
          
          if (error) {
            console.error("Error fetching university:", error)
            toast({
              title: "Error",
              description: "Failed to load university information",
              variant: "destructive",
            })
          } else {
            setUniversityInfo(data)
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [courseId, universityId, supabase, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      // 1. Get current user and their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error("You must be logged in to upload materials")
      }

      // Get user's profile to access universityId
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error("Error fetching user profile: " + profileError.message)
      }

      // 2. Upload the file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`
      
      // Using default bucket name 'materials' instead of 'uploads'
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file)
      
      if (uploadError) {
        throw new Error("Error uploading file: " + uploadError.message)
      }

      // 3. Get the URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath)

      // 4. Now use the material_metadata table for storing detailed info
      const metadataData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: publicUrl,
        original_filename: file.name,
        size: file.size,
        file_type: file.type,
        course_id: formData.course_id,
        university_id: formData.university_id,
        user_id: user.id,
      }
      
      const { data: metadataInsertData, error: metadataError } = await supabase
        .from('material_metadata')
        .insert([metadataData])
        .select()
      
      if (metadataError) {
        throw new Error("Error creating metadata record: " + metadataError.message)
      }

      // 5. Insert into materials table with only the fields it actually has
      const materialData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        price: 0,
        downloads: 0,
        rating: null,
        is_university_specific: universityId ? true : false,
        course_id: formData.course_id,
        university_id: userProfile.university_id || formData.university_id,
        user_id: user.id,
      }

      console.log("Inserting material data:", materialData)

      const { data: materialInsertData, error: insertError } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
      
      if (insertError) {
        throw new Error("Error creating material record: " + insertError.message)
      }

      // 6. Now update the material_metadata with the material_id
      const materialId = materialInsertData[0]?.id
      const metadataId = metadataInsertData[0]?.id
      
      if (materialId && metadataId) {
        await supabase
          .from('material_metadata')
          .update({ material_id: materialId })
          .eq('id', metadataId)
      }

      // 7. Award 1 credit to the user for uploading
      const { data: currentUser, error: userFetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (userFetchError) {
        console.error("Error fetching user credits:", userFetchError)
      } else {
        const { error: creditError } = await supabase
          .from('users')
          .update({ credits: (currentUser.credits || 0) + 1 })
          .eq('id', user.id)

        if (creditError) {
          console.error("Error awarding credit:", creditError)
          // Don't throw here as the material was already uploaded successfully
        }
      }

      toast({
        title: "Success",
        description: "Your material has been uploaded successfully and you earned 1 credit!",
      })

      // Redirect based on context
      if (courseId) {
        router.push(`/courses/${courseId}`)
      } else if (universityId) {
        router.push(`/universities/${universityId}`)
      } else {
        router.push('/materials')
      }
      
    } catch (error: any) {
      console.error("Error in upload process:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your file",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        {courseId ? (
          <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:underline flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Course
          </Link>
        ) : universityId ? (
          <Link href={`/universities/${universityId}`} className="text-sm text-muted-foreground hover:underline flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to University
          </Link>
        ) : (
          <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Material</CardTitle>
            <CardDescription>
              {courseInfo ? 
                `Upload study material for ${courseInfo.code}: ${courseInfo.name}` : 
                universityInfo ? 
                `Upload study material for ${universityInfo.name}` : 
                "Upload your study materials to share with others"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a descriptive title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this material contains"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Material Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notes">Lecture Notes</SelectItem>
                    <SelectItem value="assignment">Assignment/Problem Set</SelectItem>
                    <SelectItem value="exam">Past Exam/Quiz</SelectItem>
                    <SelectItem value="textbook">Textbook/Book</SelectItem>
                    <SelectItem value="slides">Presentation Slides</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOCX, PPTX, etc. (Max size: 100MB)
                </p>
              </div>
              
              {file && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Selected file:</p>
                  <p className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Material
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  )
} 