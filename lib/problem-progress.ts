export const PROBLEM_PROGRESS_BUCKET = 'submission-progress'
export const PROBLEM_PROGRESS_MAX_BYTES = 15 * 1024 * 1024
const PROGRESS_FILES_MARKER_START = '<!--progress-files'
const PROGRESS_FILES_MARKER_END = 'progress-files-->'

export const PROBLEM_PROGRESS_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const PROBLEM_PROGRESS_ACCEPT = PROBLEM_PROGRESS_ALLOWED_TYPES.join(',')

export type ProgressUploadItem = {
  name: string
  url: string
}

export function getProblemProgressUploadError(file: File) {
  if (!PROBLEM_PROGRESS_ALLOWED_TYPES.includes(file.type)) {
    return 'Use PDF, Office, CSV, ZIP, JPG, PNG, or WebP files for progress uploads.'
  }

  if (file.size > PROBLEM_PROGRESS_MAX_BYTES) {
    return 'Each progress upload must be 15 MB or smaller.'
  }

  return null
}

export function sanitizeProblemProgressFileName(name: string) {
  const lastDot = name.lastIndexOf('.')
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'progress-file'
  const extension = (lastDot >= 0 ? name.slice(lastDot + 1) : 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) || 'bin'

  return `${base}.${extension}`
}

export function serializeProgressUploads(text: string, files: ProgressUploadItem[]) {
  const cleanText = text.trim()
  if (files.length === 0) return cleanText

  const serializedFiles = JSON.stringify(files)
  return [
    cleanText,
    '',
    PROGRESS_FILES_MARKER_START,
    serializedFiles,
    PROGRESS_FILES_MARKER_END,
  ].filter(Boolean).join('\n')
}

export function parseProgressUploads(value: string | null | undefined) {
  if (!value) {
    return {
      text: '',
      files: [] as ProgressUploadItem[],
    }
  }

  const startIndex = value.indexOf(PROGRESS_FILES_MARKER_START)
  const endIndex = value.indexOf(PROGRESS_FILES_MARKER_END)

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      text: value,
      files: [] as ProgressUploadItem[],
    }
  }

  const text = value.slice(0, startIndex).trimEnd()
  const rawPayload = value
    .slice(startIndex + PROGRESS_FILES_MARKER_START.length, endIndex)
    .trim()

  try {
    const parsed = JSON.parse(rawPayload)
    const files = Array.isArray(parsed)
      ? parsed.filter((item): item is ProgressUploadItem => (
          typeof item?.name === 'string' &&
          typeof item?.url === 'string'
        ))
      : []

    return { text, files }
  } catch {
    return {
      text,
      files: [] as ProgressUploadItem[],
    }
  }
}
