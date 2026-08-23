import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Even if sign-out fails, clear auth cookies and send the user home.
  }

  const response = NextResponse.redirect(new URL('/', request.url), { status: 302 })

  // Best-effort cookie cleanup so no stale session remains.
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)/)?.[1]
  if (projectRef) {
    for (const name of [`sb-${projectRef}-auth-token`, `sb-${projectRef}-auth-token-code-verifier`]) {
      response.cookies.set(name, '', { maxAge: -1, path: '/' })
    }
  }

  return response
}
