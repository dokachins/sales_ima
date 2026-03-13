'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleDemoLogin() {
    setDemoLoading(true)
    router.push('/api/demo-auth')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        {isDemoMode && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              className="w-full text-gray-500"
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading ? '読み込み中...' : 'ログインしないで見る（サンプル）'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
