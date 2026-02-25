'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'Unassigned' | 'Assigned' | 'Completed';
  buyerId: { name: string; email: string };
  solverId?: { _id: string; name: string };
  createdAt: string;
}

export default function SolverDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setProjects(data);
      } catch { showToast('Failed to load projects', 'error'); }
      finally { setLoading(false); }
    };
    if (token) load();
  }, [token]);

  const requestToWork = async (projectId: string) => {
    setRequesting(projectId);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }
      showToast('Request submitted! Waiting for buyer to assign.', 'success');
    } catch { showToast('Failed to send request', 'error'); }
    finally { setRequesting(null); }
  };

  // Solver can only see Unassigned projects via API; any assigned project is detected separately
  const assignedProject = projects.find(p => p.solverId?._id === (user as any)?._id);
  const openProjects = projects.filter(p => p.status === 'Unassigned');

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem' }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Profile card */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: '800', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>{user?.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              🔧 Problem Solver
            </div>
          </motion.div>

          {/* Stats overview */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Overview</div>
            {[
              { label: 'Open Projects', value: openProjects.length, color: '#f59e0b' },
              { label: 'My Assignment', value: assignedProject ? 1 : 0, color: '#10b981' },
              { label: 'Requests Sent', value: '—', color: 'var(--text-primary)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Workflow guide */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Your Journey</div>
            {[
              { dot: '🔍', label: 'Browse', desc: 'Find open projects', color: '#a855f7' },
              { dot: '✋', label: 'Request', desc: 'Ask to work on a project', color: '#f59e0b' },
              { dot: '⚡', label: 'Assigned', desc: 'Buyer picks you', color: '#3b82f6' },
              { dot: '📤', label: 'Submit', desc: 'Upload your ZIP file', color: '#10b981' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', marginTop: '1px' }}>{s.dot}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: s.color }}>{s.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Apply for Buyer Role CTA */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ padding: '20px', borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.04)' }}
          >
            <div style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Role Upgrade</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>Want to post projects?</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '14px' }}>Apply for Buyer access to create projects and hire solvers.</div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver/apply')}
              style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
            >Apply for Buyer Role →</motion.button>
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>
          {/* Welcome header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>Welcome back, {user?.name.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse open projects and request to work on one.</p>
            </div>
            {assignedProject && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver/work')}
                style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '0.875rem', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', flexShrink: 0, marginLeft: '24px' }}
              >My Work →</motion.button>
            )}
          </motion.div>

          {/* Active assignment banner */}
          {assignedProject && (
            <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '18px 24px', marginBottom: '20px', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>✅ Active Assignment</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{assignedProject.title}</div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver/work')}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', flexShrink: 0 }}
                >Open Workspace →</motion.button>
              </div>
            </motion.div>
          )}

          {/* Open projects */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontWeight: '600', fontSize: '1rem' }}>
              Open Projects
              {!loading && <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px', fontSize: '0.875rem' }}>— {openProjects.length} available</span>}
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
              />
            </div>
          ) : openProjects.length === 0 ? (
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '56px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '1.05rem' }}>No open projects</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Check back later for new opportunities.</div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {openProjects.map((project, i) => (
                <motion.div key={project._id} className="glass-card"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ borderColor: 'rgba(16,185,129,0.3)', translateY: -1 }}
                  style={{ padding: '18px 24px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{project.title}</h3>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', flexShrink: 0 }}>Open</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {project.description}
                      </p>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Posted by <span style={{ color: 'var(--text-secondary)' }}>{project.buyerId.name}</span> · {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.96 }}
                      onClick={() => requestToWork(project._id)}
                      disabled={requesting === project._id}
                      style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '0.82rem', background: requesting === project._id ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: requesting === project._id ? 'not-allowed' : 'pointer', opacity: requesting === project._id ? 0.6 : 1, flexShrink: 0, transition: 'all 0.2s' }}
                    >{requesting === project._id ? '...' : 'Request →'}</motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
