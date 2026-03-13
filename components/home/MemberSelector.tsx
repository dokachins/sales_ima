'use client'

import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { User } from '@/types'

interface Props {
  allUsers: User[]
  currentUserId: string
  viewingUserId: string
}

export default function MemberSelector({ allUsers, currentUserId, viewingUserId }: Props) {
  const router = useRouter()

  return (
    <Select
      value={viewingUserId}
      onValueChange={(v) => {
        if (!v) return
        const target = v === currentUserId ? '/' : `/?member=${v}`
        router.push(target)
      }}
    >
      <SelectTrigger className="w-40 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allUsers.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.id === currentUserId ? `${u.name}（自分）` : u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
