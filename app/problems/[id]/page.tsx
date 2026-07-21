'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { decodeProblemThumbnailFallback } from '@/lib/problem-thumbnail'
import CancelEnrollmentButton from '@/app/components/cancel-enrollment-button'

type Problem = {
  id: string
  title: string
  domain: string
  problem_type: string
  status: string
  thumbnail_url: string | null
  reward_amount: number | null
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  milestones: number
  deadline: string
  judging_deadline: string
  submission_count: number
  judge_type: string
  poster_id: string
  rejected_reason?: string | null
}

type Comment = {
  id: string
  body: string
  created_at: string
  author_id: string
  parent_id: string | null
  likes_count?: number
  users: { name: string; role: string } | null
}

type User = {
  id: string
  role: string
  name: string
}

const DOMAIN_ICONS: Record<string, string> = {
  'AI & Data': '🤖', 'Climate': '🌿', 'Public Infrastructure': '🏗',
  'Healthcare': '🏥', 'Agriculture': '🌾', 'Education': '📚',
  'Urban Mobility': '🚌', 'Civic Technology': '🏛',
}

const SECTIONS = [
  { key: 'context', label: 'Background & Context', icon: '📋' },
  { key: 'problem_stmt', label: 'The Problem', icon: '🎯' },
  { key: 'scope', label: 'Scope', icon: '🔭' },
  { key: 'constraints', label: 'Constraints', icon: '⚠️' },
  { key: 'deliverables', label: 'Deliverables', icon: '📦' },
]

