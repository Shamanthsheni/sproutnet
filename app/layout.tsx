import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SproutNet - Structured Thinking for Real India',
  description: 'India has real problems. You have real ideas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="sn-root">{children}</body>
    </html>
  )
}
