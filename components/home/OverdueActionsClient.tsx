'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ExpectationBadge from '@/components/deals/ExpectationBadge'
import { formatDate, daysSince } from '@/lib/utils/date'
import type { User } from '@/types'
import { toast } from 'sonner'

interface OverdueLog {
  id: string
  next_action: string
  next_action_date: string
  action_date: string
  action_type: string
  company_id: string
  company: {
    id: string
    company_name: string
    status: string
    expectation_rank: string | null
  } | null
}

interface Props {
  logs: OverdueLog[]
  currentUser: User
}

export default function OverdueActionsClient({ logs: initial, currentUser: _currentUser }: Props) {
  const supabase = createClient()
  const [logs, setLogs] = useState(initial)

  async function dismiss(logId: string) {
    const { error } = await supabase
      .from('interaction_logs')
      .update({ next_action: null, next_action_date: null })
      .eq('id', logId)
    if (error) { toast.error('更新に失敗しました'); return }
    setLogs((prev) => prev.filter((l) => l.id !== logId))
    toast.success('完了にしました')
  }

  if (logs.length === 0) {
    return (
      <div className="section-card py-16 text-center">
        <p className="text-sm font-medium text-gray-700">期限切れのアクションはありません</p>
        <p className="text-xs text-gray-400 mt-1">お疲れ様です！</p>
      </div>
    )
  }

  return (
    <div className="section-card divide-y divide-gray-50">
      {logs.map((log) => {
        const days = daysSince(log.next_action_date)
        return (
          <div key={log.id} className="p-4 hover:bg-orange-50/50 transition-colors group">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/prospects/${log.company_id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-orange-600 hover:underline transition-colors"
                  >
                    {log.company?.company_name ?? '—'}
                  </Link>
                  <ExpectationBadge rank={log.company?.expectation_rank as Parameters<typeof ExpectationBadge>[0]['rank']} size="sm" />
                  <span className="text-xs text-gray-400">{log.company?.status}</span>
                </div>
                <p className="text-sm text-gray-700">{log.next_action}</p>
              </div>
              <button
                onClick={() => dismiss(log.id)}
                className="shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-400 flex items-center justify-center text-xs transition-colors"
                title="完了にする"
              >
                ✓
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-orange-500 tabular-nums">
                {days !== null ? `${days}日超過` : '—'}
              </span>
              <span>·</span>
              <span>{formatDate(log.next_action_date)} 予定</span>
              <span>·</span>
              <span>{log.action_type} {formatDate(log.action_date)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
