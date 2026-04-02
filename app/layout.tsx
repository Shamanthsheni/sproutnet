import type { Metadata } from 'next'
import ThemeControl from '@/app/ui/theme-control'
import { createClient } from '@/lib/supabase/server'
import './globals.css'

const themeScript = `
  (function () {
    var storageKey = 'sproutnet-theme-preference';
    var root = document.documentElement;
    var storedPreference = null;

    try {
      storedPreference = window.localStorage.getItem(storageKey);
    } catch (error) {}

    var preference =
      storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system'
        ? storedPreference
        : 'system';

    var resolvedTheme =
      preference === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preference;

    root.dataset.themePreference = preference;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  })();
`

export const metadata: Metadata = {
  title: 'SproutNet - Structured Thinking for Real India',
  description: 'India has real problems. You have real ideas.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" data-theme="light" data-theme-preference="system" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="sn-root">
        {children}
        {!user ? <ThemeControl /> : null}
      </body>
    </html>
  )
}