export default function ProblemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [activeSection, setActiveSection] = useState('context')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [nowMs] = useState(() => Date.now())

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  // Like state
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`sproutnet_liked_comments_${user.id}`)
        if (stored) {
          setLikedCommentIds(new Set(JSON.parse(stored)))
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [user?.id])

  const toggleLike = async (commentId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    const isCurrentlyLiked = likedCommentIds.has(commentId)
    const currentCount = likeCounts[commentId] ?? 0
    const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1

    // Optimistic UI update
    setLikedCommentIds(prev => {
      const next = new Set(prev)
      if (isCurrentlyLiked) next.delete(commentId)
      else next.add(commentId)
      if (user?.id) {
        try {
          localStorage.setItem(`sproutnet_liked_comments_${user.id}`, JSON.stringify(Array.from(next)))
        } catch {
          // ignore
        }
      }
      return next
    })

    setLikeCounts(prev => ({
      ...prev,
      [commentId]: newCount
    }))

    // Async DB update
    const supabase = createClient()
    try {
      if (isCurrentlyLiked) {
        await supabase.rpc('decrement_discussion_likes', { c_id: commentId }).catch(() => null)
        await supabase.from('discussion').update({ likes_count: newCount }).eq('id', commentId).catch(() => null)
        await supabase.from('discussion_likes').delete().eq('discussion_id', commentId).eq('user_id', user.id).catch(() => null)
      } else {
        await supabase.rpc('increment_discussion_likes', { c_id: commentId }).catch(() => null)
        await supabase.from('discussion').update({ likes_count: newCount }).eq('id', commentId).catch(() => null)
        await supabase.from('discussion_likes').insert({ discussion_id: commentId, user_id: user.id }).catch(() => null)
      }
    } catch {
      // Ignore network errors, optimistic state remains smooth
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Load problem
      const { data: prob } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single()
      setProblem(prob ? {
        ...prob,
        thumbnail_url: prob.thumbnail_url ?? decodeProblemThumbnailFallback(prob.rejected_reason),
      } : null)

      // Load current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, role, name')
          .eq('id', authUser.id)
          .single()
        setUser(profile)

        // Check if student already submitted
        if (profile?.role === 'student') {
          const statusRes = await fetch('/api/enrollments/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problem_id: id }),
          })

          if (statusRes.ok) {
            const statusData = await statusRes.json()
            setIsEnrolled(Boolean(statusData?.enrolled))
            setHasSubmitted(Boolean(statusData?.hasSubmitted))
            setIsCompleted(Boolean(statusData?.completed))
          } else {
            setIsEnrolled(false)
            setHasSubmitted(false)
            setIsCompleted(false)
          }
        }
      }

      // Load comments
      const { data: disc } = await supabase
        .from('discussion')
        .select('id, body, created_at, author_id, parent_id, likes_count, users(name, role)')
        .eq('problem_id', id)
        .order('created_at', { ascending: true })
      const loadedComments = (disc as unknown as Comment[]) ?? []
      setComments(loadedComments)
      
      const counts: Record<string, number> = {}
      loadedComments.forEach(c => {
        counts[c.id] = c.likes_count ?? 0
      })
      setLikeCounts(counts)

      setLoading(false)
    }
    load()
  }, [id])

  async function postComment() {
    if (!commentBody.trim() || !user) return
    setPosting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('discussion')
      .insert({ problem_id: id, author_id: user.id, body: commentBody.trim(), parent_id: null })
      .select('id, body, created_at, author_id, parent_id, likes_count, users(name, role)')
      .single()
    if (data) setComments(prev => [...prev, data as unknown as Comment])
    setCommentBody('')
    setPosting(false)
  }

  async function postReply(parentId: string) {
    if (!replyBody.trim() || !user) return
    setPostingReply(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('discussion')
      .insert({ problem_id: id, author_id: user.id, body: replyBody.trim(), parent_id: parentId })
      .select('id, body, created_at, author_id, parent_id, likes_count, users(name, role)')
      .single()
    if (data) setComments(prev => [...prev, data as unknown as Comment])
    setReplyBody('')
    setReplyingToId(null)
    setPostingReply(false)
  }

  async function enroll() {
    if (!user || user.role !== 'student') return
    setEnrolling(true)
    setEnrollError('')
    const res = await fetch('/api/enrollments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem_id: id })
    })
    if (res.ok) {
      setIsEnrolled(true)
      setIsCompleted(false)
      router.push(`/problems/${id}/submit`)
    } else {
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
      setEnrollError(message)
    }
    setEnrolling(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CA3A0' }}>Loading...</div>
    </div>
  )

  if (!problem) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 600, color: '#1C1410' }}>Problem not found</div>
        <Link href="/problems" style={{ color: '#2D6A4F', fontSize: 14, marginTop: 12, display: 'block' }}>← Back to problems</Link>
      </div>
    </div>
  )

  const isIndustry = problem.problem_type === 'industry_challenge'
  const daysLeft = Math.ceil((new Date(problem.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24))

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div className="sn-nav-actions" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <Link href="/problems" style={{ fontSize: 14, color: '#4A3F38', textDecoration: 'none' }}>← Problems</Link>
          {user && (
            <Link href="/dashboard" style={{
              fontSize: 14, fontWeight: 600, color: '#1C1410',
              background: '#F4A723', padding: '8px 20px',
              borderRadius: 6, textDecoration: 'none'
            }}>Dashboard</Link>
          )}
        </div>
        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href="/problems">Back to problems</Link>
            {user && <Link href="/dashboard" className="sn-menu-primary">Dashboard</Link>}
          </div>
        </details>
      </nav>

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)',
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>

        {/* LEFT — Problem content */}
        <div style={{ flex: '1 1 620px', minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
              color: '#2D6A4F', background: '#EAF4EE',
              border: '1px solid rgba(45,106,79,0.15)',
              padding: '4px 10px', borderRadius: 999
            }}>
              {DOMAIN_ICONS[problem.domain]} {problem.domain}
            </span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
              color: isIndustry ? '#1E40AF' : '#4A3F38',
              background: isIndustry ? 'rgba(30,64,175,0.08)' : 'rgba(28,20,16,0.05)',
              border: `1px solid ${isIndustry ? 'rgba(30,64,175,0.15)' : 'rgba(28,20,16,0.1)'}`,
              padding: '4px 10px', borderRadius: 999
            }}>
              {isIndustry ? `💼 Industry Challenge · ₹${problem.reward_amount?.toLocaleString('en-IN')}` : '🌍 Public Impact'}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: '#22C55E', background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              ● Open
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 38px)', fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.5px',
            lineHeight: 1.15, marginBottom: 32
          }}>
            {problem.title}
          </h1>

          {problem.thumbnail_url && (
            <div style={{
              background: '#fff',
              border: '1.5px solid rgba(28,20,16,0.07)',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 28
            }}>
              <div style={{ aspectRatio: '16 / 9', background: '#F3EEE7', position: 'relative' }}>
                <Image
                  src={problem.thumbnail_url}
                  alt={`${problem.title} thumbnail`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 66vw"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Section tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 28,
            borderBottom: '1px solid rgba(28,20,16,0.08)',
            overflowX: 'auto', paddingBottom: 0
          }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                color: activeSection === s.key ? '#1C1410' : '#9CA3A0',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeSection === s.key ? '#2D6A4F' : 'transparent'}`,
                padding: '10px 16px', cursor: 'pointer',
                whiteSpace: 'nowrap', marginBottom: -1
              }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Active section content */}
          {SECTIONS.map(s => activeSection === s.key && (
            <div key={s.key} style={{
              background: '#fff',
              border: '1.5px solid rgba(28,20,16,0.07)',
              borderRadius: 12, padding: '28px',
              marginBottom: 28
            }}>
              <div style={{
                fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
                color: '#2D6A4F', marginBottom: 14,
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>
                {s.icon} {s.label}
              </div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 15,
                color: '#1C1410', lineHeight: 1.75, fontWeight: 300,
                whiteSpace: 'pre-wrap', margin: 0
              }}>
                {problem[s.key as keyof Problem] as string}
              </p>
            </div>
          ))}


          {/* Discussion */}
          <div>
            <div style={{
              fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600,
              color: '#1C1410', marginBottom: 20
            }}>
              Discussion ({comments.length})
            </div>

            {comments.length === 0 && (
              <div style={{
                background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12, padding: '32px', textAlign: 'center',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 14, color: '#9CA3A0' }}>No comments yet. Be the first to ask a question.</div>
              </div>
            )}

            {comments.map(c => (
              <div key={c.id} style={{
                background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12, padding: '20px', marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#2D6A4F', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff',
                    fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700
                  }}>
                    {c.users?.name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#1C1410' }}>
                      {c.users?.name ?? 'Unknown'}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9CA3A0' }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', lineHeight: 1.6, margin: 0 }}>
                  {c.body}
                </p>
              </div>
            ))}

            {/* Comment input */}
            {user ? (
              <div style={{
                background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12, padding: '20px'
              }}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Ask a question or leave a comment..."
                  rows={3}
                  style={{
                    width: '100%', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, color: '#1C1410',
                    background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.1)',
                    borderRadius: 8, padding: '12px 14px',
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button onClick={postComment} disabled={posting || !commentBody.trim()} style={{
                  marginTop: 10, fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14, fontWeight: 600,
                  color: '#1C1410', background: '#F4A723',
                  border: 'none', borderRadius: 8,
                  padding: '10px 24px', cursor: 'pointer'
                }}>
                  {posting ? 'Posting...' : 'Post comment'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Link href="/login" style={{ color: '#2D6A4F', fontSize: 14, fontWeight: 600 }}>
                  Sign in to join the discussion →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div style={{ flex: '0 1 320px', width: '100%' }}>
          {/* CTA Card */}
          <div style={{
            background: '#1C1410', borderRadius: 14,
            padding: '28px', marginBottom: 20
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: 'rgba(250,248,244,0.4)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 14
            }}>
              {'// ready to build?'}
            </div>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 22, color: '#FAF8F4',
              lineHeight: 1.2, marginBottom: 20
            }}>
              {isCompleted ? 'You finished this problem.' : hasSubmitted ? 'You\'ve started this.' : 'Start solving this problem.'}
            </div>

            {user?.role === 'student' ? (
              isCompleted ? (
                <div style={{
                  display: 'grid',
                  gap: 10,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#2D6A4F',
                    background: '#EAF4EE',
                    border: '1px solid rgba(45,106,79,0.15)',
                    borderRadius: 8,
                    padding: '14px',
                  }}>
                    Problem completed
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(250,248,244,0.7)',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}>
                    You have already fully submitted this problem and can unlock a new enrollment slot.
                  </div>
                </div>
              ) : isEnrolled ? (
                <div style={{ display: 'grid', gap: 10 }}>
                <Link
                  href={`/problems/${problem.id}/submit`}
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#1C1410',
                    background: '#F4A723',
                    borderRadius: 8,
                    padding: '14px',
                    textDecoration: 'none'
                  }}
                >
                  {hasSubmitted ? 'Continue Solving →' : 'Start Solving →'}
                </Link>
                <CancelEnrollmentButton
                  problemId={problem.id}
                  kind="block"
                  onCancelled={() => {
                    setIsEnrolled(false)
                    setHasSubmitted(false)
                    setIsCompleted(false)
                  }}
                />
                </div>
              ) : (
                <div>
                  <button
                    onClick={enroll}
                    disabled={enrolling}
                    style={{
                      width: '100%', fontFamily: 'DM Sans, sans-serif',
                      fontSize: 15, fontWeight: 600,
                      color: '#1C1410', background: enrolling ? '#F9C05A' : '#F4A723',
                      border: 'none', borderRadius: 8,
                      padding: '14px', cursor: enrolling ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll to Solve →'}
                  </button>
                  {enrollError && (
                    <div style={{
                      marginTop: 10,
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      color: '#DC2626',
                      textAlign: 'center'
                    }}>
                      {enrollError}
                    </div>
                  )}
                </div>
              )
            ) : !user ? (
              <Link href="/login" style={{
                display: 'block', textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15, fontWeight: 600,
                color: '#1C1410', background: '#F4A723',
                borderRadius: 8, padding: '14px',
                textDecoration: 'none'
              }}>
                Sign in to Solve →
              </Link>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: 'rgba(250,248,244,0.7)',
                  textAlign: 'center',
                  lineHeight: 1.6
                }}>
                  You&apos;re signed in as a {user.role} account. Enroll is only available for student accounts.
                </div>
                <Link href="/login/student" style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#F4A723',
                  borderRadius: 8,
                  padding: '14px',
                  textDecoration: 'none'
                }}>
                  Switch to Student Login →
                </Link>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: 'rgba(250,248,244,0.45)',
                  textAlign: 'center'
                }}>
                  Student accounts can enroll and submit solutions.
                </div>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div style={{
            background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)',
            borderRadius: 14, padding: '24px', marginBottom: 20
          }}>
            {[
              { label: 'Days Left', value: `${daysLeft}d`, color: daysLeft <= 7 ? '#DC2626' : '#F4A723' },
              { label: 'Submissions', value: problem.submission_count, color: '#1C1410' },
              { label: 'Judging by', value: new Date(problem.judging_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: '#1C1410' },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid rgba(28,20,16,0.06)' : 'none'
              }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9CA3A0' }}>
                  {stat.label}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 14, fontWeight: 500, color: stat.color
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* 7-field framework reminder */}
          <div style={{
            background: '#EAF4EE', border: '1px solid rgba(45,106,79,0.15)',
            borderRadius: 14, padding: '20px'
          }}>
            <div style={{
              fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600,
              color: '#2D6A4F', marginBottom: 12,
              textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              The Framework
            </div>
            {[
              'Problem Understanding',
              'Root Cause Analysis',
              'Proposed Solution',
              'Feasibility Assessment',
              'Expected Impact',
              'Risks & Limitations',
              'Implementation Plan',
            ].map((f, i) => (
              <div key={f} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0',
                borderBottom: i < 6 ? '1px solid rgba(45,106,79,0.08)' : 'none'
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: '#2D6A4F', opacity: 0.5, minWidth: 16
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#2D6A4F' }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
