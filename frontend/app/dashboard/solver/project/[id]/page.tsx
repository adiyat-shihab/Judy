'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  buyerId: { name: string; email: string };
  solverId?: { _id: string; name: string };
}

interface Task {
  _id: string;
  title: string;
  description: string;
  timeline: string;
  status: 'In-progress' | 'Submitted' | 'Completed' | 'Rejected';
  createdAt: string;
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

// ── Upload Modal ──────────────────────────────────────────────────────────────
function SubmitModal({
  task,
  token,
  onClose,
  onSubmitted,
}: {
  task: Task;
  token: string | null;
  onClose: () => void;
  onSubmitted: (updated: Task) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.zip')) {
      setError('Only ZIP files are accepted.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith('.zip')) { setError('Only ZIP files are accepted.'); return; }
    setError('');
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/api/tasks/${task._id}/submit`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        onSubmitted(data.task);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          setError(err.message || 'Upload failed');
        } catch {
          setError('Upload failed');
        }
      }
    };

    xhr.onerror = () => { setUploading(false); setError('Network error'); };
    xhr.send(formData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>📤 Submit Task</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>{task.title}</p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${file ? 'rgba(16,185,129,0.5)' : 'var(--border)'}`,
            borderRadius: '10px', padding: '36px 24px', textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s', marginBottom: '16px',
          }}
        >
          <input ref={inputRef} type="file" accept=".zip,application/zip" onChange={handleFileChange} style={{ display: 'none' }} />
          {file ? (
            <div>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>{file.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB · ZIP</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '4px' }}>Drop your ZIP file here</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>or click to browse — ZIP only</div>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploading && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Uploading...</span>
              <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '600' }}>{progress}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'linear', duration: 0.1 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}

        {error && <div className="error-msg" style={{ marginBottom: '14px' }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={uploading}
            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}
          >Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!file || uploading}
            style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: !file || uploading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: !file || uploading ? 0.5 : 1 }}
          >{uploading ? 'Uploading...' : 'Submit ZIP'}</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Workspace ─────────────────────────────────────────────────────────────
export default function SolverProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskTimeline, setTaskTimeline] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch(`${API}/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/projects/${id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [pData, tData] = await Promise.all([pRes.json(), tRes.json()]);
        if (pRes.ok) setProject(pData);
        if (tRes.ok) setTasks(tData);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [id, token]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim() || !taskTimeline) {
      setFormError('All fields are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const res = await fetch(`${API}/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: taskTitle.trim(), description: taskDesc.trim(), timeline: taskTimeline }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message); return; }
      setTasks(prev => [data, ...prev]);
      setTaskTitle(''); setTaskDesc(''); setTaskTimeline('');
      setShowTaskForm(false);
      showToast('Task created!', 'success');
    } catch {
      setFormError('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '28px', height: '28px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚫</div>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>Project not found</div>
        <button onClick={() => router.back()} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Go back</button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem', backdropFilter: 'blur(10px)' }}
          >{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Submit modal */}
      <AnimatePresence>
        {submitTask && (
          <SubmitModal
            task={submitTask} token={token}
            onClose={() => setSubmitTask(null)}
            onSubmitted={(updated) => {
              setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
              setSubmitTask(null);
              showToast('ZIP submitted! Awaiting buyer review.', 'success');
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.back()}
          style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
        >←</button>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Project Workspace</div>
          <h1 style={{ fontWeight: '700', fontSize: '1.4rem' }}>{project.title}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Create task section */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showTaskForm ? '20px' : '0' }}>
              <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Tasks ({tasks.length})</h2>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { setShowTaskForm(p => !p); setFormError(''); }}
                style={{ padding: '8px 16px', borderRadius: '8px', background: showTaskForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: showTaskForm ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
              >{showTaskForm ? '✕ Cancel' : '+ New Task'}</motion.button>
            </div>

            {/* Inline task form */}
            <AnimatePresence>
              {showTaskForm && (
                <motion.form onSubmit={handleCreateTask}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
                    <div>
                      <label className="input-label">Task Title *</label>
                      <input className="input-field" placeholder="e.g. Design the login screen" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <label className="input-label">Description *</label>
                      <textarea className="input-field" placeholder="Describe what this task involves..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                    <div>
                      <label className="input-label">Deadline *</label>
                      <input type="date" className="input-field" min={today} value={taskTimeline} onChange={e => setTaskTimeline(e.target.value)} />
                    </div>
                    {formError && <div className="error-msg">⚠ {formError}</div>}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={creating}
                        style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: creating ? 0.6 : 1 }}
                      >{creating ? 'Creating...' : 'Create Task'}</motion.button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Task list */}
          {tasks.length === 0 ? (
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '48px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>No tasks yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create your first task to get started.</div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {tasks.map((task, i) => (
                  <motion.div key={task._id} className="glass-card"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ padding: '18px 20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        {/* Status + title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>{TASK_STATUS_ICON[task.status]}</span>
                          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{task.title}</span>
                          <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '600', background: `${TASK_STATUS_COLOR[task.status]}15`, color: TASK_STATUS_COLOR[task.status], border: `1px solid ${TASK_STATUS_COLOR[task.status]}30` }}>
                            {task.status}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.6, marginBottom: '10px' }}>{task.description}</p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                          <span>📅 Deadline: {new Date(task.timeline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Submit ZIP button — only for In-progress tasks */}
                      {task.status === 'In-progress' && (
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => setSubmitTask(task)}
                          style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >📤 Submit ZIP</motion.button>
                      )}
                      {task.status === 'Rejected' && (
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => setSubmitTask(task)}
                          style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >🔄 Resubmit</motion.button>
                      )}
                      {task.status === 'Submitted' && (
                        <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '0.78rem', fontWeight: '500', flexShrink: 0 }}>
                          Awaiting review
                        </div>
                      )}
                      {task.status === 'Completed' && (
                        <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.78rem', fontWeight: '500', flexShrink: 0 }}>
                          Accepted ✓
                        </div>
                      )}
                    </div>

                    {/* Rejected message */}
                    {task.status === 'Rejected' && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem', color: '#f87171' }}>
                        ⚠️ Buyer rejected this submission. Fix your work and resubmit a new ZIP.
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT — Project info + workflow guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '76px' }}>

          {/* Project details */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Project</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>{project.title}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '12px' }}>{project.description}</p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '4px' }}>👤 Buyer: {project.buyerId.name}</div>
              <div>{project.buyerId.email}</div>
            </div>
          </motion.div>

          {/* Task workflow guide */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Task Workflow</div>
            {[
              { icon: '⚡', label: 'In Progress', desc: 'Task created, work ongoing', color: '#f59e0b' },
              { icon: '📤', label: 'Submitted', desc: 'ZIP uploaded, awaiting review', color: '#3b82f6' },
              { icon: '✅', label: 'Completed', desc: 'Buyer accepted your work', color: '#10b981' },
              { icon: '❌', label: 'Rejected', desc: 'Fix & resubmit a new ZIP', color: '#ef4444' },
            ].map((step, i) => (
              <div key={step.label} style={{ display: 'flex', gap: '10px', marginBottom: i < 3 ? '12px' : '0', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${step.color}15`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.78rem', color: step.color }}>{step.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Stats summary */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Progress</div>
            {tasks.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Completed</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10b981' }}>
                    {tasks.filter(t => t.status === 'Completed').length} / {tasks.length}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: '4px' }}
                  />
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No tasks created yet.</div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
