import { getSupabaseServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()
  
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }

  const { data: material, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !material) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{material.title}</h1>
      <div className="prose max-w-none">
        {/* Add your material content rendering here */}
        <p>{material.description}</p>
      </div>
    </div>
  )
} 