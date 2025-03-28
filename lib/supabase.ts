import { createClient } from "@supabase/supabase-js"

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

// Create a Supabase client for server-side operations with admin privileges
export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not found for server client.')
    return null
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}