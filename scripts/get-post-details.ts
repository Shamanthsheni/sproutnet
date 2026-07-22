import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env.local') })

import { createAdminClient } from '../lib/supabase/admin'

async function main() {
  const admin = createAdminClient()
  const postId = 'e52a3866-e753-4a9d-a275-b919f4e823c0'

  const { data: post, error } = await admin
    .from('blog_posts')
    .select('*, author:author_id(id, name, role)')
    .eq('id', postId)
    .single()

  if (error) {
    console.error('Error fetching post:', error.message)
    return
  }

  console.log('Post details:', JSON.stringify(post, null, 2))
}

main().catch(err => {
  console.error(err)
})
