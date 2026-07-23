'use client'

import Image from 'next/image'
import { useState, type ReactNode, type CSSProperties } from 'react'
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

type Props = {
  posterName: string
}

export default function PostProblemForm({ posterName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState(DOMAINS[0])
  const [problemType, setProblemType] = useState(PROBLEM_TYPES[0].value)
  const [rewardAmount, setRewardAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [judgingDeadline, setJudgingDeadline] = useState('')
  const [context, setContext] = useState('')
  const [problemStmt, setProblemStmt] = useState('')
  const [scope, setScope] = useState('')
  const [constraints, setConstraints] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [thumbnailInputKey, setThumbnailInputKey] = useState(0)

  const [teamMode, setTeamMode] = useState('solo')
  const [minTeamSize, setMinTeamSize] = useState('1')
  const [maxTeamSize, setMaxTeamSize] = useState('4')
  const [mentorRequired, setMentorRequired] = useState(false)
  const [maxMentorsPerTeam, setMaxMentorsPerTeam] = useState('1')

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setThumbnailFile(null)
      setThumbnailPreview('')
      return
    }

    const validationError = getProblemThumbnailError(file)
    if (validationError) {
      setError(validationError)
      setThumbnailFile(null)
      setThumbnailPreview('')
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
      setThumbnailPreview('')
      setThumbnailInputKey(prev => prev + 1)
    }
  }

  function clearThumbnail() {
    setThumbnailFile(null)
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

    let thumbnailUrl: string | null = null
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
      thumbnailUrl = typeof uploadData?.url === 'string' ? uploadData.url : null
    }

    const payload = {
      title: title.trim(),
      domain,
      problem_type: problemType,
      status: 'open',
      thumbnail_url: thumbnailUrl,
      reward_amount: problemType === 'industry_challenge' && rewardAmount ? Number(rewardAmount) : null,
      milestones: 1,
      deadline,
      judging_deadline: judgingDeadline,
      context: context.trim(),
      problem_stmt: problemStmt.trim(),
      scope: scope.trim(),
      constraints: constraints.trim(),
      deliverables: deliverables.trim(),
      team_mode: teamMode,
      min_team_size: Number(minTeamSize) || 1,
      max_team_size: Number(maxTeamSize) || 4,
      mentor_required: mentorRequired,
      max_mentors_per_team: Number(maxMentorsPerTeam) || 1,
    }

    const res = await fetch('/api/problems/create', {
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
      console.error('Problem submission failed:', message)
      setError(message)
      setLoading(false)
      return
    }

    const data = await res.json().catch(() => null)
    setSuccess(
      typeof data?.warning === 'string' && data.warning
        ? `${data.warning} Run the SQL in supabase/migrations/20260313_add_problem_thumbnail.sql to enable thumbnails.`
        : 'Problem posted successfully. You can track it from your dashboard.'
    )
    setShowPopup(true)
    setLoading(false)
    setTimeout(() => router.push('/poster/dashboard'), 1200)
  }

  return (
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
                {'// upload complete'}
              </div>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 26,
                color: '#1C1410',
                marginBottom: 10
              }}>
                Problem posted.
              </div>
              <p style={{ fontSize: 14, color: '#4A3F38', fontWeight: 300, marginBottom: 18 }}>
                Your problem is now live in the problems list. Redirecting to your dashboard.
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
            fontSize: 'clamp(30px, 6vw, 42px)',
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Post a problem
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            Give students enough context to build serious, structured solutions.
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
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Short, descriptive title"
              style={inputStyle}
            />
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
                Add a JPG, PNG, WebP, or GIF image up to 5 MB for the problem preview card.
              </div>
              {thumbnailPreview && (
                <div style={{
                  border: '1.5px solid rgba(28,20,16,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#FAF8F4'
                }}>
                  <div style={{ aspectRatio: '16 / 9', background: '#F3EEE7', position: 'relative' }}>
                    <Image
                      src={thumbnailPreview}
                      alt="Problem thumbnail preview"
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: 'cover', display: 'block' }}
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
                      {thumbnailFile?.name}
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

          <div style={{ marginBottom: 12 }}>
            <Field label="Participation Type">
              <select value={teamMode} onChange={e => setTeamMode(e.target.value)} style={inputStyle}>
                <option value="solo">Individual Only</option>
                <option value="team">Team Only</option>
                <option value="both">Both Individual & Team</option>
              </select>
            </Field>
            {teamMode !== 'solo' && (
              <div style={{ fontSize: 12, color: '#7A7068', marginTop: 6, lineHeight: 1.5 }}>
                For teams: The leader signs up first and receives a unique <strong>team invite code</strong>.
                Other members join by entering this code. Team size can be 2-10 members.
              </div>
            )}
          </div>

          {(teamMode === 'team' || teamMode === 'both') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <Field label="Min Team Size">
                <input type="number" min="2" max="10" value={minTeamSize} onChange={e => setMinTeamSize(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Max Team Size">
                <input type="number" min="2" max="10" value={maxTeamSize} onChange={e => setMaxTeamSize(e.target.value)} style={inputStyle} />
              </Field>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410' }}>
              <input type="checkbox" checked={mentorRequired} onChange={e => setMentorRequired(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2D6A4F' }} />
              Require Mentor Guidance for this Problem
            </label>

            {mentorRequired && (
              <Field label="Max Mentors Per Team">
                <input type="number" min="1" max="3" value={maxMentorsPerTeam} onChange={e => setMaxMentorsPerTeam(e.target.value)} style={inputStyle} />
              </Field>
            )}
          </div>

          {problemType === 'industry_challenge' && (
            <Field label="Reward amount (INR)">
              <input
                type="number"
                min="0"
                value={rewardAmount}
                onChange={e => setRewardAmount(e.target.value)}
                placeholder="50000"
                style={inputStyle}
              />
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Submission deadline">
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Judging deadline">
              <input
                type="date"
                value={judgingDeadline}
                onChange={e => setJudgingDeadline(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Background & context">
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              required
              rows={4}
              placeholder="Why this problem matters, who is affected, and what has been tried."
              style={textAreaStyle}
            />
          </Field>

          <Field label="Problem statement">
            <textarea
              value={problemStmt}
              onChange={e => setProblemStmt(e.target.value)}
              required
              rows={4}
              placeholder="Describe the exact problem to be solved."
              style={textAreaStyle}
            />
          </Field>

          <Field label="Scope">
            <textarea
              value={scope}
              onChange={e => setScope(e.target.value)}
              required
              rows={3}
              placeholder="What is in scope and what is out of scope?"
              style={textAreaStyle}
            />
          </Field>

          <Field label="Constraints">
            <textarea
              value={constraints}
              onChange={e => setConstraints(e.target.value)}
              required
              rows={3}
              placeholder="Budget, policy, infrastructure, or operational constraints."
              style={textAreaStyle}
            />
          </Field>

          <Field label="Deliverables">
            <textarea
              value={deliverables}
              onChange={e => setDeliverables(e.target.value)}
              required
              rows={3}
              placeholder="Expected outputs, format, or artifacts."
              style={textAreaStyle}
            />
          </Field>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 10 }}>
            <Link href="/poster/dashboard" style={{
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
              {loading ? (thumbnailFile ? 'Uploading image...' : 'Submitting...') : 'Submit for review'}
            </button>
          </div>
        </form>
      </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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
