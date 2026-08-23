// Run: npx tsx scripts/seed-test-data.ts
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('Seeding test data...\n')

  // 1. Create/ensure a poster user
  let posterId: string
  const { data: existingPoster } = await admin
    .from('users')
    .select('id, role')
    .eq('email', 'poster@sproutnet.test')
    .maybeSingle()

  if (existingPoster) {
    posterId = existingPoster.id
    console.log('  ↻ Poster already exists')
  } else {
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: 'poster@sproutnet.test',
      password: 'Test@123',
      email_confirm: true,
      user_metadata: { name: 'Test Poster', role: 'poster' }
    })
    if (authErr || !authUser?.user) {
      console.error('  ✗ Failed to create poster auth user:', authErr?.message)
      return
    }
    posterId = authUser.user.id
    await admin.from('users').upsert({
      id: posterId, email: 'poster@sproutnet.test', name: 'Test Poster', role: 'poster'
    }, { onConflict: 'id' })
    console.log('  ✓ Poster created')
  }

  // 2. Create a problem with team_mode = 'both'
  const { data: existingProblem } = await admin
    .from('problems')
    .select('id')
    .eq('title', 'Build a Smart Campus Navigation App')
    .maybeSingle()

  let problemId: string
  if (existingProblem) {
    problemId = existingProblem.id
    console.log('  ↻ Problem already exists')
  } else {
    const { data: prob, error: probErr } = await admin
      .from('problems')
      .insert({
        title: 'Build a Smart Campus Navigation App',
        domain: 'AI & Data',
        problem_type: 'public_impact',
        status: 'open',
        poster_id: posterId,
        context: 'College campuses can be confusing for new students and visitors. Wayfinding is a daily challenge — lecture halls, labs, admin blocks, and hostels are spread across large areas with minimal signage. This problem asks you to build a smart campus navigation solution that works indoors and outdoors.',
        problem_stmt: 'Design and develop a campus navigation application that helps students, faculty, and visitors find their way around campus. The solution should include indoor mapping, real-time directions, event-based routing, and accessibility-aware paths.',
        scope: 'The solution should cover:\n- Interactive campus map with building/room-level detail\n- Turn-by-turn navigation (indoor + outdoor)\n- Search by building, department, or room number\n- Event-based routing (find rooms for scheduled classes/events)\n- Accessibility-aware routes (ramps, elevators)\n- QR code-based location check-ins\n- Optional: crowd-sourced congestion data',
        constraints: '- Must work as a Progressive Web App (PWA)\n- Offline capability for cached campus maps\n- Privacy-first — no continuous location tracking\n- Must support Kannada and English\n- Load under 3 seconds on 4G',
        deliverables: '- Functional PWA with live demo\n- Source code repository\n- Deployment guide\n- 2-min demo video\n- Architecture document',
        milestones: 5,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        judging_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        reward_amount: null,
        team_mode: 'both',
        min_team_size: 1,
        max_team_size: 4,
        mentor_required: true,
        max_mentors_per_team: 2,
      })
      .select()
      .single()

    if (probErr || !prob) {
      console.error('  ✗ Failed to create problem:', probErr?.message)
      return
    }
    problemId = prob.id
    console.log('  ✓ Problem "Smart Campus Navigation" created with team_mode=both')
  }

  // 3. Create/ensure a student leader
  let leaderId: string
  const { data: existingLeader } = await admin
    .from('users')
    .select('id')
    .eq('email', 'leader@sproutnet.test')
    .maybeSingle()

  if (existingLeader) {
    leaderId = existingLeader.id
    console.log('  ↻ Leader already exists')
  } else {
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: 'leader@sproutnet.test',
      password: 'Test@123',
      email_confirm: true,
      user_metadata: { name: 'Team Leader', role: 'student' }
    })
    if (authErr || !authUser?.user) {
      console.error('  ✗ Failed to create leader auth user:', authErr?.message)
      return
    }
    leaderId = authUser.user.id
    await admin.from('users').upsert({
      id: leaderId, email: 'leader@sproutnet.test', name: 'Team Leader', role: 'student',
      dept: 'Computer Science', year: '3rd Year'
    }, { onConflict: 'id' })
    console.log('  ✓ Team leader created')
  }

  // 3b. Create/ensure an admin user
  const { data: existingAdmin } = await admin
    .from('users')
    .select('id')
    .eq('email', 'admin@sproutnet.test')
    .maybeSingle()

  if (existingAdmin) {
    console.log('  ↻ Admin already exists')
  } else {
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: 'admin@sproutnet.test',
      password: 'Test@123',
      email_confirm: true,
      user_metadata: { name: 'Test Admin', role: 'admin' }
    })
    if (authErr || !authUser?.user) {
      console.error('  ✗ Failed to create admin auth user:', authErr?.message)
    } else {
      await admin.from('users').upsert({
        id: authUser.user.id, email: 'admin@sproutnet.test', name: 'Test Admin', role: 'admin'
      }, { onConflict: 'id' })
      console.log('  ✓ Admin created')
    }
  }

  // 3c. Create/ensure a regular student (no team)
  const { data: existingStudent } = await admin
    .from('users')
    .select('id')
    .eq('email', 'student@sproutnet.test')
    .maybeSingle()

  if (existingStudent) {
    console.log('  ↻ Regular student already exists')
  } else {
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: 'student@sproutnet.test',
      password: 'Test@123',
      email_confirm: true,
      user_metadata: { name: 'Test Student', role: 'student' }
    })
    if (authErr || !authUser?.user) {
      console.error('  ✗ Failed to create student auth user:', authErr?.message)
    } else {
      await admin.from('users').upsert({
        id: authUser.user.id, email: 'student@sproutnet.test', name: 'Test Student', role: 'student',
        dept: 'Information Science', year: '2nd Year'
      }, { onConflict: 'id' })
      console.log('  ✓ Regular student created')
    }
  }

  // 3d. Enroll both test students in the test problem so they can upload solutions
  for (const email of ['leader@sproutnet.test', 'student@sproutnet.test']) {
    const { data: u } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (!u) continue

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('problem_id', problemId)
      .eq('student_id', u.id)
      .maybeSingle()

    if (enrollment) {
      if (enrollment.status !== 'active') {
        await admin.from('enrollments').update({ status: 'active' }).eq('id', enrollment.id)
        console.log(`  ✓ Enrollment reactivated for ${email}`)
      } else {
        console.log(`  ↻ ${email} already enrolled`)
      }
      continue
    }

    const { error: enrollErr } = await admin
      .from('enrollments')
      .insert({ problem_id: problemId, student_id: u.id, status: 'active' })
    if (enrollErr) {
      console.error(`  ✗ Failed to enroll ${email}:`, enrollErr.message)
    } else {
      console.log(`  ✓ Enrolled ${email} in test problem`)
    }
  }

  // 3e. Create an APPROVED submission for student@sproutnet.test
  // so the Stage-2 final upload page can be tested immediately.
  {
    const { data: u } = await admin
      .from('users')
      .select('id')
      .eq('email', 'student@sproutnet.test')
      .maybeSingle()

    if (u) {
      const { data: existingSub } = await admin
        .from('submissions')
        .select('id')
        .eq('problem_id', problemId)
        .eq('student_id', u.id)
        .maybeSingle()

      if (!existingSub) {
        const { error: subErr } = await admin.from('submissions').insert({
          problem_id: problemId,
          student_id: u.id,
          milestone: 1,
          total_milestones: 1,
          dept: 'Information Science',
          year: '2nd Year',
          stage: 'full',
          status: 'approved',
          score: 8,
          judge_feedback: 'Strong problem understanding. Approved — upload your final work.',
          participant_type: 'individual',
          final_deliverables: [],
          f_understanding: '<p>New students and visitors struggle to navigate the campus daily.</p>',
          f_solution: '<p>A PWA with indoor/outdoor maps, turn-by-turn directions, and QR check-ins.</p>',
          f_impact: '<p>Saves ~15 minutes per visitor per day across 5000+ students.</p>',
          f_rootcause: '<p>Campus grew organically; signage never kept pace with building layout changes.</p>',
          f_feasibility: '<p>Feasible with open map libraries and college floor-plan data.</p>',
          f_risks: '<p>Indoor map accuracy depends on timely updates from the admin office.</p>',
          f_implementation: '<p>MVP in 4 weeks: campus graph, search, basic routing. Phase 2: QR + events.</p>',
        })
        if (subErr) {
          console.error('  ✗ Failed to create approved submission:', subErr.message)
        } else {
          console.log('  ✓ Approved (Stage-1) submission created for student@sproutnet.test')
        }
      } else {
        console.log('  ↻ Approved submission already exists')
      }
    }
  }

  // 3f. Create a SECOND problem enrolled by student@sproutnet.test with NO submission,
  // so the same account can also test a fresh Stage-1 submission.
  {
    const { data: existingSecond } = await admin
      .from('problems')
      .select('id')
      .eq('title', 'Smart Waste Segregation Awareness Tracker')
      .maybeSingle()

    let secondProblemId: string
    if (existingSecond) {
      secondProblemId = existingSecond.id
      console.log('  ↻ Second test problem already exists')
    } else {
      const { data: prob, error: probErr } = await admin
        .from('problems')
        .insert({
          title: 'Smart Waste Segregation Awareness Tracker',
          domain: 'Climate',
          problem_type: 'public_impact',
          status: 'open',
          poster_id: posterId,
          context: 'Households and hostels mix wet and dry waste, making recycling inefficient. Awareness campaigns rarely measure whether behaviour actually changes.',
          problem_stmt: 'Build a tracker that helps students log and improve their waste segregation habits, with measurable weekly progress.',
          scope: '- Daily segregation logging with photo proof\n- Weekly streaks and hostel leaderboards\n- Simple analytics on waste patterns',
          constraints: '- Mobile-first web app\n- Works on low-end devices\n- Kannada and English support',
          deliverables: '- Working prototype\n- Source repository\n- Short demo video',
          milestones: 5,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          judging_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          reward_amount: null,
          team_mode: 'solo',
          min_team_size: 1,
          max_team_size: 1,
          mentor_required: false,
        })
        .select()
        .single()

      if (probErr || !prob) {
        console.error('  ✗ Failed to create second problem:', probErr?.message)
        secondProblemId = ''
      } else {
        secondProblemId = prob.id
        console.log('  ✓ Second problem "Smart Waste Segregation" created (team_mode=solo)')
      }
    }

    if (secondProblemId) {
      const { data: u } = await admin
        .from('users')
        .select('id')
        .eq('email', 'student@sproutnet.test')
        .maybeSingle()

      if (u) {
        const { data: enr } = await admin
          .from('enrollments')
          .select('id, status')
          .eq('problem_id', secondProblemId)
          .eq('student_id', u.id)
          .maybeSingle()

        if (!enr) {
          const { error: e2 } = await admin
            .from('enrollments')
            .insert({ problem_id: secondProblemId, student_id: u.id, status: 'active' })
          if (e2 && !String(e2.message).includes('duplicate')) {
            console.error('  ✗ Failed to enroll student in second problem:', e2.message)
          } else {
            console.log('  ✓ student@sproutnet.test enrolled in second problem (no submission yet)')
          }
        } else {
          console.log('  ↻ Already enrolled in second problem')
        }
      }
    }
  }

  // 4. Create a team
  const { data: existingTeam } = await admin
    .from('teams')
    .select('id')
    .eq('name', 'Campus Coders')
    .maybeSingle()

  let teamId: string
  if (existingTeam) {
    teamId = existingTeam.id
    console.log('  ↻ Team already exists')
  } else {
    const { data: team, error: teamErr } = await admin
      .from('teams')
      .insert({
        problem_id: problemId,
        leader_id: leaderId,
        name: 'Campus Coders',
        invite_code: 'SPROUT-TEST01'
      })
      .select()
      .single()

    if (teamErr || !team) {
      console.error('  ✗ Failed to create team:', teamErr?.message)
      return
    }
    teamId = team.id

    // Add leader to team_members
    await admin.from('team_members').insert({
      team_id: teamId, user_id: leaderId, role: 'leader'
    })

    // Create workspace & general channel
    const { data: workspace } = await admin
      .from('workspaces')
      .insert({ team_id: teamId, name: 'Campus Coders Workspace', status: 'active' })
      .select()
      .single()

    if (workspace) {
      const { data: channel } = await admin
        .from('conversations')
        .insert({
          workspace_id: workspace.id, type: 'channel',
          name: 'general', description: 'General workspace discussion',
          created_by: leaderId
        })
        .select()
        .single()

      if (channel) {
        await admin.from('conversation_members').insert({
          conversation_id: channel.id, user_id: leaderId
        })
      }
    }

    console.log('  ✓ Team "Campus Coders" created')
  }

  // 5. Find a mentor and assign to team
  const { data: mentorProfile } = await admin
    .from('mentor_profiles')
    .select('user_id')
    .limit(1)
    .single()

  if (mentorProfile) {
    const { data: existingAssignment } = await admin
      .from('mentor_assignments')
      .select('id')
      .eq('team_id', teamId)
      .eq('mentor_id', mentorProfile.user_id)
      .maybeSingle()

    if (!existingAssignment) {
      await admin.from('mentor_assignments').insert({
        team_id: teamId,
        mentor_id: mentorProfile.user_id,
        assigned_by: posterId,
        assignment_status: 'active'
      })
      console.log('  ✓ Mentor assigned to team')
    } else {
      console.log('  ↻ Mentor already assigned to team')
    }
  } else {
    console.log('  ⚠ No mentor profile found — run seed-mentors.ts first')
  }

  console.log('\nDone! Login credentials:')
  console.log('  Student (in team): leader@sproutnet.test / Test@123')
  console.log('  Test problem:       Build a Smart Campus Navigation App (team_mode=both)')
  console.log('  Team invite code:   SPROUT-TEST01')
}

main()
