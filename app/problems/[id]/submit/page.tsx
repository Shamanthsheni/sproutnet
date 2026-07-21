'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  PROBLEM_PROGRESS_ACCEPT,
  getProblemProgressUploadError,
  parseProgressUploads,
  serializeProgressUploads,
  type ProgressUploadItem,
} from '@/lib/problem-progress'

type Problem = {
  id: string
  title: string
  domain: string
  deadline: string
}

type User = {
  id: string
  name: string
  dept: string
  year: string
}

type ExistingSubmission = {
  id: string
  stage: string
  milestone: number
  f_understanding: string
  f_solution: string
  f_impact: string
  f_rootcause: string | null
  f_feasibility: string | null
  f_risks: string | null
  f_implementation: string | null
  status: string
  ai_feedback: string | null
}

const ALL_FIELDS = [
  { key: 'f_understanding', label: 'Problem Understanding', placeholder: 'In your own words, what is the core problem? Who does it affect and how? What evidence do you have that this is real?', hint: 'Be specific. Avoid restating the problem brief — show you understand it.' },
  { key: 'f_solution', label: 'Proposed Solution', placeholder: 'What is your solution? Describe it clearly enough that someone unfamiliar could understand it in 2 minutes.', hint: 'Focus on the core idea first, not implementation details.' },
  { key: 'f_impact', label: 'Expected Impact', placeholder: 'If your solution works, what changes? Who benefits? By how much? Can you quantify the impact?', hint: 'Use numbers where possible. "Reduces X by Y%" is stronger than "improves X".' },
  { key: 'f_rootcause', label: 'Root Cause Analysis', placeholder: 'Why does this problem exist? What are the underlying causes — not just symptoms? Use a 5-Why or fishbone approach if helpful.', hint: 'Surface-level causes lead to surface-level solutions. Go deeper.' },
  { key: 'f_feasibility', label: 'Feasibility Assessment', placeholder: 'Is your solution technically, economically, and socially feasible? What resources, skills, and time would be needed? What already exists that you can build on?', hint: 'Be honest about what you don\'t know. Acknowledging uncertainty is strength.' },
  { key: 'f_risks', label: 'Risks & Limitations', placeholder: 'What could go wrong? What are the biggest risks to your solution? What assumptions are you making that could be wrong?', hint: 'Every solution has risks. The best submissions name them honestly.' },
  { key: 'f_implementation', label: 'Implementation Plan', placeholder: 'How would this actually get built and deployed? What are the key steps, timeline, and team needed? What would you do first?', hint: 'Think in phases. What\'s the MVP? What comes after?' },
]

function getPlainText(html: string) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

type RichTextEditorProps = {
  fieldKey: string
  value: string
  placeholder: string
  fieldErr?: string
  onChange: (val: string) => void
  onFocus?: () => void
  editorRef: (el: HTMLDivElement | null) => void
}

