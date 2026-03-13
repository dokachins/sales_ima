import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeWidgets from '@/components/home/HomeWidgets'
import type { User } from '@/types'
import { CLOSED_STATUSES } from '@/types'
import { jstDateStr } from '@/lib/utils/date'

export const metadata: Metadata = { title: 'ホーム | Scout' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: currentUserData } = await supabase
    .from('users').select('*').eq('id', authUser.id).single()
  if (!currentUserData) redirect('/login')

  const currentUser = currentUserData as User

  const today = jstDateStr()
  const neglectDate = jstDateStr(-30)
  const tomorrow = jstDateStr(1)
  const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')

  // 自分が担当する進行中の見込み先ID
  const { data: myBase } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_user_id', authUser.id)
    .not('status', 'in', `(${closedIn})`)

  const myIds = (myBase ?? []).map((c) => c.id)

  const baseSelect = 'id, company_name, status, expectation_rank, next_meeting_date, last_contact_date, is_important, building_count, expected_gross_profit'

  const [pipelineRes, todayMeetingsRes, overdueLogsRes, importantNeglectedRes] = await Promise.all([
    // パイプライン指標（自分のA/B進行中）
    supabase
      .from('companies')
      .select('id, expectation_rank, expected_gross_profit, building_count, next_meeting_date')
      .eq('owner_user_id', authUser.id)
      .not('status', 'in', `(${closedIn})`)
      .in('expectation_rank', ['A', 'B']),

    // 今日・明日の打ち合わせ
    myIds.length > 0
      ? supabase
          .from('companies')
          .select(baseSelect)
          .in('id', myIds)
          .gte('next_meeting_date', today)
          .lte('next_meeting_date', tomorrow)
          .order('next_meeting_date', { ascending: true })
      : Promise.resolve({ data: [] }),

    // 期限切れの次回アクション（自分担当分のみ）
    myIds.length > 0
      ? supabase
          .from('interaction_logs')
          .select('id, next_action, next_action_date, company_id, company:companies!interaction_logs_company_id_fkey(id, company_name)')
          .in('company_id', myIds)
          .not('next_action', 'is', null)
          .not('next_action_date', 'is', null)
          .lt('next_action_date', today)
          .order('next_action_date', { ascending: true })
      : Promise.resolve({ data: [] }),

    // 重要 × 長期未接触（自分担当分のみ）
    supabase
      .from('companies')
      .select(baseSelect)
      .eq('owner_user_id', authUser.id)
      .eq('is_important', true)
      .not('status', 'in', `(${closedIn})`)
      .or(`last_contact_date.lt.${neglectDate},last_contact_date.is.null`)
      .order('last_contact_date', { ascending: true, nullsFirst: true }),
  ])

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
      currentUser={currentUser}
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
