import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? '/'

  const email = process.env.DEMO_USER_EMAIL
  const password = process.env.DEMO_USER_PASSWORD

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
