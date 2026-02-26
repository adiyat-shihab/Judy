'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User { _id: string; name: string; email: string; role: string; }
interface Application {
  _id: string;
  solverId: User;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}
interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'Unassigned' | 'Assigned' | 'Completed';
  buyerId: { _id: string; name: string; email: string };
  solverId?: { _id: string; name: string; email: string };
  createdAt: string;
}

const ROLE_COLOR: Record<string, string> = { Admin: '#ef4444', Buyer: '#3b82f6', 'Problem Solver': '#10b981' };
const ROLE_ICON: Record<string, string>  = { Admin: '🛡️', Buyer: '🛒', 'Problem Solver': '🔧' };
const APP_COLOR: Record<string, string>  = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444' };
const APP_ICON: Record<string, string>   = { Pending: '⏳', Approved: '✅', Rejected: '❌' };
const PROJ_COLOR: Record<string, string> = { Unassigned: '#f59e0b', Assigned: '#3b82f6', Completed: '#10b981' };
const PROJ_ICON: Record<string, string>  = { Unassigned: '📭', Assigned: '⚡', Completed: '✅' };

type Tab        = 'users' | 'applications' | 'projects';
type UserFilter = 'All' | 'Problem Solver' | 'Buyer' | 'Admin';
type AppFilter  = 'All' | 'Pending' | 'Approved' | 'Rejected';
type ProjFilter = 'All' | 'Unassigned' | 'Assigned' | 'Completed';

