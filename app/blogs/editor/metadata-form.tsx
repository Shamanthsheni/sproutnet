'use client'

import { useEffect, useState } from 'react'

export type BlogMetadata = {
  slug: string
  excerpt: string
  tags: string[]
  category: string
  seoTitle: string
  seoDescription: string
}

type MetadataFormProps = {
  value: BlogMetadata
  onChange: (meta: BlogMetadata) => void
  title: string // Used to auto-generate slug
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

type FieldProps = {
  label: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#5C524A', marginBottom: 6, letterSpacing: '0.01em' }}>
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#8A8078', marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid rgba(28,20,16,0.12)',
  borderRadius: 10,
  padding: '10px 13px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#1C1410',
  background: '#FAF8F4',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export function MetadataForm({ value, onChange, title }: MetadataFormProps) {
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState(value.tags.join(', '))
  const [slugEdited, setSlugEdited] = useState(false)

  // Auto-generate slug from title unless user manually edited it
  useEffect(() => {
    if (!slugEdited && title) {
      const auto = slugify(title)
      if (auto !== value.slug) {
        onChange({ ...value, slug: auto })
      }
    }
  }, [title, slugEdited]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof BlogMetadata>(key: K, val: BlogMetadata[K]) {
    onChange({ ...value, [key]: val })
  }

  function handleTagInput(raw: string) {
    setTagInput(raw)
    const tags = raw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    set('tags', tags)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          color: '#1C1410',
          borderBottom: open ? '1px solid rgba(28,20,16,0.08)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          Post Settings & SEO
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: '20px 20px 4px' }}>
          <Field
            label="URL Slug"
            hint="Auto-generated from your title. Edit to customize."
          >
            <input
              type="text"
              value={value.slug}
              onChange={e => { setSlugEdited(true); set('slug', e.target.value) }}
              placeholder="my-awesome-post"
              style={INPUT_STYLE}
              onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
              onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
            />
          </Field>

          <Field
            label="Excerpt"
            hint="A short summary shown in the blog feed. 120–160 characters recommended."
          >
            <textarea
              value={value.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="A one-paragraph summary of this post…"
              rows={2}
              maxLength={300}
              style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
              onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
            />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A89E96', textAlign: 'right', marginTop: 3 }}>
              {value.excerpt.length}/300
            </div>
          </Field>

          <Field
            label="Tags"
            hint="Comma-separated. e.g. design, react, india"
          >
            <input
              type="text"
              value={tagInput}
              onChange={e => handleTagInput(e.target.value)}
              placeholder="design, startup, india"
              style={INPUT_STYLE}
              onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
              onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
            />
            {value.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {value.tags.slice(0, 10).map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#2D6A4F',
                      background: 'rgba(45,106,79,0.1)',
                      padding: '3px 9px',
                      borderRadius: 999,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Category">
            <input
              type="text"
              value={value.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Technology, Opinion, Case Study"
              style={INPUT_STYLE}
              onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
              onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
            />
          </Field>

          <div style={{ marginTop: 4, marginBottom: 12, borderTop: '1px solid rgba(28,20,16,0.07)', paddingTop: 16 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              {'// SEO'}
            </div>

            <Field
              label="SEO Title"
              hint="Overrides the post title in search engines. 50–60 chars ideal."
            >
              <input
                type="text"
                value={value.seoTitle}
                onChange={e => set('seoTitle', e.target.value)}
                placeholder="Optional — leave blank to use post title"
                maxLength={100}
                style={INPUT_STYLE}
                onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
              />
            </Field>

            <Field
              label="SEO Description"
              hint="Meta description for search engines. 120–160 chars ideal."
            >
              <textarea
                value={value.seoDescription}
                onChange={e => set('seoDescription', e.target.value)}
                placeholder="Describe this post in a way that makes someone click in search results…"
                rows={2}
                maxLength={300}
                style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = '#2D6A4F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
              />
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A89E96', textAlign: 'right', marginTop: 3 }}>
                {value.seoDescription.length}/300
              </div>
            </Field>
          </div>
        </div>
      )}
    </div>
  )
}
