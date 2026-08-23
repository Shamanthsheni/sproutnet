import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/mail'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const result = generateOtp(email)

    if (!result.ok) {
      return NextResponse.json(
        { error: `Please wait ${result.retryInSec}s before requesting another code.` },
        { status: 429 }
      )
    }

    // Don't reveal whether the account exists — always respond the same way.
    const admin = createAdminClient()
    const { data } = await admin.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
    if (!data) {
      return NextResponse.json({ success: true })
    }

    await sendOtpEmail(email.toLowerCase(), result.otp)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json(
      { error: 'Failed to send reset code. Please check SMTP configuration or try again later.' },
      { status: 500 }
    )
  }
}
