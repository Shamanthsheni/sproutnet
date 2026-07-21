'use client'

import { useRef, useState } from 'react'
import { useImageUpload } from './hooks'

type CoverImageProps = {
  value: string | null
  onChange: (url: string | null) => void
}

export function CoverImage({ value, onChange }: CoverImageProps) {
  const { uploadFile, uploadState, uploadProgress, uploadError, resetUpload } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isUploading = uploadState === 'uploading'

  async function handleFile(file: File) {
    const url = await uploadFile(file)
    if (url) {
      onChange(url)
      setTimeout(resetUpload, 2000)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  if (value) {
    return (
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', marginBottom: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Cover"
          style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: '#FAF8F4',
              background: 'rgba(28,20,16,0.72)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: '#FAF8F4',
              background: 'rgba(220,38,38,0.8)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
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

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload cover image"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
      style={{
        border: `2px dashed ${isDragging ? '#2D6A4F' : 'rgba(28,20,16,0.15)'}`,
        borderRadius: 16,
        padding: '28px 20px',
        textAlign: 'center',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        background: isDragging ? 'rgba(45,106,79,0.05)' : '#FAF8F4',
        marginBottom: 24,
        transition: 'border-color 0.2s, background 0.2s',
        outline: 'none',
      }}
    >
      {isUploading ? (
        <>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D6A4F', marginBottom: 8 }}>
            Uploading… {uploadProgress}%
          </div>
          <div style={{ width: '100%', maxWidth: 200, height: 4, background: 'rgba(28,20,16,0.1)', borderRadius: 99, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#2D6A4F', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </>
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(28,20,16,0.35)" strokeWidth="1.5" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C524A', marginBottom: 4 }}>
            {isDragging ? 'Drop your cover image here' : 'Add a cover image'}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8A8078' }}>
            Click to upload or drag & drop — PNG, JPG, WEBP up to 10MB
          </div>
        </>
      )}
      {uploadError && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#DC2626', fontFamily: 'DM Sans, sans-serif' }}>
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
