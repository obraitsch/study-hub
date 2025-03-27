import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'  // You'll need to generate this type

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null

export const getSupabaseBrowserClient = () => {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
} 