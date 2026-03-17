import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProspectList from '@/components/companies/ProspectList'
import type { Company, User } from '@/types'
import { CLOSED_STATUSES } from '@/types'
import { jstDateStr } from '@/lib/utils/date'

export default async function TodayMeetingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const today = jstDateStr()
  const tomorrow = jstDateStr(1)
  const closedIn = CLOSED_STATUSES.map((s) => `"${s}"`).join(',')

  const { data: rawProspects } = await supabase
    .from('companies')
    .select(`
      *,
      owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
      members:company_members(user:users(id, name, email, role, created_at))
    `)
    .eq('owner_user_id', authUser.id)
    .in('next_meeting_date', [today, tomorrow])
    .not('status', 'in', `(${closedIn})`)
    .order('next_meeting_date', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prospects: Company[] = (rawProspects ?? []).map((d: any) => ({
    ...d,
    members: (d.members ?? []).map((m: { user: User }) => m.user).filter(Boolean),
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-700">今日・明日の打ち合わせ</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">今日・明日の打ち合わせ</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            本日・翌日に打ち合わせ予定の見込み先 — {prospects.length}件
          </p>
        </div>
        <Link href="/prospects" className="text-xs text-blue-500 hover:underline">
          見込み先一覧 →
        </Link>
      </div>

      <ProspectList prospects={prospects} />
    </div>
  )
}
