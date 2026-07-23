import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type ProblemInput } from '@/lib/problem-evaluator'
import { evaluateProblemWithAI } from '@/lib/ai-evaluator'

const TEST_PROBLEMS: ProblemInput[] = [
  {
    title: 'Campus Lost & Found Platform',
    domain: 'Education',
    problem_type: 'public_impact',
    context: 'Every semester, hundreds of students lose items on campus — phones, wallets, ID cards, books, and laptops. Currently, lost items are reported verbally or through vague WhatsApp group messages that get lost in the noise. There is no centralized system to match lost items with found reports. Students waste hours searching for their belongings, and the admin office is flooded with inquiries.',
    problem_stmt: 'Design and build a web-based platform that allows students to report lost or found items on campus. The platform must automatically match lost reports with found reports based on item category, location, and date. It should notify both parties when a potential match is found. The solution should be simple enough for anyone to use without training.',
    scope: 'Build a web application with user authentication, item reporting forms, a matching algorithm, notification system, and an admin dashboard to manage reported items. The platform should be responsive and work on mobile browsers.',
    constraints: 'Must be a web-based solution (no native apps). Must handle at least 100 concurrent users. Must respect user privacy — contact info should only be revealed after a match is confirmed. Must work with minimal server resources.',
    deliverables: 'Working web application with: 1) User registration/login, 2) Report lost item form, 3) Report found item form, 4) Auto-matching engine, 5) Notification system (email/in-app), 6) Admin dashboard with moderation tools, 7) Simple search/browse interface for all items.',
    milestones: 2,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    team_mode: 'solo',
    min_team_size: 1,
    max_team_size: 1,
  },
  {
    title: 'Smart Water Quality Monitoring for Rural Communities',
    domain: 'Climate',
    problem_type: 'public_impact',
    context: 'Access to clean drinking water remains a critical challenge in rural India. According to recent surveys, over 60% of rural households depend on groundwater that is contaminated with fluoride, arsenic, or nitrates. Current testing methods are expensive, slow, and require lab equipment. Communities often discover contamination only after people fall ill. There is no real-time, affordable system for continuous water quality monitoring at the community level.',
    problem_stmt: 'Design an IoT-based water quality monitoring system that can measure key parameters (pH, turbidity, TDS, temperature) in real-time, transmit data wirelessly to a cloud dashboard, and send alerts when parameters cross safe thresholds. The system must be affordable (target < ₹10,000 per unit) and operate on solar power for use in off-grid locations.',
    scope: 'The project includes hardware sensor integration, firmware development, wireless data transmission (GSM/LoRa), cloud data ingestion, a web dashboard for visualization, an alerting system (SMS/voice), and a public API for integration with government health systems.',
    constraints: 'Must use low-cost, off-the-shelf sensors. Must operate reliably in high-temperature (45°C) and high-humidity environments. Data transmission should work in areas with limited cellular coverage. The dashboard must be usable by semi-literate users with minimal training.',
    deliverables: '1) Working prototype with sensor array, 2) Firmware for data collection and transmission, 3) Cloud backend with data storage and API, 4) Web dashboard with real-time charts and maps, 5) SMS alert system for threshold breaches, 6) Deployment and maintenance guide, 7) Cost analysis and scalability report.',
    milestones: 3,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    team_mode: 'team',
    min_team_size: 2,
    max_team_size: 4,
    mentor_required: true,
  },
  {
    title: 'AI-Powered Crop Disease Detection & Advisory System',
    domain: 'Agriculture',
    problem_type: 'public_impact',
    context: 'Smallholder farmers in India lose an estimated 15-25% of their crop yield annually due to undetected plant diseases. Diagnosis is currently done by agricultural extension officers who are severely understaffed — there is only one officer per 2,000 farmers in many districts. By the time a disease is identified, it has often spread to neighboring farms. Farmers need a tool that can diagnose diseases instantly from a smartphone photo and provide treatment recommendations.',
    problem_stmt: 'Build a mobile-first system that uses computer vision to detect and classify crop diseases from smartphone photos. The system should support at least 10 major crop types and 30+ diseases. It must provide actionable treatment recommendations in the local language, with dosage information for common pesticides/fungicides. The ML model should achieve >90% accuracy and work offline after initial download.',
    scope: 'Full-stack solution including: dataset collection and annotation pipeline, CNN model training and deployment, mobile web app with camera integration, offline inference capability, treatment recommendation engine, and a feedback loop for continuous model improvement through expert verification.',
    constraints: 'Must work on budget smartphones (2GB RAM, Android 10+). Model must be under 50MB for offline use. Recommendations must follow government-approved treatment guidelines. Must support at least Kannada and English interfaces. Response time must be under 3 seconds on a 4G connection.',
    deliverables: '1) Curated dataset of 10,000+ labeled disease images, 2) Trained CNN model with >90% accuracy, 3) Mobile web app with camera-based diagnosis, 4) Treatment recommendation engine with dosage calculator, 5) Offline inference mode, 6) Expert verification dashboard for continuous learning, 7) Deployment guide for rural areas.',
    milestones: 4,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    team_mode: 'team',
    min_team_size: 2,
    max_team_size: 4,
    mentor_required: true,
  },
  {
    title: 'Real-Time Urban Traffic Optimization Engine',
    domain: 'Urban Mobility',
    problem_type: 'industry_challenge',
    context: 'Bengaluru, with over 8 million vehicles, consistently ranks among the most congested cities globally. Average commute speeds have dropped to 14 km/h during peak hours. Current traffic management systems use fixed-timing signals that do not adapt to real-time conditions. Multiple agencies manage different aspects of traffic independently — no unified optimization exists. A 10% improvement in traffic flow would save an estimated ₹10,000 crore annually in fuel costs and lost productivity.',
    problem_stmt: 'Design and prototype a real-time traffic optimization engine that integrates with existing traffic infrastructure. The system should use computer vision at intersections to measure vehicle density, predict congestion patterns using deep learning, and dynamically adjust signal timings to minimize average wait times. It must handle city-scale deployment with 500+ intersections and provide a dashboard for traffic authorities.',
    scope: 'The project spans: edge-based vehicle detection using existing CCTV feeds, congestion prediction model training, multi-agent reinforcement learning for signal optimization, real-time data pipeline processing 1000+ events/second, integration with existing traffic management systems, and a command center dashboard with simulation capabilities.',
    constraints: 'Must process video feeds from existing low-resolution (720p) CCTV cameras. Signal optimization decisions must be made in under 500ms. System must degrade gracefully if individual cameras or signals fail. Must comply with traffic department data retention policies. Should be deployable on existing government cloud infrastructure.',
    deliverables: '1) Vehicle detection and counting module for live CCTV feeds, 2) Congestion prediction model with 30-minute forecast capability, 3) Reinforcement learning-based signal optimization algorithm, 4) Real-time data pipeline with sub-second latency, 5) Traffic command center dashboard, 6) Simulation environment for what-if analysis, 7) API for integration with existing traffic management systems, 8) Deployment and scaling documentation.',
    milestones: 5,
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    team_mode: 'team',
    min_team_size: 3,
    max_team_size: 5,
    mentor_required: true,
  },
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const admin = createAdminClient()
  const results: { title: string; success: boolean; error?: string; evaluation?: any }[] = []

  for (const input of TEST_PROBLEMS) {
    try {
      const insertData = {
        title: input.title,
        domain: input.domain,
        problem_type: input.problem_type,
        status: 'open',
        reward_amount: input.problem_type === 'industry_challenge' ? 100000 : null,
        milestones: input.milestones,
        deadline: input.deadline,
        judging_deadline: new Date(new Date(input.deadline).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        context: input.context,
        problem_stmt: input.problem_stmt,
        scope: input.scope,
        constraints: input.constraints,
        deliverables: input.deliverables,
        poster_id: user.id,
        team_mode: input.team_mode ?? 'solo',
        min_team_size: input.min_team_size ?? 1,
        max_team_size: input.max_team_size ?? 4,
        mentor_required: input.mentor_required ?? false,
      }

      const { data: inserted, error: insertError } = await admin
        .from('problems')
        .insert(insertData)
        .select('id')
        .single()

      if (insertError || !inserted) {
        results.push({ title: input.title, success: false, error: insertError?.message ?? 'Insert failed' })
        continue
      }

      const evaluation = await evaluateProblemWithAI(input)

      const { error: updateError } = await admin
        .from('problems')
        .update({
          difficulty_score: evaluation.difficulty_score,
          difficulty_label: evaluation.difficulty,
          leaderboard_weight: evaluation.leaderboard_weight,
          impact_score: evaluation.impact_score,
          estimated_hours: evaluation.estimated_hours,
          estimated_weeks: evaluation.estimated_weeks,
          evaluation_json: evaluation,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', inserted.id)

      if (updateError) {
        results.push({ title: input.title, success: false, error: updateError.message })
      } else {
        results.push({
          title: input.title,
          success: true,
          evaluation: {
            difficulty: evaluation.difficulty,
            difficulty_score: evaluation.difficulty_score,
            impact_score: evaluation.impact_score,
            estimated_hours: evaluation.estimated_hours,
          },
        })
      }
    } catch (err) {
      results.push({ title: input.title, success: false, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, results })
}
