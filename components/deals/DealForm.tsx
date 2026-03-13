'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Deal, Company, User } from '@/types'
import { DEAL_STATUSES, EXPECTATION_RANKS } from '@/types'

interface Props {
  deal?: Deal
  companies: Company[]
  users: User[]
  currentUser: User
  onSuccess?: (deal: Deal) => void
}

export default function DealForm({ deal, companies, users, currentUser, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!deal

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_id:            deal?.company_id ?? '',
    deal_name:             deal?.deal_name ?? '',
    owner_user_id:         deal?.owner_user_id ?? currentUser.id,
    status:                deal?.status ?? '未接触',
    expectation_rank:      deal?.expectation_rank ?? '__none__',
    target_sales:          deal?.target_sales?.toString() ?? '',
    building_count:        deal?.building_count?.toString() ?? '',
    expected_gross_profit: deal?.expected_gross_profit?.toString() ?? '',
    competitor_name:       deal?.competitor_name ?? '',
    competitor_memo:       deal?.competitor_memo ?? '',
    next_meeting_date:     deal?.next_meeting_date ?? '',
    notes:                 deal?.notes ?? '',
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_id || !form.deal_name || !form.owner_user_id) {
      toast.error('会社名、案件名、主担当は必須です')
      return
    }

    setLoading(true)

    const payload = {
      company_id:            form.company_id,
      deal_name:             form.deal_name,
      owner_user_id:         form.owner_user_id,
      status:                form.status,
      expectation_rank:      (form.expectation_rank && form.expectation_rank !== '__none__') ? form.expectation_rank : null,
      target_sales:          form.target_sales ? Number(form.target_sales) : null,
      building_count:        form.building_count ? Number(form.building_count) : null,
      expected_gross_profit: form.expected_gross_profit ? Number(form.expected_gross_profit) : null,
      competitor_name:       form.competitor_name || null,
      competitor_memo:       form.competitor_memo || null,
      next_meeting_date:     form.next_meeting_date || null,
      notes:                 form.notes || null,
      updated_by:            currentUser.id,
    }

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('deals')
          .update(payload)
          .eq('id', deal!.id)
          .select()
          .single()
        if (error) throw error
        toast.success('案件を更新しました')
        onSuccess?.(data as Deal)
      } else {
        const { data, error } = await supabase
          .from('deals')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        toast.success('案件を作成しました')
        router.push(`/deals/${data.id}`)
        router.refresh()
      }
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">基本情報</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="company_id">会社名 *</Label>
            <Select value={form.company_id} onValueChange={(v) => set('company_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="会社を選択" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="deal_name">案件名 *</Label>
            <Input
              id="deal_name"
              value={form.deal_name}
              onChange={(e) => set('deal_name', e.target.value)}
              placeholder="例: 〇〇新築プロジェクト"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>主担当営業 *</Label>
            <Select value={form.owner_user_id} onValueChange={(v) => set('owner_user_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="担当者を選択" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>ステータス</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v ?? '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>期待度</Label>
            <Select value={form.expectation_rank} onValueChange={(v) => set('expectation_rank', v ?? '')}>
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

          <div className="space-y-1.5">
            <Label htmlFor="next_meeting_date">次回打ち合わせ日</Label>
            <Input
              id="next_meeting_date"
              type="date"
              value={form.next_meeting_date}
              onChange={(e) => set('next_meeting_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 数字情報 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">数字情報</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="target_sales">目標売上（円）</Label>
            <Input
              id="target_sales"
              type="number"
              value={form.target_sales}
              onChange={(e) => set('target_sales', e.target.value)}
              placeholder="例: 10000000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="building_count">棟数</Label>
            <Input
              id="building_count"
              type="number"
              value={form.building_count}
              onChange={(e) => set('building_count', e.target.value)}
              placeholder="例: 5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expected_gross_profit">見込粗利（円）</Label>
            <Input
              id="expected_gross_profit"
              type="number"
              value={form.expected_gross_profit}
              onChange={(e) => set('expected_gross_profit', e.target.value)}
              placeholder="例: 2000000"
            />
          </div>
        </div>
      </div>

      {/* 競合情報 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">競合情報</h3>
        <div className="space-y-1.5">
          <Label htmlFor="competitor_name">競合会社名</Label>
          <Input
            id="competitor_name"
            value={form.competitor_name}
            onChange={(e) => set('competitor_name', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="competitor_memo">競合状況メモ</Label>
          <Textarea
            id="competitor_memo"
            value={form.competitor_memo}
            onChange={(e) => set('competitor_memo', e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* 備考 */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">備考</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : isEdit ? '更新する' : '作成する'}
        </Button>
      </div>
    </form>
  )
}
