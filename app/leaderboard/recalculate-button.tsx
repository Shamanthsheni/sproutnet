'use client'

import { useState } from 'react'

export default function RecalculateButton() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {result && (
        <span style={{ fontSize: 11, color: result.includes('Error') ? '#F87171' : '#34D399', fontFamily: 'JetBrains Mono, monospace' }}>
          {result}
        </span>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setResult(null)
          try {
            const res = await fetch('/api/leaderboard/recalculate', { method: 'POST' })
            const data = await res.json()
            if (data.ok) {
              const count = data.recalculated?.length ?? 0
              setResult(`${count} student${count !== 1 ? 's' : ''} recalculated`)
            } else {
              setResult(`Error: ${data.error ?? 'unknown'}`)
            }
          } catch {
            setResult('Error: network failure')
          }
          setBusy(false)
        }}
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
          color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 6,
          padding: '6px 14px', cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.6 : 1, whiteSpace: 'nowrap',
        }}
      >
        {busy ? 'Recalculating...' : 'Recalculate'}
      </button>
    </div>
  )
}
