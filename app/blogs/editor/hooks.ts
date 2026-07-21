'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JSONContent } from '@tiptap/react'

const BUCKET = 'blog-images'
const MAX_FILE_SIZE_MB = 10
const COMPRESS_ABOVE_MB = 2

export type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export type UseImageUploadReturn = {
  uploadFile: (file: File) => Promise<string | null>
  uploadState: UploadState
  uploadProgress: number
  uploadError: string | null
  resetUpload: () => void
}

async function compressImage(file: File, maxMB: number): Promise<File> {
  // dynamic import to keep bundle lean
  const { default: imageCompression } = await import('browser-image-compression')
  return imageCompression(file, {
    maxSizeMB: maxMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/webp' | 'image/png',
  })
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const resetUpload = useCallback(() => {
    setUploadState('idle')
    setUploadProgress(0)
    setUploadError(null)
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    // Validate
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.')
      setUploadState('error')
      return null
    }

    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!acceptedTypes.includes(file.type)) {
      setUploadError('Accepted formats: PNG, JPG, WEBP, GIF.')
      setUploadState('error')
      return null
    }

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setUploadError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      setUploadState('error')
      return null
    }

    setUploadState('uploading')
    setUploadProgress(10)
    setUploadError(null)

    try {
      let fileToUpload = file

      // Compress large images
      if (sizeMB > COMPRESS_ABOVE_MB) {
        setUploadProgress(20)
        fileToUpload = await compressImage(file, COMPRESS_ABOVE_MB)
      }

      setUploadProgress(50)

      const supabase = createClient()
      const ext = fileToUpload.name.split('.').pop() ?? 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileToUpload.type,
        })

      if (error) {
        // Give a clear setup instruction when the bucket hasn't been created yet
        const msg = error.message ?? ''
        if (
          msg.toLowerCase().includes('bucket not found') ||
          msg.toLowerCase().includes('bucket_not_found')
        ) {
          throw new Error(
            'Storage not set up yet. Run supabase/migrations/20260722_create_blog_images_bucket.sql in your Supabase SQL Editor, then refresh.'
          )
        }
        throw new Error(msg || 'Upload failed.')
      }

      setUploadProgress(90)

      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      setUploadProgress(100)
      setUploadState('done')

      return publicData.publicUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      setUploadError(message)
      setUploadState('error')
      return null
    }
  }, [])

  return { uploadFile, uploadState, uploadProgress, uploadError, resetUpload }
}

// --------------- Autosave hook ---------------

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type UseAutosaveOptions = {
  content: JSONContent | null
  onSave: (content: JSONContent) => Promise<void>
  intervalMs?: number
  debounceMs?: number
  enabled?: boolean
}

export function useAutosave({
  content,
  onSave,
  intervalMs = 5000,
  debounceMs = 1000,
  enabled = true,
}: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const lastSavedRef = useRef<string>('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3

  const doSave = useCallback(async (snapshot: JSONContent) => {
    const serialized = JSON.stringify(snapshot)
    if (serialized === lastSavedRef.current) return

    setSaveStatus('saving')
    try {
      await onSave(snapshot)
      lastSavedRef.current = serialized
      retryCountRef.current = 0
      setSaveStatus('saved')

      // Reset to idle after a brief "Saved" indicator period
      setTimeout(() => setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev)), 3000)
    } catch {
      retryCountRef.current += 1
      setSaveStatus('error')

      if (retryCountRef.current < MAX_RETRIES) {
        setTimeout(() => doSave(snapshot), 2000 * retryCountRef.current)
      }
    }
  }, [onSave])

  // Debounced save triggered by content changes
  useEffect(() => {
    if (!enabled || !content) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      doSave(content)
    }, debounceMs)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [content, doSave, debounceMs, enabled])

  // Interval-based save as a safety net
  useEffect(() => {
    if (!enabled || !content) return

    const interval = setInterval(() => {
      doSave(content)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [content, doSave, intervalMs, enabled])

  return { saveStatus }
}

// --------------- Word / char count helpers ---------------

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function estimateReadingTime(wordCount: number): string {
  const WPM = 200
  const minutes = Math.ceil(wordCount / WPM)
  if (minutes < 1) return '< 1 min read'
  return `${minutes} min read`
}
