import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MembersClient from '@/components/settings/MembersClient'
import type { User } from '@/types'

export const metadata: Metadata = { title: 'メンバー管理 | Scout' }

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: currentUser } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!currentUser) redirect('/login')

  const { data: users } = await supabase.from('users').select('*').order('name')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">メンバー管理</h1>
        <p className="text-sm text-gray-400 mt-0.5">{users?.length ?? 0}人</p>
      </div>
      <MembersClient
        users={(users ?? []) as User[]}
        currentUser={currentUser as User}
      />
    </div>
  )
}
