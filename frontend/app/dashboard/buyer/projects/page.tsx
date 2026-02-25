'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

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

type FilterTab = 'All' | 'Unassigned' | 'Assigned' | 'Completed';

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

export default function MyProjectsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProjects(data);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  const counts: Record<FilterTab, number> = {
    All: projects.length,
    Unassigned: projects.filter(p => p.status === 'Unassigned').length,
    Assigned: projects.filter(p => p.status === 'Assigned').length,
    Completed: projects.filter(p => p.status === 'Completed').length,
  };

  const filtered = activeTab === 'All' ? projects : projects.filter(p => p.status === activeTab);

  const tabs: FilterTab[] = ['All', 'Unassigned', 'Assigned', 'Completed'];

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>My Projects</h1>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/dashboard/buyer/new')}
          style={{
            padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            letterSpacing: '0.01em',
          }}
        >
          + Create a New Project
        </motion.button>
      </div>

      {/* Filter tabs — Fiverr style */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0',
        borderBottom: '1px solid var(--border)', marginBottom: '24px',
        position: 'relative',
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                position: 'relative', transition: 'color 0.2s',
                display: 'flex', alignItems: 'center', gap: '7px',
                letterSpacing: isActive ? '0.01em' : '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {tab}
              {counts[tab] > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', padding: '0 5px',
                  borderRadius: '999px', fontSize: '0.68rem', fontWeight: '700',
                  background: isActive ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.1)',
                  color: isActive ? 'white' : 'var(--text-muted)',
                }}>
                  {counts[tab]}
                </span>
              )}
              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  style={{
                    position: 'absolute', bottom: '-1px', left: 0, right: 0,
                    height: '2px', background: 'linear-gradient(90deg,#7c3aed,#3b82f6)',
                    borderRadius: '2px 2px 0 0',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 120px 160px 130px',
          padding: '8px 16px', marginBottom: '4px',
        }}>
          {['PROJECT', 'STATUS', 'SOLVER', 'POSTED'].map(col => (
            <span key={col} style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {col}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '28px', height: '28px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '64px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
            {activeTab === 'All' ? '📭' : STATUS_ICON[activeTab] || '📭'}
          </div>
          <div style={{ fontWeight: '600', fontSize: '1.05rem', marginBottom: '8px' }}>
            {activeTab === 'All' ? 'No projects yet' : `No ${activeTab.toLowerCase()} projects`}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
            {activeTab === 'All'
              ? 'Post your first project and let problem solvers find you.'
              : `You don't have any ${activeTab.toLowerCase()} projects right now.`}
          </div>
          {activeTab === 'All' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/buyer/new')}
              style={{ padding: '10px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >Create your first project</motion.button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {filtered.map((project, i) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/dashboard/buyer/project/${project._id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 160px 130px',
                    padding: '18px 16px', cursor: 'pointer',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                >
                  {/* Title + description */}
                  <div style={{ paddingRight: '20px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>{project.title}</div>
                    <div style={{
                      color: 'var(--text-muted)', fontSize: '0.78rem',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '480px',
                    }}>
                      {project.description}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600',
                      background: `${STATUS_COLOR[project.status]}15`,
                      color: STATUS_COLOR[project.status],
                      border: `1px solid ${STATUS_COLOR[project.status]}30`,
                    }}>
                      {project.status}
                    </span>
                  </div>

                  {/* Solver */}
                  <div style={{ fontSize: '0.82rem' }}>
                    {project.solverId ? (
                      <span style={{ color: '#34d399', fontWeight: '500' }}>
                        {project.solverId.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Awaiting bid</span>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
