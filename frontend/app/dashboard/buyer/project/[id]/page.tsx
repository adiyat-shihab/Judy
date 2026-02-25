'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SolverRequest {
  _id: string;
  solverId: { _id: string; name: string; email: string };
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  timeline: string;
  status: 'In-progress' | 'Submitted' | 'Completed' | 'Rejected';
  createdAt: string;
}

interface Submission {
  _id: string;
  taskId: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

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
  Unassigned: '#f59e0b', Assigned: '#3b82f6', Completed: '#10b981',
  Pending: '#f59e0b', Accepted: '#10b981', Rejected: '#ef4444',
  'In-progress': '#f59e0b', Submitted: '#3b82f6',
};

const TASK_STATUS_ICON: Record<string, string> = {
  'In-progress': '⚡', 'Submitted': '📤', 'Completed': '✅', 'Rejected': '❌',
};

export default function BuyerProjectDetail() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<SolverRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTasks = async (pid: string) => {
    const tRes = await fetch(`${API}/api/projects/${pid}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    if (tRes.ok) {
      const taskData: Task[] = await tRes.json();
      setTasks(taskData);

      // Load submissions for each submitted/completed/rejected task
      const subMap: Record<string, Submission> = {};
      await Promise.all(
        taskData
          .filter(t => t.status !== 'In-progress')
          .map(async t => {
            try {
              const sRes = await fetch(`${API}/api/tasks/${t._id}/submission`, { headers: { Authorization: `Bearer ${token}` } });
              if (sRes.ok) {
                const sub = await sRes.json();
                subMap[t._id] = sub;
              }
            } catch { /* no submission yet */ }
          })
      );
      setSubmissions(subMap);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, reqRes] = await Promise.all([
          fetch(`${API}/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/projects/${projectId}/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [projData, reqData] = await Promise.all([projRes.json(), reqRes.json()]);
        if (projRes.ok) setProject(projData);
        if (reqRes.ok) setRequests(reqData);

        // Load tasks if project is assigned or completed
        if (projRes.ok && projData.status !== 'Unassigned') {
          await loadTasks(projectId);
        }
      } catch {
        showToast('Failed to load project', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, projectId]);

  const assignSolver = async (requestId: string) => {
    setAssigning(requestId);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }

      // Optimistically update UI
      setProject(prev => prev ? { ...prev, status: 'Assigned', solverId: data.project?.solverId } : prev);
      setRequests(prev => prev.map(r =>
        r._id === requestId ? { ...r, status: 'Accepted' } : { ...r, status: 'Rejected' }
      ));
      showToast('Solver assigned! Project is now In Progress.', 'success');
    } catch {
      showToast('Failed to assign solver', 'error');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '28px', height: '28px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (!project) return null;

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const submittedTasks = tasks.filter(t => t.status === 'Submitted' || t.status === 'Completed' || t.status === 'Rejected');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 24px' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '72px', right: '24px', zIndex: 999,
              padding: '12px 20px', borderRadius: '10px',
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem',
            }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <button onClick={() => router.push('/dashboard/buyer')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Project info */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '700', lineHeight: 1.3, flex: 1 }}>{project.title}</h1>
              <span style={{
                padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', flexShrink: 0,
                background: `${STATUS_COLOR[project.status]}15`, color: STATUS_COLOR[project.status],
                border: `1px solid ${STATUS_COLOR[project.status]}30`,
              }}>{project.status}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {project.description}
            </p>
            {project.solverId && (
              <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned Solver</div>
                <div style={{ fontWeight: '600' }}>{project.solverId.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{project.solverId.email}</div>
              </div>
            )}
          </motion.div>

          {/* Requests */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: '600', fontSize: '0.95rem' }}>Solver Requests</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pendingRequests.length} pending</span>
            </div>

            {requests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
                <div style={{ fontWeight: '500', marginBottom: '6px' }}>No requests yet</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Solvers will start requesting once they find your project.
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {requests.map((req, i) => (
                  <motion.div key={req._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                      padding: '14px 24px',
                      borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', fontSize: '0.875rem', color: '#a855f7',
                      }}>
                        {req.solverId.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{req.solverId.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{req.solverId.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500',
                        background: `${STATUS_COLOR[req.status]}15`, color: STATUS_COLOR[req.status],
                        border: `1px solid ${STATUS_COLOR[req.status]}30`,
                      }}>{req.status}</span>
                      {req.status === 'Pending' && project.status === 'Unassigned' && (
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => assignSolver(req._id)}
                          disabled={assigning === req._id}
                          style={{
                            padding: '7px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
                            background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white',
                            border: 'none', cursor: assigning === req._id ? 'not-allowed' : 'pointer',
                            opacity: assigning === req._id ? 0.6 : 1,
                          }}
                        >
                          {assigning === req._id ? '...' : 'Assign →'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — metadata */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}
        >
          {/* Status timeline */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '18px', color: 'var(--text-secondary)' }}>Project Lifecycle</h3>
            {[
              { label: 'Created', done: true, active: false },
              { label: 'Solver Assigned', done: project.status !== 'Unassigned', active: project.status === 'Assigned' },
              { label: 'Work in Progress', done: project.status === 'Completed', active: project.status === 'Assigned' },
              { label: 'Completed', done: project.status === 'Completed', active: false },
            ].map((step, i, arr) => (
              <div key={step.label} style={{ display: 'flex', gap: '12px', paddingBottom: i < arr.length - 1 ? '16px' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: step.done ? '#10b981' : step.active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)',
                    border: step.active ? '2px solid #3b82f6' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem',
                  }}>
                    {step.done && '✓'}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: '1px', flex: 1, background: step.done ? '#10b981' : 'var(--border)', marginTop: '4px', minHeight: '16px' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '500', color: step.done ? '#34d399' : step.active ? '#60a5fa' : 'var(--text-muted)' }}>
                    {step.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Posted</span>
                <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Requests</span>
                <span>{requests.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: STATUS_COLOR[project.status], fontWeight: '600' }}>{project.status}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
