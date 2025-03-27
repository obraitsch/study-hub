"use server"

import { getSupabaseServerClient } from "@/lib/supabase"

export async function addCourse(formData: FormData) {
  try {
    const supabase = getSupabaseServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "You must be logged in to add a course" }
    }

    // Get the user's university
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("university_id")
      .eq("id", user.id)
      .single()

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
        created_by: user.id,
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

