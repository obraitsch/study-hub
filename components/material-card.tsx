'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Star } from "lucide-react"
import Link from "next/link"
import { purchaseMaterial } from "@/actions/purchase-material"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface MaterialCardProps {
  material: {
    id: string
    title: string
    description: string
    type: string
    rating: number | null
    credit_cost: number
    user_id: string
    file_url: string | null
  }
  onPurchaseSuccess?: () => void
}

export function MaterialCard({ material, onPurchaseSuccess }: MaterialCardProps) {
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

  const handlePurchase = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking purchase
    e.stopPropagation() // Stop event bubbling to prevent card click
    
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
    <Link href={`/materials/${material.id}`} className="block">
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{material.title}</h3>
            <Badge variant="secondary">{material.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{material.description}</p>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">
              {material.rating ? material.rating.toFixed(1) : 'No ratings yet'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {material.credit_cost} credit{material.credit_cost !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {hasAccess && material.file_url ? (
            <Button asChild variant="outline">
              <Link href={material.file_url} target="_blank" onClick={(e) => e.stopPropagation()}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Link>
            </Button>
          ) : isOwner ? (
            <Button variant="outline" className="w-full" disabled>
              Owned
            </Button>
          ) : (
            <Button 
              onClick={handlePurchase}
              disabled={isPurchasing}
              variant="outline"
              className="w-full"
            >
              {isPurchasing ? 'Purchasing...' : 'Purchase'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
} 