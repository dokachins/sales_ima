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
    <div className="section-card overflow-hidden">
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
              {/* 会社名 */}
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
              {/* 主担当 */}
              <td className="px-3 py-3 text-gray-500 text-xs">
                {p.owner?.name ?? <span className="text-gray-300">—</span>}
              </td>
              {/* ステータス */}
              <td className="px-3 py-3">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${PROSPECT_STATUS_STYLES[p.status] ?? ''}`}>
                  {p.status}
                </span>
              </td>
              {/* 期待度 */}
              <td className="px-3 py-3 text-center">
                <ExpectationBadge rank={p.expectation_rank} size="sm" />
              </td>
              {/* 次回予定 */}
              <td className="px-3 py-3">
                {p.next_meeting_date
                  ? <span className="text-blue-600 font-medium text-xs">{formatDate(p.next_meeting_date)}</span>
                  : <span className="text-gray-300">—</span>
                }
              </td>
              {/* 最終接触 */}
              <td className="px-3 py-3 text-gray-400 text-xs">
                {formatDate(p.last_contact_date)}
              </td>
              {/* 棟数 */}
              <td className="px-3 py-3 text-right text-gray-600 text-xs">
                {p.building_count != null
                  ? <span className="font-medium">{p.building_count}棟</span>
                  : <span className="text-gray-300">—</span>
                }
              </td>
              {/* 見込粗利 */}
              <td className="px-3 py-3 text-right text-gray-600 text-xs">
                {p.expected_gross_profit != null
                  ? formatManYen(p.expected_gross_profit)
                  : <span className="text-gray-300">—</span>
                }
              </td>
              {/* 更新日 */}
              <td className="px-3 py-3 text-gray-400 text-xs">
                {formatDate(p.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
