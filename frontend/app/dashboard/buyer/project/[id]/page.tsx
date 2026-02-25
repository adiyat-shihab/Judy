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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
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
      setProject(prev => prev ? { ...prev, status: 'Assigned', solverId: data.project?.solverId } : prev);
      setRequests(prev => prev.map(r =>
        r._id === requestId ? { ...r, status: 'Accepted' } : { ...r, status: 'Rejected' }
      ));
      showToast('Solver assigned! Project is now in progress.', 'success');
    } catch {
      showToast('Failed to assign solver', 'error');
    } finally {
      setAssigning(null);
    }
  };

  const reviewTask = async (taskId: string, action: 'accept' | 'reject') => {
    setReviewing(taskId);
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }

      // Update task status in state
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: data.task.status } : t));

      if (action === 'accept') {
        showToast('Task accepted and marked as Completed! ✓', 'success');
        // Check if all tasks are completed → mark project complete
        const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, status: 'Completed' as const } : t);
        if (updatedTasks.every(t => t.status === 'Completed')) {
          setProject(prev => prev ? { ...prev, status: 'Completed' } : prev);
        }
      } else {
        showToast('Task rejected — solver will be notified to resubmit.', 'error');
      }
    } catch {
      showToast('Failed to review task', 'error');
    } finally {
      setReviewing(null);
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

  const handleCompleteProject = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); setShowCompleteModal(false); return; }
      setProject(prev => prev ? { ...prev, status: 'Completed' } : prev);
      setShowCompleteModal(false);
      showToast('🎉 Project marked as Completed! Great work all around.', 'success');
    } catch {
      showToast('Failed to complete project', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (!project) return null;

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const submittedTasks = tasks.filter(t => t.status === 'Submitted' || t.status === 'Completed' || t.status === 'Rejected');
  const allTasksDone = tasks.length > 0 && tasks.every(t => t.status === 'Completed');
  const canComplete = project.status === 'Assigned' && allTasksDone;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 24px' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem' }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <button onClick={() => router.push('/dashboard/buyer')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >← Back to Dashboard</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Project info */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '700', lineHeight: 1.3, flex: 1 }}>{project.title}</h1>
              <span style={{ padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', flexShrink: 0, background: `${STATUS_COLOR[project.status]}15`, color: STATUS_COLOR[project.status], border: `1px solid ${STATUS_COLOR[project.status]}30` }}>
                {project.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{project.description}</p>
            {project.solverId && (
              <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned Solver</div>
                <div style={{ fontWeight: '600' }}>{project.solverId.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{project.solverId.email}</div>
              </div>
            )}
          </motion.div>

          {/* ── TASK SUBMISSIONS ── (only when assigned) */}
          {project.status !== 'Unassigned' && (
            <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontWeight: '600', fontSize: '0.95rem' }}>Task Submissions</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {tasks.filter(t => t.status === 'Submitted').length} awaiting review
                </span>
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontWeight: '500', marginBottom: '6px' }}>No tasks yet</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>The solver hasn&apos;t created any tasks yet.</div>
                </div>
              ) : (
                <div>
                  {tasks.map((task, i) => {
                    const sub = submissions[task._id];
                    return (
                      <motion.div key={task._id}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ padding: '18px 24px', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        {/* Task header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem' }}>{TASK_STATUS_ICON[task.status]}</span>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{task.title}</span>
                            <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '600', background: `${STATUS_COLOR[task.status]}15`, color: STATUS_COLOR[task.status], border: `1px solid ${STATUS_COLOR[task.status]}30` }}>
                              {task.status}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            📅 {new Date(task.timeline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: task.status !== 'In-progress' ? '12px' : '0' }}>
                          {task.description}
                        </p>

                        {/* Submission info + actions */}
                        {task.status === 'Submitted' && (
                          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📦 Submission</div>
                                {sub ? (
                                  <a href={`${API}/${sub.fileUrl}`} target="_blank" rel="noreferrer"
                                    style={{ fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    ⬇ {sub.fileName}
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>File submitted</span>
                                )}
                              </div>
                              {/* Accept / Reject */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <motion.button whileTap={{ scale: 0.96 }}
                                  onClick={() => reviewTask(task._id, 'reject')}
                                  disabled={reviewing === task._id}
                                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: reviewing === task._id ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.8rem', opacity: reviewing === task._id ? 0.5 : 1 }}
                                >❌ Reject</motion.button>
                                <motion.button whileTap={{ scale: 0.96 }}
                                  onClick={() => reviewTask(task._id, 'accept')}
                                  disabled={reviewing === task._id}
                                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', cursor: reviewing === task._id ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.8rem', opacity: reviewing === task._id ? 0.5 : 1 }}
                                >{reviewing === task._id ? '...' : '✓ Accept'}</motion.button>
                              </div>
                            </div>
                          </div>
                        )}

                        {task.status === 'Completed' && (
                          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#10b981', fontSize: '1rem' }}>✅</span>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#10b981' }}>Accepted</div>
                              {sub && (
                                <a href={`${API}/${sub.fileUrl}`} target="_blank" rel="noreferrer"
                                  style={{ fontSize: '0.78rem', color: '#34d399', textDecoration: 'none' }}
                                >⬇ Download: {sub.fileName}</a>
                              )}
                            </div>
                          </div>
                        )}

                        {task.status === 'Rejected' && (
                          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: '500' }}>❌ Rejected — Solver is expected to resubmit.</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Solver Requests */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: '600', fontSize: '0.95rem' }}>Solver Requests</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pendingRequests.length} pending</span>
            </div>

            {requests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
                <div style={{ fontWeight: '500', marginBottom: '6px' }}>No requests yet</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Solvers will start requesting once they find your project.</div>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {requests.map((req, i) => (
                  <motion.div key={req._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 24px', borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.875rem', color: '#a855f7' }}>
                        {req.solverId.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{req.solverId.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{req.solverId.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500', background: `${STATUS_COLOR[req.status]}15`, color: STATUS_COLOR[req.status], border: `1px solid ${STATUS_COLOR[req.status]}30` }}>
                        {req.status}
                      </span>
                      {req.status === 'Pending' && project.status === 'Unassigned' && (
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => assignSolver(req._id)} disabled={assigning === req._id}
                          style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: assigning === req._id ? 'not-allowed' : 'pointer', opacity: assigning === req._id ? 0.6 : 1 }}
                        >{assigning === req._id ? '...' : 'Assign →'}</motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN ── */}
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
                  <motion.div
                    animate={{ background: step.done ? '#10b981' : step.active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)' }}
                    transition={{ duration: 0.4 }}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: step.active ? '2px solid #3b82f6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white' }}
                  >{step.done && '✓'}</motion.div>
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

          {/* Task progress */}
          {tasks.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Task Progress</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Completed</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10b981' }}>
                  {tasks.filter(t => t.status === 'Completed').length} / {tasks.length}
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '14px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: '4px' }}
                />
              </div>
              {[
                { label: 'In Progress', count: tasks.filter(t => t.status === 'In-progress').length, color: '#f59e0b' },
                { label: 'Submitted', count: tasks.filter(t => t.status === 'Submitted').length, color: '#3b82f6' },
                { label: 'Completed', count: tasks.filter(t => t.status === 'Completed').length, color: '#10b981' },
                { label: 'Rejected', count: tasks.filter(t => t.status === 'Rejected').length, color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Posted', value: new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Total Requests', value: String(requests.length) },
                { label: 'Total Tasks', value: String(tasks.length) },
                { label: 'Status', value: project.status, colored: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={item.colored ? { color: STATUS_COLOR[item.value], fontWeight: '600' } : {}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* ── Complete Project CTA (sticky at bottom of right panel) ── */}
          {project.status === 'Assigned' && (
            <motion.div className="glass-card"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ padding: '20px', borderColor: canComplete ? 'rgba(16,185,129,0.4)' : 'var(--border)', background: canComplete ? 'rgba(16,185,129,0.04)' : 'none', transition: 'all 0.4s' }}
            >
              <h3 style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Project Delivery</h3>
              {canComplete ? (
                <>
                  <p style={{ fontSize: '0.78rem', color: '#34d399', marginBottom: '14px', lineHeight: 1.5 }}>
                    ✅ All tasks accepted. You can now officially close this project.
                  </p>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCompleteModal(true)}
                    style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
                  >🎉 Mark Project as Completed</motion.button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                    Accept all {tasks.length} task{tasks.length !== 1 ? 's' : ''} to unlock project completion.
                  </p>
                  <div style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'center', cursor: 'not-allowed' }}>
                    🔒 {tasks.filter(t => t.status !== 'Completed').length > 0 ? `${tasks.filter(t => t.status !== 'Completed').length} task(s) pending` : 'No tasks yet'}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Completed archive badge */}
          {project.status === 'Completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{ padding: '20px', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)', textAlign: 'center' }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>Delivered</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>This project is archived.</div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Complete Project Confirmation Modal ── */}
      <AnimatePresence>
        {showCompleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => !completing && setShowCompleteModal(false)}
          >
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 20px' }}
              >🎉</motion.div>

              <h2 style={{ fontWeight: '700', fontSize: '1.15rem', textAlign: 'center', marginBottom: '8px' }}>Complete This Project?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>
                You are about to officially close <strong>&ldquo;{project.title}&rdquo;</strong>. This action is <strong>irreversible</strong> — the project will be archived and no new tasks can be submitted.
              </p>

              {/* Task checklist summary */}
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>All tasks accepted ✓</div>
                {tasks.map(t => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✓</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.title}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCompleteModal(false)} disabled={completing}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
                >Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCompleteProject} disabled={completing}
                  style={{ flex: 2, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: completing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.875rem', opacity: completing ? 0.6 : 1 }}
                >{completing ? 'Completing...' : '🎉 Confirm & Complete'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
