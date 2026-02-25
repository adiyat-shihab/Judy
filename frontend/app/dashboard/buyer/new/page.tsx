'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TITLE_MAX = 80;
const DESC_MAX = 1000;

export default function NewProjectPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = title.trim().length >= 10 && description.trim().length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to create project');
        return;
      }

      // Success — go to the new project's page
      router.push(`/dashboard/buyer/project/${data._id}`);
    } catch {
      setError('Unable to reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg-primary)' }}>
      {/* Fiverr-style step header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '52px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { n: 1, label: 'Overview', active: true },
            { n: 2, label: 'Details', active: false },
            { n: 3, label: 'Publish', active: false },
          ].map((step, i, arr) => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.72rem',
                  fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.active ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.06)',
                  color: step.active ? 'white' : 'var(--text-muted)',
                  border: step.active ? 'none' : '1px solid var(--border)',
                }}>
                  {step.n}
                </div>
                <span style={{ fontSize: '0.82rem', color: step.active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step.active ? '600' : '400' }}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '4px' }}>›</span>
              )}
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          style={{
            padding: '7px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
            background: canSubmit ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.06)',
            color: canSubmit ? 'white' : 'var(--text-muted)',
            border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          Save
        </motion.button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', alignItems: 'start' }}>

            {/* Left — form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Title */}
              <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '28px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>Project Title</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Your title is the first thing solvers see. Write a clear, specific title that describes exactly what you need built.
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="project-title"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Build a responsive React dashboard with authentication"
                    value={title}
                    onChange={e => setTitle(e.target.value.slice(0, TITLE_MAX))}
                    style={{ paddingRight: '72px', fontSize: '0.9rem' }}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.75rem', color: title.length > TITLE_MAX * 0.85 ? '#f59e0b' : 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}>
                    {title.length} / {TITLE_MAX}
                  </span>
                </div>
                {title.length > 0 && title.trim().length < 10 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '8px' }}>
                    ⚡ Minimum 10 characters for a descriptive title
                  </p>
                )}
              </motion.div>

              {/* Description */}
              <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} style={{ padding: '28px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>Project Description</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Describe your project in detail. Include requirements, expected deliverables, and any tech stack preferences solvers should know about.
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    id="project-description"
                    className="input-field"
                    placeholder="Describe your project requirements, expected deliverables, tech stack preferences, timeline expectations..."
                    value={description}
                    onChange={e => setDescription(e.target.value.slice(0, DESC_MAX))}
                    rows={8}
                    style={{ resize: 'vertical', minHeight: '160px', lineHeight: 1.65, paddingBottom: '28px' }}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', bottom: '12px',
                    fontSize: '0.75rem', color: description.length > DESC_MAX * 0.85 ? '#f59e0b' : 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}>
                    {description.length} / {DESC_MAX}
                  </span>
                </div>
                {description.length > 0 && description.trim().length < 20 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '8px' }}>
                    ⚡ Minimum 20 characters for a useful description
                  </p>
                )}
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div className="error-msg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                id="create-project-submit"
                type="submit"
                className="btn-primary"
                disabled={!canSubmit || loading}
                whileTap={{ scale: 0.98 }}
                style={{ opacity: canSubmit ? 1 : 0.45 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                    />
                    Creating project...
                  </span>
                ) : 'Save & Publish →'}
              </motion.button>
            </div>

            {/* Right — tips panel */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}
            >
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                  💡 Tips for a great post
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, listStyle: 'none' }}>
                  {[
                    'Be specific about what you need built',
                    'Mention your preferred tech stack',
                    'Include expected timeline or deadline',
                    'Describe the final deliverable clearly',
                    'Note any existing codebase or constraints',
                  ].map((tip, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ color: '#7c3aed', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress indicator */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  Completion
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Project Title', done: title.trim().length >= 10 },
                    { label: 'Description', done: description.trim().length >= 20 },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <motion.div
                        animate={{ background: item.done ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                        style={{ width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', flexShrink: 0 }}
                      >
                        {item.done ? '✓' : ''}
                      </motion.div>
                      <span style={{ fontSize: '0.8rem', color: item.done ? '#34d399' : 'var(--text-muted)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    animate={{ width: `${([title.trim().length >= 10, description.trim().length >= 20].filter(Boolean).length / 2) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg,#7c3aed,#3b82f6)' }}
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </form>
      </div>
    </div>
  );
}
