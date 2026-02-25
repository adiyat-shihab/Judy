'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Buyer' | 'Problem Solver';
  createdAt?: string;
}

const ROLE_COLOR: Record<string, string> = {
  Admin: '#ef4444',
  Buyer: '#3b82f6',
  'Problem Solver': '#10b981',
};

const ROLE_ICON: Record<string, string> = {
  Admin: '🛡️',
  Buyer: '🛒',
  'Problem Solver': '🔧',
};

type Filter = 'All' | 'Problem Solver' | 'Buyer' | 'Admin';

export default function AdminDashboard() {
  const { token, user: adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUsers(data);
        else showToast('Failed to load users', 'error');
      } catch {
        showToast('Unable to connect to server', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUsers();
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
      showToast('✓ Buyer role assigned successfully!', 'success');
    } catch {
      showToast('Failed to assign role', 'error');
    } finally {
      setPromoting(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesFilter = filter === 'All' || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: users.length,
    buyers: users.filter(u => u.role === 'Buyer').length,
    solvers: users.filter(u => u.role === 'Problem Solver').length,
    admins: users.filter(u => u.role === 'Admin').length,
    pendingSolvers: users.filter(u => u.role === 'Problem Solver').length,
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem', backdropFilter: 'blur(10px)' }}
          >{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
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
                You are about to grant <strong>{confirmUser.name}</strong> Buyer access. They will be able to create and manage projects.
              </p>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '22px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div>👤 {confirmUser.name}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>✉ {confirmUser.email}</div>
                <div style={{ marginTop: '4px', color: '#60a5fa' }}>🔧 Problem Solver → 🛒 Buyer</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmUser(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
                >Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => assignBuyer(confirmUser._id)}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' }}
                >✓ Confirm & Assign</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Admin profile card */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: '800', color: 'white', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
              {adminUser?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>{adminUser?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '14px' }}>{adminUser?.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              🛡️ Administrator
            </div>
          </motion.div>

          {/* Platform stats */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Platform Overview</div>
            {[
              { label: 'Total Users', value: stats.total, color: 'var(--text-primary)' },
              { label: 'Problem Solvers', value: stats.solvers, color: '#10b981' },
              { label: 'Buyers', value: stats.buyers, color: '#3b82f6' },
              { label: 'Admins', value: stats.admins, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Admin capabilities */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }} style={{ padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Admin Capabilities</div>
            {[
              { icon: '👥', label: 'View all users', desc: 'See every registered account' },
              { icon: '🛒', label: 'Assign Buyer role', desc: 'Promote Problem Solvers' },
              { icon: '📊', label: 'Platform stats', desc: 'Monitor user distribution' },
            ].map(cap => (
              <div key={cap.label} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', marginTop: '1px' }}>{cap.icon}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>{cap.label}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{cap.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>User Management</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assign Buyer roles to Problem Solvers.</p>
            </div>
            {stats.pendingSolvers > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0, marginLeft: '24px' }}
              >
                {stats.pendingSolvers} eligible for Buyer
              </motion.div>
            )}
          </motion.div>

          {/* Filter tabs + Search */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              {(['All', 'Problem Solver', 'Buyer', 'Admin'] as Filter[]).map(f => (
                <motion.button key={f} whileTap={{ scale: 0.96 }} onClick={() => setFilter(f)}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: filter === f ? 'rgba(124,58,237,0.2)' : 'transparent', color: filter === f ? '#a855f7' : 'var(--text-muted)', transition: 'all 0.2s' }}
                >{f === 'Problem Solver' ? 'Solvers' : f}</motion.button>
              ))}
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field"
              style={{ flex: 1, minWidth: '200px', padding: '8px 14px', fontSize: '0.85rem' }}
            />
          </motion.div>

          {/* Users list */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {filter === 'All' ? 'All Users' : filter === 'Problem Solver' ? 'Problem Solvers' : filter + 's'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '26px', height: '26px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>No users found</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Try adjusting your search or filter.</div>
              </div>
            ) : (
              <div>
                {filtered.map((u, i) => (
                  <motion.div key={u._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    {/* User info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: `${ROLE_COLOR[u.role]}20`, border: `1px solid ${ROLE_COLOR[u.role]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: ROLE_COLOR[u.role] }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '2px' }}>{u.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>
                    </div>

                    {/* Role badge + action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: '600', background: `${ROLE_COLOR[u.role]}15`, color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}30`, whiteSpace: 'nowrap' }}>
                        {ROLE_ICON[u.role]} {u.role}
                      </span>

                      {u.role === 'Problem Solver' && (
                        <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                          onClick={() => setConfirmUser(u)}
                          disabled={promoting === u._id}
                          style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: promoting === u._id ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', opacity: promoting === u._id ? 0.5 : 1, whiteSpace: 'nowrap' }}
                        >
                          {promoting === u._id ? (
                            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>Assigning...</motion.span>
                          ) : '🛒 Make Buyer'}
                        </motion.button>
                      )}

                      {u.role === 'Buyer' && (
                        <div style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '500', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', whiteSpace: 'nowrap' }}>
                          Buyer role active
                        </div>
                      )}

                      {u.role === 'Admin' && (
                        <div style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '500', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', whiteSpace: 'nowrap' }}>
                          System admin
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
