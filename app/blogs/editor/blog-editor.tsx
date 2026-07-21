'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'
import type { JSONContent } from '@tiptap/react'
import type { BlogUserSummary } from '@/lib/blogs'
import { RichTextEditor } from './rich-text-editor'
import { CoverImage } from './cover-image'
import { MetadataForm, type BlogMetadata } from './metadata-form'
import { PostPreview } from './post-preview'
import { useAutosave, type SaveStatus } from './hooks'

// ─────────────── Types ───────────────

export type BlogDraft = {
  title: string
  body: JSONContent | null
  postType: 'knowledge' | 'question'
  coverImage: string | null
  metadata: BlogMetadata
}

export type BlogEditorProps = {
  viewer: BlogUserSummary
  /** Pass initial values when editing an existing post */
  initialDraft?: Partial<BlogDraft>
  /** ID of existing post — if set, PATCH is used instead of POST */
  postId?: string | null
  /** Disable autosave (e.g. during preview) */
  autosaveEnabled?: boolean
  onClose?: () => void
}

type EditorMode = 'write' | 'preview'

const EMPTY_METADATA: BlogMetadata = {
  slug: '',
  excerpt: '',
  tags: [],
  category: '',
  seoTitle: '',
  seoDescription: '',
}

async function readErrorMessage(res: Response, fallback: string) {
  const text = await res.text().catch(() => '')
  if (!text) return fallback
  try {
    return JSON.parse(text)?.error ?? fallback
  } catch {
    return text
  }
}

