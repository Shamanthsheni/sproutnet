import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))

  if (error) {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)/)?.[1]
    if (projectRef) {
      response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: -1, path: '/' })
    }
  }

  return response
}