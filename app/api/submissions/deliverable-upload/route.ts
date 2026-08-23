import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DELIVERABLES_BUCKET,
  DELIVERABLE_MAX_BYTES,
  sanitizeDeliverableFileName,
} from '@/lib/deliverables'

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

  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  const problemId = formData?.get('problem_id')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 })
  }

  if (typeof problemId !== 'string' || !problemId.trim()) {
    return NextResponse.json({ error: 'Missing problem_id.' }, { status: 400 })
  }

  if (file.size > DELIVERABLE_MAX_BYTES) {
    return NextResponse.json({ error: 'Files must be 25 MB or smaller.' }, { status: 422 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('problem_id', problemId)
    .eq('student_id', user.id)
    .eq('status', 'active')
    .limit(1)

  if (!enrollment || enrollment.length === 0) {
    return NextResponse.json({ error: 'You must enroll before uploading deliverables.' }, { status: 403 })
  }

  await admin.storage.createBucket(DELIVERABLES_BUCKET, {
    public: true,
    fileSizeLimit: DELIVERABLE_MAX_BYTES,
  }).catch(() => null)

  // Relax restrictions in case the bucket pre-existed with tighter limits.
  await admin.storage.updateBucket(DELIVERABLES_BUCKET, {
    public: true,
    fileSizeLimit: DELIVERABLE_MAX_BYTES,
  }).catch(() => null)

  const filePath = `${user.id}/${problemId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeDeliverableFileName(file.name)}`
  const fileBytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from(DELIVERABLES_BUCKET)
    .upload(filePath, fileBytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data } = admin.storage
    .from(DELIVERABLES_BUCKET)
    .getPublicUrl(filePath)

  return NextResponse.json({
    name: file.name,
    path: filePath,
    url: data.publicUrl,
  })
}
