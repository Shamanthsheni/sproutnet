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

function renderDomainIcon(domain: string) {
  switch (domain) {
    case 'AI & Data':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
    case 'Climate':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    case 'Healthcare':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    case 'Public Infrastructure':
    case 'Urban Mobility':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    case 'Agriculture':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12A10 10 0 0 1 12 2z"/><path d="M12 6v12"/></svg>
    case 'Education':
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    default:
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
  }
}

const SECTIONS = [
  { key: 'context', label: 'Background & Context', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: 'problem_stmt', label: 'The Problem', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { key: 'scope', label: 'Scope', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { key: 'constraints', label: 'Constraints', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: 'deliverables', label: 'Deliverables', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
]

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  if (diffInSeconds < 60) return 'Just now'
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

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

  // Filter & Sort state
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'oldest'>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // UX state
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [visibleCommentCount, setVisibleCommentCount] = useState(5)

  const toggleExpandReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
        await supabase.from('discussion').update({ likes_count: newCount }).eq('id', commentId)
        await supabase.from('discussion_likes').delete().eq('discussion_id', commentId).eq('user_id', user.id)
      } else {
        await supabase.from('discussion').update({ likes_count: newCount }).eq('id', commentId)
        await supabase.from('discussion_likes').insert({ discussion_id: commentId, user_id: user.id })
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
        .select('id, body, created_at, author_id, parent_id, users(name, role)')
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY
      const threshold = document.documentElement.offsetHeight - 400
      if (scrollPosition >= threshold) {
        setVisibleCommentCount(prev => prev + 5)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function postComment() {
    if (!commentBody.trim() || !user) return
    setPosting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('discussion')
      .insert({ problem_id: id, author_id: user.id, body: commentBody.trim(), parent_id: null })
      .select('id, body, created_at, author_id, parent_id, users(name, role)')
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
      .select('id, body, created_at, author_id, parent_id, users(name, role)')
      .single()
    if (data) {
      setComments(prev => [...prev, data as unknown as Comment])
      setExpandedReplies(prev => new Set(prev).add(parentId))
    }
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
              padding: '4px 10px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              {renderDomainIcon(problem.domain)} {problem.domain}
            </span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
              color: isIndustry ? '#1E40AF' : '#4A3F38',
              background: isIndustry ? 'rgba(30,64,175,0.08)' : 'rgba(28,20,16,0.05)',
              border: `1px solid ${isIndustry ? 'rgba(30,64,175,0.15)' : 'rgba(28,20,16,0.1)'}`,
              padding: '4px 10px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              {isIndustry ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Industry Challenge · ₹{problem.reward_amount?.toLocaleString('en-IN')}
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Public Impact
                </>
              )}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: '#22C55E', background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              Open
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
          <div style={{
            background: '#FAF8F4',
            border: '1px solid rgba(28,20,16,0.08)',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}>
            
            {/* Header & Stats */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 16, marginBottom: 28,
              borderBottom: '1px solid rgba(28,20,16,0.08)', paddingBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: '#2D6A4F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAF8F4'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', margin: 0, letterSpacing: '-0.3px' }}>
                    Discussion Thread
                  </h2>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6A5F58', marginTop: 2 }}>
                    {comments.length} contribution{comments.length === 1 ? '' : 's'} from community & poster
                  </div>
                </div>
              </div>

              {/* Sorting & Search Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3A0" strokeWidth="2" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search responses..."
                    style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1C1410',
                      background: '#fff', border: '1px solid rgba(28,20,16,0.12)',
                      borderRadius: 20, padding: '7px 14px 7px 34px', outline: 'none', width: 160,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', background: '#EFECE6', borderRadius: 20, padding: 3 }}>
                  {(['newest', 'top', 'oldest'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSortBy(mode)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                        color: sortBy === mode ? '#1C1410' : '#7A6F68',
                        background: sortBy === mode ? '#fff' : 'transparent',
                        border: 'none', borderRadius: 16, padding: '5px 12px', cursor: 'pointer',
                        boxShadow: sortBy === mode ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}
                    >
                      {mode === 'top' ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                          Top
                        </>
                      ) : mode === 'newest' ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Latest
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                          Oldest
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment List */}
            {(() => {
              const matchesQuery = (c: Comment) => {
                if (!searchQuery.trim()) return true
                const q = searchQuery.toLowerCase()
                return c.body.toLowerCase().includes(q) || (c.users?.name ?? '').toLowerCase().includes(q)
              }

              const rootComments = comments.filter(c => c.parent_id === null && matchesQuery(c))
              
              rootComments.sort((a, b) => {
                if (sortBy === 'top') {
                  const likesA = likeCounts[a.id] ?? 0
                  const likesB = likeCounts[b.id] ?? 0
                  return likesB - likesA
                }
                if (sortBy === 'oldest') {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              })

              if (comments.length === 0) {
                return (
                  <div style={{
                    background: '#fff', border: '1px stroke rgba(28,20,16,0.06)',
                    borderRadius: 16, padding: '48px 24px', textAlign: 'center', marginBottom: 24,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #EAF4EE 0%, #D4EADB 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto',
                      boxShadow: '0 4px 12px rgba(45,106,79,0.15)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410', marginBottom: 6 }}>
                      Start the Conversation
                    </div>
                    <div style={{ fontSize: 14, color: '#6A5F58', maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
                      No comments yet. Share your problem analysis, clarify requirements, or propose solutions!
                    </div>
                  </div>
                )
              }

              if (rootComments.length === 0) {
                return (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#7A6F68', fontSize: 14 }}>
                    No responses matching &quot;<strong>{searchQuery}</strong>&quot;.
                  </div>
                )
              }

              const renderCommentCard = (c: Comment, isChild = false) => {
                const isPoster = c.author_id === problem.poster_id
                const isLiked = likedCommentIds.has(c.id)
                const likes = likeCounts[c.id] ?? 0
                const childReplies = comments.filter(child => child.parent_id === c.id)
                const isRepliesExpanded = expandedReplies.has(c.id)

                return (
                  <div key={c.id} style={{
                    position: 'relative',
                    paddingLeft: isChild ? 24 : 0,
                    marginBottom: isChild ? 12 : 20,
                  }}>
                    {/* Visual Vertical Thread Line for nested items */}
                    {isChild && (
                      <div style={{
                        position: 'absolute', left: 8, top: 0, bottom: 0, width: 2,
                        background: 'linear-gradient(180deg, rgba(45,106,79,0.3) 0%, rgba(28,20,16,0.06) 100%)',
                        borderRadius: 1
                      }} />
                    )}

                    <div style={{
                      background: isPoster ? 'linear-gradient(135deg, #FFFDF8 0%, #FFF9EC 100%)' : '#fff',
                      border: isPoster ? '1.5px solid rgba(244,167,35,0.4)' : '1px solid rgba(28,20,16,0.08)',
                      borderRadius: 14,
                      padding: '16px 20px',
                      boxShadow: isPoster ? '0 4px 16px rgba(244,167,35,0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* User Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Avatar Circle */}
                          <div style={{
                            width: isChild ? 32 : 36, height: isChild ? 32 : 36, borderRadius: '50%',
                            background: isPoster ? 'linear-gradient(135deg, #F4A723 0%, #D88E0E 100%)' : 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPoster ? '#1C1410' : '#fff',
                            fontFamily: 'Sora, sans-serif', fontSize: isChild ? 12 : 13, fontWeight: 700,
                            boxShadow: isPoster ? '0 2px 8px rgba(244,167,35,0.3)' : '0 2px 8px rgba(45,106,79,0.2)'
                          }}>
                            {c.users?.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410' }}>
                                {c.users?.name ?? 'Community Contributor'}
                              </span>

                              {isPoster && (
                                <span style={{
                                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                                  color: '#1C1410', background: '#F4A723', padding: '2px 8px', borderRadius: 12,
                                  boxShadow: '0 1px 4px rgba(244,167,35,0.3)',
                                  display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                                  OP / Problem Poster
                                </span>
                              )}

                              {c.users?.role && !isPoster && (
                                <span style={{
                                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
                                  color: '#2D6A4F', background: '#EAF4EE', padding: '2px 8px', borderRadius: 12,
                                  textTransform: 'capitalize'
                                }}>
                                  {c.users.role}
                                </span>
                              )}
                            </div>

                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0', marginTop: 2 }}>
                              {getRelativeTime(c.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comment Body */}
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410',
                        lineHeight: 1.65, margin: '8px 0 14px 0', whiteSpace: 'pre-wrap', fontWeight: 400
                      }}>
                        {c.body}
                      </p>

                      {/* Action Bar Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Upvote Pill */}
                        <button
                          type="button"
                          onClick={() => toggleLike(c.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700,
                            color: isLiked ? '#DC2626' : '#4A3F38',
                            background: isLiked ? '#FEF2F2' : '#F5F2EC',
                            border: `1px solid ${isLiked ? 'rgba(220,38,38,0.25)' : 'rgba(28,20,16,0.08)'}`,
                            borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={isLiked ? '#DC2626' : 'none'} stroke={isLiked ? '#DC2626' : '#4A3F38'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                          <span>{likes} {likes === 1 ? 'upvote' : 'upvotes'}</span>
                        </button>

                        {/* Reply Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(replyingToId === c.id ? null : c.id)
                            setReplyBody('')
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                            color: '#2D6A4F', background: '#EAF4EE',
                            border: '1px solid rgba(45,106,79,0.15)',
                            borderRadius: 20, padding: '4px 12px', cursor: 'pointer'
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                          Reply
                        </button>

                        {/* Link UI Reply Count Toggle */}
                        {childReplies.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandReplies(c.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                              color: '#2D6A4F', background: 'transparent',
                              border: 'none', padding: '4px 8px', cursor: 'pointer',
                              borderRadius: 6
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>{isRepliesExpanded ? 'Hide replies' : `${childReplies.length} ${childReplies.length === 1 ? 'reply' : 'replies'}`}</span>
                          </button>
                        )}

                        {/* Copy Link Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#comment-${c.id}`)
                              setCopiedLinkId(c.id)
                              setTimeout(() => setCopiedLinkId(null), 2000)
                            } catch {
                              // ignore
                            }
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
                            color: copiedLinkId === c.id ? '#10B981' : '#7A6F68', background: 'transparent',
                            border: 'none', padding: '4px 8px', cursor: 'pointer'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          {copiedLinkId === c.id ? 'Link copied!' : 'Share'}
                        </button>
                      </div>

                      {/* Inline Reply Input */}
                      {replyingToId === c.id && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(28,20,16,0.08)' }}>
                          <textarea
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            placeholder={`Replying to ${c.users?.name ?? 'user'}...`}
                            rows={2}
                            style={{
                              width: '100%', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1C1410',
                              background: '#FAF8F4', border: '1.5px solid #2D6A4F', borderRadius: 10,
                              padding: '10px 14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              style={{
                                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
                                color: '#7A6F68', background: '#EFECE6', border: 'none', borderRadius: 8,
                                padding: '6px 14px', cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => postReply(c.id)}
                              disabled={postingReply || !replyBody.trim()}
                              style={{
                                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                                color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 8,
                                padding: '6px 18px', cursor: (postingReply || !replyBody.trim()) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 2px 6px rgba(244,167,35,0.2)'
                              }}
                            >
                              {postingReply ? 'Posting...' : 'Post Reply'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thread Child Node Container */}
                    {isRepliesExpanded && childReplies.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {childReplies.map(child => renderCommentCard(child, true))}
                      </div>
                    )}
                  </div>
                )
              }

              const visibleRootComments = rootComments.slice(0, visibleCommentCount)

              return (
                <>
                  {visibleRootComments.map(c => renderCommentCard(c))}

                  {rootComments.length > visibleCommentCount && (
                    <div style={{ textAlign: 'center', margin: '24px 0 12px 0' }}>
                      <button
                        type="button"
                        onClick={() => setVisibleCommentCount(prev => prev + 5)}
                        style={{
                          fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
                          color: '#2D6A4F', background: '#EAF4EE',
                          border: '1px solid rgba(45,106,79,0.2)', borderRadius: 20,
                          padding: '10px 24px', cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(45,106,79,0.08)',
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        Load More Discussions ({rootComments.length - visibleCommentCount} remaining)
                      </button>
                      <div style={{ fontSize: 11, color: '#9CA3A0', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>
                        Scroll down to automatically reveal more
                      </div>
                    </div>
                  )}
                </>
              )
            })()}

            {/* Comment input */}
            {/* Modern Floating Comment Composer */}
            {user ? (
              <div style={{
                background: '#fff',
                border: '1px solid rgba(28,20,16,0.1)',
                borderRadius: 16,
                padding: '20px 22px',
                marginTop: 28,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                {/* Header User Row & Formatting Tools */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>
                      Add to discussion as <span style={{ color: '#2D6A4F' }}>{user.name}</span>
                    </div>
                  </div>

                  {/* Rich Text Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FAF8F4', borderRadius: 8, padding: 3, border: '1px solid rgba(28,20,16,0.06)' }}>
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => setCommentBody(prev => `${prev} **bold** `)}
                      style={{ fontSize: 12, fontWeight: 800, color: '#4A3F38', background: 'transparent', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => setCommentBody(prev => `${prev} *italic* `)}
                      style={{ fontSize: 12, fontStyle: 'italic', fontWeight: 700, color: '#4A3F38', background: 'transparent', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      title="Inline Code"
                      onClick={() => setCommentBody(prev => `${prev} \`code\` `)}
                      style={{ fontSize: 12, fontFamily: 'monospace', color: '#4A3F38', background: 'transparent', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      &lt;/&gt;
                    </button>
                    <button
                      type="button"
                      title="Quote"
                      onClick={() => setCommentBody(prev => `${prev}\n> quote\n`)}
                      style={{ fontSize: 12, fontFamily: 'serif', fontWeight: 700, color: '#4A3F38', background: 'transparent', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      &ldquo;&rdquo;
                    </button>
                  </div>
                </div>

                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault()
                      postComment()
                    }
                  }}
                  placeholder="Share a thoughtful response, ask a question, or clarify solution scope... (Ctrl + Enter to send)"
                  rows={3}
                  style={{
                    width: '100%', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, color: '#1C1410', lineHeight: 1.6,
                    background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.1)',
                    borderRadius: 12, padding: '12px 16px',
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 12, color: '#7A6F68', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Markdown supported
                    </span>
                    {commentBody.length > 0 && (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0', background: '#FAF8F4', padding: '2px 8px', borderRadius: 10 }}>
                        {commentBody.length} chars
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {commentBody.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCommentBody('')}
                        style={{
                          fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                          color: '#7A6F68', background: 'transparent', border: 'none',
                          padding: '6px 12px', cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={postComment}
                      disabled={posting || !commentBody.trim()}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 14, fontWeight: 700,
                        color: '#1C1410', background: posting ? '#E2E8F0' : '#F4A723',
                        border: 'none', borderRadius: 10,
                        padding: '10px 22px', cursor: (posting || !commentBody.trim()) ? 'not-allowed' : 'pointer',
                        boxShadow: (posting || !commentBody.trim()) ? 'none' : '0 4px 14px rgba(244,167,35,0.3)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {posting ? 'Posting...' : 'Publish Response →'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '32px 20px',
                background: 'linear-gradient(135deg, #FFFDF8 0%, #FAF8F4 100%)',
                border: '1px stroke rgba(28,20,16,0.08)',
                borderRadius: 16, marginTop: 24,
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#1C1410', marginBottom: 4 }}>
                  Join the SproutNet Community
                </div>
                <div style={{ fontSize: 13, color: '#7A6F68', marginBottom: 16 }}>
                  Sign in to post replies, upvote helpful contributions, and connect with the problem author.
                </div>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: '#1C1410', background: '#F4A723',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
                  padding: '10px 24px', borderRadius: 20, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(244,167,35,0.3)', transition: 'all 0.15s ease'
                }}>
                  Sign in to Participate →
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
