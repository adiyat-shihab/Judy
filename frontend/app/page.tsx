'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

/* ─────────── inline SVG icons ─────────── */
const IconSparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
    <path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>
  </svg>
);
const IconArrow = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8L22 12L18 16"/><path d="M2 12H22"/>
  </svg>
);
const IconLogin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);
const IconChevronL = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);
const IconChevronR = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
);

/* ─────────── constants ─────────── */
const PARTICLES = [
  { color: '#7c3aed', left: '12%', top: '28%', delay: 0 },
  { color: '#3b82f6', left: '72%', top: '14%', delay: 0.6 },
  { color: '#10b981', left: '85%', top: '55%', delay: 1.1 },
  { color: '#f59e0b', left: '38%', top: '76%', delay: 1.6 },
  { color: '#ef4444', left: '6%',  top: '62%', delay: 2.1 },
  { color: '#06b6d4', left: '55%', top: '88%', delay: 0.3 },
];

const WORKFLOW_STEPS = [
  { num: '01', label: 'createProject()',   accent: '#a855f7', comment: '// Buyer posts a new project' },
  { num: '02', label: 'requestToWork()',   accent: '#3b82f6', comment: '// Solver submits a request' },
  { num: '03', label: 'assignSolver()',    accent: '#06b6d4', comment: '// Buyer picks the best fit' },
  { num: '04', label: 'submitZIP(task)',   accent: '#10b981', comment: '// Solver delivers the work' },
  { num: '05', label: 'acceptDelivery()', accent: '#f59e0b', comment: '// Buyer closes the project ✓' },
];

const STATS = [
  {  value: '3',    label: 'Role Levels',      sub: 'Admin · Buyer · Solver' },
  { value: '5',    label: 'Workflow States',  sub: 'Strict lifecycle enforced' },
  { value: '100%', label: 'JWT Secured',      sub: 'Stateless & server-validated' },
];

