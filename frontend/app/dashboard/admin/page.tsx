'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        setUsers(data);
      } catch {
        showToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUsers();
  }, [token]);

  const promoteUser = async (userId: string) => {
    setPromoting(userId);
    try {
      const res = await fetch(`${API}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Buyer' }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }

      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'Buyer' } : u));
      showToast('User promoted to Buyer!', 'success');
    } catch {
      showToast('Failed to promote user', 'error');
    } finally {
      setPromoting(null);
    }
  };

  const ROLE_COLOR: Record<string, string> = {
    Admin: '#ef4444', Buyer: '#3b82f6', 'Problem Solver': '#10b981',
  };

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 999,
              padding: '12px 20px', borderRadius: '10px',
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171',
              fontWeight: '500', fontSize: '0.875rem',
            }}
          >
            {toast.type === 'success' ? '✓ ' : '⚠ '} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '6px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage all registered users and assign Buyer roles.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Users', value: users.length, icon: '👥' },
          { label: 'Buyers', value: users.filter(u => u.role === 'Buyer').length, icon: '🛒' },
          { label: 'Solvers', value: users.filter(u => u.role === 'Problem Solver').length, icon: '🔧' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{ padding: '20px' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Users Table */}
      <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>All Users</h2>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
            />
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {users.map((user, i) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px',
                  borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: `${ROLE_COLOR[user.role] || '#7c3aed'}20`,
                    border: `1px solid ${ROLE_COLOR[user.role] || '#7c3aed'}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: '600', color: ROLE_COLOR[user.role],
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{user.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: '500',
                    background: `${ROLE_COLOR[user.role] || '#7c3aed'}15`,
                    color: ROLE_COLOR[user.role] || '#7c3aed',
                    border: `1px solid ${ROLE_COLOR[user.role] || '#7c3aed'}30`,
                  }}>
                    {user.role}
                  </span>

                  {user.role === 'Problem Solver' && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => promoteUser(user._id)}
                      disabled={promoting === user._id}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem',
                        fontWeight: '500', cursor: 'pointer',
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#60a5fa', transition: 'all 0.2s',
                        opacity: promoting === user._id ? 0.5 : 1,
                      }}
                    >
                      {promoting === user._id ? '...' : '→ Buyer'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
