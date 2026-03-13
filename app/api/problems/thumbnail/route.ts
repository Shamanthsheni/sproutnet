import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PROBLEM_THUMBNAIL_ALLOWED_TYPES,
  PROBLEM_THUMBNAIL_BUCKET,
  PROBLEM_THUMBNAIL_MAX_BYTES,
  getProblemThumbnailError,
  sanitizeProblemThumbnailFileName,
} from '@/lib/problem-thumbnail'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'poster' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing image file.' }, { status: 400 })
  }

  const validationError = getProblemThumbnailError(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 })
  }

  const admin = createAdminClient()

  await admin.storage.createBucket(PROBLEM_THUMBNAIL_BUCKET, {
    public: true,
    fileSizeLimit: PROBLEM_THUMBNAIL_MAX_BYTES,
    allowedMimeTypes: PROBLEM_THUMBNAIL_ALLOWED_TYPES,
  }).catch(() => null)

  const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeProblemThumbnailFileName(file.name)}`
  const fileBytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from(PROBLEM_THUMBNAIL_BUCKET)
    .upload(filePath, fileBytes, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data } = admin.storage
    .from(PROBLEM_THUMBNAIL_BUCKET)
    .getPublicUrl(filePath)

  return NextResponse.json({ url: data.publicUrl, path: filePath })
}
