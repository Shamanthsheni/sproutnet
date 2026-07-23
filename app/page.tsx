import { createClient } from '@/lib/supabase/server'
import Navbar from '@/app/components/navbar'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  let user: { id: string; name?: string; role?: string; is_master?: boolean; profile_slug?: string | null } | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role, is_master, profile_slug')
      .eq('id', authUser.id)
      .single()
    user = profile
  }

  const { count: totalProblems } = await supabase
    .from('problems')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--soil:#1C1410;--green:#2D6A4F;--green-light:#3D8A65;--green-pale:#EAF4EE;--marigold:#F4A723;--marigold-lt:#F9C05A;--marigold-dim:rgba(244,167,35,0.12);--paper:#FAF8F4;--paper-dim:#F2EEE8;--dust:#9CA3A0;--ink:#1C1410;--ink-mid:#4A3F38;--white:#ffffff;--ff-display:'Instrument Serif',Georgia,serif;--ff-head:'Sora',sans-serif;--ff-body:'DM Sans',sans-serif;--ff-mono:'JetBrains Mono',monospace;--r-sm:6px;--r-md:12px;--r-pill:999px;--sh:0 2px 12px rgba(28,20,16,.08);--sh-md:0 4px 24px rgba(28,20,16,.12);--ease:200ms ease-out}
html{scroll-behavior:smooth}
body{font-family:var(--ff-body);background:var(--paper);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased}
body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;opacity:.4}

