// Run: npx tsx scripts/seed-mentors.ts
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const MENTORS = [
  {
    email: 'arjun.krishna@example.com',
    password: 'Mentor@123',
    name: 'Arjun Krishna',
    bio: 'Full-stack developer with 8+ years building scalable web applications. Passionate about mentoring students on real-world software engineering challenges.',
    skills: ['Web Development', 'System Design', 'API Architecture'],
    technologies: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker'],
    experience_years: 8,
    linkedin_url: 'https://linkedin.com/in/arjunkrishna',
    github_url: 'https://github.com/arjunkrishna',
  },
  {
    email: 'priya.sharma@example.com',
    password: 'Mentor@123',
    name: 'Priya Sharma',
    bio: 'AI/ML engineer specializing in computer vision and NLP. Previously at Google Research. Love helping students break into AI.',
    skills: ['Machine Learning', 'Computer Vision', 'NLP', 'Data Science'],
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'CUDA', 'Jupyter'],
    experience_years: 6,
    linkedin_url: 'https://linkedin.com/in/priyasharma',
    github_url: 'https://github.com/priyasharma',
  },
  {
    email: 'rahul.verma@example.com',
    password: 'Mentor@123',
    name: 'Rahul Verma',
    bio: 'Cloud infrastructure engineer and DevOps practitioner. AWS Certified Solutions Architect. Mentors students on deployment, scalability, and CI/CD.',
    skills: ['Cloud Architecture', 'DevOps', 'Kubernetes', 'CI/CD'],
    technologies: ['AWS', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Linux'],
    experience_years: 7,
    linkedin_url: 'https://linkedin.com/in/rahulverma',
    github_url: 'https://github.com/rahulverma',
  },
  {
    email: 'ananya.patel@example.com',
    password: 'Mentor@123',
    name: 'Ananya Patel',
    bio: 'Product designer and frontend engineer with a keen eye for accessibility and user experience. Mentors on design thinking and modern CSS.',
    skills: ['UI/UX Design', 'Frontend Engineering', 'Design Systems', 'Accessibility'],
    technologies: ['Figma', 'React', 'Tailwind CSS', 'Storybook', 'TypeScript'],
    experience_years: 5,
    linkedin_url: 'https://linkedin.com/in/ananyapatel',
    github_url: 'https://github.com/ananyapatel',
  },
  {
    email: 'vikram.singh@example.com',
    password: 'Mentor@123',
    name: 'Vikram Singh',
    bio: 'Backend and database specialist. Expert in distributed systems, microservices, and database optimization. Guides students on building robust backends.',
    skills: ['Distributed Systems', 'Database Design', 'Microservices', 'Performance Optimization'],
    technologies: ['Go', 'PostgreSQL', 'Redis', 'Kafka', 'gRPC'],
    experience_years: 10,
    linkedin_url: 'https://linkedin.com/in/vikramsingh',
    github_url: 'https://github.com/vikramsingh',
  },
  {
    email: 'kavya.nair@example.com',
    password: 'Mentor@123',
    name: 'Kavya Nair',
    bio: 'Cybersecurity researcher and ethical hacker. Previously at CrowdStrike. Passionate about mentoring students on secure coding and threat modeling.',
    skills: ['Cybersecurity', 'Penetration Testing', 'Secure Coding', 'Threat Modeling'],
    technologies: ['Python', 'Burp Suite', 'Wireshark', 'Kali Linux', 'Metasploit'],
    experience_years: 6,
    linkedin_url: 'https://linkedin.com/in/kavyanair',
    github_url: 'https://github.com/kavyanair',
  },
  {
    email: 'rohan.deshpande@example.com',
    password: 'Mentor@123',
    name: 'Rohan Deshpande',
    bio: 'Mobile app developer with expertise in React Native and Flutter. Built apps with 10M+ downloads. Mentors students on cross-platform development.',
    skills: ['Mobile Development', 'Cross-Platform', 'App Architecture', 'Performance'],
    technologies: ['React Native', 'Flutter', 'TypeScript', 'Firebase', 'GraphQL'],
    experience_years: 5,
    linkedin_url: 'https://linkedin.com/in/rohandeshpande',
    github_url: 'https://github.com/rohandeshpande',
    availability_status: 'busy',
  },
  {
    email: 'meera.iyer@example.com',
    password: 'Mentor@123',
    name: 'Meera Iyer',
    bio: 'Data engineer and analytics expert. Builds data pipelines and dashboards that drive business decisions. Mentors students on data-driven problem solving.',
    skills: ['Data Engineering', 'Data Visualization', 'ETL Pipelines', 'Analytics'],
    technologies: ['Python', 'SQL', 'Apache Spark', 'Tableau', 'dbt'],
    experience_years: 7,
    linkedin_url: 'https://linkedin.com/in/meeraiyer',
    github_url: 'https://github.com/meeraiyer',
  },
]

async function seed() {
  console.log('Seeding mentor profiles...\n')

  for (const m of MENTORS) {
    const { data: existingProfile } = await admin
      .from('mentor_profiles')
      .select('user_id')
      .eq('user_id', (await admin.from('users').select('id').eq('email', m.email).maybeSingle()).data?.id || '')
      .maybeSingle()

    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', m.email)
      .maybeSingle()

    if (existingProfile) {
      console.log(`  ↻ ${m.name} already has a mentor profile, skipping`)
      continue
    }

    if (existingUser) {
      // User exists but no mentor profile — just create the profile
      const userId = existingUser.id
      const { error: mentorErr } = await admin.from('mentor_profiles').upsert({
        user_id: userId,
        bio: m.bio,
        skills: m.skills,
        technologies: m.technologies,
        experience_years: m.experience_years,
        linkedin_url: m.linkedin_url,
        github_url: m.github_url,
        availability_status: (m as any).availability_status || 'available',
      }, { onConflict: 'user_id' })

      if (mentorErr) {
        console.error(`  ✗ Failed to create mentor profile for ${m.name}:`, mentorErr.message)
      } else {
        console.log(`  ✓ ${m.name} (${m.email}) — mentor profile created`)
      }
      continue
    }

    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: m.email,
      password: m.password,
      email_confirm: true,
      user_metadata: { name: m.name, role: 'mentor' }
    })

    if (authErr || !authUser?.user) {
      console.error(`  ✗ Failed to create auth user for ${m.email}:`, authErr?.message)
      continue
    }

    const userId = authUser.user.id

    await admin.from('users').upsert({
      id: userId,
      email: m.email,
      name: m.name,
      role: 'mentor',
    }, { onConflict: 'id' })

    const { error: mentorErr } = await admin.from('mentor_profiles').insert({
      user_id: userId,
      bio: m.bio,
      skills: m.skills,
      technologies: m.technologies,
      experience_years: m.experience_years,
      linkedin_url: m.linkedin_url,
      github_url: m.github_url,
      availability_status: (m as any).availability_status || 'available',
    })

    if (mentorErr) {
      console.error(`  ✗ Failed to create mentor profile for ${m.name}:`, mentorErr.message)
      continue
    }

    console.log(`  ✓ ${m.name} (${m.email}) — ${m.skills.join(', ')}`)
  }

  console.log('\nDone!')
}

seed()
