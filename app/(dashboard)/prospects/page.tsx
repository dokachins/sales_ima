import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getCurrentProfile } from '@/lib/supabase/cached'
import ProspectList from '@/components/companies/ProspectList'
import ProspectFilters from '@/components/companies/ProspectFilters'
import ProspectCreateButton from '@/components/companies/ProspectCreateButton'
import type { Company, User, ProspectSortKey } from '@/types'
import { CLOSED_STATUSES } from '@/types'

export const metadata: Metadata = { title: '見込み先一覧 | Scout' }

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function ProspectsPage({ searchParams }: Props) {
  const params = await searchParams

  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const supabase = await createClient()

  // ユーザー一覧・フィルター対象クエリを並列取得（currentUser は layout でキャッシュ済み）
  const [usersResult, currentUser] = await Promise.all([
    supabase.from('users').select('id, name, email, role, created_at').order('name'),
    getCurrentProfile(authUser.id),
  ])

  if (!currentUser) redirect('/login')

  // クエリ構築
  let query = supabase.from('companies').select(`
    *,
    owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
    members:company_members(user:users(id, name, email, role, created_at))
  `)

  const showClosed = !!params.closed
  if (!showClosed) {
    const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')
    query = query.not('status', 'in', `(${closedIn})`)
  }
  const ownerFilter = params.owner === 'all' ? null : (params.owner || authUser.id)
  if (ownerFilter) query = query.eq('owner_user_id', ownerFilter)
  if (params.status) query = query.eq('status', params.status)
  if (params.rank) query = query.eq('expectation_rank', params.rank)
  if (params.important) query = query.eq('is_important', true)
  if (params.q) query = query.ilike('company_name', `%${params.q}%`)

  const sortKey = (params.sort as ProspectSortKey) || 'updated_at'
  const ascending = sortKey === 'expectation_rank'
  query = query.order(sortKey, { ascending, nullsFirst: false })

  const { data: rawProspects } = await query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prospects: Company[] = (rawProspects ?? []).map((d: any) => ({
    ...d,
    members: (d.members ?? []).map((m: { user: User }) => m.user).filter(Boolean),
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">見込み先一覧</h1>
          <p className="text-sm text-gray-400 mt-0.5">{prospects.length}件</p>
        </div>
        <div className="shrink-0">
          <ProspectCreateButton
            users={(usersResult.data ?? []) as User[]}
            currentUser={currentUser as User}
          />
        </div>
      </div>

      <Suspense>
        <ProspectFilters users={(usersResult.data ?? []) as User[]} currentUserId={authUser.id} />
      </Suspense>

      <ProspectList prospects={prospects} />
    </div>
  )
}
