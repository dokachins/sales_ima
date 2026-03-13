'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteUser, updateUserRole } from '@/app/(dashboard)/settings/members/actions'
import type { User } from '@/types'
import { toast } from 'sonner'

interface Props {
  users: User[]
  currentUser: User
}

export default function MembersClient({ users, currentUser }: Props) {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const isAdmin = currentUser.role === 'admin'

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    startTransition(async () => {
      try {
        await inviteUser(email.trim())
        setEmail('')
        toast.success('招待メールを送信しました')
      } catch (err: unknown) {
        toast.error((err as Error).message ?? '招待に失敗しました')
      }
    })
  }

  function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast.success('ロールを変更しました')
      } catch (err: unknown) {
        toast.error((err as Error).message ?? '変更に失敗しました')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* 招待フォーム */}
      {isAdmin && (
        <section className="section-card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">メンバーを招待</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs h-9 text-sm"
              required
            />
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? '送信中...' : '招待メールを送る'}
            </Button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            招待メールが届いた方は、メール内のリンクからパスワードを設定してログインできます。
          </p>
        </section>
      )}

      {/* メンバー一覧 */}
      <section className="section-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs tracking-wide">名前</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs tracking-wide">メールアドレス</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs tracking-wide w-24">ロール</th>
              {isAdmin && <th className="px-4 py-3 w-32" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/40">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.name}
                  {u.id === currentUser.id && (
                    <span className="ml-1.5 text-xs text-gray-400 font-normal">（自分）</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.role === 'admin' ? '管理者' : 'メンバー'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        disabled={isPending}
                        onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'member' : 'admin')}
                      >
                        {u.role === 'admin' ? 'メンバーに変更' : '管理者に変更'}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
