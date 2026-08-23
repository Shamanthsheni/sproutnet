import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicRoutes = [
    '/',
    '/login',
    '/login/student',
    '/login/poster',
    '/login/mentor',
    '/login/admin',
    '/join',
    '/forgot-password',
    '/problems',
    '/blogs',
    '/leaderboard',
    '/impact',
    '/how-it-works',
    '/about',
    '/mentors',
    '/profile',
  ]
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || (pathname.startsWith('/problems/') && !pathname.endsWith('/submit'))
  )
    || (pathname.startsWith('/blogs/') && !pathname.startsWith('/blogs/manage'))
    || pathname.startsWith('/profile/')
    || pathname.startsWith('/admin/') || pathname === '/admin'

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_master')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (pathname.startsWith('/problems/') && pathname.endsWith('/submit')) {
      if (role !== 'student') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    if (pathname === '/post-problem') {
      if (role !== 'poster' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    if (pathname === '/mentor' || pathname.startsWith('/mentor/')) {
      if (role !== 'mentor' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
