'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Company, User } from '@/types'

interface Props {
  company?: Company
  users: User[]
  currentUser: User
  onSuccess?: (company: Company) => void
}

export default function CompanyForm({ company, users, currentUser, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!company

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_name:          company?.company_name ?? '',
    main_contact_user_id:  company?.main_contact_user_id ?? currentUser.id ?? '__none__',
    notes:                 company?.notes ?? '',
  })

  function set(key: string, value: string) {
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
      company_name:         form.company_name,
      main_contact_user_id: (form.main_contact_user_id && form.main_contact_user_id !== '__none__') ? form.main_contact_user_id : null,
      notes:                form.notes || null,
    }

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('companies')
          .update(payload)
          .eq('id', company!.id)
          .select()
          .single()
        if (error) throw error
        toast.success('会社情報を更新しました')
        onSuccess?.(data as Company)
      } else {
        const { data, error } = await supabase
          .from('companies')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        toast.success('会社を登録しました')
        router.push(`/companies/${data.id}`)
        router.refresh()
      }
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="company_name">会社名 *</Label>
        <Input
          id="company_name"
          value={form.company_name}
          onChange={(e) => set('company_name', e.target.value)}
          placeholder="例: 株式会社〇〇"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>主担当営業</Label>
        <Select
          value={form.main_contact_user_id}
          onValueChange={(v) => set('main_contact_user_id', v ?? '')}
        >
          <SelectTrigger>
            <SelectValue placeholder="担当者を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">未設定</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">備考</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="会社に関するメモ"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </Button>
      </div>
    </form>
  )
}