// ─────────────── Mode Toggle ───────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: EditorMode
  onChange: (m: EditorMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Editor mode"
      style={{
        display: 'inline-flex',
        background: 'rgba(28,20,16,0.06)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {(['write', 'preview'] as const).map(m => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              color: active ? '#1C1410' : '#7A7068',
              background: active ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s',
              boxShadow: active ? '0 1px 4px rgba(28,20,16,0.10)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {m === 'write' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Write
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────── BlogEditor ───────────────

export default function BlogEditor({
  viewer,
  initialDraft,
  postId,
  autosaveEnabled = true,
  onClose,
}: BlogEditorProps) {
  const router = useRouter()

  const [mode, setMode] = useState<EditorMode>('write')
  const [title, setTitle] = useState(initialDraft?.title ?? '')
  const [body, setBody] = useState<JSONContent | null>(initialDraft?.body ?? null)
  const [postType, setPostType] = useState<'knowledge' | 'question'>(initialDraft?.postType ?? 'knowledge')
  const [coverImage, setCoverImage] = useState<string | null>(initialDraft?.coverImage ?? null)
  const [metadata, setMetadata] = useState<BlogMetadata>({
    ...EMPTY_METADATA,
    ...initialDraft?.metadata,
  })

  const [publishing, setPublishing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const bodyRef = useRef(body)
  bodyRef.current = body

  // ── Autosave ──
  const handleAutosave = useCallback(async (content: JSONContent) => {
    if (!postId) return
    await fetch('/api/blogs/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        body: JSON.stringify(content),
      }),
    })
  }, [postId])

  const { saveStatus } = useAutosave({
    content: body,
    onSave: handleAutosave,
    enabled: autosaveEnabled && Boolean(postId),
    intervalMs: 5000,
    debounceMs: 1200,
  })

  // ── Publish / Save draft ──
  async function handleSubmit(status: 'draft' | 'published') {
    if (publishing) return

    const trimmedTitle = title.trim()
    const bodyJson = bodyRef.current

    if (!trimmedTitle) {
      setActionError('Please add a title before publishing.')
      return
    }
    if (!bodyJson || JSON.stringify(bodyJson) === JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })) {
      setActionError('The editor body is empty. Write something first.')
      return
    }

    setPublishing(true)
    setActionError('')
    setActionSuccess('')

    const payload = {
      title: trimmedTitle,
      body: JSON.stringify(bodyJson),
      post_type: postType,
      cover_image: coverImage,
      slug: metadata.slug,
      excerpt: metadata.excerpt,
      tags: metadata.tags,
      category: metadata.category,
      seo_title: metadata.seoTitle,
      seo_description: metadata.seoDescription,
      status,
    }

    const res = postId
      ? await fetch('/api/blogs/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId, ...payload }),
        })
      : await fetch('/api/blogs/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not ${status === 'published' ? 'publish' : 'save'} the post (${res.status}).`))
      setPublishing(false)
      return
    }

    setPublishing(false)
    setActionSuccess(status === 'published' ? 'Published! 🎉' : 'Draft saved.')
    setTimeout(() => setActionSuccess(''), 4000)
    startTransition(() => router.refresh())

    if (status === 'published') {
      startTransition(() => router.push('/blogs/manage'))
    }
  }

  const isEditing = Boolean(postId)

  const postTypeMeta = {
    knowledge: { label: 'Knowledge Share', accent: '#2D6A4F', background: '#EAF4EE' },
    question: { label: 'Question / Doubt', accent: '#1E40AF', background: 'rgba(30,64,175,0.08)' },
  }

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: 'clamp(20px, 4vw, 40px) clamp(14px, 3vw, 20px)',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* ── Header strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {/* Left — title + mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              {isEditing ? '// editing post' : '// new post'}
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410' }}>
              {isEditing ? 'Edit your post' : 'Write a new post'}
            </div>
          </div>

          {/* ── Write / Preview toggle ── */}
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Right — actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#5C524A', background: '#F6F2EB', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={publishing}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410', background: '#F6F2EB', border: '1px solid rgba(28,20,16,0.1)', borderRadius: 10, padding: '10px 18px', cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.6 : 1 }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={publishing}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410', background: publishing ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: publishing ? 'not-allowed' : 'pointer', boxShadow: '0 6px 16px rgba(244,167,35,0.28)' }}
          >
            {publishing ? 'Publishing…' : isEditing ? 'Update Post →' : 'Publish →'}
          </button>
        </div>
      </div>

      {/* ── Feedback banners ── */}
      {actionError && (
        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#B91C1C', marginBottom: 18, fontFamily: 'DM Sans, sans-serif' }}>
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div style={{ background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#1B4332', marginBottom: 18, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {/* ════════ WRITE MODE ════════ */}
      {mode === 'write' && (
        <>
          {/* Cover image */}
          <CoverImage value={coverImage} onChange={setCoverImage} />

          {/* Post type selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {(['knowledge', 'question'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: postType === type ? '#1C1410' : postTypeMeta[type].accent,
                  background: postType === type ? '#F4A723' : postTypeMeta[type].background,
                  border: 'none',
                  borderRadius: 999,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {postTypeMeta[type].label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              placeholder="Give your post a sharp title…"
              rows={1}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '2px solid rgba(28,20,16,0.1)',
                borderRadius: 0,
                padding: '8px 0',
                fontFamily: 'Sora, sans-serif',
                fontSize: 'clamp(22px, 4vw, 32px)',
                fontWeight: 700,
                color: '#1C1410',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                lineHeight: 1.25,
                overflow: 'hidden',
              }}
              onFocus={e => (e.target.style.borderBottomColor = '#2D6A4F')}
              onBlur={e => (e.target.style.borderBottomColor = 'rgba(28,20,16,0.1)')}
            />
          </div>

          {/* Metadata */}
          <MetadataForm value={metadata} onChange={setMetadata} title={title} />

          {/* Rich-text editor */}
          <RichTextEditor
            initialContent={body}
            onChange={setBody}
            saveStatus={saveStatus as SaveStatus}
            placeholder="Start writing your story…"
          />
        </>
      )}

      {/* ════════ PREVIEW MODE ════════ */}
      {mode === 'preview' && (
        <>
          {/* Hint banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(45,106,79,0.06)',
              border: '1px solid rgba(45,106,79,0.14)',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 22,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#2D6A4F',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>
              <strong>Preview mode</strong> — this is exactly how readers will see your post.{' '}
              <button
                type="button"
                onClick={() => setMode('write')}
                style={{ background: 'none', border: 'none', color: '#2D6A4F', fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Back to writing →
              </button>
            </span>
          </div>

          <PostPreview
            title={title}
            body={body}
            coverImage={coverImage}
            postType={postType}
            authorName={viewer.name}
            authorRole={viewer.role}
            authorDept={viewer.dept}
            tags={metadata.tags}
            excerpt={metadata.excerpt}
          />
        </>
      )}

      {/* ── Author strip (shown in both modes) ── */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid rgba(28,20,16,0.07)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EAF4EE', color: '#2D6A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {viewer.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410' }}>{viewer.name}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#8A8078' }}>
            Publishing as {viewer.role}{viewer.dept ? ` · ${viewer.dept}` : ''}
          </div>
        </div>
        {autosaveEnabled && postId && (
          <AutosaveIndicator saveStatus={saveStatus as SaveStatus} />
        )}
      </div>
    </div>
  )
}

// ─────────────── Autosave Indicator ───────────────

function AutosaveIndicator({ saveStatus }: { saveStatus: SaveStatus }) {
  if (saveStatus === 'idle') return null

  const config: Record<string, { text: string; color: string }> = {
    saving: { text: 'Saving…', color: '#7A7068' },
    saved: { text: 'Saved ✓', color: '#2D6A4F' },
    error: { text: 'Save failed', color: '#DC2626' },
  }

  const c = config[saveStatus]
  if (!c) return null

  return (
    <span
      style={{
        marginLeft: 'auto',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        color: c.color,
        transition: 'color 0.3s',
      }}
    >
      {c.text}
    </span>
  )
}
