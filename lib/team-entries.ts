import type { SupabaseClient } from '@supabase/supabase-js'

// Team-entry resolution: a submission counts as a TEAM entry when the student
// is a member of a team working on that problem — regardless of what the
// participant_type toggle said at submit time.

type TeamMembershipRow = {
  user_id: string
  teams: { problem_id: string } | null
}

export async function getTeamEntryKeys(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()

  const { data } = await admin
    .from('team_members')
    .select('user_id, teams!inner(problem_id)')
    .in('user_id', userIds)

  const keys = new Set<string>()
  for (const row of (data ?? []) as unknown as TeamMembershipRow[]) {
    if (row.teams?.problem_id) keys.add(`${row.user_id}:${row.teams.problem_id}`)
  }
  return keys
}

export function resolveParticipantType(
  storedType: string | null | undefined,
  userId: string,
  problemId: string,
  teamKeys: Set<string>
): 'team' | 'individual' {
  if (teamKeys.has(`${userId}:${problemId}`)) return 'team'
  return storedType === 'team' ? 'team' : 'individual'
}
