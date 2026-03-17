'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpectationBadge from '@/components/deals/ExpectationBadge'
import { formatDate } from '@/lib/utils/date'
import { formatManYen } from '@/lib/utils/number'
import { PROSPECT_STATUS_STYLES } from '@/lib/utils/status'
import type { Company } from '@/types'
import { toast } from 'sonner'

interface Props {
  prospects: Company[]
  onUpdate?: () => void
}

export default function ProspectList({ prospects, onUpdate }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function toggleImportant(e: React.MouseEvent, id: string, current: boolean) {
    e.stopPropagation()
    const { error } = await supabase.from('companies').update({ is_important: !current }).eq('id', id)
    if (error) { toast.error('更新に失敗しました'); return }
    router.refresh()
  }

  if (prospects.length === 0) {
    return (
      <div className="section-card py-16 text-center">
        <p className="text-sm text-gray-400">該当する見込み先がありません</p>
      </div>
    )
  }

  return (
    <>
      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-2">
        {prospects.map((p) => (
          <div
            key={p.id}
            className="section-card p-4 cursor-pointer active:bg-gray-50"
            onClick={() => router.push(`/prospects/${p.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={(e) => toggleImportant(e, p.id, p.is_important)}
                  className={`shrink-0 text-base leading-none ${p.is_important ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
                <span className="font-medium text-gray-900 truncate">{p.company_name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ExpectationBadge rank={p.expectation_rank} size="sm" />
                <span className="text-gray-300 text-xs">›</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROSPECT_STATUS_STYLES[p.status] ?? ''}`}>
                {p.status}
              </span>
              <span className="text-xs text-gray-400">{p.owner?.name ?? '担当未設定'}</span>
              {p.next_meeting_date && (
                <span className="text-xs text-blue-600 font-medium">次回 {formatDate(p.next_meeting_date)}</span>
              )}
            </div>
            {(p.expected_gross_profit != null || p.building_count != null || p.last_contact_date) && (
              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                {p.expected_gross_profit != null && (
                  <span className="font-medium text-gray-700">{formatManYen(p.expected_gross_profit)}</span>
                )}
                {p.building_count != null && (
                  <span className="font-medium text-gray-700">{p.building_count}棟</span>
                )}
                {p.last_contact_date && <span>最終接触 {formatDate(p.last_contact_date)}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block section-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs tracking-wide">会社名</th>
              <th className="text-left px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-24">主担当</th>
              <th className="text-left px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-28">ステータス</th>
              <th className="text-center px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-16">期待度</th>
              <th className="text-left px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-28">次回予定</th>
              <th className="text-left px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-28">最終接触</th>
              <th className="text-right px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-20">棟数</th>
              <th className="text-right px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-28">見込粗利</th>
              <th className="text-left px-3 py-3 font-medium text-gray-400 text-xs tracking-wide w-24">更新日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prospects.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                onClick={() => router.push(`/prospects/${p.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleImportant(e, p.id, p.is_important)}
                      className={`shrink-0 text-base leading-none transition-colors ${
                        p.is_important
                          ? 'text-amber-400'
                          : 'text-gray-200 group-hover:text-gray-300 hover:!text-amber-300'
                      }`}
                      title={p.is_important ? '重要解除' : '重要にする'}
                    >
                      ★
                    </button>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {p.company_name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">
                  {p.owner?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${PROSPECT_STATUS_STYLES[p.status] ?? ''}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <ExpectationBadge rank={p.expectation_rank} size="sm" />
                </td>
                <td className="px-3 py-3">
                  {p.next_meeting_date
                    ? <span className="text-blue-600 font-medium text-xs">{formatDate(p.next_meeting_date)}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-3 py-3 text-gray-400 text-xs">
                  {formatDate(p.last_contact_date)}
                </td>
                <td className="px-3 py-3 text-right text-gray-600 text-xs">
                  {p.building_count != null
                    ? <span className="font-medium">{p.building_count}棟</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-3 py-3 text-right text-gray-600 text-xs">
                  {p.expected_gross_profit != null
                    ? formatManYen(p.expected_gross_profit)
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-3 py-3 text-gray-400 text-xs">
                  {formatDate(p.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
