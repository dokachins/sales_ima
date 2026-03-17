'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'
import { PROSPECT_STATUSES, EXPECTATION_RANKS } from '@/types'

interface Props {
  users: User[]
  currentUserId: string
}

export default function ProspectFilters({ users, currentUserId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      value ? params.set(key, value) : params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const hasFilters = ['owner', 'status', 'rank', 'important', 'closed'].some(
    (k) => searchParams.has(k)
  )

  return (
    <div className="space-y-2">
      {/* 検索 */}
      <Input
        placeholder="会社名で検索"
        className="w-full sm:w-56 h-8 text-sm"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => update('q', e.target.value)}
      />

      {/* フィルター群 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={searchParams.get('owner') === 'all' ? '__all__' : (searchParams.get('owner') ?? currentUserId)}
          onValueChange={(v) => update('owner', v === '__all__' ? 'all' : (v ?? ''))}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全員</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.id === currentUserId ? `${u.name}（自分）` : u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('status') ?? ''}
          onValueChange={(v) => update('status', v === '__all__' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">すべて</SelectItem>
            {PROSPECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('rank') ?? ''}
          onValueChange={(v) => update('rank', v === '__all__' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-24 h-8 text-sm">
            <SelectValue placeholder="期待度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">すべて</SelectItem>
            {EXPECTATION_RANKS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('sort') ?? 'updated_at'}
          onValueChange={(v) => update('sort', v ?? 'updated_at')}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue>
              {({
                updated_at: '最終更新日',
                next_meeting_date: '次回予定日',
                expected_gross_profit: '見込粗利',
                expectation_rank: '期待度',
                last_contact_date: '最終接触日',
              } as Record<string, string>)[searchParams.get('sort') ?? 'updated_at'] ?? '並び順'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">最終更新日</SelectItem>
            <SelectItem value="next_meeting_date">次回予定日</SelectItem>
            <SelectItem value="expected_gross_profit">見込粗利</SelectItem>
            <SelectItem value="expectation_rank">期待度</SelectItem>
            <SelectItem value="last_contact_date">最終接触日</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => update('important', searchParams.get('important') ? '' : '1')}
          className={`h-8 text-sm ${searchParams.get('important') ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}`}
        >
          ★ 重要
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => update('closed', searchParams.get('closed') ? '' : '1')}
          className={`h-8 text-sm ${searchParams.get('closed') ? 'bg-gray-100' : ''}`}
        >
          終了済み
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="h-8 text-sm text-gray-400">
            クリア
          </Button>
        )}
      </div>
    </div>
  )
}
