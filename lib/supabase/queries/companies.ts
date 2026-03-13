import { createClient } from '@/lib/supabase/client'
import type { Company, ProspectFormInput, ProspectFilters, ProspectSortKey, SortOrder } from '@/types'
import { CLOSED_STATUSES } from '@/types'

const COMPANY_SELECT = `
  *,
  owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
  updater:users!companies_updated_by_fkey(id, name, email, role, created_at),
  members:company_members(user:users(id, name, email, role, created_at))
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompany(d: any): Company {
  return {
    ...d,
    members: (d.members ?? []).map((m: { user: unknown }) => m.user).filter(Boolean),
  } as Company
}

export async function getProspects(
  filters: ProspectFilters = {},
  sortKey: ProspectSortKey = 'updated_at',
  sortOrder: SortOrder = 'desc'
): Promise<Company[]> {
  const supabase = createClient()
  let query = supabase.from('companies').select(COMPANY_SELECT)

  if (!filters.show_closed) {
    query = query.not('status', 'in', `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(',')})`)
  }
  if (filters.owner_user_id) {
    query = query.eq('owner_user_id', filters.owner_user_id)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.expectation_rank) {
    query = query.eq('expectation_rank', filters.expectation_rank)
  }
  if (filters.is_important) {
    query = query.eq('is_important', true)
  }
  if (filters.search) {
    query = query.ilike('company_name', `%${filters.search}%`)
  }

  query = query.order(sortKey, { ascending: sortOrder === 'asc', nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => normalizeCompany(d))
}

export async function getProspect(id: string): Promise<Company | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return normalizeCompany(data)
}

export async function createProspect(
  input: ProspectFormInput & { updated_by?: string }
): Promise<Company> {
  const supabase = createClient()
  // main_contact_user_id も owner_user_id に合わせて設定（後方互換）
  const { data, error } = await supabase
    .from('companies')
    .insert({
      ...input,
      main_contact_user_id: input.owner_user_id,
    })
    .select(COMPANY_SELECT)
    .single()

  if (error) throw error
  return normalizeCompany(data)
}

export async function updateProspect(
  id: string,
  input: Partial<ProspectFormInput> & { updated_by?: string }
): Promise<Company> {
  const supabase = createClient()
  const payload: Record<string, unknown> = { ...input }
  if (input.owner_user_id !== undefined) {
    payload.main_contact_user_id = input.owner_user_id
  }

  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', id)
    .select(COMPANY_SELECT)
    .single()

  if (error) throw error
  return normalizeCompany(data)
}

export async function toggleImportant(id: string, value: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('companies')
    .update({ is_important: value })
    .eq('id', id)
  if (error) throw error
}

// 関係者追加・削除
export async function addCompanyMember(companyId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('company_members')
    .insert({ company_id: companyId, user_id: userId })
  if (error) throw error
}

export async function removeCompanyMember(companyId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('company_members')
    .delete()
    .match({ company_id: companyId, user_id: userId })
  if (error) throw error
}

// ホーム画面用クエリ
export async function getHomeProspects(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const upcoming = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const neglectDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')

  const baseSelect = `
    id, company_name, status, expectation_rank, next_meeting_date,
    last_contact_date, updated_at, is_important,
    owner:users!companies_owner_user_id_fkey(id, name)
  `

  const [myProspects, myMemberProspectsRaw, upcomingProspects, importantProspects,
    recentlyUpdated, neglectedProspects] = await Promise.all([
    // 自分が主担当の進行中見込み先
    supabase.from('companies').select(baseSelect)
      .eq('owner_user_id', userId)
      .not('status', 'in', `(${closedIn})`)
      .order('updated_at', { ascending: false }).limit(10),

    // 自分が関係者の見込み先
    supabase.from('company_members').select(`company:companies(${baseSelect})`)
      .eq('user_id', userId).limit(10),

    // 近日予定（7日以内）
    supabase.from('companies').select(baseSelect)
      .gte('next_meeting_date', today)
      .lte('next_meeting_date', upcoming)
      .not('status', 'in', `(${closedIn})`)
      .order('next_meeting_date', { ascending: true }).limit(10),

    // 重要見込み先
    supabase.from('companies').select(baseSelect)
      .eq('is_important', true)
      .not('status', 'in', `(${closedIn})`)
      .order('expectation_rank', { ascending: true }).limit(10),

    // 自分が最近更新した見込み先
    supabase.from('companies').select(baseSelect)
      .eq('updated_by', userId)
      .order('updated_at', { ascending: false }).limit(10),

    // 放置見込み先（30日以上未接触）
    supabase.from('companies').select(baseSelect)
      .not('status', 'in', `(${closedIn})`)
      .or(`last_contact_date.lt.${neglectDate},last_contact_date.is.null`)
      .order('last_contact_date', { ascending: true, nullsFirst: true }).limit(10),
  ])

  return {
    myProspects: myProspects.data ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myMemberProspects: (myMemberProspectsRaw.data ?? []).map((r: any) => r.company).filter(Boolean),
    upcomingProspects: upcomingProspects.data ?? [],
    importantProspects: importantProspects.data ?? [],
    recentlyUpdated: recentlyUpdated.data ?? [],
    neglectedProspects: neglectedProspects.data ?? [],
  }
}
