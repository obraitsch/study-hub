'use client'

import { MaterialPreview } from './material-preview'

interface MaterialPreviewWrapperProps {
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
}

export function MaterialPreviewWrapper({ material }: MaterialPreviewWrapperProps) {
  const handlePurchaseClick = () => {
    const purchaseButton = document.querySelector('[data-purchase-button]')
    if (purchaseButton instanceof HTMLElement) {
      purchaseButton.click()
    }
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Preview</h2>
      <MaterialPreview 
        material={material} 
        onPurchaseClick={handlePurchaseClick}
      />
    </div>
  )
} 