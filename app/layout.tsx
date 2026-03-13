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
          .sn-mobile-menu { display: none; position: relative; }
          .sn-mobile-menu summary {
            list-style: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid rgba(28,20,16,0.14);
            background: #ffffff;
            color: inherit;
            cursor: pointer;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
          }
          .sn-mobile-menu summary::-webkit-details-marker { display: none; }
          .sn-mobile-menu summary:focus-visible {
            outline: 2px solid rgba(45,106,79,0.4);
            outline-offset: 2px;
          }
          .sn-menu-icon {
            width: 18px;
            height: 2px;
            background: currentColor;
            border-radius: 2px;
            position: relative;
            display: inline-block;
          }
          .sn-menu-icon::before,
          .sn-menu-icon::after {
            content: '';
            position: absolute;
            left: 0;
            width: 18px;
            height: 2px;
            background: currentColor;
            border-radius: 2px;
          }
          .sn-menu-icon::before { top: -6px; }
          .sn-menu-icon::after { top: 6px; }
          .sn-mobile-panel {
            position: absolute;
            right: 0;
            top: calc(100% + 10px);
            min-width: 220px;
            max-width: calc(100vw - 32px);
            background: #ffffff;
            border: 1px solid rgba(28,20,16,0.12);
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 12px 30px rgba(28,20,16,0.16);
            z-index: 999;
          }
          .sn-mobile-panel a {
            display: block;
            padding: 8px 10px;
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #1C1410;
            text-decoration: none;
          }
          .sn-mobile-panel a:hover { background: rgba(28,20,16,0.06); }
          .sn-mobile-panel a + a { margin-top: 4px; }
          .sn-menu-primary {
            background: #F4A723;
            color: #1C1410;
            font-weight: 600;
          }
          .sn-menu-primary:hover { background: #F9C05A; }
          .sn-menu-ghost {
            background: rgba(28,20,16,0.04);
            color: #4A3F38;
            font-weight: 500;
          }
          @media (max-width: 900px) {
            .sn-nav-links,
            .sn-nav-actions {
              display: none !important;
            }
            .sn-mobile-menu { display: block; }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
