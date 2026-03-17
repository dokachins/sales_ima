import { cache } from 'react'
import { createClient } from './server'

/**
 * React.cache() でリクエスト内で共有される認証・プロフィール取得。
 * layout と各ページで同じ関数を呼んでも DB に 1 回しかアクセスしない。
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', userId)
    .single()
  return data
})
