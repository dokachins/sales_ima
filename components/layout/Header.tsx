'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@/types'
import { toast } from 'sonner'

interface HeaderProps {
  user: User
}

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function Header({ user: initialUser }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [profileOpen, setProfileOpen] = useState(false)
  const [name, setName] = useState(initialUser.name)
  const [saving, setSaving] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('ログアウトに失敗しました')
      return
    }
    router.push('/login')
    router.refresh()
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('名前を入力してください'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)
    if (error) {
      toast.error('更新に失敗しました')
    } else {
      setUser((u) => ({ ...u, name: name.trim() }))
      toast.success('名前を更新しました')
      setProfileOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      {/* モバイル用ボトムナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <span className="text-lg leading-none">🏠</span>
          <span className="text-xs">ホーム</span>
        </Link>
        <Link
          href="/prospects"
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <span className="text-lg leading-none">📋</span>
          <span className="text-xs">見込み先</span>
        </Link>
      </nav>

      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-gray-900 [font-family:var(--font-space-grotesk)]"
          >
            Scout
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              ホーム
            </Link>
            <Link
              href="/prospects"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              見込み先
            </Link>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                {user.name.charAt(0)}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                {user.role === 'admin' && (
                  <p className="text-xs text-blue-600 mt-0.5">管理者</p>
                )}
              </div>
              <DropdownMenuSeparator />
              {!isDemoMode && (
                <>
                  <DropdownMenuItem onClick={() => { setName(user.name); setProfileOpen(true) }} className="cursor-pointer">
                    プロフィール編集
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings/members')} className="cursor-pointer">
                    メンバー管理
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>プロフィール編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">メールアドレス</Label>
              <Input id="profile-email" value={user.email} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">表示名 *</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '保存中...' : '保存する'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
