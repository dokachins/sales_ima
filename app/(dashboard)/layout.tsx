import { redirect } from 'next/navigation'
import { getAuthUser, getCurrentProfile } from '@/lib/supabase/cached'
import Header from '@/components/layout/Header'
import type { User } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const profile = await getCurrentProfile(authUser.id)
  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={profile as User} />
      <main className="max-w-7xl mx-auto px-4 py-4 pb-20 md:pb-4">
        {children}
      </main>
    </div>
  )
}
