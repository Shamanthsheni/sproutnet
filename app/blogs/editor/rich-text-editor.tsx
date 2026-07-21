'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { JSONContent, Editor as TiptapEditor } from '@tiptap/react'
import { buildExtensions } from './extensions'
import { EditorToolbar } from './toolbar'
import { countWords, estimateReadingTime } from './hooks'
import type { SaveStatus } from './hooks'

// ─────────────── Status Bar ───────────────

type StatusBarProps = {
  editor: TiptapEditor | null
  saveStatus: SaveStatus
}

function StatusBar({ editor, saveStatus }: StatusBarProps) {
  if (!editor) return null

  const charCount = editor.storage.characterCount?.characters() ?? 0
  const wordCount = countWords(editor.getText())
  const readTime = estimateReadingTime(wordCount)

  const statusText = {
    idle: null,
    saving: 'Saving…',
    saved: 'Saved ✓',
    error: 'Save failed — will retry',
  }[saveStatus]

  const statusColor = {
    idle: 'transparent',
    saving: '#5C524A',
    saved: '#2D6A4F',
    error: '#DC2626',
  }[saveStatus]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 20px',
        borderTop: '1px solid rgba(28,20,16,0.07)',
        background: '#FAF8F4',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
      }}
    >
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7A7068' }}>
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7A7068' }}>
          {charCount.toLocaleString()} chars
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7A7068' }}>
          {readTime}
        </span>
      </div>
      {statusText && (
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: statusColor, transition: 'color 0.3s' }}>
          {statusText}
        </span>
      )}
    </div>
  )
}

// ─────────────── Editor styles injected once ───────────────

const EDITOR_STYLES = `
.sn-editor .ProseMirror {
  min-height: 340px;
  padding: 24px 28px;
  outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  line-height: 1.85;
  color: #1C1410;
  caret-color: #2D6A4F;
}
.sn-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #A89E96;
  pointer-events: none;
  height: 0;
  font-style: italic;
}
.sn-editor .ProseMirror h1,
.sn-editor .ProseMirror h2,
.sn-editor .ProseMirror h3 {
  font-family: 'Sora', sans-serif;
  color: #1C1410;
  line-height: 1.25;
  margin-top: 1.6em;
  margin-bottom: 0.5em;
}
.sn-editor .ProseMirror h1 { font-size: 2rem; font-weight: 700; }
.sn-editor .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; }
.sn-editor .ProseMirror h3 { font-size: 1.2rem; font-weight: 600; }
.sn-editor .ProseMirror p { margin: 0 0 1em; }
.sn-editor .ProseMirror strong { font-weight: 700; }
.sn-editor .ProseMirror em { font-style: italic; }
.sn-editor .ProseMirror u { text-decoration: underline; text-underline-offset: 3px; }
.sn-editor .ProseMirror s { text-decoration: line-through; }
.sn-editor .ProseMirror mark {
  background: rgba(244,167,35,0.35);
  border-radius: 3px;
  padding: 1px 2px;
}
.sn-editor .ProseMirror sup { font-size: 0.7em; vertical-align: super; }
.sn-editor .ProseMirror sub { font-size: 0.7em; vertical-align: sub; }
.sn-editor .ProseMirror a.sn-editor-link {
  color: #2D6A4F;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.sn-editor .ProseMirror a.sn-editor-link:hover { color: #1B4332; }
.sn-editor .ProseMirror code {
  background: rgba(28,20,16,0.07);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  color: #1C1410;
}
.sn-editor .ProseMirror pre {
  background: #1C1410;
  border-radius: 12px;
  padding: 20px 22px;
  overflow-x: auto;
  margin: 1.5em 0;
}
.sn-editor .ProseMirror pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  color: #FAF8F4;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.7;
}
/* lowlight token colors */
.sn-editor .ProseMirror pre .hljs-keyword { color: #F4A723; }
.sn-editor .ProseMirror pre .hljs-string { color: #95E5AB; }
.sn-editor .ProseMirror pre .hljs-number { color: #79C0FF; }
.sn-editor .ProseMirror pre .hljs-comment { color: #8A7E6A; font-style: italic; }
.sn-editor .ProseMirror pre .hljs-function { color: #B8F2E6; }
.sn-editor .ProseMirror pre .hljs-title { color: #D2A8FF; }
.sn-editor .ProseMirror pre .hljs-built_in { color: #79C0FF; }
.sn-editor .ProseMirror pre .hljs-attr { color: #95E5AB; }
.sn-editor .ProseMirror blockquote {
  border-left: 4px solid #F4A723;
  padding-left: 18px;
  margin: 1.5em 0;
  color: #5C524A;
  font-style: italic;
}
.sn-editor .ProseMirror hr {
  border: none;
  border-top: 2px solid rgba(28,20,16,0.1);
  margin: 2.5em 0;
}
.sn-editor .ProseMirror ul, .sn-editor .ProseMirror ol {
  padding-left: 1.6em;
  margin: 0.5em 0 1em;
}
.sn-editor .ProseMirror li { margin: 0.3em 0; }
.sn-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.5em; }
.sn-editor .ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0.5em 0;
}
.sn-editor .ProseMirror ul[data-type="taskList"] li > label {
  flex-shrink: 0;
  margin-top: 2px;
}
.sn-editor .ProseMirror ul[data-type="taskList"] li > label input {
  accent-color: #2D6A4F;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.sn-editor .ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
.sn-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
  opacity: 0.5;
  text-decoration: line-through;
}
.sn-editor .ProseMirror img.sn-editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  display: block;
  margin: 1.5em auto;
  box-shadow: 0 4px 20px rgba(28,20,16,0.12);
  object-fit: cover;
}
.sn-editor .ProseMirror img.sn-editor-image.ProseMirror-selectednode {
  outline: 3px solid #2D6A4F;
  outline-offset: 2px;
}
/* drag-and-drop placeholder */
.sn-editor .ProseMirror .ProseMirror-dropcursor {
  border-left: 2px solid #2D6A4F;
}
/* focus ring */
.sn-editor .ProseMirror:focus-visible { outline: none; }
/* selection color */
.sn-editor .ProseMirror ::selection { background: rgba(45,106,79,0.18); }
/* scrollbar hide for toolbar */
.sn-toolbar::-webkit-scrollbar { display: none; }
`

