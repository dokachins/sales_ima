'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'
import { DEAL_STATUSES, EXPECTATION_RANKS } from '@/types'

interface Props {
  users: User[]
}

export default function DealFilters({ users }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const hasFilters = Array.from(searchParams.entries()).some(([k]) =>
    ['owner', 'status', 'rank', 'archived'].includes(k)
  )

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="会社名・案件名で検索"
        className="w-48"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
      />

      <Select
        value={searchParams.get('owner') ?? ''}
        onValueChange={(v) => updateParam('owner', v === '__all__' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="主担当" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">すべて</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') ?? ''}
        onValueChange={(v) => updateParam('status', v === '__all__' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">すべて</SelectItem>
          {DEAL_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('rank') ?? ''}
        onValueChange={(v) => updateParam('rank', v === '__all__' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="w-28">
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
        onValueChange={(v) => updateParam('sort', v ?? 'updated_at')}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="並び順" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at">最終更新日</SelectItem>
          <SelectItem value="next_meeting_date">次回予定日</SelectItem>
          <SelectItem value="expected_gross_profit">見込粗利</SelectItem>
          <SelectItem value="expectation_rank">期待度</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => updateParam('archived', searchParams.get('archived') ? '' : '1')}
        className={searchParams.get('archived') ? 'bg-gray-100' : ''}
      >
        過去案件を表示
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
          クリア
        </Button>
      )}
    </div>
  )
}
