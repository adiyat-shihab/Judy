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

const STATUS_COLOR: Record<string, string> = {
  Unassigned: '#f59e0b',
  Assigned: '#3b82f6',
  Completed: '#10b981',
};

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
    const fetchProjects = async () => {
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
    if (token) fetchProjects();
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
    } catch {
      showToast('Failed to send request', 'error');
    } finally {
      setRequesting(null);
    }
  };

  const availableProjects = projects.filter(p => p.status === 'Unassigned');
  const myProject = projects.find(p => p.solverId?._id === user?._id);

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 999,
              padding: '12px 20px', borderRadius: '10px',
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem',
            }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '6px' }}>Solver Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse open projects and request to work on them.</p>
      </div>

      {/* Current assignment */}
      {myProject && (
        <motion.div className="glass-card"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '20px 24px', marginBottom: '28px', borderColor: 'rgba(16,185,129,0.3)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                ✅ You are assigned to
              </div>
              <h3 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>{myProject.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{myProject.description}</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/dashboard/solver/project/${myProject._id}`)}
              style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', flexShrink: 0, marginLeft: '16px' }}
            >Open →</motion.button>
          </div>
        </motion.div>
      )}

      {/* Available projects */}
      <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>
        Open Projects ({availableProjects.length})
      </h2>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
          />
        </div>
      ) : availableProjects.length === 0 ? (
        <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>No open projects</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Check back later for new opportunities.</div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {availableProjects.map((project, i) => (
            <motion.div key={project._id} className="glass-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: '20px 24px' }}
              whileHover={{ borderColor: 'rgba(124,58,237,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{project.title}</h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500',
                      background: `${STATUS_COLOR[project.status]}15`, color: STATUS_COLOR[project.status],
                      border: `1px solid ${STATUS_COLOR[project.status]}30`,
                    }}>{project.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {project.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Posted by {project.buyerId?.name}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => requestToWork(project._id)}
                  disabled={requesting === project._id}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '0.82rem',
                    background: requesting === project._id ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)', color: '#a855f7',
                    cursor: requesting === project._id ? 'not-allowed' : 'pointer',
                    opacity: requesting === project._id ? 0.7 : 1,
                    flexShrink: 0, transition: 'all 0.2s',
                  }}
                >
                  {requesting === project._id ? '...' : 'Request →'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
