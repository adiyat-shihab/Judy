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
  status: string;
  buyerId: { name: string; email: string };
  solverId?: { _id: string; name: string; email: string };
}

interface Task {
  _id: string;
  title: string;
  description: string;
  timeline: string;
  status: 'In-progress' | 'Submitted' | 'Completed' | 'Rejected';
}

const TASK_STATUS_COLOR: Record<string, string> = {
  'In-progress': '#f59e0b',
  'Submitted': '#3b82f6',
  'Completed': '#10b981',
  'Rejected': '#ef4444',
};

const TASK_STATUS_ICON: Record<string, string> = {
  'In-progress': '⚡',
  'Submitted': '📤',
  'Completed': '✅',
  'Rejected': '❌',
};

export default function MyWorkPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [assignedProject, setAssignedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const pRes = await fetch(`${API}/api/solver/my-project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.status === 404) { setLoading(false); return; } // No assignment
        if (!pRes.ok) { showToast('Failed to load assignment', 'error'); setLoading(false); return; }
        const project = await pRes.json();
        setAssignedProject(project);

        // Load tasks for assigned project
        const tRes = await fetch(`${API}/api/projects/${project._id}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tRes.ok) setTasks(await tRes.json());
      } catch { showToast('Failed to load your work', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const taskCounts = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'In-progress').length,
    submitted: tasks.filter(t => t.status === 'Submitted').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  };

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
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: '800', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>{user?.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              🔧 Problem Solver
            </div>
          </motion.div>

          {/* Task stats */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Task Overview</div>
            {[
              { label: 'Total Tasks', value: taskCounts.total, color: 'var(--text-primary)' },
              { label: 'In Progress', value: taskCounts.inProgress, color: '#f59e0b' },
              { label: 'Submitted', value: taskCounts.submitted, color: '#3b82f6' },
              { label: 'Completed', value: taskCounts.completed, color: '#10b981' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Task status legend */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Task Stages</div>
            {[
              { dot: '⚡', label: 'In Progress', desc: 'Task created, work ongoing', color: '#f59e0b' },
              { dot: '📤', label: 'Submitted', desc: 'ZIP uploaded, awaiting review', color: '#3b82f6' },
              { dot: '✅', label: 'Completed', desc: 'Buyer accepted your work', color: '#10b981' },
              { dot: '❌', label: 'Rejected', desc: 'Fix and resubmit', color: '#ef4444' },
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>My Work</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your active assignment and task progress.</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver')}
              style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '0.875rem', background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0, marginLeft: '24px' }}
            >← Browse</motion.button>
          </motion.div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
              />
            </div>
          ) : !assignedProject ? (
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '1.05rem' }}>No active assignment yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px' }}>
                Request to work on an open project. Once a buyer selects you, your workspace will appear here.
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/solver')}
                style={{ padding: '10px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >Browse Open Projects →</motion.button>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Assigned project banner */}
              <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '20px 24px', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>✅ Active Assignment</div>
                    <h2 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '6px' }}>{assignedProject.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.6 }}>{assignedProject.description}</p>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Buyer: <span style={{ color: 'var(--text-secondary)' }}>{assignedProject.buyerId.name}</span> · {assignedProject.buyerId.email}
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/dashboard/solver/project/${assignedProject._id}`)}
                    style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem', flexShrink: 0 }}
                  >Open Workspace →</motion.button>
                </div>
              </motion.div>

              {/* Tasks header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontWeight: '600', fontSize: '1rem' }}>
                  Tasks
                  <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px', fontSize: '0.875rem' }}>— {tasks.length} total</span>
                </h2>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/dashboard/solver/project/${assignedProject._id}`)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                >+ Add Task</motion.button>
              </div>

              {tasks.length === 0 ? (
                <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontWeight: '600', marginBottom: '6px' }}>No tasks yet</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>Open your workspace and create your first task.</div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/dashboard/solver/project/${assignedProject._id}`)}
                    style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
                  >Create First Task</motion.button>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tasks.map((task, i) => (
                    <motion.div key={task._id} className="glass-card"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ borderColor: 'rgba(124,58,237,0.25)', translateY: -1 }}
                      style={{ padding: '18px 24px', cursor: 'pointer' }}
                      onClick={() => router.push(`/dashboard/solver/project/${assignedProject._id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem' }}>{TASK_STATUS_ICON[task.status]}</span>
                            <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{task.title}</h3>
                            <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '600', background: `${TASK_STATUS_COLOR[task.status]}15`, color: TASK_STATUS_COLOR[task.status], border: `1px solid ${TASK_STATUS_COLOR[task.status]}30`, flexShrink: 0 }}>{task.status}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{task.description}</p>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            📅 Deadline: {new Date(task.timeline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>›</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
