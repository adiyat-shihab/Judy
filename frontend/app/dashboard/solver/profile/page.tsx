'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Shared animation variants ──────────────────────────────────────────────────
const fadeSlideIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: 'easeOut' as const },
} as const;


// ── Types ──────────────────────────────────────────────────────────────────────
interface ProfileData {
  user: { name: string; email: string; role: string; createdAt: string };
  profile: {
    bio: string;
    skills: string[];
    hourlyRate: number | null;
    availability: 'Available' | 'Busy' | 'Not Available';
    location: string;
    portfolio: string;
    languages: string[];
    title: string;
  };
  stats: {
    totalRequests: number;
    totalTasks: number;
    completedTasks: number;
    assignedProject: { _id: string; title: string } | null;
  };
}

const AVAILABILITY_OPTIONS = ['Available', 'Busy', 'Not Available'] as const;
type Availability = typeof AVAILABILITY_OPTIONS[number];

const AVAILABILITY_COLOR: Record<Availability, string> = {
  Available: '#10b981',
  Busy: '#f59e0b',
  'Not Available': '#ef4444',
};

const SKILL_PRESETS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'MongoDB',
  'PostgreSQL', 'GraphQL', 'Docker', 'AWS', 'Figma', 'UI/UX',
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function SolverProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    bio: '',
    skills: [] as string[],
    hourlyRate: '' as string | number,
    availability: 'Available' as Availability,
    location: '',
    portfolio: '',
    languages: [] as string[],
  });
  const [skillDraft, setSkillDraft] = useState('');
  const [langDraft, setLangDraft] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/solver/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) { showToast(json.message, 'error'); return; }
        setData(json);
        const p = json.profile;
        setForm({
          title: p.title || '',
          bio: p.bio || '',
          skills: p.skills || [],
          hourlyRate: p.hourlyRate ?? '',
          availability: p.availability || 'Available',
          location: p.location || '',
          portfolio: p.portfolio || '',
          languages: p.languages || [],
        });
      } catch { showToast('Failed to load profile', 'error'); }
      finally { setLoading(false); }
    };
    if (token) load();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/solver/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
        }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message, 'error'); return; }
      setData(prev => prev ? { ...prev, profile: json.profile } : prev);
      setEditMode(false);
      showToast('Profile saved!', 'success');
    } catch { showToast('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillDraft('');
    skillInputRef.current?.focus();
  };
  const removeSkill = (skill: string) => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));
  const addLanguage = () => {
    const l = langDraft.trim();
    if (l && !form.languages.includes(l)) setForm(f => ({ ...f, languages: [...f.languages, l] }));
    setLangDraft('');
  };
  const removeLanguage = (lang: string) => setForm(f => ({ ...f, languages: f.languages.filter(l => l !== lang) }));

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '28px', height: '28px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (!data) return null;

  const { user, profile, stats } = data;
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const availColor = AVAILABILITY_COLOR[editMode ? form.availability : profile.availability] || '#10b981';

  const statCards = [
    { label: 'Requests Sent',   value: stats.totalRequests,   icon: '✋', color: '#a855f7' },
    { label: 'Tasks Created',   value: stats.totalTasks,       icon: '📋', color: '#3b82f6' },
    { label: 'Tasks Completed', value: stats.completedTasks,   icon: '✅', color: '#10b981' },
    { label: 'Completion Rate', value: `${completionRate}%`,   icon: '📈', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem' }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO CARD ─────────────────────────────────────────────────── */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '36px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 100%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', position: 'relative', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <motion.div whileHover={{ scale: 1.05 }}
            style={{ width: '96px', height: '96px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', fontWeight: '800', color: 'white', boxShadow: '0 12px 32px rgba(16,185,129,0.35)', border: '3px solid rgba(16,185,129,0.3)' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </motion.div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{user.name}</h1>

              {/* Availability badge — animates its color and inner content */}
              <motion.div whileHover={{ scale: 1.04 }} layout
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', background: `${availColor}18`, border: `1px solid ${availColor}40`, color: availColor, transition: 'background 0.3s, border-color 0.3s, color 0.3s' }}
              >
                <motion.span animate={{ backgroundColor: availColor }} transition={{ duration: 0.3 }}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}
                />
                <AnimatePresence mode="wait">
                  {editMode ? (
                    <motion.span key="avail-edit" {...fadeSlideIn}>
                      <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value as Availability }))}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                      >
                        {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#0a0a12', color: 'white' }}>{o}</option>)}
                      </select>
                    </motion.span>
                  ) : (
                    <motion.span key="avail-view" {...fadeSlideIn}>{profile.availability}</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Headline / Title */}
            <div style={{ marginBottom: '10px', minHeight: '32px' }}>
              <AnimatePresence mode="wait">
                {editMode ? (
                  <motion.div key="title-edit" {...fadeSlideIn}>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Professional headline (e.g. Full-Stack Developer)"
                      style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="title-view" {...fadeSlideIn}
                    style={{ fontSize: '1rem', color: '#10b981', fontWeight: '600' }}
                  >
                    {profile.title || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No headline yet — edit your profile</span>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Meta row: email + location + member since */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', alignItems: 'center' }}>
              <span>✉️ {user.email}</span>
              <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                <AnimatePresence mode="wait">
                  {editMode ? (
                    <motion.input key="loc-edit" {...fadeSlideIn}
                      value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="📍 Your location"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', color: 'var(--text-secondary)', fontSize: '0.82rem', outline: 'none', width: '180px' }}
                    />
                  ) : profile.location ? (
                    <motion.span key="loc-view" {...fadeSlideIn}>📍 {profile.location}</motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <span>🗓️ Member since {memberSince}</span>
              <AnimatePresence>
                {profile.hourlyRate && !editMode && (
                  <motion.span key="rate-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    💰 ${profile.hourlyRate}/hr
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Edit / Save / Cancel buttons */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.div key="edit-btns" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.18 }}
                  style={{ display: 'flex', gap: '10px' }}
                >
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditMode(false)}
                    style={{ padding: '9px 18px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
                  >Cancel</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
                    style={{ padding: '9px 22px', borderRadius: '9px', background: saving ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                  >{saving ? 'Saving…' : 'Save Profile'}</motion.button>
                </motion.div>
              ) : (
                <motion.button key="view-btn"
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.18 }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setEditMode(true)}
                  style={{ padding: '9px 20px', borderRadius: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
                >✏️ Edit Profile</motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── TWO COLUMN ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* LEFT — Bio, Skills, Languages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Bio ── */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ padding: '24px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>📝</span> About Me
            </div>
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.textarea key="bio-edit" {...fadeSlideIn}
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write a compelling bio — your experience, specialties, what makes you the best solver…"
                  rows={6}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              ) : profile.bio ? (
                <motion.p key="bio-text" {...fadeSlideIn}
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}
                >{profile.bio}</motion.p>
              ) : (
                <motion.div key="bio-empty" {...fadeSlideIn}
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '20px 0' }}
                >
                  No bio added yet. Click <strong>Edit Profile</strong> to tell buyers what you do best.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Skills ── */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} style={{ padding: '24px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span> Skills
            </div>

            {/* Tag cloud — works in both view and edit mode */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <AnimatePresence>
                {(editMode ? form.skills : profile.skills).map(skill => (
                  <motion.span key={skill}
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}
                  >
                    {skill}
                    {editMode && (
                      <motion.button initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        onClick={() => removeSkill(skill)}
                        style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: '0', fontSize: '0.85rem', lineHeight: 1, marginTop: '1px' }}
                      >×</motion.button>
                    )}
                  </motion.span>
                ))}
                {(editMode ? form.skills : profile.skills).length === 0 && (
                  <motion.span key="skills-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}
                  >No skills added yet.</motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Edit controls — slide in from bottom */}
            <AnimatePresence>
              {editMode && (
                <motion.div key="skills-editor"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input ref={skillInputRef} value={skillDraft} onChange={e => setSkillDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillDraft); } }}
                      placeholder="Type a skill and press Enter…"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => addSkill(skillDraft)}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
                    >Add</motion.button>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Suggestions:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {SKILL_PRESETS.filter(s => !form.skills.includes(s)).map((s, i) => (
                      <motion.button key={s}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        onClick={() => addSkill(s)}
                        style={{ padding: '4px 11px', borderRadius: '999px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >+ {s}</motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Languages ── */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ padding: '24px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🌍</span> Languages
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <AnimatePresence>
                {(editMode ? form.languages : profile.languages).map(lang => (
                  <motion.span key={lang}
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}
                  >
                    {lang}
                    {editMode && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => removeLanguage(lang)}
                        style={{ background: 'none', border: 'none', color: '#d8b4fe', cursor: 'pointer', padding: '0', fontSize: '0.85rem', lineHeight: 1 }}
                      >×</motion.button>
                    )}
                  </motion.span>
                ))}
                {(editMode ? form.languages : profile.languages).length === 0 && (
                  <motion.span key="lang-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}
                  >No languages listed.</motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {editMode && (
                <motion.div key="lang-editor"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={langDraft} onChange={e => setLangDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(); } }}
                      placeholder="e.g. English, Spanish…"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={addLanguage}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
                    >Add</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT — Stats + Rate + Portfolio + Active Project */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stats grid */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>📊 Activity Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {statCards.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.05 }}
                  whileHover={{ y: -2, borderColor: `${s.color}40` }}
                  style={{ padding: '14px 12px', borderRadius: '12px', background: `${s.color}0c`, border: `1px solid ${s.color}22`, textAlign: 'center', transition: 'border-color 0.2s' }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hourly Rate */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>💰 Hourly Rate</div>
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.div key="rate-edit" {...fadeSlideIn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '1.1rem' }}>$</span>
                  <input type="number" min="0" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                    placeholder="e.g. 45"
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/hr</span>
                </motion.div>
              ) : profile.hourlyRate ? (
                <motion.div key="rate-view" {...fadeSlideIn} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>${profile.hourlyRate}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/hr</span>
                </motion.div>
              ) : (
                <motion.div key="rate-empty" {...fadeSlideIn}
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}
                >Rate not set.</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Portfolio */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>🔗 Portfolio / Links</div>
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.input key="portfolio-edit" {...fadeSlideIn}
                  value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))}
                  placeholder="https://your-portfolio.com"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : profile.portfolio ? (
                <motion.a key="portfolio-link" {...fadeSlideIn}
                  href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#60a5fa', fontSize: '0.875rem', wordBreak: 'break-all', textDecoration: 'none', display: 'block' }}
                >🌐 {profile.portfolio}</motion.a>
              ) : (
                <motion.div key="portfolio-empty" {...fadeSlideIn}
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}
                >No portfolio link added.</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Active assignment */}
          <AnimatePresence>
            {stats.assignedProject && (
              <motion.div key="active" className="glass-card"
                initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
                style={{ padding: '20px', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}
              >
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🟢 Active Assignment</div>
                <div style={{ fontWeight: '600', fontSize: '0.92rem', marginBottom: '14px', color: 'var(--text-primary)' }}>{stats.assignedProject.title}</div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver/work')}
                  style={{ width: '100%', padding: '9px', borderRadius: '9px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem' }}
                >Open Workspace →</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