.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 52px 72px;text-align:center;position:relative;overflow:hidden;background:var(--paper)}
.hero::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,rgba(45,106,79,.18) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;z-index:0}
.hero::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(250,248,244,0) 0%,rgba(250,248,244,.96) 68%);pointer-events:none;z-index:1}
.hero-inner{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;max-width:860px}
@keyframes fu{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.a0{opacity:0;animation:fu .6s ease-out .08s forwards}
.a1{opacity:0;animation:fu .7s ease-out .20s forwards}
.a2{opacity:0;animation:fu .7s ease-out .34s forwards}
.a3{opacity:0;animation:fu .7s ease-out .46s forwards}
.a4{opacity:0;animation:fu .7s ease-out .60s forwards}
.a5{opacity:0;animation:fu .7s ease-out .78s forwards}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:var(--ff-mono);font-size:11px;font-weight:500;color:var(--green);letter-spacing:.09em;text-transform:uppercase;background:var(--green-pale);border:1px solid rgba(45,106,79,.2);padding:6px 14px;border-radius:var(--r-pill);margin-bottom:26px}
.e-dot{width:6px;height:6px;background:var(--green);border-radius:50%;animation:pulse 2.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
.hero-h1{font-family:var(--ff-display);font-size:clamp(50px,7.5vw,92px);font-weight:400;line-height:1.04;color:var(--ink);letter-spacing:-1.5px;max-width:820px;margin-bottom:20px}
.hero-h1 em{font-style:italic;color:var(--green)}
.hero-sub{font-family:var(--ff-body);font-size:17px;font-weight:300;line-height:1.7;color:var(--ink-mid);max-width:520px;margin-bottom:32px}
.hero-ctas{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:28px}
.btn-hp{font-family:var(--ff-body);font-size:15px;font-weight:600;color:var(--soil);background:var(--marigold);text-decoration:none;padding:14px 30px;border-radius:var(--r-sm);display:flex;align-items:center;gap:8px;box-shadow:0 2px 10px rgba(244,167,35,.3);transition:all var(--ease)}
.btn-hp:hover{background:var(--marigold-lt);transform:translateY(-2px);box-shadow:0 6px 22px rgba(244,167,35,.4)}
.btn-hs{font-family:var(--ff-body);font-size:15px;font-weight:500;color:var(--ink-mid);text-decoration:none;padding:14px 28px;border-radius:var(--r-sm);border:1.5px solid rgba(28,20,16,.15);background:transparent;transition:all var(--ease)}
.btn-hs:hover{border-color:rgba(28,20,16,.3);color:var(--ink);transform:translateY(-1px)}
.poster-bar{display:flex;align-items:center;gap:20px;justify-content:space-between;padding:20px 28px;background:var(--green-pale);border:1.5px solid rgba(45,106,79,.2);border-radius:12px;margin-bottom:36px;width:100%;max-width:600px}
.poster-bar-left{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left}
.poster-bar-label{font-family:var(--ff-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);font-weight:500}
.poster-bar-text{font-family:var(--ff-body);font-size:13.5px;color:var(--ink-mid);line-height:1.45}
.poster-bar-text strong{color:var(--ink);font-weight:600}
.btn-post{font-family:var(--ff-body);font-size:14px;font-weight:600;color:#fff;background:var(--green);border:none;text-decoration:none;padding:12px 22px;border-radius:var(--r-sm);white-space:nowrap;display:inline-flex;align-items:center;gap:7px;box-shadow:0 2px 10px rgba(45,106,79,.25);transition:all var(--ease);flex-shrink:0}
.btn-post:hover{background:var(--green-light);transform:translateY(-2px);box-shadow:0 6px 20px rgba(45,106,79,.32)}
.hero-trust{display:flex;align-items:center;gap:22px;justify-content:center;flex-wrap:wrap}
.ti{display:flex;align-items:center;gap:6px;font-family:var(--ff-body);font-size:12px;font-weight:500;color:var(--dust)}
.ti span{color:var(--green);font-size:13px}
.td{width:1px;height:13px;background:rgba(28,20,16,.12)}
.hero-scroll{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;z-index:2}
.scroll-line{width:1px;height:38px;background:linear-gradient(to bottom,var(--marigold),transparent);animation:sa 2.2s ease-in-out infinite}
@keyframes sa{0%,100%{opacity:.35;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.15)}}
.stats-bar{background:var(--soil);padding:30px 52px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap}
.si-stat{display:flex;flex-direction:column;align-items:center;padding:0 52px;position:relative}
.si-stat:not(:last-child)::after{content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);width:1px;height:30px;background:rgba(250,248,244,.09)}
.sn{font-family:var(--ff-mono);font-size:30px;font-weight:500;color:var(--marigold);letter-spacing:-.5px}
.sl{font-family:var(--ff-body);font-size:11px;font-weight:500;color:rgba(250,248,244,.35);text-transform:uppercase;letter-spacing:.09em;margin-top:5px}
section{padding:100px 52px}
.si-wrap{max-width:1200px;margin:0 auto}
.s-label{font-family:var(--ff-mono);font-size:11px;font-weight:500;color:var(--green);letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}
.s-title{font-family:var(--ff-display);font-size:clamp(36px,4vw,54px);font-weight:400;line-height:1.08;color:var(--ink);letter-spacing:-.5px}
.s-sub{font-family:var(--ff-body);font-size:17px;font-weight:300;line-height:1.65;color:var(--ink-mid);margin-top:16px;max-width:540px}
.reality{background:var(--soil);padding:100px 52px;position:relative;overflow:hidden}
.reality::before{content:'';position:absolute;top:-180px;right:-160px;width:520px;height:520px;background:radial-gradient(ellipse,rgba(45,106,79,.14) 0%,transparent 68%);pointer-events:none}
.r-inner{max-width:880px;margin:0 auto}
.r-label{font-family:var(--ff-mono);font-size:11px;color:rgba(250,248,244,.25);letter-spacing:.1em;text-transform:uppercase;margin-bottom:48px}
.r-item{padding:30px 0;border-bottom:1px solid rgba(250,248,244,.06);display:flex;align-items:flex-start;gap:24px;opacity:0;transform:translateX(-18px);transition:opacity .65s ease-out,transform .65s ease-out}
.r-item.visible{opacity:1;transform:translateX(0)}
.r-num{font-family:var(--ff-mono);font-size:12px;color:var(--marigold);opacity:.55;padding-top:7px;min-width:22px}
.r-text{font-family:var(--ff-display);font-size:clamp(22px,2.8vw,34px);color:var(--paper);font-weight:400;line-height:1.2;letter-spacing:-.3px}
.r-text em{font-style:italic;color:var(--marigold)}
.what-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px}
.wc{background:var(--white);border:1.5px solid rgba(28,20,16,.07);border-radius:var(--r-md);padding:32px;transition:transform var(--ease),box-shadow var(--ease),border-color var(--ease)}
.wc:hover{transform:translateY(-4px);box-shadow:var(--sh-md);border-color:rgba(45,106,79,.2)}
.wc-icon{width:44px;height:44px;background:var(--green-pale);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:20px}
.wc-title{font-family:var(--ff-head);font-size:17px;font-weight:600;color:var(--ink);margin-bottom:10px}
.wc-body{font-family:var(--ff-body);font-size:14px;line-height:1.6;color:var(--ink-mid)}
.hiw{background:var(--paper-dim)}
.hiw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:56px;position:relative}
.hiw-grid::before{content:'';position:absolute;top:20px;left:8%;right:8%;height:1px;background:linear-gradient(to right,transparent,rgba(45,106,79,.18),rgba(45,106,79,.18),transparent)}
.hiw-step{padding:0 20px}
.step-dot{width:40px;height:40px;border-radius:50%;background:var(--paper);border:2px solid rgba(45,106,79,.22);display:flex;align-items:center;justify-content:center;margin-bottom:20px;position:relative;z-index:1;transition:border-color var(--ease),background var(--ease)}
.hiw-step:hover .step-dot{border-color:var(--green);background:var(--green-pale)}
.step-n{font-family:var(--ff-mono);font-size:13px;font-weight:500;color:var(--green)}
.step-t{font-family:var(--ff-head);font-size:15px;font-weight:600;color:var(--ink);margin-bottom:8px}
.step-d{font-family:var(--ff-body);font-size:13px;color:var(--ink-mid);line-height:1.55}
.hiw-cta{display:inline-flex;align-items:center;gap:6px;margin-top:48px;font-family:var(--ff-body);font-size:14px;font-weight:600;color:var(--green);text-decoration:none;border-bottom:1px solid rgba(45,106,79,.3);padding-bottom:2px;transition:gap var(--ease),border-color var(--ease)}
.hiw-cta:hover{gap:10px;border-color:var(--green)}
.domains{background:var(--white)}
.domain-mosaic{display:flex;flex-wrap:wrap;gap:10px;margin-top:52px;max-width:780px}
.dt{font-family:var(--ff-body);font-size:13px;font-weight:500;color:var(--green);background:var(--green-pale);border:1px solid rgba(45,106,79,.15);padding:8px 18px;border-radius:var(--r-pill);display:flex;align-items:center;gap:7px;transition:all var(--ease);animation:floatT linear infinite}
.dt:hover{background:var(--green);color:var(--white);border-color:var(--green);transform:translateY(-2px)}
@keyframes floatT{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.dt:nth-child(1){animation-duration:4.3s}.dt:nth-child(2){animation-duration:3.7s;animation-delay:.3s}
.dt:nth-child(3){animation-duration:5.1s;animation-delay:.7s}.dt:nth-child(4){animation-duration:4.6s;animation-delay:.2s}
.dt:nth-child(5){animation-duration:3.5s;animation-delay:.9s}.dt:nth-child(6){animation-duration:4.9s;animation-delay:.5s}
.dt:nth-child(7){animation-duration:4.1s;animation-delay:1.1s}.dt:nth-child(8){animation-duration:3.8s;animation-delay:.4s}
.thinking{background:var(--soil);padding:100px 52px;position:relative;overflow:hidden}
.thinking::after{content:'';position:absolute;bottom:-120px;left:-120px;width:420px;height:420px;background:radial-gradient(ellipse,rgba(244,167,35,.05) 0%,transparent 68%);pointer-events:none}
.th-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:88px;align-items:center}
.th-label{font-family:var(--ff-mono);font-size:11px;color:rgba(250,248,244,.25);letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}
.th-title{font-family:var(--ff-display);font-size:clamp(30px,3.4vw,48px);color:var(--paper);font-weight:400;line-height:1.1;letter-spacing:-.5px;margin-bottom:20px}
.th-title em{font-style:italic;color:var(--marigold)}
.th-sub{font-family:var(--ff-body);font-size:16px;color:rgba(250,248,244,.55);line-height:1.68;font-weight:300;margin-bottom:28px}
.th-note{font-family:var(--ff-body);font-size:13px;color:rgba(250,248,244,.3);font-style:italic;line-height:1.5}
.mockup{background:rgba(250,248,244,.04);border:1px solid rgba(250,248,244,.1);border-radius:var(--r-md);padding:24px;backdrop-filter:blur(4px)}
.mockup-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid rgba(250,248,244,.08)}
.mockup-title{font-family:var(--ff-head);font-size:13px;font-weight:600;color:rgba(250,248,244,.8)}
.mockup-pill{font-family:var(--ff-mono);font-size:10px;color:var(--marigold);background:var(--marigold-dim);padding:3px 9px;border-radius:var(--r-pill)}
.fi{display:flex;align-items:center;gap:12px;padding:9px 6px;border-bottom:1px solid rgba(250,248,244,.05);border-radius:4px;cursor:default;transition:background var(--ease)}
.fi:hover{background:rgba(250,248,244,.04)}.fi:last-child{border-bottom:none}
.fchk{width:18px;height:18px;border-radius:4px;border:1.5px solid rgba(250,248,244,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px}
.fchk.done{background:var(--green);border-color:var(--green);color:#fff}
.fchk.now{border-color:var(--marigold)}
.fn{font-family:var(--ff-body);font-size:13px;color:rgba(250,248,244,.7)}
.fn.done{color:rgba(250,248,244,.35);text-decoration:line-through}
.fn.now{color:rgba(250,248,244,.92)}
.fn.next{color:rgba(250,248,244,.28)}
.closing{background:var(--green);padding:100px 52px;text-align:center;position:relative;overflow:hidden}
.closing::before{content:'';position:absolute;top:-140px;left:50%;transform:translateX(-50%);width:700px;height:500px;background:radial-gradient(ellipse,rgba(250,248,244,.07) 0%,transparent 68%);pointer-events:none}
.cl-inner{position:relative;z-index:1}
.cl-title{font-family:var(--ff-display);font-size:clamp(36px,5vw,64px);color:var(--paper);font-weight:400;line-height:1.08;letter-spacing:-.5px;margin-bottom:20px}
.cl-title em{font-style:italic;color:var(--marigold)}
.cl-sub{font-family:var(--ff-body);font-size:17px;color:rgba(250,248,244,.65);line-height:1.65;font-weight:300;max-width:460px;margin:0 auto 40px}
.btn-cl{font-family:var(--ff-body);font-size:16px;font-weight:600;color:var(--green);background:var(--marigold);text-decoration:none;padding:16px 38px;border-radius:var(--r-sm);display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 22px rgba(0,0,0,.16);transition:all var(--ease)}
.btn-cl:hover{background:var(--marigold-lt);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.22)}
.cl-fine{margin-top:22px;font-family:var(--ff-body);font-size:12px;color:rgba(250,248,244,.32)}
footer{background:var(--soil);padding:52px}
.ft-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px}
.ft-brand{display:flex;align-items:center;gap:10px}
.ft-wm{font-family:var(--ff-head);font-size:16px;font-weight:700;color:rgba(250,248,244,.55)}
.ft-tl{font-family:var(--ff-body);font-size:12px;color:rgba(250,248,244,.22);margin-top:4px}
.ft-links{display:flex;gap:24px;flex-wrap:wrap}
.ft-links a{font-family:var(--ff-body);font-size:13px;color:rgba(250,248,244,.32);text-decoration:none;transition:color var(--ease)}
.ft-links a:hover{color:rgba(250,248,244,.68)}
.ft-copy{font-family:var(--ff-body);font-size:12px;color:rgba(250,248,244,.18)}
.rv{opacity:0;transform:translateY(22px);transition:opacity .6s ease-out,transform .6s ease-out}
.rv.on{opacity:1;transform:translateY(0)}
.rv.d1{transition-delay:.1s}.rv.d2{transition-delay:.2s}.rv.d3{transition-delay:.3s}
@media(max-width:1024px){section{padding:72px 24px}.what-grid{grid-template-columns:1fr}.hiw-grid{grid-template-columns:repeat(2,1fr);gap:32px}.hiw-grid::before{display:none}.th-inner{grid-template-columns:1fr;gap:48px}.stats-bar{padding:24px}.si-stat{padding:0 24px}.hero{padding:96px 24px 72px}.reality,.thinking,.closing{padding:72px 24px}footer{padding:40px 24px}.ft-inner{flex-direction:column;align-items:flex-start}}

