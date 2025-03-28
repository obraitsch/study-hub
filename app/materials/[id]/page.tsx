import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Star, School, Clock, User } from 'lucide-react'
import { MaterialActions } from '@/components/material-actions'
import { MaterialPreviewWrapper } from '@/components/material-preview-wrapper'

interface PageProps {
  params: {
    id: string
  }
}

export default async function MaterialPage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }

  const materialId = await Promise.resolve(params.id)
  console.log('Fetching material with ID:', materialId)

  try {
    // First get the material
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single()

    if (materialError) {
      console.error('Error fetching material:', {
        message: materialError.message,
        details: materialError.details,
        hint: materialError.hint,
        code: materialError.code
      })
      notFound()
    }

    if (!material) {
      console.log('No material found with ID:', materialId)
      notFound()
    }

    // Get user data separately
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', material.user_id)
      .maybeSingle()

    if (userError) {
      console.error('Error fetching user data:', userError)
    }

    // Get university data if needed
    let universityData = null
    if (material.university_id) {
      const { data: uniData, error: uniError } = await supabase
        .from('universities')
        .select('name')
        .eq('id', material.university_id)
        .single()

      if (uniError) {
        console.error('Error fetching university data:', uniError)
      } else {
        universityData = uniData
      }
    }

    // Combine the data
    const enrichedMaterial = {
      ...material,
      users: userData ? { name: userData.name } : null,
      universities: universityData
    }

    console.log('Found material:', {
      id: enrichedMaterial.id,
      title: enrichedMaterial.title,
      type: enrichedMaterial.type,
      user: enrichedMaterial.users?.name
    })

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{enrichedMaterial.type}</Badge>
              {enrichedMaterial.is_university_specific && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <School className="h-3 w-3" /> University
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{enrichedMaterial.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>By {enrichedMaterial.users?.name || 'Unknown User'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Uploaded {new Date(enrichedMaterial.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{enrichedMaterial.rating ? enrichedMaterial.rating.toFixed(1) : 'No ratings yet'}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="md:col-span-2">
              <div className="bg-card rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground">{enrichedMaterial.description}</p>
              </div>

              <MaterialPreviewWrapper material={enrichedMaterial} />
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-medium">{enrichedMaterial.subject}</p>
                  </div>
                  {enrichedMaterial.course_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-medium">{enrichedMaterial.course_id}</p>
                    </div>
                  )}
                  {enrichedMaterial.universities?.name && (
                    <div>
                      <p className="text-sm text-muted-foreground">University</p>
                      <p className="font-medium">{enrichedMaterial.universities.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="font-medium">{enrichedMaterial.downloads}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6">
                <MaterialActions material={enrichedMaterial} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    notFound()
  }
} 