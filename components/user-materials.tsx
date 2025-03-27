"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function UserMaterials({ type }: { type: "uploaded" | "downloaded" | "saved" }) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return

      setLoading(true)
      let query

      if (type === "uploaded") {
        // Fetch materials uploaded by the user
        query = supabase.from("materials").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      } else if (type === "downloaded") {
        // Fetch materials downloaded by the user
        query = supabase
          .from("user_downloads")
          .select("*, materials(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      } else if (type === "saved") {
        // Fetch materials saved by the user
        query = supabase
          .from("user_saved_materials")
          .select("*, materials(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      }

      if (query) {
        const { data, error } = await query
        if (error) {
          console.error(`Error fetching ${type} materials:`, error)
        } else {
          setMaterials(data || [])
        }
      }

      setLoading(false)
    }

    fetchMaterials()
  }, [user, type, supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            {type === "uploaded"
              ? "You haven't uploaded any materials yet."
              : type === "downloaded"
                ? "You haven't downloaded any materials yet."
                : "You haven't saved any materials yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Render materials here */}
      {materials.map((item) => {
        const material = type === "uploaded" ? item : item.materials
        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <h3 className="font-medium">{material.title}</h3>
              <p className="text-sm text-muted-foreground">{material.type}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

