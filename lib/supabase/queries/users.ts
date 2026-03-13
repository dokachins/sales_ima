import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export async function getUsers(): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}
