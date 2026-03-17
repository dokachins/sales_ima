import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getCurrentProfile } from '@/lib/supabase/cached'
import ProspectDetailClient from '@/components/companies/ProspectDetailClient'
import type { Company, InteractionLog, User } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const getProspect = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase.from('companies').select(`
    *,
    owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
    updater:users!companies_updated_by_fkey(id, name, email, role, created_at),
    members:company_members(user:users(id, name, email, role, created_at))
  `).eq('id', id).single()
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getProspect(id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { title: data ? `${(data as any).company_name} | Scout` : 'Scout' }
}

export default async function ProspectDetailPage({ params }: Props) {
  const { id } = await params
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const supabase = await createClient()
  const [prospectResult, logsResult, usersResult, currentUser] = await Promise.all([
    getProspect(id),

    supabase.from('interaction_logs').select(`
      *,
      creator:users!interaction_logs_created_by_fkey(id, name, email, role, created_at),
      updater:users!interaction_logs_updated_by_fkey(id, name, email, role, created_at)
    `).eq('company_id', id)
      .order('action_date', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase.from('users').select('*').order('name'),
    getCurrentProfile(authUser.id),
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
      currentUser={currentUser as User}
    />
  )
}
