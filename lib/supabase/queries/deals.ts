import { createClient } from '@/lib/supabase/client'
import type { Deal, DealFilters, DealFormInput, DealSortKey, SortOrder, User } from '@/types'

const DEAL_SELECT = `
  *,
  company:companies(id, company_name),
  owner:users!deals_owner_user_id_fkey(id, name, email, role, created_at),
  updater:users!deals_updated_by_fkey(id, name, email, role, created_at),
  members:deal_members(user:users(id, name, email, role, created_at))
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDeal(d: any): Deal {
  return {
    ...d,
    members: (d.members ?? []).map((m: { user: User }) => m.user).filter(Boolean),
  } as Deal
}

export async function getDeals(
  filters: DealFilters = {},
  sortKey: DealSortKey = 'updated_at',
  sortOrder: SortOrder = 'desc'
): Promise<Deal[]> {
  const supabase = createClient()
  let query = supabase.from('deals').select(DEAL_SELECT)

  if (!filters.show_archived) {
    query = query.eq('is_archived', false).not('status', 'in', '("受注","失注","保留")')
  }
  if (filters.owner_user_id) query = query.eq('owner_user_id', filters.owner_user_id)
  if (filters.status)         query = query.eq('status', filters.status)
  if (filters.expectation_rank) query = query.eq('expectation_rank', filters.expectation_rank)
  if (filters.next_meeting_from) query = query.gte('next_meeting_date', filters.next_meeting_from)
  if (filters.next_meeting_to)   query = query.lte('next_meeting_date', filters.next_meeting_to)

  query = query.order(sortKey, { ascending: sortOrder === 'asc', nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => normalizeDeal(d))
}

export async function getDealsByCompany(companyId: string): Promise<Deal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => normalizeDeal(d))
}

export async function getDeal(id: string): Promise<Deal | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return normalizeDeal(data)
}

export async function createDeal(input: DealFormInput & { updated_by: string }): Promise<Deal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deals')
    .insert(input)
    .select(DEAL_SELECT)
    .single()

  if (error) throw error
  return normalizeDeal(data)
}

export async function updateDeal(
  id: string,
  input: Partial<DealFormInput> & { updated_by?: string; is_archived?: boolean }
): Promise<Deal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deals')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(DEAL_SELECT)
    .single()

  if (error) throw error
  return normalizeDeal(data)
}

// ホーム画面用クエリ
export async function getHomeDeals(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const upcoming = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const neglectDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const baseSelect = `
    id, deal_name, status, expectation_rank, next_meeting_date,
    last_contact_date, updated_at, updated_by,
    company:companies(id, company_name),
    owner:users!deals_owner_user_id_fkey(id, name)
  `

  const [myDeals, myMemberDeals, upcomingDeals, highRankDeals, recentlyUpdated, neglectedDeals] =
    await Promise.all([
      supabase
        .from('deals')
        .select(baseSelect)
        .match({ owner_user_id: userId, is_archived: false })
        .not('status', 'in', '("受注","失注","保留")')
        .order('updated_at', { ascending: false })
        .limit(10),

      supabase
        .from('deal_members')
        .select(`deal:deals(${baseSelect})`)
        .eq('user_id', userId)
        .limit(10),

      supabase
        .from('deals')
        .select(baseSelect)
        .eq('is_archived', false)
        .gte('next_meeting_date', today)
        .lte('next_meeting_date', upcoming)
        .order('next_meeting_date', { ascending: true })
        .limit(10),

      supabase
        .from('deals')
        .select(baseSelect)
        .eq('is_archived', false)
        .in('expectation_rank', ['A', 'B'])
        .not('status', 'in', '("受注","失注","保留")')
        .order('expectation_rank', { ascending: true })
        .limit(10),

      supabase
        .from('deals')
        .select(baseSelect)
        .eq('updated_by', userId)
        .order('updated_at', { ascending: false })
        .limit(10),

      supabase
        .from('deals')
        .select(baseSelect)
        .eq('is_archived', false)
        .not('status', 'in', '("受注","失注","保留")')
        .or(`last_contact_date.lt.${neglectDate},last_contact_date.is.null`)
        .order('last_contact_date', { ascending: true, nullsFirst: true })
        .limit(10),
    ])

  return {
    myDeals: myDeals.data ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myMemberDeals: (myMemberDeals.data ?? []).map((r: any) => r.deal).filter(Boolean),
    upcomingDeals: upcomingDeals.data ?? [],
    highRankDeals: highRankDeals.data ?? [],
    recentlyUpdated: recentlyUpdated.data ?? [],
    neglectedDeals: neglectedDeals.data ?? [],
  }
}

export async function addDealMember(dealId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('deal_members')
    .insert({ deal_id: dealId, user_id: userId })

  if (error) throw error
}

export async function removeDealMember(dealId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('deal_members')
    .delete()
    .match({ deal_id: dealId, user_id: userId })

  if (error) throw error
}
