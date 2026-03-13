'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ExpectationBadge from '@/components/deals/ExpectationBadge'
import { formatDate, daysSince, todayStr } from '@/lib/utils/date'
import { formatManYen } from '@/lib/utils/number'
import type { User } from '@/types'
import { toast } from 'sonner'

interface ProspectItem {
  id: string
  company_name: string
  status: string
  expectation_rank: string | null
  next_meeting_date: string | null
  last_contact_date: string | null
  is_important: boolean
}

interface OverdueAction {
  id: string
  next_action: string
  next_action_date: string
  company_id: string
  company: { id: string; company_name: string } | null
}

interface PipelineStats {
  count: number
  grossProfit: number
  buildingCount: number
  upcomingMeetings: number
}

interface Props {
  currentUser: User
  pipelineStats: PipelineStats
  todayMeetings: ProspectItem[]
  overdueActions: OverdueAction[]
  importantNeglected: ProspectItem[]
}

// ---- パイプラインサマリー ----

function PipelineSummary({ stats }: { stats: PipelineStats }) {
  return (
    <div className="section-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">マイパイプライン（進行中 A・B案件）</h2>
        <Link href="/prospects" className="text-xs text-blue-500 hover:underline">
          一覧で確認 →
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.count}</p>
          <p className="text-xs text-gray-400 mt-0.5">社</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {stats.grossProfit > 0 ? formatManYen(stats.grossProfit) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">見込み粗利</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {stats.buildingCount > 0 ? `${stats.buildingCount}棟` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">見込み棟数</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.upcomingMeetings}</p>
          <p className="text-xs text-gray-400 mt-0.5">打ち合わせ予定</p>
        </div>
      </div>
    </div>
  )
}

// ---- ウィジェットヘッダー ----

function WidgetHeader({
  icon, title, count, href,
}: {
  icon: string
  title: string
  count: number
  href: string
}) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-1">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400 tabular-nums">{count}件</span>
      </div>
      <Link href={href} className="text-xs text-blue-500 hover:underline shrink-0">
        全件を見る →
      </Link>
    </div>
  )
}

// ---- 今日・明日の打ち合わせ行 ----

function TodayMeetingRow({ prospect, today }: { prospect: ProspectItem; today: string }) {
  const isToday = prospect.next_meeting_date === today
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-blue-50 transition-colors group"
    >
      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
        {prospect.company_name}
      </p>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isToday ? '今日' : '明日'}
        </span>
        <ExpectationBadge rank={prospect.expectation_rank as Parameters<typeof ExpectationBadge>[0]['rank']} size="sm" />
      </div>
    </Link>
  )
}

// ---- 期限切れアクション行 ----

function OverdueActionRow({
  log,
  onDismiss,
}: {
  log: OverdueAction
  onDismiss: (id: string) => void
}) {
  const days = daysSince(log.next_action_date)
  return (
    <div className="flex items-start gap-2 py-2.5 px-3 rounded-lg hover:bg-orange-50 transition-colors group">
      <Link href={`/prospects/${log.company_id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {log.company?.company_name ?? '—'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{log.next_action}</p>
      </Link>
      <div className="shrink-0 flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs font-medium text-orange-500 tabular-nums">
            {days !== null ? `${days}日超過` : '—'}
          </p>
          <p className="text-xs text-gray-400">{formatDate(log.next_action_date)}予定</p>
        </div>
        <button
          onClick={() => onDismiss(log.id)}
          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-600 text-gray-400 flex items-center justify-center text-xs transition-colors shrink-0"
          title="完了にする"
        >
          ✓
        </button>
      </div>
    </div>
  )
}

// ---- 重要×未接触行 ----

function ImportantNeglectedRow({ prospect }: { prospect: ProspectItem }) {
  const days = daysSince(prospect.last_contact_date)
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-amber-50 transition-colors group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-700 transition-colors">
          <span className="text-amber-400 mr-1">★</span>
          {prospect.company_name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {days !== null ? `${days}日前に接触` : '未接触'}
        </p>
      </div>
      <ExpectationBadge rank={prospect.expectation_rank as Parameters<typeof ExpectationBadge>[0]['rank']} size="sm" />
    </Link>
  )
}

// ---- メインコンポーネント ----

export default function HomeWidgets({
  currentUser,
  pipelineStats,
  todayMeetings,
  overdueActions: initialOverdueActions,
  importantNeglected,
}: Props) {
  const supabase = createClient()
  const today = todayStr()
  const [overdueActions, setOverdueActions] = useState(initialOverdueActions)

  async function dismissAction(logId: string) {
    const { error } = await supabase
      .from('interaction_logs')
      .update({ next_action: null, next_action_date: null })
      .eq('id', logId)
    if (error) { toast.error('更新に失敗しました'); return }
    setOverdueActions((prev) => prev.filter((a) => a.id !== logId))
    toast.success('完了にしました')
  }

  const noWidgets = todayMeetings.length === 0 && overdueActions.length === 0 && importantNeglected.length === 0

  return (
    <div className="space-y-5">

      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">ホーム</h1>
          <p className="text-sm text-gray-400 mt-0.5">{currentUser.name} さん、お疲れ様です</p>
        </div>
        <Link href="/prospects" className="text-xs text-blue-500 hover:underline shrink-0 mt-1">
          見込み先一覧 →
        </Link>
      </div>

      {/* パイプラインサマリー */}
      <PipelineSummary stats={pipelineStats} />

      {/* 全て対応済み */}
      {noWidgets && (
        <div className="section-card p-8 text-center">
          <p className="text-lg mb-1">✓</p>
          <p className="text-sm font-medium text-gray-700">今日の対応事項はすべて完了しています</p>
          <p className="text-xs text-gray-400 mt-1">
            <Link href="/prospects" className="text-blue-500 hover:underline">見込み先一覧</Link>で
            状況を確認しましょう
          </p>
        </div>
      )}

      {/* 今日・明日の打ち合わせ */}
      {todayMeetings.length > 0 && (
        <div className="section-card p-4">
          <WidgetHeader
            icon="📅"
            title="今日・明日の打ち合わせ"
            count={todayMeetings.length}
            href="/prospects/today-meetings"
          />
          <div className="divide-y divide-gray-50 mt-1">
            {todayMeetings.map((p) => (
              <TodayMeetingRow key={p.id} prospect={p} today={today} />
            ))}
          </div>
        </div>
      )}

      {/* 期限切れの次回アクション */}
      {overdueActions.length > 0 && (
        <div className="section-card p-4">
          <WidgetHeader
            icon="⚠️"
            title="期限切れの次回アクション"
            count={overdueActions.length}
            href="/prospects/overdue-actions"
          />
          <div className="divide-y divide-gray-50 mt-1">
            {overdueActions.map((log) => (
              <OverdueActionRow key={log.id} log={log} onDismiss={dismissAction} />
            ))}
          </div>
        </div>
      )}

      {/* 重要 × 長期未接触 */}
      {importantNeglected.length > 0 && (
        <div className="section-card p-4">
          <WidgetHeader
            icon="★"
            title="重要案件で長期間未接触（30日以上）"
            count={importantNeglected.length}
            href="/prospects/important-neglected"
          />
          <div className="divide-y divide-gray-50 mt-1">
            {importantNeglected.map((p) => (
              <ImportantNeglectedRow key={p.id} prospect={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
