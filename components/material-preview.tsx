'use client'

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Lock, FileText, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface MaterialPreviewProps {
  material: {
    id: string
    content: string | null
    user_id: string
    url: string | null
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
    file_type: string
    original_filename: string
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
  const [previewError, setPreviewError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isOwner = user?.id === material.user_id

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('Iframe error:', e)
    setPreviewError(true)
    setErrorMessage('Failed to load PDF preview. The file may be corrupted or inaccessible.')
  }

  const renderContent = () => {
    // If there's a file URL, show file preview
    const fileUrl = material.url
    console.log('Attempting to render content with URL:', fileUrl)

    if (fileUrl) {
      // Check if the file is a PDF
      const isPDF = material.file_type === 'application/pdf' || fileUrl.toLowerCase().endsWith('.pdf')
      console.log('Is PDF:', isPDF, 'File Type:', material.file_type)

      if (isPDF) {
        return (
          <div className="w-full h-[600px] relative">
            {previewError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Unable to load PDF preview</p>
                <p className="text-sm text-muted-foreground">{errorMessage || 'Please download the file to view it'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Open PDF in new tab
                </Button>
              </div>
            ) : (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full rounded-lg border"
                title={`Preview of ${material.title}`}
                onError={handleIframeError}
              />
            )}
          </div>
        )
      }
      
      // For other file types, show generic preview
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">File Content</p>
          <p className="text-sm text-muted-foreground">This material contains a downloadable file</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.open(fileUrl, '_blank')}
          >
            Open file in new tab
          </Button>
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