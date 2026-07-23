'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ProfileData = {
  name: string
  dept: string
  year: string
  bio: string
  github: string
  linkedin: string
  twitter: string
  profile_slug: string
}

export function EditProfile({ data, onClose }: { data: ProfileData; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState(data)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof ProfileData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to save')
      return
    }
    onClose()
    router.refresh()
  }

  const fields: Array<{ key: keyof ProfileData; label: string; placeholder: string; type?: string }> = [
    { key: 'name', label: 'Full Name', placeholder: 'Your name' },
    { key: 'dept', label: 'Department', placeholder: 'Computer Science' },
    { key: 'year', label: 'Year', placeholder: '3rd Year' },
    { key: 'profile_slug', label: 'Profile URL', placeholder: 'your-slug', type: 'slug' },
    { key: 'bio', label: 'Bio', placeholder: 'Tell us about yourself…', type: 'textarea' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
    { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(28,20,16,0.4)', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 0',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1C1410', margin: 0 }}>
            Edit Profile
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: '#9CA3A0', padding: '4px 8px', borderRadius: 6,
          }}>✕</button>
        </div>

        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{
                fontSize: 11, fontWeight: 600, color: '#6B5E52',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: 4,
              }}>
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid rgba(28,20,16,0.1)',
                    fontSize: 14, color: '#1C1410', resize: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {f.type === 'slug' && (
                    <span style={{ fontSize: 13, color: '#9CA3A0', fontFamily: 'JetBrains Mono, monospace' }}>
                      /profile/
                    </span>
                  )}
                  <input
                    value={form[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid rgba(28,20,16,0.1)',
                      fontSize: 14, color: '#1C1410',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {error && (
            <div style={{ fontSize: 13, color: '#DC2626', padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              border: '1.5px solid rgba(28,20,16,0.1)',
              background: '#fff', color: '#4A3F38',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              border: 'none', background: saving ? '#D4D0C8' : '#1C1410',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
