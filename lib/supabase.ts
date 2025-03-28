import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// These environment variables are set in the Vercel project or .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a single supabase client for the browser
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient && supabaseUrl && supabaseAnonKey) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'studyhub-auth-storage-key',
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return localStorage.getItem(key)
            }
            return null
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value)
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key)
            }
          },
        },
      },
    })
  }
  return browserClient
}

// Create a Supabase client for server-side operations
export function getSupabaseServerClient(cookieStore: any = null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found for server client.')
    return null
  }
  
  // If cookies are provided, use the createServerClient for auth
  if (cookieStore) {
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get: (name: string) => {
            try {
              const cookie = cookieStore.get(name)
              return cookie?.value
            } catch (error) {
              console.error("Error accessing cookie:", error)
              return undefined
            }
          },
          set: (name: string, value: string, options: any) => {
            // This function is required for createServerClient but not used in server actions
          },
          remove: (name: string, options: any) => {
            // This function is required for createServerClient but not used in server actions  
          },
        },
      }
    )
  }
  
  // Fallback to service role client for admin operations
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  }
  
  // Default to anon client
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}