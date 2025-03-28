import { getSupabaseServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Star, School, Clock, User } from 'lucide-react'
import { MaterialActions } from '@/components/material-actions'
import { MaterialPreviewWrapper } from '@/components/material-preview-wrapper'

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()
  
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }

  const { data: material, error } = await supabase
    .from('materials')
    .select(`
      *,
      users (
        name,
        id
      ),
      universities (
        name,
        id
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !material) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{material.type}</Badge>
            {material.is_university_specific && (
              <Badge variant="outline" className="flex items-center gap-1">
                <School className="h-3 w-3" /> University
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{material.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>By {material.users?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Uploaded {new Date(material.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span>{material.rating ? material.rating.toFixed(1) : 'No ratings yet'}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground">{material.description}</p>
            </div>

            <MaterialPreviewWrapper material={material} />
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{material.subject}</p>
                </div>
                {material.course_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Course</p>
                    <p className="font-medium">{material.course_id}</p>
                  </div>
                )}
                {material.universities?.name && (
                  <div>
                    <p className="text-sm text-muted-foreground">University</p>
                    <p className="font-medium">{material.universities.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="font-medium">{material.downloads}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6">
              <MaterialActions material={material} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 