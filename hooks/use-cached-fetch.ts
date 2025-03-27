import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Export the cache so it can be used in other components
export const cache = new Map()

export function useCachedFetch(table: string, query: any = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = getSupabaseBrowserClient()

  const cacheKey = `${table}-${JSON.stringify(query)}`

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from(table)
          .select(query.select || '*')
          .order(query.orderBy || 'created_at', { ascending: false })

        if (error) throw error

        // Store in cache
        cache.set(cacheKey, data)
        setData(data)
      } catch (err) {
        setError(err)
        console.error(`Error fetching ${table}:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cacheKey])

  const updateCache = (newData) => {
    cache.set(cacheKey, newData)
    setData(newData)
  }

  return { data, loading, error, updateCache }
} 