"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function addCourse(formData: FormData) {
  try {
    console.log("Server action: Starting add course process")
    
    // Create a new supabase client for each request (no caching)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Create a standard client without cookie integration
    // We'll handle auth using the service role key instead
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    // First get userId from form data - this is our workaround
    const userId = formData.get("userId") as string
    
    if (!userId) {
      console.log("Server action: No user ID provided in form data")
      return { success: false, error: "Authentication information missing. Please try again." }
    }
    
    console.log("Server action: Using user ID from form:", userId)
    
    // Verify the user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("university_id")
      .eq("id", userId)
      .single()
      
    console.log("Server action user data:", userData ? "User data found" : "No user data", userError ? `Error: ${userError.message}` : "No user data error")

    if (userError || !userData?.university_id) {
      return { success: false, error: "Could not find your university information" }
    }

    // Extract form data
    const code = formData.get("code") as string
    const name = formData.get("name") as string
    const department = formData.get("department") as string
    const description = formData.get("description") as string

    // Validate form data
    if (!code || !name || !department) {
      return { success: false, error: "Course code, name, and department are required" }
    }

    // Check if course already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from("courses")
      .select("id")
      .eq("code", code)
      .eq("university_id", userData.university_id)
      .maybeSingle()

    if (existingCourse) {
      return { success: false, error: "A course with this code already exists at your university" }
    }

    // Insert the new course
    const { data, error } = await supabase
      .from("courses")
      .insert({
        code,
        name,
        department,
        description: description || null,
        university_id: userData.university_id,
        created_by: userId,
      })
      .select()

    if (error) {
      console.error("Error adding course:", error)
      return { success: false, error: "Failed to add course. Please try again." }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in addCourse action:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

