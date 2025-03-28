'use client'

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Lock, FileText } from "lucide-react"

interface MaterialPreviewProps {
  material: {
    id: string
    content: string | null
    user_id: string
    file_url: string | null
    credit_cost: number
    title: string
    description: string | null
    type: string
    rating: number | null
    created_at: string
    downloads: number
    subject: string
    course_id?: string
    is_university_specific: boolean
    universities?: {
      name: string
      id: string
    }
    users?: {
      name: string
      id: string
    }
  }
  onPurchaseClick: () => void
}

export function MaterialPreview({ material, onPurchaseClick }: MaterialPreviewProps) {
  const { user } = useAuth()
  const isOwner = user?.id === material.user_id

  const renderContent = () => {
    // If there's a file URL, show file preview
    if (material.file_url) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">File Content</p>
          <p className="text-sm text-muted-foreground">This material contains a downloadable file</p>
        </div>
      )
    }

    // If there's text content, show it
    if (material.content) {
      return (
        <div className="prose max-w-none">
          {material.content}
        </div>
      )
    }

    // If no content or file, show message
    return (
      <div className="text-center text-muted-foreground py-8">
        No preview available
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={`bg-card rounded-lg p-6 ${!isOwner ? 'blur-sm' : ''}`}>
        {renderContent()}
      </div>
      {!isOwner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-4">Purchase to view content</p>
          <Button onClick={onPurchaseClick}>
            Purchase for {material.credit_cost} credit{material.credit_cost !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
} 