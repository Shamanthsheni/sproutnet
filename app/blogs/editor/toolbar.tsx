'use client'

import { useCallback, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useImageUpload } from './hooks'

// ─────────────── Toolbar Button ───────────────

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  danger?: boolean
}

export function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
  danger = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 7,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active
          ? '#2D6A4F'
          : danger
          ? 'rgba(220,38,38,0.08)'
          : 'transparent',
        color: active
          ? '#FAF8F4'
          : danger
          ? '#DC2626'
          : '#3F352E',
        fontSize: 14,
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        transition: 'background 0.15s, color 0.15s, transform 0.1s',
        opacity: disabled ? 0.38 : 1,
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,106,79,0.1)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }
      }}
    >
      {children}
    </button>
  )
}

// ─────────────── Separator ───────────────

export function ToolbarSeparator() {
  return (
    <div
      style={{
        width: 1,
        height: 22,
        background: 'rgba(28,20,16,0.12)',
        flexShrink: 0,
        margin: '0 2px',
      }}
      aria-hidden="true"
    />
  )
}

// ─────────────── Link Dialog ───────────────

type LinkDialogProps = {
  initialUrl?: string
  onConfirm: (url: string, openInNewTab: boolean) => void
  onRemove?: () => void
  onCancel: () => void
}

export function LinkDialog({ initialUrl = '', onConfirm, onRemove, onCancel }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    const withProtocol =
      trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')
        ? trimmed
        : `https://${trimmed}`
    onConfirm(withProtocol, openInNewTab)
  }

  return (
    <div
      role="dialog"
      aria-label="Insert link"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,20,16,0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 24px 64px rgba(28,20,16,0.18)',
          border: '1px solid rgba(28,20,16,0.08)',
        }}
      >
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: '#1C1410', marginBottom: 20 }}>
          Insert Link
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5C524A', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
            URL
          </label>
          <input
            ref={inputRef}
            autoFocus
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              width: '100%',
              border: '1.5px solid rgba(28,20,16,0.14)',
              borderRadius: 10,
              padding: '11px 14px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: '#1C1410',
              outline: 'none',
              marginBottom: 14,
              background: '#FAF8F4',
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5C524A', fontFamily: 'DM Sans, sans-serif', marginBottom: 22, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={e => setOpenInNewTab(e.target.checked)}
              style={{ accentColor: '#2D6A4F', width: 15, height: 15 }}
            />
            Open in new tab
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#5C524A', background: '#F6F2EB', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF8F4', background: '#2D6A4F', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: !url.trim() ? 'not-allowed' : 'pointer', opacity: !url.trim() ? 0.5 : 1 }}
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────── Image Upload Button ───────────────

type ImageUploaderProps = {
  onInsert: (url: string) => void
}

export function ImageUploader({ onInsert }: ImageUploaderProps) {
  const { uploadFile, uploadState, uploadProgress, uploadError, resetUpload } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      onInsert(url)
      setTimeout(resetUpload, 2000)
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isUploading = uploadState === 'uploading'

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        title={isUploading ? `Uploading ${uploadProgress}%` : 'Insert image'}
        aria-label="Insert image"
        disabled={isUploading}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: 7,
          border: 'none',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          background: isUploading ? 'rgba(45,106,79,0.15)' : 'transparent',
          color: isUploading ? '#2D6A4F' : '#3F352E',
          fontSize: 14,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isUploading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,106,79,0.1)' }}
        onMouseLeave={e => { if (!isUploading) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        {isUploading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </button>

      {uploadError && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#DC2626',
          color: '#fff',
          fontSize: 11,
          fontFamily: 'DM Sans, sans-serif',
          padding: '6px 10px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
        }}>
          {uploadError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

// ─────────────── Full Editor Toolbar ───────────────

type EditorToolbarProps = {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const currentLink = editor.getAttributes('link').href as string | undefined

  const applyLink = useCallback(
    (url: string, openInNewTab: boolean) => {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: openInNewTab ? '_blank' : undefined })
        .run()
      setShowLinkDialog(false)
    },
    [editor]
  )

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkDialog(false)
  }, [editor])

  function insertImage(url: string) {
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Text editor toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '6px 10px',
          background: '#fff',
          borderBottom: '1px solid rgba(28,20,16,0.08)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          flexWrap: 'nowrap',
        }}
      >
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Paragraph"
        >
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>P</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>H3</span>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Inline marks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5a4 4 0 0 0-7 0c0 4 7 4 7 4"/><path d="M6.5 16.5a4 4 0 0 0 7 0c0-4-7-4-7-4"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l-4 4v3h3l4-4"/><path d="m22 5.5-9.17 9.17-3.5-3.5L19 2a2.83 2.83 0 0 1 3 3.5z"/></svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Superscript / Subscript */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          title="Superscript"
        >
          <span style={{ fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>x²</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          title="Subscript"
        >
          <span style={{ fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>x₂</span>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" stroke="currentColor" strokeLinecap="round"/><path d="M4 10h2" stroke="currentColor" strokeLinecap="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          title="Task List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="6" height="6" rx="1"/><polyline points="4 8 6 10 9 6" strokeLinecap="round" strokeLinejoin="round"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="14" width="6" height="6" rx="1"/><line x1="13" y1="17" x2="21" y2="17"/></svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="10 14 6 12 10 10"/><polyline points="14 10 18 12 14 14"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link */}
        <ToolbarButton
          onClick={() => setShowLinkDialog(true)}
          active={editor.isActive('link')}
          title="Insert Link (Ctrl+K)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </ToolbarButton>

        {/* Image */}
        <ImageUploader onInsert={insertImage} />

        <ToolbarSeparator />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting"
          danger
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7 L10 13 L7 20 H14"/><path d="M14 4 L20 17"/><line x1="5" y1="19" x2="19" y2="19"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </ToolbarButton>
      </div>

      {showLinkDialog && (
        <LinkDialog
          initialUrl={currentLink}
          onConfirm={applyLink}
          onRemove={currentLink ? removeLink : undefined}
          onCancel={() => setShowLinkDialog(false)}
        />
      )}
    </>
  )
}
