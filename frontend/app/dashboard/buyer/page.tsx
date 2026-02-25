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

const STATUS_ICON: Record<string, string> = {
  Unassigned: '🟡',
  Assigned: '🔵',
  Completed: '✅',
};

export default function BuyerDashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  const myProjects = projects.filter(p => p.buyerId);

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '6px' }}>Buyer Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create and manage your projects.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/dashboard/buyer/new')}
          style={{
            padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          }}
        >
          + New Project
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {['Unassigned', 'Assigned', 'Completed'].map((status, i) => (
          <motion.div key={status} className="glass-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ padding: '20px' }}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{STATUS_ICON[status]}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px', color: STATUS_COLOR[status] }}>
              {myProjects.filter(p => p.status === status).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{status}</div>
          </motion.div>
        ))}
      </div>

      {/* Projects list */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
          />
        </div>
      ) : myProjects.length === 0 ? (
        <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📭</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>No projects yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>Create your first project to get started.</div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/buyer/new')}
            style={{ padding: '10px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >Create Project</motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myProjects.map((project, i) => (
            <motion.div key={project._id} className="glass-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: '20px 24px', cursor: 'pointer' }}
              onClick={() => router.push(`/dashboard/buyer/project/${project._id}`)}
              whileHover={{ borderColor: 'rgba(124,58,237,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{project.title}</h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500',
                      background: `${STATUS_COLOR[project.status]}15`,
                      color: STATUS_COLOR[project.status],
                      border: `1px solid ${STATUS_COLOR[project.status]}30`,
                    }}>{project.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {project.description}
                  </p>
                  {project.solverId && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Assigned to: <span style={{ color: '#10b981' }}>{project.solverId.name}</span>
                    </div>
                  )}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginLeft: '16px' }}>›</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