export default function AdminDashboard() {
  const { token, user: adminUser } = useAuth();
  const [tab, setTab] = useState<Tab>('applications');

  // Users state
  const [users, setUsers]               = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [promoting, setPromoting]       = useState<string | null>(null);
  const [userFilter, setUserFilter]     = useState<UserFilter>('All');
  const [userSearch, setUserSearch]     = useState('');
  const [confirmUser, setConfirmUser]   = useState<User | null>(null);

  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps]   = useState(true);
  const [reviewing, setReviewing]       = useState<string | null>(null);
  const [appFilter, setAppFilter]       = useState<AppFilter>('Pending');

  // Projects state
  const [projects, setProjects]           = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projFilter, setProjFilter]       = useState<ProjFilter>('All');
  const [projSearch, setProjSearch]       = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setUsers(data);
      } catch { showToast('Failed to load users', 'error'); }
      finally { setLoadingUsers(false); }
    };
    if (token) fetchUsers();
  }, [token]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch(`${API}/api/applications`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setApplications(data);
      } catch { showToast('Failed to load applications', 'error'); }
      finally { setLoadingApps(false); }
    };
    if (token) fetchApps();
  }, [token]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setProjects(data);
      } catch { showToast('Failed to load projects', 'error'); }
      finally { setLoadingProjects(false); }
    };
    if (token) fetchProjects();
  }, [token]);

  const assignBuyer = async (userId: string) => {
    setPromoting(userId);
    setConfirmUser(null);
    try {
      const res = await fetch(`${API}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Buyer' }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'Buyer' } : u));
      showToast('✓ Buyer role assigned!', 'success');
    } catch { showToast('Failed to assign role', 'error'); }
    finally { setPromoting(null); }
  };

  const reviewApp = async (appId: string, action: 'approve' | 'reject') => {
    setReviewing(appId);
    try {
      const res = await fetch(`${API}/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: action === 'approve' ? 'Approved' : 'Rejected' } : a));
      if (action === 'approve') {
        // Also update user list role
        const app = applications.find(a => a._id === appId);
        if (app) setUsers(prev => prev.map(u => u._id === app.solverId._id ? { ...u, role: 'Buyer' } : u));
      }
      showToast(action === 'approve' ? '🎉 Application approved — user is now a Buyer!' : 'Application rejected.', action === 'approve' ? 'success' : 'error');
    } catch { showToast('Failed to review application', 'error'); }
    finally { setReviewing(null); }
  };

  const filteredUsers = users.filter(u => {
    const matchFilter = userFilter === 'All' || u.role === userFilter;
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredApps = applications.filter(a => appFilter === 'All' || a.status === appFilter);

  const filteredProjects = projects.filter(p => {
    const matchFilter = projFilter === 'All' || p.status === projFilter;
    const matchSearch =
      p.title.toLowerCase().includes(projSearch.toLowerCase()) ||
      p.buyerId?.name?.toLowerCase().includes(projSearch.toLowerCase()) ||
      p.solverId?.name?.toLowerCase().includes(projSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total:    users.length,
    buyers:   users.filter(u => u.role === 'Buyer').length,
    solvers:  users.filter(u => u.role === 'Problem Solver').length,
    pending:  applications.filter(a => a.status === 'Pending').length,
    projects: projects.length,
  };

  const NAV_TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'applications', icon: '📋', label: 'Applications', badge: stats.pending },
    { id: 'users',        icon: '👥', label: 'All Users' },
    { id: 'projects',     icon: '📁', label: 'Projects',     badge: stats.projects > 0 ? stats.projects : undefined },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem', backdropFilter: 'blur(10px)' }}
          >{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Confirm promote modal */}
      <AnimatePresence>
        {confirmUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setConfirmUser(null)}
          >
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 20px' }}
              >🛒</motion.div>
              <h2 style={{ fontWeight: '700', fontSize: '1.1rem', textAlign: 'center', marginBottom: '8px' }}>Assign Buyer Role?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
                Grant <strong>{confirmUser.name}</strong> Buyer access to create and manage projects.
              </p>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '22px', fontSize: '0.82rem', color: '#60a5fa' }}>
                🔧 Problem Solver → 🛒 Buyer
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmUser(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => assignBuyer(confirmUser._id)}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' }}
                >✓ Confirm & Assign</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Admin profile */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800', color: 'white', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
              {adminUser?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>{adminUser?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '14px' }}>{adminUser?.email}</div>
            <div style={{ display: 'inline-flex', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>🛡️ Administrator</div>
          </motion.div>

          {/* Stats */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Platform Stats</div>
            {[
              { label: 'Total Users',            value: stats.total,    color: 'var(--text-primary)' },
              { label: 'Problem Solvers',         value: stats.solvers,  color: '#10b981' },
              { label: 'Buyers',                  value: stats.buyers,   color: '#3b82f6' },
              { label: 'Pending Applications',    value: stats.pending,  color: '#f59e0b' },
              { label: 'Total Projects',          value: stats.projects, color: '#a855f7' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{s.label}</span>
                <span style={{ fontWeight: '700', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Nav tabs */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} style={{ padding: '8px' }}>
            {NAV_TABS.map(item => (
              <motion.button key={item.id} whileTap={{ scale: 0.97 }} onClick={() => setTab(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: 'none', background: tab === item.id ? 'rgba(124,58,237,0.15)' : 'transparent', color: tab === item.id ? '#a855f7' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px', textAlign: 'left' }}
              >
                <span>{item.icon} {item.label}</span>
                {item.badge != null ? (
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', background: item.id === 'projects' ? 'rgba(168,85,247,0.2)' : 'rgba(245,158,11,0.2)', color: item.id === 'projects' ? '#a855f7' : '#f59e0b' }}>{item.badge}</span>
                ) : null}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>

          {/* ── APPLICATIONS TAB ── */}
          {tab === 'applications' && (
            <motion.div key="applications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Buyer Applications</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Review and approve Solver requests to become Buyers.</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content' }}>
                {(['Pending', 'Approved', 'Rejected', 'All'] as AppFilter[]).map(f => (
                  <motion.button key={f} whileTap={{ scale: 0.96 }} onClick={() => setAppFilter(f)}
                    style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: appFilter === f ? 'rgba(124,58,237,0.2)' : 'transparent', color: appFilter === f ? '#a855f7' : 'var(--text-muted)', transition: 'all 0.2s' }}
                  >{f}</motion.button>
                ))}
              </div>

              <div className="glass-card">
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.92rem' }}>{appFilter} Applications</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredApps.length} total</span>
                </div>

                {loadingApps ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '26px', height: '26px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }} />
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: '600', marginBottom: '6px' }}>No {appFilter.toLowerCase()} applications</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>When solvers apply for Buyer access, they&apos;ll appear here.</div>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {filteredApps.map((app, i) => (
                        <motion.div key={app._id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          style={{ padding: '20px 24px', borderBottom: i < filteredApps.length - 1 ? '1px solid var(--border)' : 'none' }}
                        >
                          {/* Applicant header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#10b981', flexShrink: 0 }}>
                                {app.solverId.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{app.solverId.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{app.solverId.email}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', background: `${APP_COLOR[app.status]}15`, color: APP_COLOR[app.status], border: `1px solid ${APP_COLOR[app.status]}30` }}>
                                {APP_ICON[app.status]} {app.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: app.status === 'Pending' ? '14px' : '0' }}>
                            &ldquo;{app.reason}&rdquo;
                          </div>

                          {/* Approve / Reject actions — only for Pending */}
                          {app.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <motion.button whileTap={{ scale: 0.97 }} onClick={() => reviewApp(app._id, 'reject')}
                                disabled={reviewing === app._id}
                                style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: reviewing === app._id ? 'not-allowed' : 'pointer', opacity: reviewing === app._id ? 0.5 : 1 }}
                              >✕ Reject</motion.button>
                              <motion.button whileTap={{ scale: 0.97 }} onClick={() => reviewApp(app._id, 'approve')}
                                disabled={reviewing === app._id}
                                style={{ padding: '8px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', cursor: reviewing === app._id ? 'not-allowed' : 'pointer', opacity: reviewing === app._id ? 0.5 : 1 }}
                              >{reviewing === app._id ? 'Processing...' : '✓ Approve → Buyer'}</motion.button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>User Management</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>View all users and manage roles directly.</p>
              </div>

              {/* Filter + search */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  {(['All', 'Problem Solver', 'Buyer', 'Admin'] as UserFilter[]).map(f => (
                    <motion.button key={f} whileTap={{ scale: 0.96 }} onClick={() => setUserFilter(f)}
                      style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: userFilter === f ? 'rgba(124,58,237,0.2)' : 'transparent', color: userFilter === f ? '#a855f7' : 'var(--text-muted)', transition: 'all 0.2s' }}
                    >{f === 'Problem Solver' ? 'Solvers' : f}</motion.button>
                  ))}
                </div>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..." className="input-field"
                  style={{ flex: 1, minWidth: '180px', padding: '8px 14px', fontSize: '0.85rem' }} />
              </div>

              <div className="glass-card">
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.92rem' }}>{userFilter === 'Problem Solver' ? 'Solvers' : userFilter === 'All' ? 'All Users' : userFilter + 's'}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                </div>
                {loadingUsers ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '26px', height: '26px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }} />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                    <div style={{ fontWeight: '600' }}>No users found</div>
                  </div>
                ) : filteredUsers.map((u, i) => (
                  <motion.div key={u._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 24px', borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: `${ROLE_COLOR[u.role]}20`, border: `1px solid ${ROLE_COLOR[u.role]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.88rem', color: ROLE_COLOR[u.role] }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{u.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', background: `${ROLE_COLOR[u.role]}15`, color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}30` }}>
                        {ROLE_ICON[u.role]} {u.role}
                      </span>
                      {u.role === 'Problem Solver' && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setConfirmUser(u)} disabled={promoting === u._id}
                          style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', opacity: promoting === u._id ? 0.5 : 1 }}
                        >{promoting === u._id ? '...' : '🛒 Make Buyer'}</motion.button>
                      )}
                      {u.role === 'Buyer' && <div style={{ fontSize: '0.76rem', color: '#60a5fa' }}>Buyer active</div>}
                      {u.role === 'Admin' && <div style={{ fontSize: '0.76rem', color: '#f87171' }}>System admin</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