function RichTextEditor({
  value,
  placeholder,
  fieldErr,
  onChange,
  onFocus,
  editorRef
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (containerRef.current && !isInternalChange.current) {
      if (containerRef.current.innerHTML !== (value || '')) {
        containerRef.current.innerHTML = value || ''
      }
    }
    isInternalChange.current = false
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    containerRef.current?.focus()
    document.execCommand(cmd, false, arg)
    if (containerRef.current) {
      isInternalChange.current = true
      onChange(containerRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (containerRef.current) {
      isInternalChange.current = true
      onChange(containerRef.current.innerHTML)
    }
  }

  const getWordCount = () => {
    const text = containerRef.current?.innerText?.trim() ?? ''
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
  }

  return (
    <div style={{
      border: `1.5px solid ${fieldErr ? '#FCA5A5' : 'rgba(28,20,16,0.14)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: fieldErr ? '#FEF2F2' : '#fff',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    }}>
      {/* Formatting Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#FAF8F4',
        borderBottom: '1px solid rgba(28,20,16,0.08)',
        gap: 8,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); exec('bold') }}
            title="Bold"
            style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 13,
              color: '#1C1410', background: 'transparent', border: 'none',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,20,16,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            B
          </button>

          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); exec('italic') }}
            title="Italic"
            style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 600, fontSize: 13,
              color: '#1C1410', background: 'transparent', border: 'none',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,20,16,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            I
          </button>

          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); exec('underline') }}
            title="Underline"
            style={{
              fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline', fontWeight: 600, fontSize: 13,
              color: '#1C1410', background: 'transparent', border: 'none',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,20,16,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            U
          </button>

          <div style={{ width: 1, height: 16, background: 'rgba(28,20,16,0.12)', margin: '0 4px' }} />

          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }}
            title="Bullet List"
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
              color: '#4A3F38', background: 'transparent', border: 'none',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,20,16,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            List
          </button>

          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote') }}
            title="Quote"
            style={{
              fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700,
              color: '#4A3F38', background: 'transparent', border: 'none',
              borderRadius: 4, padding: '4px 7px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,20,16,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            “ Quote
          </button>
        </div>

        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: '#9CA3A0', fontWeight: 500
        }}>
          {getWordCount()} words
        </div>
      </div>
      {/* Contenteditable Rich Text Area */}
      <div
        ref={el => {
          containerRef.current = el
          editorRef(el)
        }}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={onFocus}
        data-placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: 120,
          maxHeight: 380,
          overflowY: 'auto',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          color: '#1C1410',
          background: 'transparent',
          padding: '14px 16px',
          outline: 'none',
          boxSizing: 'border-box',
          lineHeight: 1.65
        }}
      />
    </div>
  )
}

export default function SubmitPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [existing, setExisting] = useState<ExistingSubmission | null>(null)
  const [progressFiles, setProgressFiles] = useState<ProgressUploadItem[]>([])

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  // Form state
  const [fields, setFields] = useState<Record<string, string>>({
    f_understanding: '',
    f_solution: '',
    f_impact: '',
    f_rootcause: '',
    f_feasibility: '',
    f_risks: '',
    f_implementation: '',
  })

  const loadSubmission = useCallback(async (supabase: ReturnType<typeof createClient>, userId: string) => {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('problem_id', problemId)
      .eq('student_id', userId)
      .limit(1)

    const sub = data?.[0]

    if (sub) {
      const parsedImplementation = parseProgressUploads(sub.f_implementation ?? '')
      setExisting(sub as ExistingSubmission)
      setProgressFiles(parsedImplementation.files)
      setFields({
        f_understanding: sub.f_understanding ?? '',
        f_solution: sub.f_solution ?? '',
        f_impact: sub.f_impact ?? '',
        f_rootcause: sub.f_rootcause ?? '',
        f_feasibility: sub.f_feasibility ?? '',
        f_risks: sub.f_risks ?? '',
        f_implementation: parsedImplementation.text,
      })
    } else {
      setExisting(null)
      setProgressFiles([])
      setFields({
        f_understanding: '', f_solution: '', f_impact: '',
        f_rootcause: '', f_feasibility: '', f_risks: '', f_implementation: '',
      })
    }
  }, [problemId])

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

      const statusRes = await fetch('/api/enrollments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: problemId }),
      })

      if (!statusRes.ok) {
        router.push(`/problems/${problemId}`)
        return
      }

      const statusData = await statusRes.json()
      if (!statusData?.enrolled) {
        router.push(`/problems/${problemId}`)
        return
      }

      const { data: prob } = await supabase
        .from('problems')
        .select('id, title, domain, deadline')
        .eq('id', problemId)
        .single()
      setProblem(prob)

      await loadSubmission(supabase, authUser.id)
      setLoading(false)
    }
    load()
  }, [loadSubmission, problemId, router])

  const completedFields = ALL_FIELDS.filter(f => fields[f.key]?.trim()).length
  const isAllFieldsCompleted = completedFields === 7

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
    if (error) setError('')
  }

  async function handleProgressUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isAllFieldsCompleted) {
      setError('Please complete all 7 solution fields above before uploading supporting PDF documents.')
      const firstMissing = ALL_FIELDS.find(f => !fields[f.key]?.trim())
      if (firstMissing && fieldRefs.current[firstMissing.key]) {
        fieldRefs.current[firstMissing.key]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        fieldRefs.current[firstMissing.key]?.focus()
      }
      e.target.value = ''
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    const validationError = getProblemProgressUploadError(file)
    if (validationError) {
      setError(validationError)
      e.target.value = ''
      return
    }

    setUploadingFiles(true)
    setError('')

    const formData = new FormData()
    formData.append('problem_id', problemId)
    formData.append('file', file)

    const res = await fetch('/api/submissions/progress-upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `File upload failed (${res.status}).`
      if (text) {
        try {
          const data = JSON.parse(text)
          message = data?.error ?? message
        } catch {
          message = text
        }
      }
      setError(message)
      setUploadingFiles(false)
      e.target.value = ''
      return
    }

    const data = await res.json()
    if (typeof data?.url === 'string' && typeof data?.name === 'string') {
      setProgressFiles(prev => [...prev, { name: data.name, url: data.url }])
    }

    setUploadingFiles(false)
    e.target.value = ''
  }

  function removeProgressFile(url: string) {
    setProgressFiles(prev => prev.filter(file => file.url !== url))
  }

  async function saveDraft() {
    if (!user || !problem) return
    setSaving(true)
    setError('')
    setDraftSaved(false)

    const supabase = createClient()

    const payload = {
      problem_id: problemId,
      student_id: user.id,
      milestone: 1,
      total_milestones: 1,
      dept: user.dept ?? 'Unknown',
      year: user.year ?? 'Unknown',
      stage: 'draft' as const,
      status: 'draft' as const,
      f_understanding: fields.f_understanding,
      f_solution: fields.f_solution,
      f_impact: fields.f_impact,
      f_rootcause: fields.f_rootcause,
      f_feasibility: fields.f_feasibility,
      f_risks: fields.f_risks,
      f_implementation: serializeProgressUploads(fields.f_implementation, progressFiles),
    }

    if (existing) {
      const { error: updateError } = await supabase.from('submissions').update(payload).eq('id', existing.id)
      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      const { data, error: insertError } = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .single()
      if (insertError) { setError(insertError.message); setSaving(false); return }
      if (data) setExisting(data as ExistingSubmission)
    }

    setDraftSaved(true)
    setSaving(false)
  }

  async function submitSolution() {
    if (!user || !problem) return

    const newErrors: Record<string, string> = {}
    let firstErrorKey: string | null = null

    for (const field of ALL_FIELDS) {
      if (!fields[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} is required.`
        if (!firstErrorKey) {
          firstErrorKey = field.key
        }
      }
    }

    if (firstErrorKey) {
      setFieldErrors(newErrors)
      setError('Please complete all 7 fields before submitting your solution.')
      
      const el = fieldRefs.current[firstErrorKey]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
      return
    }

    setSubmitting(true)
    setError('')
    setDraftSaved(false)

    const supabase = createClient()

    const payload = {
      problem_id: problemId,
      student_id: user.id,
      milestone: 1,
      total_milestones: 1,
      dept: user.dept ?? 'Unknown',
      year: user.year ?? 'Unknown',
      stage: 'full' as const,
      status: 'pending' as const,
      f_understanding: fields.f_understanding,
      f_solution: fields.f_solution,
      f_impact: fields.f_impact,
      f_rootcause: fields.f_rootcause,
      f_feasibility: fields.f_feasibility,
      f_risks: fields.f_risks,
      f_implementation: serializeProgressUploads(fields.f_implementation, progressFiles),
    }

    if (existing) {
      const { error: updateError } = await supabase.from('submissions').update(payload).eq('id', existing.id)
      if (updateError) { setError(updateError.message); setSubmitting(false); return }
    } else {
      const { data, error: insertError } = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .single()
      if (insertError) { setError(insertError.message); setSubmitting(false); return }
      if (data) setExisting(data as ExistingSubmission)
    }

    setSubmitted(true)
    setSubmitting(false)

    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CA3A0' }}>Loading solution workspace...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif', paddingBottom: 100 }}>

      {/* Navigation Header */}
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
        background: 'rgba(250,248,244,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href={`/problems/${problemId}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', rowGap: 8 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500,
            color: isAllFieldsCompleted ? '#2D6A4F' : '#B45309',
            background: isAllFieldsCompleted ? '#EAF4EE' : '#FEF3C7',
            border: `1px solid ${isAllFieldsCompleted ? 'rgba(45,106,79,0.2)' : 'rgba(217,119,6,0.2)'}`,
            padding: '6px 14px', borderRadius: 999
          }}>
            {completedFields} / 7 Fields Completed
          </div>
          <Link href={`/problems/${problemId}`} style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>
            ← Back to Problem Details
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(28px, 5vw, 44px) clamp(16px, 4vw, 24px)' }}>

        {/* Main Header Banner */}
        <div style={{
          background: '#fff',
          border: '1.5px solid rgba(28,20,16,0.08)',
          borderRadius: 18,
          padding: '28px 30px',
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(28,20,16,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              color: '#2D6A4F', background: '#EAF4EE', padding: '4px 10px', borderRadius: 6
            }}>
              Solution Workspace
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

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap', paddingTop: 14, marginTop: 14,
            borderTop: '1px solid rgba(28,20,16,0.06)'
          }}>
            <div style={{ fontSize: 13, color: '#4A3F38' }}>
              <strong>Builder:</strong> {user?.name} {user?.dept ? `(${user.dept} · ${user.year})` : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexGrow: 1, maxWidth: 280 }}>
              <div style={{
                flexGrow: 1, height: 8, background: '#EAE5DC', borderRadius: 999, overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(completedFields / 7) * 100}%`,
                  background: isAllFieldsCompleted ? '#2D6A4F' : '#F4A723',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6A5F58', fontWeight: 600 }}>
                {Math.round((completedFields / 7) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1.5px solid #FCA5A5',
            borderRadius: 12, padding: '14px 18px', marginBottom: 28,
            display: 'flex', alignItems: 'flex-start', gap: 12,
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#991B1B'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ flexGrow: 1, fontWeight: 500 }}>{error}</div>
          </div>
        )}

        {/* Draft Saved Banner */}
        {draftSaved && (
          <div style={{
            background: '#ECFDF5', border: '1.5px solid #6EE7B7',
            borderRadius: 12, padding: '14px 18px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#065F46', fontWeight: 500
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <div>Draft saved successfully! You can return to edit and submit at any time.</div>
          </div>
        )}

        {/* Submitted Banner */}
        {submitted && (
          <div style={{
            background: '#ECFDF5', border: '1.5px solid #34D399',
            borderRadius: 12, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#047857', fontWeight: 600
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>Solution submitted for judging! Redirecting to your dashboard...</div>
          </div>
        )}

        {/* 7 Framework Fields */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, flexWrap: 'wrap', gap: 10
          }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410' }}>
                7-Field Solution Framework
              </h2>
              <p style={{ fontSize: 13, color: '#6A5F58', marginTop: 2 }}>
                Complete all seven fields to provide a structured, defensible solution proposal.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            {ALL_FIELDS.map((field, i) => {
              const value = fields[field.key] ?? ''
              const isFilled = value.trim().length > 0
              const fieldErr = fieldErrors[field.key]

              return (
                <div
                  key={field.key}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${fieldErr ? '#EF4444' : isFilled ? 'rgba(45,106,79,0.25)' : 'rgba(28,20,16,0.09)'}`,
                    borderRadius: 14,
                    padding: '24px',
                    boxShadow: fieldErr ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 2px 12px rgba(28,20,16,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                        color: isFilled ? '#2D6A4F' : '#6A5F58',
                        background: isFilled ? '#EAF4EE' : '#F2EEE8',
                        padding: '3px 9px', borderRadius: 6
                      }}>
                        Field {i + 1} of 7
                      </span>
                      <h3 style={{
                        fontFamily: 'Sora, sans-serif', fontSize: 16,
                        fontWeight: 600, color: '#1C1410'
                      }}>
                        {field.label}
                      </h3>
                    </div>

                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: isFilled ? '#2D6A4F' : '#9CA3A0',
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      {isFilled ? (
                        <>
                          Completed <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </>
                      ) : 'Required'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                    color: '#6A5F58', marginBottom: 12, lineHeight: 1.5
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5F58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    <span>{field.hint}</span>
                  </div>

                  {/* WYSIWYG Rich Text Editor */}
                  <RichTextEditor
                    fieldKey={field.key}
                    value={value}
                    placeholder={field.placeholder}
                    fieldErr={fieldErr}
                    onChange={val => handleFieldChange(field.key, val)}
                    editorRef={el => { fieldRefs.current[field.key] = el }}
                  />

                  {fieldErr && (
                    <div style={{
                      fontSize: 13, color: '#DC2626', fontWeight: 500,
                      marginTop: 8, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {fieldErr}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* PDF & Supporting Documents Upload (At the end, unlocked when all 7 fields complete) */}
        <div style={{
          background: isAllFieldsCompleted ? '#fff' : '#F9F8F6',
          border: `1.5px solid ${isAllFieldsCompleted ? 'rgba(45,106,79,0.3)' : 'rgba(28,20,16,0.08)'}`,
          borderRadius: 14,
          padding: '24px 26px',
          marginBottom: 36,
          boxShadow: isAllFieldsCompleted ? '0 4px 16px rgba(45,106,79,0.05)' : 'none',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              <h3 style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#1C1410'
              }}>
                Upload PDF & Supporting Evidence (Optional)
              </h3>
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              color: isAllFieldsCompleted ? '#2D6A4F' : '#9CA3A0',
              background: isAllFieldsCompleted ? '#EAF4EE' : '#EAE7E1',
              padding: '3px 10px', borderRadius: 6
            }}>
              {isAllFieldsCompleted ? 'Unlocked' : 'Requires All 7 Fields'}
            </span>
          </div>

          <p style={{ fontSize: 13, color: '#6A5F58', marginBottom: 16, lineHeight: 1.6 }}>
            {isAllFieldsCompleted
              ? 'Attach your detailed PDF report, presentation slides, diagrams, or dataset spreadsheets to accompany your submission.'
              : 'Complete all 7 framework fields above to unlock uploading PDF reports and supporting documents.'}
          </p>

          <input
            type="file"
            accept={PROBLEM_PROGRESS_ACCEPT}
            onChange={handleProgressUpload}
            disabled={uploadingFiles || !isAllFieldsCompleted}
            style={{
              width: '100%',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: isAllFieldsCompleted ? '#1C1410' : '#9CA3A0',
              background: isAllFieldsCompleted ? '#FAF8F4' : '#EFECE6',
              border: `1.5px dashed ${isAllFieldsCompleted ? 'rgba(45,106,79,0.35)' : 'rgba(28,20,16,0.15)'}`,
              borderRadius: 10,
              padding: '14px 16px',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: isAllFieldsCompleted ? 'pointer' : 'not-allowed'
            }}
          />

          <div style={{ fontSize: 12, color: '#9CA3A0', marginTop: 10 }}>
            {!isAllFieldsCompleted ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> File upload is locked until fields 1 through 7 are completed.
              </span>
            ) : uploadingFiles
              ? 'Uploading document...'
              : `${progressFiles.length} file${progressFiles.length === 1 ? '' : 's'} attached.`}
          </div>

          {progressFiles.length > 0 && (
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {progressFiles.map(file => (
                <div key={file.url} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#FAF8F4',
                  borderRadius: 10,
                  border: '1px solid rgba(45,106,79,0.18)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2D6A4F',
                        textDecoration: 'none'
                      }}
                    >
                      {file.name}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProgressFile(file.url)}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#DC2626',
                      background: '#fff',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 6,
                      padding: '5px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div style={{
          position: 'sticky',
          bottom: 'clamp(10px, 2vw, 20px)',
          background: '#fff',
          border: '1.5px solid rgba(28,20,16,0.1)',
          borderRadius: 16,
          padding: '14px clamp(14px, 3vw, 24px)',
          boxShadow: '0 10px 30px rgba(28,20,16,0.08)',
          zIndex: 90
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 10
          }}>
            <div style={{ fontSize: 13, color: '#6A5F58', flex: '1 1 180px' }}>
              {isAllFieldsCompleted ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2D6A4F', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  All 7 fields completed.
                </span>
              ) : `${7 - completedFields} field${7 - completedFields === 1 ? '' : 's'} remaining.`}
            </div>

            <div style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'nowrap',
              flex: '1 1 auto',
              justifyContent: 'flex-end',
              maxWidth: '100%'
            }}>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving || submitting}
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
                  color: '#1C1410', background: saving ? '#E2E8F0' : '#F6F2EB',
                  border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8,
                  padding: '11px clamp(12px, 2vw, 20px)',
                  cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto'
                }}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={submitSolution}
                disabled={saving || submitting}
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
                  color: '#1C1410',
                  background: submitting ? '#F9C05A' : '#F4A723',
                  border: 'none', borderRadius: 8,
                  padding: '11px clamp(14px, 3vw, 24px)',
                  cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(244,167,35,0.3)',
                  transition: 'background 0.2s, transform 0.1s',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto',
                  textAlign: 'center',
                  minWidth: 140
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Solution →'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
