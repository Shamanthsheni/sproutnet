'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  DELIVERABLE_MAX_BYTES,
  MAX_DELIVERABLES,
  isValidHttpUrl,
  parseDeliverables,
  type DeliverableItem,
} from '@/lib/deliverables'

type Problem = { id: string; title: string; domain: string | null; team_mode?: string | null }
type User = { id: string; name: string; dept: string; year: string }

export default function FinalUploadPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [score, setScore] = useState<number | null>(null)
  const [judgeFeedback, setJudgeFeedback] = useState<string | null>(null)
  const [participantType, setParticipantType] = useState<'team' | 'individual'>('individual')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('id, name, dept, year, role')
        .eq('id', authUser.id)
        .single()

      if (!profile || profile.role !== 'student') {
        router.push('/dashboard')
        return
      }
      setUser(profile)

      const { data: sub } = await supabase
        .from('submissions')
        .select('id, status, score, judge_feedback, participant_type, final_deliverables')
        .eq('problem_id', problemId)
        .eq('student_id', authUser.id)
        .limit(1)

      const row = sub?.[0]
      if (!row || row.status !== 'approved') {
        router.push(`/problems/${problemId}`)
        return
      }

      setSubmissionId(row.id)
      setScore(row.score ?? null)
      setJudgeFeedback(row.judge_feedback ?? null)
      if (row.participant_type === 'team' || row.participant_type === 'individual') {
        setParticipantType(row.participant_type)
      }
      setDeliverables(parseDeliverables(row.final_deliverables))

      const { data: prob } = await supabase
        .from('problems')
        .select('id, title, domain, team_mode')
        .eq('id', problemId)
        .single()
      setProblem(prob)

      setLoading(false)
    }
    load()
  }, [problemId, router])

  const addDeliverableLink = useCallback(() => {
    if (deliverables.length >= MAX_DELIVERABLES) {
      setError(`You can add up to ${MAX_DELIVERABLES} deliverables.`)
      return
    }
    const label = newLinkLabel.trim()
    const url = newLinkUrl.trim()
    if (!label || !url) {
      setError('Enter a label and the link URL.')
      return
    }
    if (!isValidHttpUrl(url)) {
      setError('Links must start with http:// or https://')
      return
    }
    setDeliverables(prev => [...prev, { kind: 'link', label, url }])
    setNewLinkLabel('')
    setNewLinkUrl('')
    setError('')
  }, [deliverables.length, newLinkLabel, newLinkUrl])

  async function handleDeliverableUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (deliverables.length >= MAX_DELIVERABLES) {
      setError(`You can add up to ${MAX_DELIVERABLES} deliverables.`)
      e.target.value = ''
      return
    }
    if (file.size > DELIVERABLE_MAX_BYTES) {
      setError('Files must be 25 MB or smaller.')
      e.target.value = ''
      return
    }

    setUploadingDeliverable(true)
    setError('')

    const formData = new FormData()
    formData.append('problem_id', problemId)
    formData.append('file', file)

    const res = await fetch('/api/submissions/deliverable-upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `File upload failed (${res.status}).`
      try {
        message = JSON.parse(text)?.error ?? message
      } catch { /* keep default */ }
      setError(message)
      setUploadingDeliverable(false)
      e.target.value = ''
      return
    }

    const data = await res.json()
    if (typeof data?.url === 'string') {
      setDeliverables(prev => [
        ...prev,
        { kind: 'file', label: String(data.name ?? file.name), url: data.url, name: String(data.name ?? file.name) },
      ])
    }

    setUploadingDeliverable(false)
    e.target.value = ''
  }

  function removeDeliverable(index: number) {
    setDeliverables(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!submissionId) return
    setSaving(true)
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ final_deliverables: deliverables, participant_type: participantType })
      .eq('id', submissionId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CA3A0' }}>Loading final upload stage...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(28px, 5vw, 44px) clamp(16px, 4vw, 24px)' }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.08)',
        borderRadius: 18,
        padding: '28px 30px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(28,20,16,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
            color: '#FAF8F4', background: '#2D6A4F', padding: '4px 10px', borderRadius: 6
          }}>
            STAGE 2 · FINAL WORK
          </span>
          {problem?.domain && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: '#6A5F58', background: '#F2EEE8', padding: '4px 10px', borderRadius: 6
            }}>
              {problem.domain}
            </span>
          )}
        </div>

        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 400,
          color: '#1C1410', letterSpacing: '-0.3px',
          lineHeight: 1.25, marginBottom: 10
        }}>
          {problem?.title}
        </h1>

        {/* Approval banner */}
        <div style={{
          background: '#EAF4EE', border: '1.5px solid rgba(45,106,79,0.25)',
          borderRadius: 12, padding: '14px 18px', marginTop: 8
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Your solution was approved{score != null ? ` · Score ${score}/10` : ''}
          </div>
          {judgeFeedback && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', margin: '6px 0 0' }}>
              Judge feedback: {judgeFeedback}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FCA5A5',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#991B1B'
        }}>
          {error}
        </div>
      )}

      {/* Upload card */}
      <div style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.08)',
        borderRadius: 18,
        padding: '24px clamp(18px, 3vw, 30px)',
        marginBottom: 24
      }}>
        <h2 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 22, fontWeight: 400, color: '#1C1410',
          letterSpacing: '-0.2px', margin: '0 0 6px'
        }}>
          Upload what you have built
        </h2>
        <p style={{ fontSize: 13, color: '#6A5F58', margin: '0 0 18px', lineHeight: 1.6 }}>
          Add up to {MAX_DELIVERABLES} items — research paper, APK/app build, live app link, GitHub repository, demo video, or any other file (max 25 MB each).
        </p>

        {/* Entry type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1C1410' }}>
            This entry is by
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(problem?.team_mode === 'team'
              ? ['team']
              : problem?.team_mode === 'solo'
                ? ['individual']
                : ['individual', 'team']
            ).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setParticipantType(option as 'team' | 'individual')}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: participantType === option ? 700 : 500,
                  color: participantType === option ? '#FAF8F4' : '#1C1410',
                  background: participantType === option ? '#2D6A4F' : '#fff',
                  border: `1.5px solid ${participantType === option ? '#2D6A4F' : 'rgba(28,20,16,0.14)'}`,
                  borderRadius: 999,
                  padding: '8px 18px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {option === 'team' ? '👥 Team' : '🙋 Individual'}
              </button>
            ))}
          </div>
        </div>

        {/* Link input */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(200px, 1.4fr) auto', gap: 10, alignItems: 'end', flexWrap: 'wrap', marginBottom: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#4A3F38' }}>Label</span>
            <input
              type="text"
              value={newLinkLabel}
              onChange={e => setNewLinkLabel(e.target.value)}
              placeholder="Research paper / GitHub / Live app…"
              maxLength={80}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#4A3F38' }}>URL</span>
            <input
              type="url"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://…"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <button
            type="button"
            onClick={addDeliverableLink}
            disabled={deliverables.length >= MAX_DELIVERABLES}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
              color: deliverables.length >= MAX_DELIVERABLES ? '#9CA3A0' : '#FAF8F4',
              background: deliverables.length >= MAX_DELIVERABLES ? '#EAE5DC' : '#2D6A4F',
              border: 'none', borderRadius: 8, padding: '12px 18px',
              cursor: deliverables.length >= MAX_DELIVERABLES ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + Add link
          </button>
        </div>

        {/* File upload */}
        <input
          type="file"
          onChange={handleDeliverableUpload}
          disabled={uploadingDeliverable || deliverables.length >= MAX_DELIVERABLES}
          style={{
            width: '100%',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: deliverables.length >= MAX_DELIVERABLES ? '#9CA3A0' : '#1C1410',
            background: deliverables.length >= MAX_DELIVERABLES ? '#F3F0E8' : '#FAF8F4',
            border: `1.5px dashed ${deliverables.length >= MAX_DELIVERABLES ? 'rgba(28,20,16,0.15)' : 'rgba(45,106,79,0.35)'}`,
            borderRadius: 10,
            padding: '13px 16px',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: uploadingDeliverable || deliverables.length >= MAX_DELIVERABLES ? 'not-allowed' : 'pointer'
          }}
        />
        <div style={{ fontSize: 12, color: '#6A5F58', marginTop: 8, fontWeight: 500 }}>
          {uploadingDeliverable ? 'Uploading file...' : `${deliverables.length} of ${MAX_DELIVERABLES} items added · any file type, up to 25 MB`}
        </div>

        {deliverables.length > 0 && (
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {deliverables.map((item, index) => (
              <div key={`${item.url}-${index}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '11px 16px',
                background: '#FAF8F4',
                borderRadius: 10,
                border: '1px solid rgba(45,106,79,0.18)',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.kind === 'link'
                      ? <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>
                      : <><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>}
                  </svg>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#1C1410', whiteSpace: 'nowrap' }}>
                    {index + 1}.
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#2D6A4F', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </a>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9CA3A0' }}>
                    {item.kind === 'link' ? 'LINK' : 'FILE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDeliverable(index)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                    color: '#DC2626', background: '#fff',
                    border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6,
                    padding: '5px 12px', cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save bar */}
      <div style={{
        position: 'sticky',
        bottom: 'clamp(10px, 2vw, 20px)',
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.1)',
        borderRadius: 16,
        padding: '14px clamp(14px, 3vw, 24px)',
        boxShadow: '0 10px 30px rgba(28,20,16,0.08)',
        zIndex: 90,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: 10
      }}>
        <div style={{ fontSize: 13, color: saved ? '#2D6A4F' : '#6A5F58', fontWeight: saved ? 600 : 400 }}>
          {saved ? '✓ Final work saved.' : `${deliverables.length} item${deliverables.length === 1 ? '' : 's'} ready.`}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={`/problems/${problemId}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#4A3F38', textDecoration: 'none', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 16px' }}>
            Back to problem
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410',
              background: saving ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8,
              padding: '12px 22px', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
            }}
          >
            {saving ? 'Saving...' : 'Save final work'}
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0' }}>
        Builder: {user?.name} {user?.dept ? `(${user.dept} · ${user.year})` : ''} · Signed in as {user ? 'Student' : ''}
      </p>
    </div>
  )
}