let stylesInjected = false

function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = EDITOR_STYLES
  document.head.appendChild(style)
  stylesInjected = true
}

// ─────────────── Main RichTextEditor ───────────────

export type RichTextEditorProps = {
  initialContent?: JSONContent | null
  onChange?: (content: JSONContent) => void
  saveStatus?: SaveStatus
  placeholder?: string
  readOnly?: boolean
}

export function RichTextEditor({
  initialContent,
  onChange,
  saveStatus = 'idle',
  placeholder = 'Start writing your story…',
  readOnly = false,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    injectStyles()
  }, [])

  const handleUpdate = useCallback(({ editor }: { editor: TiptapEditor }) => {
    onChangeRef.current?.(editor.getJSON())
  }, [])

  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: initialContent ?? undefined,
    editable: !readOnly,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'sn-editor-prosemirror',
        spellcheck: 'true',
      },
      handleDrop(view, event, _slice, moved) {
        // Handle image drop
        const files = event.dataTransfer?.files
        if (!files?.length) return false

        const imageFile = Array.from(files).find(f => f.type.startsWith('image/'))
        if (!imageFile) return false

        event.preventDefault()
        const { tr, schema } = view.state
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!coordinates) return false

        // Emit to parent to handle upload; we use a custom event
        const uploadEvent = new CustomEvent('sn-editor-drop-image', { detail: { file: imageFile, pos: coordinates.pos } })
        view.dom.dispatchEvent(uploadEvent)
        return moved
      },
      handlePaste(view, event) {
        // Handle clipboard image paste
        const items = event.clipboardData?.items
        if (!items) return false

        const imageItem = Array.from(items).find(item => item.type.startsWith('image/'))
        if (!imageItem) return false

        event.preventDefault()
        const file = imageItem.getAsFile()
        if (!file) return false

        const pasteEvent = new CustomEvent('sn-editor-paste-image', { detail: { file } })
        view.dom.dispatchEvent(pasteEvent)
        return true
      },
    },
  })

  // Handle drop/paste images via custom events → upload → insert
  const { uploadFile } = useImageUploadSilent(editor)
  useEffect(() => {
    const dom = editor?.view.dom
    if (!dom) return

    function onDropImage(e: Event) {
      const { file, pos } = (e as CustomEvent<{ file: File; pos: number }>).detail
      uploadFile(file, pos)
    }
    function onPasteImage(e: Event) {
      const { file } = (e as CustomEvent<{ file: File }>).detail
      uploadFile(file)
    }

    dom.addEventListener('sn-editor-drop-image', onDropImage)
    dom.addEventListener('sn-editor-paste-image', onPasteImage)
    return () => {
      dom.removeEventListener('sn-editor-drop-image', onDropImage)
      dom.removeEventListener('sn-editor-paste-image', onPasteImage)
    }
  }, [editor, uploadFile])

  return (
    <div
      className="sn-editor"
      style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.09)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 10px 32px rgba(28,20,16,0.05)',
      }}
    >
      {!readOnly && editor && (
        <div
          className="sn-toolbar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#fff',
            borderBottom: '1px solid rgba(28,20,16,0.07)',
          }}
        >
          <EditorToolbar editor={editor} />
        </div>
      )}

      <EditorContent editor={editor} />

      <StatusBar editor={editor} saveStatus={saveStatus} />
    </div>
  )
}

// ─────────────── Silent image uploader for drop/paste ───────────────

import { useImageUpload } from './hooks'

function useImageUploadSilent(editor: TiptapEditor | null) {
  const { uploadFile: upload } = useImageUpload()

  const uploadFile = useCallback(async (file: File, insertPos?: number) => {
    const url = await upload(file)
    if (!url || !editor) return

    if (insertPos !== undefined) {
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, { type: 'image', attrs: { src: url } })
        .run()
    } else {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, upload])

  return { uploadFile }
}
