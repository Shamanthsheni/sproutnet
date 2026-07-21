import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'blog-images'
const MAX_SIZE_MB = 10

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  // Validate type
  const accepted = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!accepted.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WEBP, GIF are accepted.' }, { status: 400 })
  }

  // Validate size
  const sizeMB = file.size / 1024 / 1024
  if (sizeMB > MAX_SIZE_MB) {
    return NextResponse.json({ error: `File exceeds ${MAX_SIZE_MB}MB limit.` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicData.publicUrl })
}
