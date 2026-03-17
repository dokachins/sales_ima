'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { InteractionLog, User } from '@/types'
import { ACTION_TYPES } from '@/types'
import { todayStr } from '@/lib/utils/date'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  currentUser: User
  log?: InteractionLog   // 編集時に渡す
  onSuccess: () => void
}

export default function LogModal({
  open, onOpenChange, companyId, currentUser, log, onSuccess
}: Props) {
  const supabase = createClient()
  const isEdit = !!log
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    action_date:      log?.action_date ?? todayStr(),
    action_type:      log?.action_type ?? '訪問',
    content:          log?.content ?? '',
    next_action:      log?.next_action ?? '',
    next_action_date: log?.next_action_date ?? '',
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) {
      toast.error('内容を入力してください')
      return
    }

    setLoading(true)

    const payload = {
      action_date:      form.action_date,
      action_type:      form.action_type,
      content:          form.content,
      next_action:      form.next_action || null,
      next_action_date: form.next_action_date || null,
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('interaction_logs')
          .update({ ...payload, updated_by: currentUser.id })
          .eq('id', log!.id)

        if (error) throw error
        toast.success('折衝履歴を更新しました')
      } else {
        const { error } = await supabase
          .from('interaction_logs')
          .insert({ company_id: companyId, deal_id: null, ...payload, created_by: currentUser.id })

        if (error) throw error
        toast.success('折衝履歴を追加しました')
      }

      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value && !isEdit) {
      setForm({
        action_date:      todayStr(),
        action_type:      '訪問',
        content:          '',
        next_action:      '',
        next_action_date: '',
      })
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '折衝履歴を編集' : '折衝履歴を追加'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="action_date">日付 *</Label>
              <Input
                id="action_date"
                type="date"
                value={form.action_date}
                onChange={(e) => set('action_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>種別 *</Label>
              <Select value={form.action_type} onValueChange={(v) => set('action_type', v ?? '訪問')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">内容 *</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={4}
              placeholder="接触内容を記録してください"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next_action">次回アクション</Label>
            <Input
              id="next_action"
              value={form.next_action}
              onChange={(e) => set('next_action', e.target.value)}
              placeholder="例: 提案書を送付する"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next_action_date">次回予定日</Label>
            <Input
              id="next_action_date"
              type="date"
              value={form.next_action_date}
              onChange={(e) => set('next_action_date', e.target.value)}
            />
          </div>

          <div className="pt-1 text-xs text-gray-400">
            入力者: {currentUser.name}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : isEdit ? '更新する' : '追加する'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
