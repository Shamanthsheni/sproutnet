'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import type { JSONContent } from '@tiptap/react'
import { buildExtensions } from './extensions'

// ─────────────── Shared preview styles ───────────────

const PREVIEW_STYLES = `
.sn-preview-body {
  font-family: 'DM Sans', sans-serif;
  font-size: 17px;
  line-height: 1.9;
  color: #1C1410;
}
.sn-preview-body .ProseMirror {
  outline: none;
  padding: 0;
}
.sn-preview-body h1,
.sn-preview-body h2,
.sn-preview-body h3 {
  font-family: 'Sora', sans-serif;
  color: #1C1410;
  line-height: 1.25;
  margin-top: 2em;
  margin-bottom: 0.55em;
}
.sn-preview-body h1 { font-size: 2.1rem; font-weight: 700; }
.sn-preview-body h2 { font-size: 1.55rem; font-weight: 700; border-bottom: 2px solid rgba(28,20,16,0.08); padding-bottom: 0.3em; }
.sn-preview-body h3 { font-size: 1.2rem; font-weight: 600; }
.sn-preview-body p { margin: 0 0 1.1em; }
.sn-preview-body strong { font-weight: 700; }
.sn-preview-body em { font-style: italic; }
.sn-preview-body u { text-decoration: underline; text-underline-offset: 3px; }
.sn-preview-body s { text-decoration: line-through; }
.sn-preview-body mark {
  background: rgba(244,167,35,0.3);
  border-radius: 3px;
  padding: 1px 2px;
}
.sn-preview-body sup { font-size: 0.7em; vertical-align: super; }
.sn-preview-body sub { font-size: 0.7em; vertical-align: sub; }
.sn-preview-body a {
  color: #2D6A4F;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sn-preview-body a:hover { color: #1B4332; }
.sn-preview-body code {
  background: rgba(28,20,16,0.07);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88em;
  color: #1C1410;
}
.sn-preview-body pre {
  background: #1C1410;
  border-radius: 14px;
  padding: 22px 24px;
  overflow-x: auto;
  margin: 1.8em 0;
  box-shadow: 0 4px 20px rgba(28,20,16,0.18);
}
.sn-preview-body pre code {
  background: none;
  padding: 0;
  font-size: 0.88rem;
  color: #FAF8F4;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.75;
}
.sn-preview-body pre .hljs-keyword { color: #F4A723; }
.sn-preview-body pre .hljs-string { color: #95E5AB; }
.sn-preview-body pre .hljs-number { color: #79C0FF; }
.sn-preview-body pre .hljs-comment { color: #8A7E6A; font-style: italic; }
.sn-preview-body pre .hljs-function { color: #B8F2E6; }
.sn-preview-body pre .hljs-title { color: #D2A8FF; }
.sn-preview-body pre .hljs-built_in { color: #79C0FF; }
.sn-preview-body pre .hljs-attr { color: #95E5AB; }
.sn-preview-body blockquote {
  border-left: 4px solid #F4A723;
  padding: 4px 0 4px 22px;
  margin: 2em 0;
  color: #5C524A;
  font-style: italic;
  font-size: 1.05em;
}
.sn-preview-body hr {
  border: none;
  border-top: 2px solid rgba(28,20,16,0.09);
  margin: 3em 0;
}
.sn-preview-body ul,
.sn-preview-body ol {
  padding-left: 1.7em;
  margin: 0.5em 0 1.2em;
}
.sn-preview-body li { margin: 0.4em 0; }
.sn-preview-body ul[data-type="taskList"] { list-style: none; padding-left: 0.4em; }
.sn-preview-body ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0.5em 0;
}
.sn-preview-body ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 3px; }
.sn-preview-body ul[data-type="taskList"] li > label input {
  accent-color: #2D6A4F;
  width: 16px;
  height: 16px;
  cursor: default;
}
.sn-preview-body ul[data-type="taskList"] li > div { flex: 1; }
.sn-preview-body ul[data-type="taskList"] li[data-checked="true"] > div {
  opacity: 0.45;
  text-decoration: line-through;
}
.sn-preview-body img {
  max-width: 100%;
  height: auto;
  border-radius: 14px;
  display: block;
  margin: 2em auto;
  box-shadow: 0 8px 32px rgba(28,20,16,0.14);
}
`

