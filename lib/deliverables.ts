export const DELIVERABLES_BUCKET = 'deliverables'
export const DELIVERABLE_MAX_BYTES = 25 * 1024 * 1024
export const MAX_DELIVERABLES = 5

export type DeliverableItem = {
  kind: 'link' | 'file'
  label: string
  url: string
  name?: string
}

export function isDeliverableItem(value: unknown): value is DeliverableItem {
  const item = value as DeliverableItem | null
  return (
    !!item &&
    (item.kind === 'link' || item.kind === 'file') &&
    typeof item.label === 'string' &&
    typeof item.url === 'string'
  )
}

export function parseDeliverables(value: unknown): DeliverableItem[] {
  if (!Array.isArray(value)) return []
  return value.filter(isDeliverableItem)
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeDeliverableFileName(name: string) {
  const lastDot = name.lastIndexOf('.')
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file'
  const extension = (lastDot >= 0 ? name.slice(lastDot + 1) : 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12) || 'bin'

  return `${base}.${extension}`
}
