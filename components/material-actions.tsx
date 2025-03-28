'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"
import { purchaseMaterial } from "@/actions/purchase-material"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface MaterialActionsProps {
  material: {
    id: string
    title: string
    credit_cost: number
    user_id: string
    file_url: string | null
  }
  onPurchaseSuccess?: () => void
}

export function MaterialActions({ material, onPurchaseSuccess }: MaterialActionsProps) {
  const { user } = useAuth()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const isOwner = user?.id === material.user_id

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) return

      // First check if user is the owner
      if (isOwner) {
        setHasAccess(true)
        return
      }

      // If not the owner, check if they have purchased it
      const { data, error } = await supabase
        .rpc('has_material_access', {
          user_id: user.id,
          material_id: material.id
        })

      if (!error && data) {
        setHasAccess(data)
      }
    }

    checkAccess()
  }, [user?.id, material.id, material.user_id, supabase, isOwner])

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please log in to purchase materials')
      return
    }

    // Don't allow purchase if user is the owner
    if (isOwner) {
      toast.error('You already own this material')
      return
    }

    setIsPurchasing(true)
    try {
      const result = await purchaseMaterial(material.id)
      if (result.success) {
        toast.success('Material purchased successfully!')
        setHasAccess(true)
        onPurchaseSuccess?.()
      } else {
        toast.error(result.error || 'Failed to purchase material')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('An error occurred while purchasing the material')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Price</span>
        <span className="text-lg font-medium">
          {material.credit_cost} credit{material.credit_cost !== 1 ? 's' : ''}
        </span>
      </div>
      {hasAccess && material.file_url ? (
        <Button size="lg" className="w-full" asChild>
          <Link href={material.file_url} target="_blank">
            <Download className="h-5 w-5 mr-2" /> Download
          </Link>
        </Button>
      ) : isOwner ? (
        <Button size="lg" className="w-full" disabled>
          Owned
        </Button>
      ) : (
        <Button 
          size="lg"
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full"
          data-purchase-button
        >
          {isPurchasing ? 'Purchasing...' : 'Purchase'}
        </Button>
      )}
    </div>
  )
} 