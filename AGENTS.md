# SproutNet — Agent Guide

## Quick start
```bash
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint 9 flat config (eslint.config.mjs)
npm run start    # start production server
```

## Stack
- **Next.js 16.1.6** (App Router) + **React 19.2.3** + **TypeScript 5**
- **Tailwind CSS v4** via `@tailwindcss/postcss` (minimal usage; most CSS is inline `<style>` tags)
- **Supabase** (auth, database, storage via `@supabase/ssr`)
- **Tiptap 3.28** rich text editor (blogs)
- No testing framework is set up.

## Project structure
```
app/
  (auth)/login/{student,poster}/  role-based login pages
  (auth)/join/                     registration (email domain gated)
  dashboard/                       student dashboard
  poster/{dashboard,post-problem,problems,solutions}/
  admin/{judging,analytics,problems}/
  blogs/{editor,manage,new}/       community blog feed + Tiptap editor
  problems/[id]/                   dynamic problem detail + submit
  profile/[slug]/                  public user profile
  api/{auth,problems,enrollments,submissions,blogs}/
lib/
  supabase/{client,server,admin}.ts  3 Supabase client factories
  blogs.ts + blogs.server.ts          blog feed builder
  blogs-local.server.ts               local JSON fallback for blogs
  enrollment-progress.ts              active enrollment limits
  problem-progress.ts                 progress upload helpers
  problem-thumbnail.ts                thumbnail upload helpers
proxy.ts                              auth middleware (see below)
supabase/migrations/                  raw SQL (apply manually in Supabase dashboard)
```

## Key non-obvious patterns

### Middleware in `proxy.ts` (NOT `middleware.ts`)
Auth middleware lives in `proxy.ts` with a `config.matcher` export. It:
- Protects non-public routes by redirecting unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/join`
- Forbids non-student access to `/problems/[id]/submit`
- Forbids non-poster/non-admin access to `/post-problem`
- Public routes are listed inline; add new public routes there too

### Three Supabase clients
| File | Usage |
|------|-------|
| `lib/supabase/client.ts` | Browser (`createBrowserClient`) — use in `'use client'` components |
| `lib/supabase/server.ts` | Server (`createServerClient` with cookie store) — use in server components and API routes |
| `lib/supabase/admin.ts` | Service role (`SUPABASE_SERVICE_ROLE_KEY`), no session — use for admin-only operations |

Admin client (`createAdminClient`) is used in dashboards and API routes for cross-user queries.

### Blog local fallback
When Supabase blog tables don't exist (migration not applied), blogs fall back to `.data/blogs.json` (gitignored via `.data/`). Controlled by env `BLOGS_ALLOW_LOCAL_FALLBACK` (default `true`). The fallback is a full read-write store.

### Supabase migrations
SQL files in `supabase/migrations/` must be applied manually in the Supabase SQL editor. No migration runner is configured.

### CSS style
Most styling uses inline `<style>` tags in `page.tsx` with CSS-in-JS via `dangerouslySetInnerHTML`. `globals.css` is minimal (mostly Tailwind import + responsive overrides). **Do not add Tailwind utility classes** — match the existing inline style approach.

### Enrollments
- Students can have at most `MAX_ACTIVE_ENROLLMENTS = 2` active enrollments at once.
- Enrollments auto-complete when all milestones are submitted (checked in `syncCompletedEnrollments`).

### Registration
- Student signup checks `allowed_domains` table — only `@jyothyit.ac.in` is configured during Phase 1.
- New users are created via `supabase.auth.signUp()`, then profile fields updated in the `users` table.

### Env
`.env` is **committed** (Supabase URL + keys) despite `.env*` in `.gitignore`. Needed for local dev. Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.

### File uploads
- Problem thumbnails: `problem-thumbnails` bucket, max 5 MB, JPG/PNG/WebP/GIF
- Submission progress: `submission-progress` bucket, max 15 MB, PDF/Office/CSV/ZIP/images
- Post-problem form inserts via admin client with a fallback for missing `thumbnail_url` column
