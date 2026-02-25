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
  solverId?: { name: string; email: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  Unassigned: '#f59e0b',
  Assigned: '#3b82f6',
  Completed: '#10b981',
};

export default function BuyerDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProjects(data);
      } catch {
        showToast('Failed to load projects', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetch_();
  }, [token]);

  const stats = {
    total: projects.length,
    unassigned: projects.filter(p => p.status === 'Unassigned').length,
    assigned: projects.filter(p => p.status === 'Assigned').length,
    completed: projects.filter(p => p.status === 'Completed').length,
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'fixed', top: '72px', right: '24px', zIndex: 999,
              padding: '12px 20px', borderRadius: '10px',
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171',
              fontWeight: '500', fontSize: '0.875rem',
            }}
          >
            {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Profile card */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: '24px', textAlign: 'center' }}
          >
            {/* Avatar */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: '800', color: 'white',
              boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>{user?.email}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600',
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
            }}>🛒 Buyer</div>
          </motion.div>

          {/* Overview card */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
            style={{ padding: '20px' }}
          >
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Project Overview
            </div>
            {[
              { label: 'Total Projects', value: stats.total, color: 'var(--text-primary)' },
              { label: 'Active (Assigned)', value: stats.assigned, color: '#3b82f6' },
              { label: 'Completed', value: stats.completed, color: '#10b981' },
              { label: 'Awaiting Solver', value: stats.unassigned, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Status legend */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}
            style={{ padding: '20px' }}
          >
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>
              Workflow Stages
            </div>
            {[
              { label: 'Unassigned', desc: 'Awaiting solver bids', color: '#f59e0b', dot: '🟡' },
              { label: 'Assigned', desc: 'Solver is working', color: '#3b82f6', dot: '🔵' },
              { label: 'Completed', desc: 'Work delivered', color: '#10b981', dot: '✅' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', marginTop: '1px' }}>{s.dot}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: s.color }}>{s.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>
          {/* Welcome header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>
                Welcome back, {user?.name.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Manage your projects and review solver submissions here.
              </p>
            </div>
            <motion.button
              id="create-project-btn"
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/dashboard/buyer/new')}
              style={{
                padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                color: 'white', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                flexShrink: 0, marginLeft: '24px',
              }}
            >
              + New Project
            </motion.button>
          </motion.div>

          {/* Projects section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontWeight: '600', fontSize: '1rem' }}>
              My Projects
              {!loading && (
                <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px', fontSize: '0.875rem' }}>
                  — {projects.length} total
                </span>
              )}
            </h2>
          </div>

          {/* Project cards */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
              />
            </div>
          ) : projects.length === 0 ? (
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '56px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📭</div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '1.05rem' }}>No projects yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>
                Post your first project and let problem solvers bid on it.
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/buyer/new')}
                style={{ padding: '10px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >Create your first project</motion.button>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((project, i) => (
                <motion.div
                  key={project._id}
                  className="glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ borderColor: 'rgba(124,58,237,0.3)', translateY: -1 }}
                  style={{ padding: '18px 24px', cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/buyer/project/${project._id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{project.title}</h3>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600',
                          background: `${STATUS_COLOR[project.status]}15`,
                          color: STATUS_COLOR[project.status],
                          border: `1px solid ${STATUS_COLOR[project.status]}30`,
                          flexShrink: 0,
                        }}>{project.status}</span>
                      </div>
                      <p style={{
                        color: 'var(--text-secondary)', fontSize: '0.84rem',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        {project.description}
                      </p>
                      {project.solverId && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Solver: <span style={{ color: '#10b981', fontWeight: '500' }}>{project.solverId.name}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>›</span>
                    </div>
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