let previewStylesInjected = false

function injectPreviewStyles() {
  if (previewStylesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = PREVIEW_STYLES
  document.head.appendChild(style)
  previewStylesInjected = true
}

// ─────────────── PostPreview ───────────────

export type PostPreviewProps = {
  title: string
  body: JSONContent | null
  coverImage: string | null
  postType: 'knowledge' | 'question'
  authorName: string
  authorRole: string
  authorDept?: string | null
  tags?: string[]
  excerpt?: string
}

const POST_TYPE_META = {
  knowledge: { label: 'Knowledge Share', accent: '#2D6A4F', background: '#EAF4EE' },
  question: { label: 'Question / Doubt', accent: '#1E40AF', background: 'rgba(30,64,175,0.08)' },
}

/** Read-only Tiptap editor that renders a JSONContent document */
function PreviewBody({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: buildExtensions(),
    content,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    injectPreviewStyles()
  }, [])

  // Sync content if it changes (e.g. user keeps editing)
  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(content)
    if (current !== next) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [editor, content])

  return (
    <div className="sn-preview-body">
      <EditorContent editor={editor} />
    </div>
  )
}

export function PostPreview({
  title,
  body,
  coverImage,
  postType,
  authorName,
  authorRole,
  authorDept,
  tags = [],
  excerpt,
}: PostPreviewProps) {
  const meta = POST_TYPE_META[postType]
  const initials = authorName.slice(0, 2).toUpperCase()

  const isEmpty = !body || JSON.stringify(body) === JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })

  return (
    <article
      style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(28,20,16,0.07)',
      }}
    >
      {/* ── Cover image ── */}
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt="Cover"
          style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }}
        />
      )}

      <div style={{ padding: 'clamp(28px, 5vw, 52px) clamp(20px, 5vw, 48px)' }}>
        {/* ── Badge ── */}
        <div style={{ marginBottom: 22 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
              color: meta.accent,
              background: meta.background,
              padding: '5px 12px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {meta.label}
          </span>
        </div>

        {/* ── Title ── */}
        {title ? (
          <h1
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 700,
              color: '#1C1410',
              lineHeight: 1.2,
              marginBottom: 18,
            }}
          >
            {title}
          </h1>
        ) : (
          <h1
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 'clamp(22px, 4vw, 36px)',
              fontWeight: 700,
              color: '#A89E96',
              lineHeight: 1.2,
              marginBottom: 18,
              fontStyle: 'italic',
            }}
          >
            Untitled post…
          </h1>
        )}

        {/* ── Excerpt ── */}
        {excerpt && (
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 16,
              color: '#5C524A',
              lineHeight: 1.7,
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: '1px solid rgba(28,20,16,0.07)',
            }}
          >
            {excerpt}
          </p>
        )}

        {/* ── Author row ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 36,
            paddingBottom: excerpt ? 0 : 24,
            borderBottom: excerpt ? 'none' : '1px solid rgba(28,20,16,0.07)',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: meta.background,
              color: meta.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Sora, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410' }}>
              {authorName}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A7068' }}>
              {authorRole}{authorDept ? ` · ${authorDept}` : ''} · Just now
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        {isEmpty ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#A89E96',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontStyle: 'italic',
            }}
          >
            Start writing to see your post preview here…
          </div>
        ) : (
          <PreviewBody content={body!} />
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid rgba(28,20,16,0.07)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#5C524A',
                  background: '#F6F2EB',
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(28,20,16,0.08)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
