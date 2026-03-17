'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NumberInput } from '@/components/ui/number-input'
import { toast } from 'sonner'
import type { Company, User, ProspectStatus, ExpectationRank } from '@/types'
import { PROSPECT_STATUSES, EXPECTATION_RANKS } from '@/types'

interface Props {
  prospect?: Company
  users: User[]
  currentUser: User
  onSuccess?: (company: Company) => void
}

export default function ProspectForm({ prospect, users, currentUser, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!prospect

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_name:          prospect?.company_name ?? '',
    owner_user_id:         prospect?.owner_user_id ?? currentUser.id,
    status:                (prospect?.status ?? '未接触') as ProspectStatus,
    expectation_rank:      prospect?.expectation_rank ?? '__none__',
    next_meeting_date:     prospect?.next_meeting_date ?? '',
    competitor_name:       prospect?.competitor_name ?? '',
    competitor_memo:       prospect?.competitor_memo ?? '',
    notes:                 prospect?.notes ?? '',
    is_important:          prospect?.is_important ?? false,
  })
  const [targetSales, setTargetSales] = useState<number | null>(prospect?.target_sales ?? null)
  const [grossProfit, setGrossProfit] = useState<number | null>(prospect?.expected_gross_profit ?? null)
  const [buildingCount, setBuildingCount] = useState<number | null>(prospect?.building_count ?? null)

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) {
      toast.error('会社名を入力してください')
      return
    }

    setLoading(true)

    const payload = {
      company_name:          form.company_name,
      owner_user_id:         form.owner_user_id || null,
      main_contact_user_id:  form.owner_user_id || null,
      status:                form.status,
      expectation_rank:      (form.expectation_rank && form.expectation_rank !== '__none__') ? form.expectation_rank : null,
      next_meeting_date:     form.next_meeting_date || null,
      competitor_name:       form.competitor_name || null,
      competitor_memo:       form.competitor_memo || null,
      target_sales:          targetSales,
      expected_gross_profit: grossProfit,
      building_count:        buildingCount,
      notes:                 form.notes || null,
      is_important:          form.is_important,
      updated_by:            currentUser.id,
    }

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('companies')
          .update(payload)
          .eq('id', prospect!.id)
          .select('*')
          .single()
        if (error) throw error
        toast.success('見込み先情報を更新しました')
        onSuccess?.(data as Company)
      } else {
        const { data, error } = await supabase
          .from('companies')
          .insert(payload)
          .select('*')
          .single()
        if (error) throw error
        toast.success('見込み先を登録しました')
        router.push(`/prospects/${data.id}`)
        router.refresh()
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.message ?? JSON.stringify(err)
      console.error('ProspectForm error:', msg, err)
      toast.error(msg || '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ステータスのリストから受注/失注/保留を除く（通常入力時は非表示）
  const activeStatuses: ProspectStatus[] = ['未接触', '接触中', 'ヒアリング済み', '提案中', '商談中']
  const allStatuses = PROSPECT_STATUSES

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 会社名 */}
      <div className="space-y-1.5">
        <Label htmlFor="company_name" className="text-xs font-medium text-gray-500">
          会社名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company_name"
          value={form.company_name}
          onChange={(e) => set('company_name', e.target.value)}
          placeholder="例: 株式会社〇〇ハウス"
          required
          className="text-base"
          autoFocus={!isEdit}
        />
      </div>

      {/* 主担当 / ステータス / 期待度 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">主担当営業</Label>
          <Select
            value={form.owner_user_id}
            onValueChange={(v) => set('owner_user_id', v ?? '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="担当者を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">ステータス</Label>
          <Select
            value={form.status}
            onValueChange={(v) => set('status', (v ?? '未接触') as ProspectStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROSPECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">期待度</Label>
          <Select
            value={form.expectation_rank}
            onValueChange={(v) => set('expectation_rank', v ?? '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="未設定" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未設定</SelectItem>
              {EXPECTATION_RANKS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="next_meeting_date" className="text-xs font-medium text-gray-500">
            次回打ち合わせ日
          </Label>
          <Input
            id="next_meeting_date"
            type="date"
            value={form.next_meeting_date}
            onChange={(e) => set('next_meeting_date', e.target.value)}
          />
        </div>
      </div>

      {/* 数字情報 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">数字情報（任意）</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="target_sales" className="text-xs font-medium text-gray-500">目標売上</Label>
            <NumberInput
              id="target_sales"
              value={targetSales}
              onChange={setTargetSales}
              placeholder="0"
              suffix="円"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gross_profit" className="text-xs font-medium text-gray-500">見込粗利</Label>
            <NumberInput
              id="gross_profit"
              value={grossProfit}
              onChange={setGrossProfit}
              placeholder="0"
              suffix="円"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="building_count" className="text-xs font-medium text-gray-500">見込み棟数</Label>
            <NumberInput
              id="building_count"
              value={buildingCount}
              onChange={setBuildingCount}
              placeholder="0"
              suffix="棟"
            />
          </div>
        </div>
      </div>

      {/* 競合情報 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">競合情報（任意）</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="competitor_name" className="text-xs font-medium text-gray-500">競合会社名</Label>
            <Input
              id="competitor_name"
              value={form.competitor_name}
              onChange={(e) => set('competitor_name', e.target.value)}
              placeholder="例: 〇〇工務店"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="competitor_memo" className="text-xs font-medium text-gray-500">競合状況メモ</Label>
            <Textarea
              id="competitor_memo"
              value={form.competitor_memo}
              onChange={(e) => set('competitor_memo', e.target.value)}
              rows={2}
              placeholder="競合の強み・弱みなど"
            />
          </div>
        </div>
      </div>

      {/* 備考 */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium text-gray-500">備考</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="その他メモ"
        />
      </div>

      {/* 重要フラグ */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_important}
          onChange={(e) => set('is_important', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-amber-500"
        />
        <span className="text-sm text-gray-700 font-medium">重要見込み先としてマーク</span>
        <span className="text-xs text-gray-400">（一覧・ホームで目立たせます）</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </Button>
      </div>
    </form>
  )
}