const FEATURES = [
  { icon: '⚡', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', title: 'Strict Workflow',     desc: 'Projects follow a locked Unassigned→Assigned→Completed lifecycle — no state skipping, ever.' },
  { icon: '🛡️', gradient: 'linear-gradient(135deg,#ec4899,#a855f7)', title: 'Role-Based Access',   desc: 'Every API route is protected by server-side JWT middleware. Zero trust on the frontend.' },
  { icon: '📊', gradient: 'linear-gradient(135deg,#f97316,#dc2626)', title: 'Admin Oversight',     desc: 'Admins get a full platform view: all users, all projects, all applications — in real time.' },
  { icon: '🕐', gradient: 'linear-gradient(135deg,#6366f1,#3b82f6)', title: 'Animated Transitions', desc: 'Every state change triggers a Framer Motion animation so the lifecycle is always visible.' },
  { icon: '🌍', gradient: 'linear-gradient(135deg,#06b6d4,#10b981)', title: 'Buyer Marketplace',   desc: 'Buyers create projects and choose from competing solver requests — Upwork style.' },
  { icon: '📦', gradient: 'linear-gradient(135deg,#a855f7,#06b6d4)', title: 'Secure ZIP Delivery', desc: 'Solvers upload a ZIP submission; Multer validates the file type server-side before storage.' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen',       role: 'Senior Buyer at TechCorp',        color: '#10b981', quote: '"The workflow lifecycle is exactly what our team needed. Every state transition is crystal clear and the animations make the process intuitive for everyone."', stars: 5 },
  { name: 'Marcus Williams',  role: 'Problem Solver & Freelancer',      color: '#3b82f6', quote: '"As a solver, the platform is incredibly transparent. I can see exactly where my submission is in the review process. The ZIP upload with progress feedback is a great touch."', stars: 5 },
  { name: 'Priya Patel',      role: 'Admin at InnovateLabs',           color: '#a855f7', quote: '"Having a dedicated Admin view to monitor all projects across the platform is a game-changer. The real-time stats and filters make governance effortless."', stars: 5 },
  { name: 'James Rodriguez',  role: 'Buyer at Digital Solutions Co.',   color: '#f59e0b', quote: '"Reviewing solver requests and assigning the best fit is seamless. The state transition animation when I assign a solver is a nice premium touch."', stars: 5 },
  { name: 'Aisha Kofi',       role: 'Full-Stack Solver',               color: '#ef4444', quote: '"The task management system is straightforward. Creating sub-tasks with timelines and uploading deliverables all in one place saves so much time."', stars: 5 },
  { name: 'Lena Müller',      role: 'CTO at StartupHub',              color: '#06b6d4', quote: '"Role-segregated dashboards mean our Buyers, Solvers, and Admins all see exactly what they need — nothing more, nothing less. Security done right."', stars: 5 },
];

/* ─────────── component ─────────── */
export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [dir, setDir]     = useState(1);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'Admin')  router.replace('/dashboard/admin');
      else if (user.role === 'Buyer') router.replace('/dashboard/buyer');
      else router.replace('/dashboard/solver');
    }
  }, [user, isLoading, router]);

  const navigate = (d: 1 | -1) => {
    setDir(d);
    setSlide(prev => (prev + d + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // show 3 testimonials at a time
  const visible = [0, 1, 2].map(i => TESTIMONIALS[(slide + i) % TESTIMONIALS.length]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '32px', height: '32px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', padding: '80px 24px 60px' }}>

        {/* dot-grid */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '40px 40px' }} />

        {/* ── 3 gradient blobs matching reference ── */}
        {/* LEFT — purple/fuchsia */}
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.7, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '-4%', width: '420px', height: '420px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(124,58,237,0.3) 40%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(55px)', zIndex: 0 }} />
        {/* RIGHT — blue/teal */}
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.6, 0.45] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ position: 'absolute', bottom: '10%', right: '-4%', width: '440px', height: '440px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(55px)', zIndex: 0 }} />
        {/* CENTER — orange/amber */}
        <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{ position: 'absolute', top: '42%', left: '48%', width: '320px', height: '320px',
            background: 'radial-gradient(circle, rgba(251,146,60,0.45) 0%, rgba(245,158,11,0.25) 40%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(50px)', zIndex: 0, transform: 'translate(-50%,-50%)' }} />

        {/* floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div key={i}
            animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
            style={{ position: 'absolute', left: p.left, top: p.top, width: '8px', height: '8px',
              borderRadius: '50%', background: p.color, zIndex: 1, boxShadow: `0 0 8px ${p.color}` }} />
        ))}

        {/* main content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '960px', width: '100%', textAlign: 'center' }}>

          {/* badge */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 16px',
              borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600',
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#a855f7', marginBottom: '28px' }}>
            <IconSparkles /> Role-Based Project Marketplace
          </motion.div>

          {/* heading */}
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55 }}
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: '800', lineHeight: 1.18, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            The marketplace where{' '}
            <span style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 55%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ideas get solved
            </span>
          </motion.h1>

          {/* subtitle */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 38px', lineHeight: 1.75 }}>
            Post projects as a Buyer, bid and deliver as a Problem Solver, and govern the platform as Admin — with a strict, animated workflow lifecycle.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <motion.a href="/register" whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }} whileTap={{ scale: 0.97 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '13px 30px',
                borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
              Get Started <IconArrow />
            </motion.a>
            <motion.a href="/login" whileHover={{ background: 'rgba(124,58,237,0.1)', scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px',
                borderRadius: '10px', fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none',
                border: '1px solid rgba(124,58,237,0.4)', color: 'var(--text-primary)', background: 'transparent' }}>
              <IconLogin /> Sign In
            </motion.a>
          </motion.div>

          {/* workflow window */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.015, boxShadow: '0 20px 60px rgba(124,58,237,0.2)' }}
            style={{ maxWidth: '620px', margin: '0 auto 72px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)', overflow: 'hidden', textAlign: 'left',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '12px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Workflow Lifecycle</span>
            </div>
            <div style={{ padding: '20px 22px', fontFamily: 'Menlo,Monaco,Consolas,monospace', fontSize: '0.82rem', lineHeight: '1.9' }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <motion.div key={step.num} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: '22px', userSelect: 'none' }}>{step.num}</span>
                  <span style={{ color: step.accent, fontWeight: '600' }}>{step.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.76rem' }}>{step.comment}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px', maxWidth: '640px', margin: '0 auto' }}>
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(124,58,237,0.15)' }}
                style={{ padding: '22px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', textAlign: 'center' }}>
               
                <div style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '4px',
                  background: 'linear-gradient(135deg,#a855f7,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section style={{ position: 'relative', padding: '100px 24px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        {/* subtle bg accent */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '3px',
          background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.5),rgba(59,130,246,0.5),transparent)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* section header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Built for the Marketplace,{' '}
              <span style={{ background: 'linear-gradient(135deg,#a855f7,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>by Builders</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Every feature is designed to make the Buyer→Solver workflow seamless, secure, and visually transparent.
            </p>
          </motion.div>

          {/* 3 × 2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.35)', borderColor: 'rgba(124,58,237,0.35)' }}
                style={{ padding: '32px 28px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)', cursor: 'default', transition: 'box-shadow 0.25s,border-color 0.25s,transform 0.25s' }}>
                {/* icon */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '52px', height: '52px', borderRadius: '14px', background: f.gradient,
                  fontSize: '1.5rem', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{ position: 'relative', padding: '100px 24px 120px', background: 'var(--bg-primary)', overflow: 'hidden' }}>

        {/* glow blobs for this section */}
        <div style={{ position: 'absolute', top: '20%', left: '-6%', width: '360px', height: '360px',
          background: 'radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-6%', width: '360px', height: '360px',
          background: 'radial-gradient(circle,rgba(59,130,246,0.18),transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>

          {/* header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '56px' }}>
            {/* badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 14px',
              borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600',
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#a855f7', marginBottom: '20px' }}>
              <IconSparkles /> User Stories
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: '800', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Loved by{' '}
              <span style={{ background: 'linear-gradient(135deg,#a855f7,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                every role
              </span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
              Buyers, Solvers, and Admins all love how clear and smooth their workflow experience is.
            </p>
          </motion.div>

          {/* carousel */}
          <div style={{ position: 'relative' }}>
            {/* prev */}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.94 }} onClick={() => navigate(-1)}
              style={{ position: 'absolute', left: '-24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', cursor: 'pointer',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevronL />
            </motion.button>

            {/* cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', overflow: 'hidden' }}>
              <AnimatePresence mode="sync">
                {visible.map((t, i) => (
                  <motion.div key={`${t.name}-${i}`}
                    initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -dir * 40 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{ padding: '28px 24px', borderRadius: '16px',
                      background: `linear-gradient(135deg, ${t.color}12 0%, rgba(255,255,255,0.03) 100%)`,
                      border: `1px solid ${t.color}25`,
                      backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* top row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                          background: `${t.color}22`, border: `1px solid ${t.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '0.9rem', color: t.color }}>
                          {t.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>✦</span>
                      </div>
                      {/* stars */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: t.stars }).map((_, si) => (
                          <span key={si} style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* quote */}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.75, flex: 1 }}>{t.quote}</p>

                    {/* author */}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '2px' }}>{t.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{t.role}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* next */}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.94 }} onClick={() => navigate(1)}
              style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', cursor: 'pointer',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevronR />
            </motion.button>
          </div>

          {/* dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '36px' }}>
            {Array.from({ length: TESTIMONIALS.length }).map((_, i) => (
              <motion.button key={i}
                onClick={() => { setDir(i > slide ? 1 : -1); setSlide(i); }}
                animate={{ width: i === slide ? '24px' : '8px', background: i === slide ? '#a855f7' : 'rgba(255,255,255,0.2)' }}
                transition={{ duration: 0.3 }}
                style={{ height: '8px', borderRadius: '999px', border: 'none', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
