'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('ログインが必要です')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('管理者権限が必要です')
}

export async function inviteUser(email: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/members')
}

export async function updateUserRole(userId: string, role: 'admin' | 'member') {
  await requireAdmin()

  // 自分自身のロール変更は不可（念のためサーバー側でも防ぐ）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) throw new Error('自分自身のロールは変更できません')

  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/members')
}
