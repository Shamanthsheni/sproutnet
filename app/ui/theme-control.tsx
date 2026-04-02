'use client'

import { useEffect, useState } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'sproutnet-theme-preference'
const PROMPT_STORAGE_KEY = 'sproutnet-theme-intro-seen'
const THEME_CHANGE_EVENT = 'sproutnet-theme-change'

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function hasSeenThemePrompt() {
  try {
    return window.localStorage.getItem(PROMPT_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markThemePromptSeen() {
  try {
    window.localStorage.setItem(PROMPT_STORAGE_KEY, '1')
  } catch {}
}

function applyTheme(preference: ThemePreference, persist = true, broadcast = true) {
  const resolvedTheme = resolveTheme(preference)
  const root = document.documentElement

  root.dataset.themePreference = preference
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme

  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference)
    } catch {}
  }

  if (broadcast) {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { preference } }))
  }
}

function getInitialPreference(): ThemePreference {
  if (typeof document !== 'undefined') {
    const fromDom = document.documentElement.dataset.themePreference
    if (isThemePreference(fromDom ?? null)) {
      return fromDom
    }
  }

  if (typeof window !== 'undefined') {
    const fromStorage = getStoredPreference()
    if (isThemePreference(fromStorage)) {
      return fromStorage
    }
  }

  return 'system'
}

function ThemeButtons({
  themePreference,
  onChange,
}: {
  themePreference: ThemePreference
  onChange: (nextPreference: ThemePreference) => void
}) {
  return (
    <div className="sn-theme-toggle" role="group" aria-label="Choose theme">
      {OPTIONS.map((option) => {
        const active = themePreference === option.value

        return (
          <button
            key={option.value}
            type="button"
            className={`sn-theme-option${active ? ' is-active' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function useThemePreference() {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getInitialPreference())

  useEffect(() => {
    applyTheme(themePreference, false, false)
  }, [themePreference])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = () => {
      if (getInitialPreference() === 'system') {
        applyTheme('system', false, true)
      }
    }

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ preference?: ThemePreference }>).detail
      if (detail?.preference && isThemePreference(detail.preference)) {
        setThemePreference(detail.preference)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)
    }
  }, [])

  function updateThemePreference(nextPreference: ThemePreference, markPromptAsSeen = false) {
    setThemePreference(nextPreference)
    applyTheme(nextPreference, true, true)

    if (markPromptAsSeen) {
      markThemePromptSeen()
    }
  }

  return { themePreference, updateThemePreference }
}

export function ThemeSettingsCard({
  label = 'Profile settings',
  title = 'Theme preference',
  copy = 'After your first visit, change the interface here whenever you want.',
}: {
  label?: string
  title?: string
  copy?: string
}) {
  const { themePreference, updateThemePreference } = useThemePreference()

  return (
    <div className="sn-theme-settings sn-stack-sm">
      <div className="sn-panel-label">{label}</div>
      <h3 className="sn-card-title">{title}</h3>
      <p className="sn-card-copy">{copy}</p>
      <div className="sn-theme-meta">Choose theme</div>
      <ThemeButtons themePreference={themePreference} onChange={(nextPreference) => updateThemePreference(nextPreference)} />
    </div>
  )
}

export default function ThemeControl() {
  const { themePreference, updateThemePreference } = useThemePreference()
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false

    const promptSeen = hasSeenThemePrompt()
    const storedPreference = getStoredPreference()

    if (!promptSeen && isThemePreference(storedPreference)) {
      markThemePromptSeen()
      return false
    }

    return !promptSeen
  })

  if (!isVisible) return null

  return (
    <div className="sn-theme-welcome sn-stack-md" role="dialog" aria-labelledby="sn-theme-dialog-title">
      <div className="sn-stack-sm">
        <div className="sn-theme-meta">Choose theme</div>
        <h2 id="sn-theme-dialog-title" className="sn-card-title">
          Pick your theme
        </h2>
        <p className="sn-card-copy">
          Choose how SproutNet should look on this device. Later, you can change it from your profile settings.
        </p>
      </div>

      <ThemeButtons
        themePreference={themePreference}
        onChange={(nextPreference) => {
          updateThemePreference(nextPreference, true)
          setIsVisible(false)
        }}
      />
    </div>
  )
}