@media(max-width:640px){.hiw-grid{grid-template-columns:1fr}.hero-ctas{flex-direction:column;width:100%}.btn-hp,.btn-hs{width:100%;justify-content:center}.stats-bar{flex-direction:column;gap:22px}.si-stat::after{display:none}.poster-bar{flex-direction:column;align-items:flex-start}.btn-post{width:100%;justify-content:center}}
      `}}/>

      <Navbar user={user} />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow a0"><div className="e-dot"></div>Structured thinking for real India</div>
          <h1 className="hero-h1 a1">India&apos;s problems<br/>don&apos;t wait for <em>permission.</em></h1>
          <p className="hero-sub a2">
            SproutNet is where students stop theorizing and start solving — with structure, seriousness, and real stakes. Every real Indian problem. One rigorous framework.
          </p>

          <div className="hero-ctas a3">
            <Link href="/login/student" className="btn-hp">Start Solving →</Link>
            <Link href="/problems" className="btn-hs">See Open Problems</Link>
          </div>

          <div className="poster-bar a3">
            <div className="poster-bar-left">
              <span className="poster-bar-label">For organisations &amp; NGOs</span>
              <span className="poster-bar-text"><strong>Have a real problem to solve?</strong> Post your challenge, get structured solutions from India&apos;s sharpest students.</span>
            </div>
            <Link href="/login/poster" className="btn-post">Post a Problem →</Link>
          </div>

          <div className="hero-trust a4">
            <div className="ti"><span>✓</span> Verified student identities</div>
            <div className="td"></div>
            <div className="ti"><span>✓</span> Blind judging · 5-criteria rubric</div>
            <div className="td"></div>
            <div className="ti"><span>✓</span> Structured 7-field submissions</div>
          </div>
        </div>
        <div className="hero-scroll a5"><div className="scroll-line"></div></div>
      </section>

      <div className="stats-bar">
        <div className="si-stat"><div className="sn" data-target="8">0</div><div className="sl">Problem Domains</div></div>
        <div className="si-stat"><div className="sn" data-target="7">0</div><div className="sl">Submission Fields</div></div>
        <div className="si-stat"><div className="sn" data-target="5">0</div><div className="sl">Judging Criteria</div></div>
        <div className="si-stat"><div className="sn" data-target={totalProblems ?? 5}>{totalProblems ?? 5}</div><div className="sl">Open Problems</div></div>
      </div>

      <div className="reality">
        <div className="r-inner">

          <div className="r-item" suppressHydrationWarning><div className="r-num">01</div><div className="r-text">Exams test memory. SproutNet tests <em>judgment.</em></div></div>
          <div className="r-item" suppressHydrationWarning><div className="r-num">02</div><div className="r-text">Assignments have right answers. <em>Real problems don&apos;t.</em></div></div>
          <div className="r-item" suppressHydrationWarning><div className="r-num">03</div><div className="r-text">You&apos;ve been trained to study India. Now <em>help fix it.</em></div></div>
        </div>
      </div>

      <section id="about" suppressHydrationWarning>
        <div className="si-wrap">

          <h2 className="s-title rv d1" suppressHydrationWarning>Not another hackathon.</h2>
          <p className="s-sub rv d2" suppressHydrationWarning>Three things make SproutNet different from every competition you&apos;ve seen.</p>
          <div className="what-grid">
            <div className="wc rv d1" suppressHydrationWarning><div className="wc-icon">🔍</div><div className="wc-title">Real Problems</div><div className="wc-body">Posted by real people with real context — not toy scenarios invented for a weekend.</div></div>
            <div className="wc rv d2" suppressHydrationWarning><div className="wc-icon">🧠</div><div className="wc-title">Structured Thinking</div><div className="wc-body">A 7-field framework that forces you to think like a professional — from root cause to implementation plan.</div></div>
            <div className="wc rv d3" suppressHydrationWarning><div className="wc-icon">🇮🇳</div><div className="wc-title">Indian Context</div><div className="wc-body">Problems rooted in this country&apos;s actual lived reality. Agriculture, healthcare, infrastructure, civic tech.</div></div>
          </div>
        </div>
      </section>

      <section className="hiw" id="how-it-works" suppressHydrationWarning>
        <div className="si-wrap">

          <h2 className="s-title rv d1" suppressHydrationWarning>Simple. Serious. Structured.</h2>
          <div className="hiw-grid">
            <div className="hiw-step rv d1" suppressHydrationWarning><div className="step-dot"><div className="step-n">01</div></div><div className="step-t">Browse real problems</div><div className="step-d">Vetted, fully scoped. Each one matters to someone real.</div></div>
            <div className="hiw-step rv d2" suppressHydrationWarning><div className="step-dot"><div className="step-n">02</div></div><div className="step-t">Submit your solution</div><div className="step-d">Build your solution using our 7-field framework.</div></div>
            <div className="hiw-step rv d3" suppressHydrationWarning><div className="step-dot"><div className="step-n">03</div></div><div className="step-t">Get evaluated fairly</div><div className="step-d">Blind review. 5 clear criteria. No favouritism.</div></div>
            <div className="hiw-step rv d3" suppressHydrationWarning><div className="step-dot"><div className="step-n">04</div></div><div className="step-t">See your thinking matter</div><div className="step-d">Your rank, your badges, your Builder Score.</div></div>
          </div>
          <Link href="/problems" className="hiw-cta rv" suppressHydrationWarning>See open problems →</Link>
        </div>
      </section>

      <section className="domains" suppressHydrationWarning>
        <div className="si-wrap">

          <h2 className="s-title rv d1" suppressHydrationWarning>What kind of problems?<br/>Indian ones.</h2>
          <p className="s-sub rv d2" suppressHydrationWarning>Eight starting domains. Every real Indian problem fits somewhere.</p>
          <div className="domain-mosaic rv d1" suppressHydrationWarning>
            <div className="dt">🤖 AI &amp; Data</div>
            <div className="dt">🌿 Climate</div>
            <div className="dt">🏗 Public Infrastructure</div>
            <div className="dt">🏥 Healthcare</div>
            <div className="dt">🌾 Agriculture</div>
            <div className="dt">📚 Education</div>
            <div className="dt">🚌 Urban Mobility</div>
            <div className="dt">🏛 Civic Technology</div>
          </div>
        </div>
      </section>

      <div className="thinking">
        <div className="th-inner">
          <div>

            <h2 className="th-title">We won&apos;t let you submit a <em>half-baked idea.</em></h2>
            <p className="th-sub">Every submission has 7 mandatory fields. You&apos;ll think harder than you ever have.</p>
            <p className="th-note">&quot;Most students have never been asked to think this completely. You&apos;ll leave knowing you did.&quot;</p>
          </div>
          <div className="mockup">
            <div className="mockup-hd">
              <div className="mockup-title">7-Field Solution Submission</div>
              <div className="mockup-pill">5 / 7 complete</div>
            </div>
            <div className="fi"><div className="fchk done">✓</div><div className="fn done">Problem Understanding</div></div>
            <div className="fi"><div className="fchk done">✓</div><div className="fn done">Root Cause Analysis</div></div>
            <div className="fi"><div className="fchk done">✓</div><div className="fn done">Proposed Solution</div></div>
            <div className="fi"><div className="fchk done">✓</div><div className="fn done">Feasibility</div></div>
            <div className="fi"><div className="fchk done">✓</div><div className="fn done">Expected Impact</div></div>
            <div className="fi"><div className="fchk now">·</div><div className="fn now">Risks &amp; Limitations</div></div>
            <div className="fi"><div className="fchk"></div><div className="fn next">Implementation Plan</div></div>
          </div>
        </div>
      </div>

      <div className="closing">
        <div className="cl-inner">
          <h2 className="cl-title">You don&apos;t need experience.<br/>You need <em>curiosity.</em></h2>
          <p className="cl-sub">No prior experience required. No branch restrictions. The only requirement is that you take it seriously.</p>
          <Link href="/join" className="btn-cl">Create Your Account →</Link>
          <p className="cl-fine">Verified student identities only · Season 1 now open</p>
        </div>
      </div>

      <footer>
        <div className="ft-inner">
          <div>
            <div className="ft-brand">
              <svg className="logo-svg" viewBox="0 0 34 34" fill="none">
                <rect width="34" height="34" rx="8" fill="rgba(45,106,79,0.35)"/>
                <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
                <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.6)"/>
              </svg>
              <span className="ft-wm">SproutNet</span>
            </div>
            <div className="ft-tl">Structured thinking for real India.</div>
          </div>
          <div className="ft-links">
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/problems">Problems</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/login">Sign in</Link>
          </div>
          <div className="ft-copy">© 2026 SproutNet</div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{__html: `
        const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target)}})},{threshold:.1,rootMargin:'0px 0px -36px 0px'});
        document.querySelectorAll('.rv').forEach(el=>obs.observe(el));
        const rItems=document.querySelectorAll('.r-item');
        const rObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){rItems.forEach((el,i)=>setTimeout(()=>el.classList.add('visible'),i*170));rObs.disconnect()}})},{threshold:.25});
        const rs=document.querySelector('.reality');if(rs)rObs.observe(rs);
        const cObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;const t=+e.target.dataset.target;const sfx=t>=100?'+':'';let c=0,step=t/44;const id=setInterval(()=>{c=Math.min(c+step,t);e.target.textContent=Math.floor(c)+sfx;if(c>=t)clearInterval(id)},26);cObs.unobserve(e.target)})},{threshold:.5});
        document.querySelectorAll('[data-target]').forEach(el=>cObs.observe(el));
      `}}/>
    </>
  )
}
