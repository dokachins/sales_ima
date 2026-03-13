import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import OverdueActionsClient from '@/components/home/OverdueActionsClient'
import type { User } from '@/types'
import { CLOSED_STATUSES } from '@/types'
import { jstDateStr } from '@/lib/utils/date'

export default async function OverdueActionsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users').select('*').eq('id', authUser.id).single()
  if (!currentUser) redirect('/login')

  const today = jstDateStr()
  const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')

  const { data: myBase } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_user_id', authUser.id)
    .not('status', 'in', `(${closedIn})`)

  const myIds = (myBase ?? []).map((c) => c.id)

  const { data: logsRaw } = myIds.length > 0
    ? await supabase
        .from('interaction_logs')
        .select('id, next_action, next_action_date, action_date, action_type, company_id, company:companies!interaction_logs_company_id_fkey(id, company_name, status, expectation_rank)')
        .in('company_id', myIds)
        .not('next_action', 'is', null)
        .not('next_action_date', 'is', null)
        .lt('next_action_date', today)
        .order('next_action_date', { ascending: true })
    : { data: [] }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-700">期限切れの次回アクション</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">期限切れの次回アクション</h1>
        <p className="text-sm text-gray-400 mt-0.5">予定日を過ぎた未対応のアクション一覧</p>
      </div>

      <OverdueActionsClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs={(logsRaw ?? []) as any}
        currentUser={currentUser as User}
      />
    </div>
  )
}
