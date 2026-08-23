import { createHash, randomInt } from 'crypto'

const OTP_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

type OtpEntry = {
  hash: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

// In-memory store — fine for a single self-hosted Next.js server.
// Codes are hashed so they can't be read even if memory is inspected.
const store = new Map<string, OtpEntry>()

function hashCode(email: string, otp: string) {
  return createHash('sha256').update(`${email.toLowerCase()}::${otp}`).digest('hex')
}

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key)
  }
}

export function generateOtp(email: string): { ok: true; otp: string } | { ok: false; retryInSec: number } {
  cleanup()
  const key = email.toLowerCase()
  const existing = store.get(key)

  if (existing && existing.lastSentAt + RESEND_COOLDOWN_MS > Date.now()) {
    const retryInSec = Math.ceil((existing.lastSentAt + RESEND_COOLDOWN_MS - Date.now()) / 1000)
    return { ok: false, retryInSec }
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0')
  store.set(key, {
    hash: hashCode(key, otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
  })
  return { ok: true, otp }
}

export function verifyOtp(email: string, otp: string): { ok: true } | { ok: false; error: string } {
  cleanup()
  const key = email.toLowerCase()
  const entry = store.get(key)

  if (!entry) return { ok: false, error: 'No reset code requested. Please request a new one.' }
  if (entry.expiresAt < Date.now()) {
    store.delete(key)
    return { ok: false, error: 'Code expired. Please request a new one.' }
  }

  entry.attempts += 1
  if (entry.attempts > MAX_ATTEMPTS) {
    store.delete(key)
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' }
  }

  if (entry.hash !== hashCode(key, otp)) {
    return { ok: false, error: `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` }
  }

  store.delete(key)
  return { ok: true }
}
