'use client';

import { useState, useEffect, useRef } from 'react';
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

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
  project,
  token,
  onClose,
  onSave,
}: {
  project: Project;
  token: string | null;
  onClose: () => void;
  onSave: (updated: Project) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onSave(data);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '20px' }}>✏️ Edit Project</h2>
        {/* Warning banner */}
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '20px', fontSize: '0.8rem', color: '#fbbf24' }}>
          ⚠️ You can only edit projects that have not yet been assigned to a solver.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Project Title</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={5}
              style={{ resize: 'vertical', lineHeight: 1.6 }} maxLength={1000} />
          </div>
          {error && <div className="error-msg">⚠ {error}</div>}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  project,
  token,
  onClose,
  onDelete,
}: {
  project: Project;
  token: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/projects/${project._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onDelete(project._id);
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Red warning header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🗑️</div>
          <div>
            <h2 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '2px' }}>Delete Project</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>This action cannot be undone</p>
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{project.title}&rdquo;</strong>?
            All solver requests for this project will also be deleted.
          </p>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: '14px' }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete} disabled={deleting}
            style={{ padding: '9px 20px', borderRadius: '8px', background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Row Action Dropdown ───────────────────────────────────────────────────────
function RowActions({
  project,
  onEdit,
  onDelete,
  onPreview,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canEdit = project.status === 'Unassigned';

  const actions = [
    {
      label: 'Preview',
      icon: '👁',
      action: () => { onPreview(); setOpen(false); },
      disabled: false,
      color: 'var(--text-secondary)',
    },
    {
      label: 'Edit',
      icon: '✏️',
      action: () => { onEdit(); setOpen(false); },
      disabled: !canEdit,
      color: canEdit ? '#60a5fa' : 'var(--text-muted)',
      disabledNote: !canEdit ? 'Already assigned' : undefined,
    },
    {
      label: 'Delete',
      icon: '🗑️',
      action: () => { onDelete(); setOpen(false); },
      disabled: !canEdit,
      color: canEdit ? '#f87171' : 'var(--text-muted)',
      disabledNote: !canEdit ? 'Cannot delete' : undefined,
    },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: '1px solid var(--border)', background: open ? 'rgba(255,255,255,0.08)' : 'none',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        title="Actions"
      >
        ▾
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: '34px', right: 0, zIndex: 100,
              background: 'rgba(10,10,18,0.95)', border: '1px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden', minWidth: '140px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {actions.map(action => (
              <button
                key={action.label}
                onClick={action.disabled ? undefined : action.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  color: action.color, fontSize: '0.82rem', fontWeight: '500',
                  opacity: action.disabled ? 0.45 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!action.disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              >
                <span>{action.icon}</span>
                <span style={{ flex: 1 }}>{action.label}</span>
                {action.disabledNote && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{action.disabledNote}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyProjectsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
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

      {/* Modals */}
      <AnimatePresence>
        {editProject && (
          <EditModal
            project={editProject}
            token={token}
            onClose={() => setEditProject(null)}
            onSave={(updated) => {
              setProjects(prev => prev.map(p => p._id === updated._id ? updated : p));
              setEditProject(null);
            }}
          />
        )}
        {deleteProject && (
          <DeleteModal
            project={deleteProject}
            token={token}
            onClose={() => setDeleteProject(null)}
            onDelete={(id) => {
              setProjects(prev => prev.filter(p => p._id !== id));
              setDeleteProject(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>My Projects</h1>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/buyer/new')}
          style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
        >+ Create a New Project</motion.button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                position: 'relative', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >
              {tab}
              {counts[tab] > 0 && (
                <span style={{ minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.1)', color: isActive ? 'white' : 'var(--text-muted)' }}>
                  {counts[tab]}
                </span>
              )}
              {isActive && (
                <motion.div layoutId="tab-underline"
                  style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius: '2px 2px 0 0' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 120px 36px', padding: '8px 16px', marginBottom: '4px' }}>
          {['PROJECT', 'STATUS', 'SOLVER', 'POSTED', ''].map(col => (
            <span key={col} style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col}</span>
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
        <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{activeTab === 'All' ? '📭' : STATUS_ICON[activeTab] || '📭'}</div>
          <div style={{ fontWeight: '600', fontSize: '1.05rem', marginBottom: '8px' }}>{activeTab === 'All' ? 'No projects yet' : `No ${activeTab.toLowerCase()} projects`}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
            {activeTab === 'All' ? 'Post your first project and let problem solvers find you.' : `You don't have any ${activeTab.toLowerCase()} projects right now.`}
          </div>
          {activeTab === 'All' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard/buyer/new')}
              style={{ padding: '10px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >Create your first project</motion.button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {filtered.map((project, i) => (
                <motion.div key={project._id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 120px 36px', padding: '16px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}
                  onClick={() => router.push(`/dashboard/buyer/project/${project._id}`)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                  style2={{ cursor: 'pointer' }}
                >
                  <div style={{ paddingRight: '20px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '3px' }}>{project.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '420px' }}>{project.description}</div>
                  </div>
                  <div>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', background: `${STATUS_COLOR[project.status]}15`, color: STATUS_COLOR[project.status], border: `1px solid ${STATUS_COLOR[project.status]}30` }}>{project.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>
                    {project.solverId ? <span style={{ color: '#34d399', fontWeight: '500' }}>{project.solverId.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Awaiting bid</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {/* Action button — stops propagation so clicking it doesn't navigate */}
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions
                      project={project}
                      onPreview={() => router.push(`/dashboard/buyer/project/${project._id}`)}
                      onEdit={() => setEditProject(project)}
                      onDelete={() => setDeleteProject(project)}
                    />
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
