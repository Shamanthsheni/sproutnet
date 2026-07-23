import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar, { type NavbarUser } from '@/app/components/navbar'
import { ProfileClient } from './profile-client'

const AVATAR_COLORS = ['#2D6A4F', '#1E40AF', '#9C6344', '#6B4C2A', '#3D8A65', '#4A3F38', '#7C3AED', '#BE123C']

export type ProfileUser = {
  id: string
  name: string
  dept: string | null
  year: string | null
  role: string
  profile_slug: string | null
  builder_score: number | null
  attempted: number | null
  avg_score: number | null
  milestones_done: number | null
  bio: string | null
  github: string | null
  linkedin: string | null
  twitter: string | null
  avatar_url: string | null
}

export type LeaderboardNeighbor = {
  rank: number
  name: string
  profile_slug: string
  builder_score: number
}

export type RecentSubmission = {
  id: string
  problem_title: string | null
  problem_slug: string | null
  score: number | null
  status: string
  created_at: string
}

export type EnrollmentProgress = {
  problem_id: string
  problem_title: string | null
  milestone: number
  total_milestones: number
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: auth } = await supabase.auth.getUser()

  let profile: ProfileUser | null = null

  const { data: bySlug } = await admin
    .from('users')
    .select('id, name, dept, year, role, profile_slug, builder_score, attempted, avg_score, milestones_done, bio, github, linkedin, twitter, avatar_url')
    .eq('profile_slug', slug)
    .maybeSingle()

  if (bySlug) {
    profile = bySlug as ProfileUser
  } else {
    const { data: byId } = await admin
      .from('users')
      .select('id, name, dept, year, role, profile_slug, builder_score, attempted, avg_score, milestones_done, bio, github, linkedin, twitter, avatar_url')
      .eq('id', slug)
      .maybeSingle()
    if (byId) profile = byId as ProfileUser
  }

  if (!profile) {
    notFound()
  }

  const userProfile = profile as ProfileUser
  const isOwnProfile = auth.user?.id === userProfile.id

  let currentUser: NavbarUser | null = null
  if (auth?.user) {
    const { data: curProfile } = await supabase
      .from('users')
      .select('id, name, role, is_master, profile_slug')
      .eq('id', auth.user.id)
      .single()
    if (curProfile) currentUser = curProfile as NavbarUser
  }

  const { data: leaderboardRows } = await admin
    .from('leaderboard')
    .select('rank, builder_score, name, profile_slug')
    .order('builder_score', { ascending: false })

  const allEntries = (leaderboardRows ?? []) as LeaderboardNeighbor[]
  const myEntry = allEntries.find(e => e.profile_slug === slug)

  let neighbors: LeaderboardNeighbor[] = []
  if (myEntry) {
    const myIdx = allEntries.findIndex(e => e.profile_slug === slug)
    const start = Math.max(0, myIdx - 2)
    const end = Math.min(allEntries.length, myIdx + 3)
    neighbors = allEntries.slice(start, end)
  }

  const { data: submissionRows } = await admin
    .from('submissions')
    .select('id, score, status, created_at, problems(title)')
    .eq('student_id', userProfile.id)
    .eq('status', 'judged')
    .order('created_at', { ascending: false })
    .limit(10)

  const submissions = ((submissionRows ?? []) as any as Array<{
    id: string; score: number | null; status: string; created_at: string;
    problems: { title: string | null } | null
  }>).map(s => ({
    id: s.id,
    problem_title: s.problems?.title ?? null,
    score: s.score,
    status: s.status,
    created_at: s.created_at,
  })) as RecentSubmission[]

  const { data: enrollRows } = await admin
    .from('enrollments')
    .select('problem_id, milestone, problems(title, total_milestones)')
    .eq('student_id', userProfile.id)
    .neq('status', 'completed')
    .limit(10)

  const enrollments = ((enrollRows ?? []) as any as Array<{
    problem_id: string; milestone: number;
    problems: { title: string | null; total_milestones: number | null } | null
  }>).map(e => ({
    problem_id: e.problem_id,
    problem_title: e.problems?.title ?? null,
    milestone: e.milestone,
    total_milestones: e.problems?.total_milestones ?? 1,
  })) as EnrollmentProgress[]

  const ac = avatarColor(userProfile.name)
  const init = initials(userProfile.name)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={currentUser} />
      <div style={{ flex: 1 }}>
        <ProfileClient
          profile={userProfile}
          isOwnProfile={isOwnProfile}
          neighbors={neighbors}
          myRank={myEntry?.rank ?? null}
          submissions={submissions}
          enrollments={enrollments}
          avatarColor={ac}
          initials={init}
        />
      </div>
    </div>
  )
}
