import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type BlogUserSummary } from '@/lib/blogs'
import BlogEditor from '@/app/blogs/editor/blog-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New Post | SproutNet',
  description: 'Write and publish a new blog post on SproutNet.',
}

export default async function NewBlogPostPage() {
  let viewer: BlogUserSummary | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, role, dept, year')
        .eq('id', user.id)
        .single()

      if (profile) viewer = profile as BlogUserSummary
    }
  } catch {}

  if (!viewer) {
    redirect('/login')
  }

  return <BlogEditor viewer={viewer} />
}
