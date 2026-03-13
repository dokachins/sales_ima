'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { User } from '@/types'

interface Props {
  companyId: string
  members: User[]
  allUsers: User[]
  ownerId: string
  currentUserId: string
  isAdmin: boolean
  onUpdate: () => void
}

export default function ProspectMembers({
  companyId, members, allUsers, ownerId, currentUserId, isAdmin, onUpdate
}: Props) {
  const supabase = createClient()
  const [adding, setAdding] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  const memberIds = new Set(members.map((m) => m.id))
  const canManage = isAdmin || currentUserId === ownerId

  const addableUsers = allUsers.filter(
    (u) => u.id !== ownerId && !memberIds.has(u.id)
  )

  async function addMember() {
    if (!selectedUserId) return
    const { error } = await supabase
      .from('company_members')
      .insert({ company_id: companyId, user_id: selectedUserId })
    if (error) { toast.error('追加に失敗しました'); return }
    toast.success('関係者を追加しました')
    setSelectedUserId('')
    setAdding(false)
    onUpdate()
  }

  async function removeMember(userId: string) {
    const { error } = await supabase
      .from('company_members')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', userId)
    if (error) { toast.error('削除に失敗しました'); return }
    toast.success('関係者を削除しました')
    onUpdate()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
          >
            {m.name}
            {canManage && (
              <button
                onClick={() => removeMember(m.id)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 leading-none"
                title="削除"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {members.length === 0 && (
          <span className="text-xs text-gray-400">関係者営業なし</span>
        )}
      </div>

      {canManage && (
        adding ? (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? '')}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="担当者を選択" />
              </SelectTrigger>
              <SelectContent>
                {addableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs px-3" onClick={addMember} disabled={!selectedUserId}>
              追加
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setAdding(false); setSelectedUserId('') }}>
              キャンセル
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-blue-500 hover:underline"
          >
            + 関係者を追加
          </button>
        )
      )}
    </div>
  )
}
