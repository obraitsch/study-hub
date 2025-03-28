'use server'

import { getSupabaseServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function purchaseMaterial(materialId: string) {
  const supabase = getSupabaseServerClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Start a transaction
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('credit_cost, user_id')
      .eq('id', materialId)
      .single()

    if (materialError) {
      console.error('Error fetching material:', materialError)
      return { success: false, error: 'Material not found' }
    }

    // Get current user's credits
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      return { success: false, error: 'Failed to fetch user data' }
    }

    // Check if user has enough credits
    if (userData.credits < material.credit_cost) {
      return { success: false, error: 'Insufficient credits' }
    }

    // Check if user already owns or has purchased the material
    const { data: existingPurchase, error: purchaseCheckError } = await supabase
      .from('material_purchases')
      .select('id')
      .eq('material_id', materialId)
      .eq('user_id', user.id)
      .single()

    if (purchaseCheckError && purchaseCheckError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing purchase:', purchaseCheckError)
      return { success: false, error: 'Failed to check purchase status' }
    }

    if (existingPurchase) {
      return { success: false, error: 'You already have access to this material' }
    }

    // Deduct credits and create purchase record
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: userData.credits - material.credit_cost })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return { success: false, error: 'Failed to update credits' }
    }

    const { error: purchaseError } = await supabase
      .from('material_purchases')
      .insert({
        material_id: materialId,
        user_id: user.id,
        credits_spent: material.credit_cost
      })

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError)
      return { success: false, error: 'Failed to record purchase' }
    }

    revalidatePath('/materials')
    return { success: true }
  } catch (error) {
    console.error('Error purchasing material:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 