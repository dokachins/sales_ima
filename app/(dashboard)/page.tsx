import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getCurrentProfile } from '@/lib/supabase/cached'
import HomeWidgets from '@/components/home/HomeWidgets'
import type { User } from '@/types'
import { CLOSED_STATUSES } from '@/types'
import { jstDateStr } from '@/lib/utils/date'

export const metadata: Metadata = { title: 'ホーム | Scout' }

export default async function HomePage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const currentUser = await getCurrentProfile(authUser.id)
  if (!currentUser) redirect('/login')

  const supabase = await createClient()
  const today = jstDateStr()
  const neglectDate = jstDateStr(-30)
  const tomorrow = jstDateStr(1)
  const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')

  const baseSelect = 'id, company_name, status, expectation_rank, next_meeting_date, last_contact_date, is_important, building_count, expected_gross_profit'

  // myIds(overdue用)・pipeline・today・neglected を全部並列で取得
  const [myBaseRes, pipelineRes, todayMeetingsRes, importantNeglectedRes] = await Promise.all([
    supabase
      .from('companies')
      .select('id')
      .eq('owner_user_id', authUser.id)
      .not('status', 'in', `(${closedIn})`),

    supabase
      .from('companies')
      .select('id, expectation_rank, expected_gross_profit, building_count, next_meeting_date')
      .eq('owner_user_id', authUser.id)
      .not('status', 'in', `(${closedIn})`)
      .in('expectation_rank', ['A', 'B']),

    supabase
      .from('companies')
      .select(baseSelect)
      .eq('owner_user_id', authUser.id)
      .gte('next_meeting_date', today)
      .lte('next_meeting_date', tomorrow)
      .not('status', 'in', `(${closedIn})`)
      .order('next_meeting_date', { ascending: true }),

    supabase
      .from('companies')
      .select(baseSelect)
      .eq('owner_user_id', authUser.id)
      .eq('is_important', true)
      .not('status', 'in', `(${closedIn})`)
      .or(`last_contact_date.lt.${neglectDate},last_contact_date.is.null`)
      .order('last_contact_date', { ascending: true, nullsFirst: true }),
  ])

  const myIds = (myBaseRes.data ?? []).map((c) => c.id)

  // overdue logs は myIds が必要なので後続で実行（myIds は上の並列で取得済み）
  const overdueLogsRes = myIds.length > 0
    ? await supabase
        .from('interaction_logs')
        .select('id, next_action, next_action_date, company_id, company:companies!interaction_logs_company_id_fkey(id, company_name)')
        .in('company_id', myIds)
        .not('next_action', 'is', null)
        .not('next_action_date', 'is', null)
        .lt('next_action_date', today)
        .order('next_action_date', { ascending: true })
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline = (pipelineRes.data ?? []) as any[]
  const pipelineStats = {
    count: pipeline.length,
    grossProfit: pipeline.reduce((s, p) => s + (p.expected_gross_profit ?? 0), 0),
    buildingCount: pipeline.reduce((s, p) => s + (p.building_count ?? 0), 0),
    upcomingMeetings: pipeline.filter((p) => p.next_meeting_date && p.next_meeting_date >= today).length,
  }

  const seen = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdueActions = (overdueLogsRes.data ?? []).filter((log: any) => {
    if (!log.company_id || seen.has(log.company_id)) return false
    seen.add(log.company_id)
    return true
  })

  return (
    <HomeWidgets
      currentUser={currentUser as User}
      pipelineStats={pipelineStats}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todayMeetings={(todayMeetingsRes.data ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      overdueActions={overdueActions as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      importantNeglected={(importantNeglectedRes.data ?? []) as any}
    />
  )
}
