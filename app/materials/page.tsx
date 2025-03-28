"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Star, School } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { UniversityVerification } from "@/components/university-verification"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PageContainer } from "@/components/page-container"
import { useCachedFetch } from "@/hooks/use-cached-fetch"

export default function MaterialsPage() {
  // 1. Context hooks
  const { user } = useAuth()

  // 2. All state hooks together
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [ratingFilter, setRatingFilter] = useState(0)
  const [materials, setMaterials] = useState<any[]>([])
  const [universityMaterials, setUniversityMaterials] = useState<any[]>([])
  const [publicMaterials, setPublicMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userUniversityId, setUserUniversityId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    university: "all",
    subject: "all",
    materialType: "all",
    minRating: 0,
    showFreeOnly: false,
  })
  const [activeTab, setActiveTab] = useState("public")
  const [universities, setUniversities] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [materialTypes, setMaterialTypes] = useState<any[]>([])

  // 3. Initialize Supabase client
  const supabase = getSupabaseBrowserClient()

  // 4. All useEffects together
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!supabase) {
        setError("Supabase client not initialized");
        setLoading(false);
        return;
      }

      setLoading(true)
      try {
        // Fetch public materials
        const { data: publicData, error: publicError } = await supabase
          .from("materials")
          .select(`*, users(name), universities(name)`)
          .eq("is_university_specific", false)
          .order("created_at", { ascending: false })

        if (publicError) {
          const errorMessage = typeof publicError === 'object' ? 
            (publicError.message || JSON.stringify(publicError)) : 
            String(publicError);
          setError(errorMessage);
          console.error("Error fetching public materials:", errorMessage);
          return;
        }
        setPublicMaterials(publicData || [])

        // Get user's profile to ensure we have the latest universityId
        if (user?.id) {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('university_id')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            return;
          }

          console.log("User profile:", userProfile);
          const universityId = userProfile?.university_id;

          if (universityId) {
            console.log("Fetching university materials for universityId:", universityId);
            
            // First, let's check what materials exist for this university without any filters
            const { data: allMaterials, error: checkError } = await supabase
              .from("materials")
              .select("*")
              .eq("university_id", universityId);
            
            console.log("All materials for this university (unfiltered):", allMaterials);
            
            // Now fetch the specific materials we want
            const { data: uniData, error: uniError } = await supabase
              .from("materials")
              .select(`
                *,
                users (
                  name
                ),
                universities (
                  name
                )
              `)
              .eq("university_id", universityId)
              .order("created_at", { ascending: false })

            if (uniError) {
              const errorMessage = typeof uniError === 'object' ? 
                (uniError.message || JSON.stringify(uniError)) : 
                String(uniError);
              setError(errorMessage);
              console.error("Error fetching university materials:", errorMessage);
              return;
            }
            console.log("Fetched university materials (filtered):", uniData);
            setUniversityMaterials(uniData || []);
            setUserUniversityId(universityId);
            console.log("University Materials state after setting:", uniData || []);
            console.log("User University ID state after setting:", universityId);
          } else {
            console.log("No university_id found in user profile");
            setUniversityMaterials([]);
          }
        } else {
          console.log("No user ID found");
          setUniversityMaterials([]);
        }
      } catch (err: any) {
        const errorMessage = err ? 
          (typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err)) : 
          'Unknown error';
        setError(errorMessage);
        console.error("Error fetching materials:", errorMessage);
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [supabase, user?.id])

  // Filter materials effect
  useEffect(() => {
    // Create a Set to track unique material IDs
    const uniqueMaterialIds = new Set();
    const filtered = [...publicMaterials, ...universityMaterials].filter((material) => {
      // Skip if we've already seen this material ID
      if (uniqueMaterialIds.has(material.id)) {
        return false;
      }
      uniqueMaterialIds.add(material.id);

      const matchesSearch = 
        material.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSubject = !selectedSubject || material.subject === selectedSubject
      const matchesType = !selectedType || material.type === selectedType
      const matchesRating = material.rating >= ratingFilter

      return matchesSearch && matchesSubject && matchesType && matchesRating
    })

    // Show all materials in public view
    setMaterials(filtered)
  }, [
    searchQuery,
    selectedSubject,
    selectedType,
    ratingFilter,
    publicMaterials,
    universityMaterials
  ])

  // Fetch metadata effect
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!supabase) {
        console.error("Supabase client not initialized");
        return;
      }

      try {
        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .order("name")
        setSubjects(subjectsData || [])

        // Fetch material types
        const { data: typesData } = await supabase
          .from("material_types")
          .select("*")
          .order("name")
        setMaterialTypes(typesData || [])

        // Fetch universities
        const { data: universitiesData } = await supabase
          .from("universities")
          .select("*")
          .order("name")
        setUniversities(universitiesData || [])
      } catch (err) {
        console.error("Error fetching metadata:", err)
      }
    }

    fetchMetadata()
  }, [supabase])

  if (loading) {
    return <LoadingSpinner />
  }

  const handleFilterChange = (name: string, value: string | number | boolean) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="public">Public Materials</TabsTrigger>
          {user && (
            <TabsTrigger value="university" className="flex items-center gap-1">
              <School className="h-4 w-4" />
              {user.university} Materials
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="public">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold text-lg">Filters</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          type="search"
                          placeholder="Search materials..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Select
                        value={filters.university}
                        onValueChange={(value) => handleFilterChange("university", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((university) => (
                            <SelectItem key={university.id} value={university.id}>
                              {university.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={filters.subject} onValueChange={(value) => handleFilterChange("subject", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="materialType">Material Type</Label>
                      <Select
                        value={filters.materialType}
                        onValueChange={(value) => handleFilterChange("materialType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="minRating">Minimum Rating</Label>
                        <span className="text-sm text-muted-foreground">{filters.minRating}/5</span>
                      </div>
                      <Slider
                        id="minRating"
                        min={0}
                        max={5}
                        step={0.5}
                        value={[filters.minRating]}
                        onValueChange={(value) => handleFilterChange("minRating", value[0])}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showFreeOnly"
                        checked={filters.showFreeOnly}
                        onChange={(e) => handleFilterChange("showFreeOnly", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="showFreeOnly" className="text-sm font-medium">
                        Show free materials only
                      </Label>
                    </div>

                    <Button className="w-full" variant="outline">
                      Apply Filters
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Materials Grid */}
              <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm text-muted-foreground">Showing {materials.length} materials</div>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="downloads">Most Downloaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map((material) => (
                    <div key={material.id} className="w-full">
                      <MaterialCard material={material} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="university">
          {user ? (
            <UniversityVerification universityName={user.university}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <School className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">{user.university} Materials</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    These materials are exclusively for {user.university} students. They include course-specific notes,
                    exam materials, and resources shared by your university community.
                  </p>

                  {universityMaterials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {console.log('University Materials before render:', universityMaterials)}
                      {universityMaterials.map((material) => {
                        console.log('Rendering material:', {
                          id: material.id,
                          title: material.title,
                          is_university_specific: material.is_university_specific,
                          university_id: material.university_id
                        });
                        return (
                          <MaterialCard key={material.id} material={material} />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Your university doesn't have any materials yet. Be the first to upload!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </UniversityVerification>
          ) : (
            <div className="text-center py-12">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">University Materials</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Please log in with your university account to access university-specific materials.
              </p>
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

function MaterialCard({ material }: { material: any }) {
  return (
    <Card className="flex flex-col h-full w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="truncate max-w-[120px]">{material.type}</Badge>
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
          <p className="truncate max-w-full">
            {material.course_id ? material.course_id : "General"} • {material.subject}
          </p>
          <p className="truncate max-w-full">{material.universities?.name}</p>
          <p className="text-xs truncate max-w-full">By {material.users?.name}</p>
          <p className="text-xs">Uploaded on {new Date(material.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex flex-col w-full gap-2">
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">{material.downloads} downloads</div>
            <div className="flex items-center gap-2">
              {material.is_university_specific && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <School className="h-3 w-3" /> University
                </Badge>
              )}
              {material.price > 0 ? (
                <Badge variant="secondary">
                  {material.price} credits
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Free
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/materials/${material.id}`}>
                <Download className="h-4 w-4 mr-1" /> View
              </Link>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

