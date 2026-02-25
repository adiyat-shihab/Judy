'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ROLES = [
  { value: 'Buyer', label: '🛒 Buyer', desc: 'Post projects & hire solvers' },
  { value: 'Problem Solver', label: '🔧 Problem Solver', desc: 'Bid on projects & earn' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Problem Solver' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      login({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);

      if (data.role === 'Admin') router.push('/dashboard/admin');
      else if (data.role === 'Buyer') router.push('/dashboard/buyer');
      else router.push('/dashboard/solver');

    } catch {
      setError('Unable to connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      {/* Background orbs */}
      <div className="bg-orb bg-orb-purple" style={{ top: 'auto', bottom: '-100px', right: '-100px' }} />
      <div className="bg-orb bg-orb-blue" style={{ bottom: 'auto', top: '-80px', left: '-80px' }} />
      <div className="bg-orb bg-orb-cyan" />

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}
      >
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '28px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px', marginBottom: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)'
          }}>
            <span style={{ fontSize: '22px' }}>⚡</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '6px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join the Judy marketplace</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ padding: '32px' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Name */}
            <div>
              <label className="input-label">Full name</label>
              <input
                id="register-name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email address</label>
              <input
                id="register-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <input
                id="register-password"
                type="password"
                className="input-field"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Role Selector */}
            <div>
              <label className="input-label">I want to join as</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {ROLES.map(role => (
                  <motion.button
                    key={role.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => set('role', role.value)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${form.role === role.value ? 'var(--accent-purple)' : 'var(--border)'}`,
                      background: form.role === role.value ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.03)',
                      color: form.role === role.value ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
                      transition: 'all 0.2s', textAlign: 'center',
                      boxShadow: form.role === role.value ? '0 0 0 1px rgba(124,58,237,0.3)' : 'none'
                    }}
                    id={`role-${role.value.toLowerCase().replace(' ', '-')}`}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{role.label}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{role.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Admin note */}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              ℹ️ Admin access is assigned by an existing admin after registration.
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-msg"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              id="register-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '4px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                  />
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-purple-light)', textDecoration: 'none', fontWeight: '500' }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
