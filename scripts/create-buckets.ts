import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env.local') })

import { createAdminClient } from '../lib/supabase/admin'

const BUCKETS = [
  { id: 'blog-images', options: { public: true, fileSizeLimit: 10485760 } },
  { id: 'message-attachments', options: { public: true, fileSizeLimit: 15728640 } },
  { id: 'mentor-avatars', options: { public: true, fileSizeLimit: 5242880 } },
  { id: 'problem-thumbnails', options: { public: true, fileSizeLimit: 5242880 } }
]

async function main() {
  const admin = createAdminClient()
  console.log('Connecting to Supabase to initialize storage buckets...')

  for (const bucket of BUCKETS) {
    try {
      const { data, error } = await admin.storage.createBucket(bucket.id, bucket.options)
      if (error) {
        if (error.message.toLowerCase().includes('already exists')) {
          console.log(`  ✓ Bucket "${bucket.id}" already exists`)
        } else {
          console.error(`  ✗ Failed to create bucket "${bucket.id}":`, error.message)
        }
      } else {
        console.log(`  ✓ Created bucket "${bucket.id}"`)
      }
    } catch (err: any) {
      console.error(`  ✗ Error creating bucket "${bucket.id}":`, err.message)
    }
  }

  console.log('Storage initialization complete.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
