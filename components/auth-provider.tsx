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

  // Cache user data
  const fetchUserData = async (authUser: User) => {
    // Check if we already have user data
    if (user && user.id === authUser.id) {
      return user
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("*, universities(name)")
      .eq("id", authUser.id)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return null
    }

    const userProfile = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      university: userData.universities?.name,
      universityId: userData.university_id,
      credits: userData.credits,
    }

    return userProfile
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }

      // Fetch user data immediately after sign in
      if (data.user) {
        const userData = await fetchUserData(data.user)
        setUser(userData)
        setSession(data.session)
      }

      return { error: null }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, universityId: string) => {
    setLoading(true)

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
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    return { error }
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

