'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
  Admin: [
    { label: 'Users', href: '/dashboard/admin' },
  ],
  Buyer: [
    { label: 'Dashboard', href: '/dashboard/buyer' },
    { label: 'My Projects', href: '/dashboard/buyer/projects' },
    { label: 'New Project', href: '/dashboard/buyer/new' },
  ],
  'Problem Solver': [
    { label: 'Browse', href: '/dashboard/solver' },
    { label: 'My Work', href: '/dashboard/solver/work' },
    { label: 'Profile', href: '/dashboard/solver/profile' },
    { label: 'Apply for Buyer', href: '/dashboard/solver/apply' },
  ],
};

const ROLE_COLOR: Record<string, string> = {
  Admin: '#ef4444',
  Buyer: '#3b82f6',
  'Problem Solver': '#10b981',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  // Cross-role path enforcement — server-validated role is the source of truth
  useEffect(() => {
    if (isLoading || !user) return;
    const role = user.role;
    if (role === 'Admin' && !pathname.startsWith('/dashboard/admin')) {
      router.replace('/dashboard/admin');
    } else if (role === 'Buyer' && !pathname.startsWith('/dashboard/buyer')) {
      router.replace('/dashboard/buyer');
    } else if (role === 'Problem Solver' && !pathname.startsWith('/dashboard/solver')) {
      router.replace('/dashboard/solver');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '32px', height: '32px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%' }}
        />
      </div>
    );
  }

  const navLinks = NAV_LINKS[user.role] || [];
  const roleColor = ROLE_COLOR[user.role] || '#7c3aed';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* ───── TOP NAVBAR ───── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: '60px',
          background: 'rgba(5, 5, 8, 0.85)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center',
          padding: '0 32px', gap: '32px',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>⚡</div>
          <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Judy</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  padding: '6px 14px', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: isActive ? '600' : '400',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Role pill */}
          <div style={{
            padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: '600',
            background: `${roleColor}18`, border: `1px solid ${roleColor}35`, color: roleColor,
          }}>
            {user.role}
          </div>

          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: `${roleColor}25`,
            border: `2px solid ${roleColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: '700', color: roleColor,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Sign out */}
          <button
            id="logout-btn"
            onClick={() => { logout(); router.push('/login'); }}
            style={{
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: '0.8rem',
              transition: 'all 0.2s',
            }}
          >
            Sign out
          </button>
        </div>
      </motion.header>

      {/* ───── PAGE CONTENT ───── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{ flex: 1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
