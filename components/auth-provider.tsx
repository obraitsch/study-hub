"use client"

import type React from "react"
import { createContext, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { Session, User, AuthError } from "@supabase/supabase-js"

type AuthUser = {
  id: string
  name: string
  email: string
  university?: string
  universityId?: string
  credits: number
} | null

type AuthContextType = {
  user: AuthUser
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name: string, universityId: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized")
      setLoading(false)
      return
    }

    const fetchUserData = async (authUser: User) => {
      try {
        // Fetch user profile data from the database
        const { data: userData, error } = await supabase
          .from("users")
          .select("*, universities(name)")
          .eq("id", authUser.id)
          .single()

        if (error) {
          console.error("Error fetching user data:", error)
          return null
        }

        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          university: userData.universities?.name,
          universityId: userData.university_id,
          credits: userData.credits,
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error)
        return null
      }
    }

    // First, check for an existing session
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession?.user) {
          setSession(initialSession)
          const userData = await fetchUserData(initialSession.user)
          setUser(userData)
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log("Auth state changed:", event, currentSession?.user?.id)
            
            if (currentSession?.user) {
              setSession(currentSession)
              const userData = await fetchUserData(currentSession.user)
              setUser(userData)
            } else {
              setUser(null)
              setSession(null)
            }
          }
        )
        
        setLoading(false)
        
        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
      }

      setLoading(false)
      return { error }
    } catch (error) {
      console.error("Unexpected sign in error:", error)
      setLoading(false)
      return { error: { name: "UnexpectedError", message: "An unexpected error occurred" } as AuthError }
    }
  }

  const signUp = async (email: string, password: string, name: string, universityId: string) => {
    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError || !authData.user) {
        setLoading(false)
        return { error: authError }
      }

      // Create user profile in the database
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
        name,
        university_id: universityId,
        credits: 10, // New users get 10 credits
      })

      setLoading(false)

      if (profileError) {
        return { error: { name: "ProfileError", message: profileError.message } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected sign up error:", error)
      setLoading(false)
      return { error: { name: "UnexpectedError", message: "An unexpected error occurred" } as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error("Reset password error:", error)
      return { error: { name: "UnexpectedError", message: "An unexpected error occurred" } as AuthError }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      return { error }
    } catch (error) {
      console.error("Update password error:", error)
      return { error: { name: "UnexpectedError", message: "An unexpected error occurred" } as AuthError }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}