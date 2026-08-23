import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    const result = verifyOtp(email, String(otp))
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password,
    })

    if (updateError) {
      console.error('[reset-password] update failed:', updateError)
      return NextResponse.json({ error: 'Could not update password. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
