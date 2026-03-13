'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { User } from '@/types'

interface Props {
  dealId: string
  members: User[]
  allUsers: User[]
  ownerId: string
  currentUserId: string
  isAdmin: boolean
  onUpdate: () => void
}

export default function DealMembers({
  dealId, members, allUsers, ownerId, currentUserId, isAdmin, onUpdate
}: Props) {
  const [adding, setAdding] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const supabase = createClient()

  const canEdit = isAdmin || currentUserId === ownerId
  const memberIds = new Set(members.map((m) => m.id))
  const available = allUsers.filter((u) => !memberIds.has(u.id) && u.id !== ownerId)

  async function addMember() {
    if (!selectedUserId) return
    const { error } = await supabase
      .from('deal_members')
      .insert({ deal_id: dealId, user_id: selectedUserId })

    if (error) {
      toast.error('追加に失敗しました')
      return
    }
    toast.success('関係者を追加しました')
    setSelectedUserId('')
    setAdding(false)
    onUpdate()
  }

  async function removeMember(userId: string) {
    const { error } = await supabase
      .from('deal_members')
      .delete()
      .match({ deal_id: dealId, user_id: userId })

    if (error) {
      toast.error('削除に失敗しました')
      return
    }
    toast.success('関係者を削除しました')
    onUpdate()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {members.length === 0 && (
          <p className="text-sm text-gray-400">関係者なし</p>
        )}
        {members.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1.5 text-sm bg-gray-100 px-2.5 py-1 rounded-full"
          >
            {m.name}
            {canEdit && (
              <button
                onClick={() => removeMember(m.id)}
                className="text-gray-400 hover:text-red-500 text-xs leading-none"
                title="削除"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {canEdit && (
        <div>
          {adding ? (
            <div className="flex gap-2 items-center">
              <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? '')}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="メンバーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={addMember} disabled={!selectedUserId}>
                追加
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                キャンセル
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdding(true)}
              disabled={available.length === 0}
            >
              + 関係者を追加
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
