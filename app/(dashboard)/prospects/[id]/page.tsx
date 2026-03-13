import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProspectDetailClient from '@/components/companies/ProspectDetailClient'
import type { Company, InteractionLog, User } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('company_name').eq('id', id).single()
  return { title: data ? `${data.company_name} | Scout` : 'Scout' }
}

export default async function ProspectDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [prospectResult, logsResult, usersResult, currentUserResult] = await Promise.all([
    supabase.from('companies').select(`
      *,
      owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
      updater:users!companies_updated_by_fkey(id, name, email, role, created_at),
      members:company_members(user:users(id, name, email, role, created_at))
    `).eq('id', id).single(),

    supabase.from('interaction_logs').select(`
      *,
      creator:users!interaction_logs_created_by_fkey(id, name, email, role, created_at),
      updater:users!interaction_logs_updated_by_fkey(id, name, email, role, created_at)
    `).eq('company_id', id)
      .order('action_date', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase.from('users').select('*').order('name'),
    supabase.from('users').select('*').eq('id', authUser.id).single(),
  ])

  if (!prospectResult.data) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = prospectResult.data as any
  const prospect: Company = {
    ...raw,
    members: (raw.members ?? []).map((m: { user: User }) => m.user).filter(Boolean),
  }

  return (
    <ProspectDetailClient
      prospect={prospect}
      logs={(logsResult.data ?? []) as InteractionLog[]}
      users={(usersResult.data ?? []) as User[]}
      currentUser={currentUserResult.data as User}
    />
  )
}
