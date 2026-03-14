'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  PROBLEM_THUMBNAIL_ACCEPT,
  getProblemThumbnailError,
} from '@/lib/problem-thumbnail'

const DOMAINS = [
  'AI & Data',
  'Climate',
  'Public Infrastructure',
  'Healthcare',
  'Agriculture',
  'Education',
  'Urban Mobility',
  'Civic Technology',
]

const PROBLEM_TYPES = [
  { value: 'public_impact', label: 'Public Impact' },
  { value: 'industry_challenge', label: 'Industry Challenge' },
]

type Problem = {
  id: string
  title: string
  domain: string
  problem_type: string
  thumbnail_url: string | null
  reward_amount: number | null
  milestones: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  status: string
}

export default function EditProblemForm({ posterName, problem }: { posterName: string; problem: Problem }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  const [title, setTitle] = useState(problem.title)
  const [domain, setDomain] = useState(problem.domain)
  const [problemType, setProblemType] = useState(problem.problem_type)
  const [rewardAmount, setRewardAmount] = useState(problem.reward_amount ? String(problem.reward_amount) : '')
  const [milestones, setMilestones] = useState(String(problem.milestones))
  const [deadline, setDeadline] = useState(problem.deadline)
  const [judgingDeadline, setJudgingDeadline] = useState(problem.judging_deadline)
  const [context, setContext] = useState(problem.context)
  const [problemStmt, setProblemStmt] = useState(problem.problem_stmt)
  const [scope, setScope] = useState(problem.scope)
  const [constraints, setConstraints] = useState(problem.constraints)
  const [deliverables, setDeliverables] = useState(problem.deliverables)
  const [thumbnailUrl, setThumbnailUrl] = useState(problem.thumbnail_url ?? '')
  const [thumbnailPreview, setThumbnailPreview] = useState(problem.thumbnail_url ?? '')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailInputKey, setThumbnailInputKey] = useState(0)

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setThumbnailFile(null)
      setThumbnailPreview(thumbnailUrl)
      return
    }

    const validationError = getProblemThumbnailError(file)
    if (validationError) {
      setError(validationError)
      setThumbnailFile(null)
      setThumbnailPreview(thumbnailUrl)
      setThumbnailInputKey(prev => prev + 1)
      e.target.value = ''
      return
    }

    try {
      const preview = await readFileAsDataUrl(file)
      setError('')
      setThumbnailFile(file)
      setThumbnailPreview(preview)
    } catch {
      setError('Could not read the selected image. Please try another file.')
      setThumbnailFile(null)
      setThumbnailPreview(thumbnailUrl)
      setThumbnailInputKey(prev => prev + 1)
    }
  }

  function clearThumbnail() {
    setThumbnailFile(null)
    setThumbnailUrl('')
    setThumbnailPreview('')
    setThumbnailInputKey(prev => prev + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (judgingDeadline && deadline && judgingDeadline < deadline) {
      setError('Judging deadline must be on or after the submission deadline.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login/poster')
      return
    }

    let nextThumbnailUrl = thumbnailUrl.trim() || null
    if (thumbnailFile) {
      const formData = new FormData()
      formData.append('file', thumbnailFile)

      const uploadRes = await fetch('/api/problems/thumbnail', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => '')
        let message = `Thumbnail upload failed (${uploadRes.status}).`
        if (text) {
          try {
            const data = JSON.parse(text)
            message = data?.error ?? message
          } catch {
            message = text
          }
        }
        setError(message)
        setLoading(false)
        return
      }

      const uploadData = await uploadRes.json()
      nextThumbnailUrl = typeof uploadData?.url === 'string' ? uploadData.url : null
    }

    const payload = {
      id: problem.id,
      title: title.trim(),
      domain,
      problem_type: problemType,
      thumbnail_url: nextThumbnailUrl,
      reward_amount: problemType === 'industry_challenge' && rewardAmount ? Number(rewardAmount) : null,
      milestones: Number(milestones),
      deadline,
      judging_deadline: judgingDeadline,
      context: context.trim(),
      problem_stmt: problemStmt.trim(),
      scope: scope.trim(),
      constraints: constraints.trim(),
      deliverables: deliverables.trim(),
    }

    const res = await fetch('/api/problems/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `Request failed (${res.status}).`
      if (text) {
        try {
          const data = JSON.parse(text)
          message = data?.error ?? message
        } catch {
          message = text
        }
      }
      if (message.includes('min_deadline')) {
        message = 'Submission deadline is too soon. Please choose a later date.'
      }
      setError(message)
      setLoading(false)
      return
    }

    const data = await res.json().catch(() => null)
    setSuccess(
      typeof data?.warning === 'string' && data.warning
        ? `${data.warning} Run the SQL in supabase/migrations/20260313_add_problem_thumbnail.sql to enable thumbnails.`
        : 'Problem updated.'
    )
    setShowPopup(true)
    setLoading(false)
    setTimeout(() => router.push('/poster/problems'), 800)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{
        minHeight: 66,
        height: 'auto',
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 10,
        columnGap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/poster/problems" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#2D6A4F',
            background: '#EAF4EE',
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Poster
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38' }}>{posterName}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        {showPopup && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,20,16,0.35)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              width: 'min(420px, 92vw)',
              background: '#fff',
              borderRadius: 16,
              padding: '28px 26px',
              border: '1.5px solid rgba(28,20,16,0.08)',
              boxShadow: '0 20px 60px rgba(28,20,16,0.2)'
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#2D6A4F',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 10
              }}>
                {'// updated'}
              </div>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 26,
                color: '#1C1410',
                marginBottom: 10
              }}>
                Problem updated.
              </div>
              <p style={{ fontSize: 14, color: '#4A3F38', fontWeight: 300, marginBottom: 18 }}>
                Your changes are saved. Redirecting to your problems.
              </p>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#F4A723',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
                }}
              >
                Okay
              </button>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 38px)',
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Edit problem
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            Update the problem details for students.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#fff',
          border: '1.5px solid rgba(28,20,16,0.07)',
          borderRadius: 14,
          padding: 'clamp(22px, 3vw, 32px)',
          display: 'grid',
          gap: 18
        }}>
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#16A34A' }}>
              {success}
            </div>
          )}

          <Field label="Problem title">
            <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
          </Field>

          <Field label="Thumbnail image (optional)">
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                key={thumbnailInputKey}
                type="file"
                accept={PROBLEM_THUMBNAIL_ACCEPT}
                onChange={handleThumbnailChange}
                style={inputStyle}
              />
              <div style={{ fontSize: 12, color: '#6A5F58' }}>
                Add or replace the image shown on the public problem preview card.
              </div>
              {thumbnailPreview && (
                <div style={{
                  border: '1.5px solid rgba(28,20,16,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#FAF8F4'
                }}>
                  <div style={{ aspectRatio: '16 / 9', background: '#F3EEE7' }}>
                    <img
                      src={thumbnailPreview}
                      alt="Problem thumbnail preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: 12, color: '#4A3F38' }}>
                      {thumbnailFile?.name ?? 'Current thumbnail'}
                    </span>
                    <button
                      type="button"
                      onClick={clearThumbnail}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#1C1410',
                        background: '#fff',
                        border: '1px solid rgba(28,20,16,0.12)',
                        borderRadius: 999,
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Domain">
              <select value={domain} onChange={e => setDomain(e.target.value)} style={inputStyle}>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Problem type">
              <select value={problemType} onChange={e => setProblemType(e.target.value)} style={inputStyle}>
                {PROBLEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>

          {problemType === 'industry_challenge' && (
            <Field label="Reward amount (INR)">
              <input type="number" min="0" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} style={inputStyle} />
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Milestones">
              <input type="number" min="1" max="7" value={milestones} onChange={e => setMilestones(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Submission deadline">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="Judging deadline">
              <input type="date" value={judgingDeadline} onChange={e => setJudgingDeadline(e.target.value)} required style={inputStyle} />
            </Field>
          </div>

          <Field label="Background & context">
            <textarea value={context} onChange={e => setContext(e.target.value)} required rows={4} style={textAreaStyle} />
          </Field>

          <Field label="Problem statement">
            <textarea value={problemStmt} onChange={e => setProblemStmt(e.target.value)} required rows={4} style={textAreaStyle} />
          </Field>

          <Field label="Scope">
            <textarea value={scope} onChange={e => setScope(e.target.value)} required rows={3} style={textAreaStyle} />
          </Field>

          <Field label="Constraints">
            <textarea value={constraints} onChange={e => setConstraints(e.target.value)} required rows={3} style={textAreaStyle} />
          </Field>

          <Field label="Deliverables">
            <textarea value={deliverables} onChange={e => setDeliverables(e.target.value)} required rows={3} style={textAreaStyle} />
          </Field>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 10 }}>
            <Link href="/poster/problems" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#4A3F38',
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: 8,
              border: '1px solid rgba(28,20,16,0.12)'
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={loading} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: '#1C1410',
              background: loading ? '#F9C05A' : '#F4A723',
              border: 'none',
              borderRadius: 8,
              padding: '12px 22px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
            }}>
              {loading ? (thumbnailFile ? 'Uploading image...' : 'Saving...') : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: '#1C1410',
  background: '#FAF8F4',
  border: '1.5px solid rgba(28,20,16,0.12)',
  borderRadius: 8,
  padding: '11px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}
