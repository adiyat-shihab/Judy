'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { motion } from 'motion/react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'Admin') router.replace('/dashboard/admin');
        else if (user.role === 'Buyer') router.replace('/dashboard/buyer');
        else router.replace('/dashboard/solver');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '32px', height: '32px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-orb bg-orb-purple" />
      <div className="bg-orb bg-orb-blue" />
      <div className="bg-orb bg-orb-cyan" />

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', marginBottom: '28px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 12px 40px rgba(124, 58, 237, 0.5)' }}
        >
          <span style={{ fontSize: '32px' }}>⚡</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2 }}
        >
          The <span className="gradient-text">marketplace</span><br />for project solvers
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.7 }}
        >
          Connect buyers with problem solvers. Post projects, bid on work, and get things done — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a href="/register" style={{
            padding: '13px 32px', borderRadius: '10px', fontWeight: '600', fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: 'white', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            Get Started →
          </a>
          <a href="/login" style={{
            padding: '13px 32px', borderRadius: '10px', fontWeight: '600', fontSize: '0.95rem',
            border: '1px solid var(--border)', background: 'var(--glass-bg)',
            color: 'var(--text-primary)', textDecoration: 'none',
            backdropFilter: 'blur(10px)',
          }}>
            Sign In
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
