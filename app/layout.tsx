import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SproutNet — Structured Thinking for Real India',
  description: 'India has real problems. You have real ideas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Sora:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{__html: `
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'DM Sans', sans-serif;
            font-size: 16px;
            line-height: 1.5;
            background: #FAF8F4;
            color: #1C1410;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}