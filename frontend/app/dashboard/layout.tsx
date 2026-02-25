'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  Admin: [
    { label: 'Users', href: '/dashboard/admin', icon: '👥' },
  ],
  Buyer: [
    { label: 'My Projects', href: '/dashboard/buyer', icon: '📁' },
    { label: 'Create Project', href: '/dashboard/buyer/new', icon: '✚' },
  ],
  'Problem Solver': [
    { label: 'Browse Projects', href: '/dashboard/solver', icon: '🔍' },
    { label: 'My Work', href: '/dashboard/solver/work', icon: '🔧' },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  Admin: '#ef4444',
  Buyer: '#3b82f6',
  'Problem Solver': '#10b981',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
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

  const navItems = NAV_BY_ROLE[user.role] || [];
  const roleColor = ROLE_COLORS[user.role] || '#7c3aed';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '240px', minHeight: '100vh', flexShrink: 0,
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '24px 16px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
          }}>⚡</div>
          <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.02em' }}>Judy</span>
        </div>

        {/* Role badge */}
        <div style={{
          padding: '8px 12px', borderRadius: '8px', marginBottom: '24px',
          background: `${roleColor}15`, border: `1px solid ${roleColor}30`,
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signed in as</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: roleColor }}>{user.role}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                color: 'var(--text-secondary)', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: '500',
                transition: 'background 0.2s, color 0.2s',
              }}
              className="nav-link"
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: '0.875rem',
            width: '100%', transition: 'all 0.2s',
          }}
        >
          <span>↩</span> Sign Out
        </button>
      </motion.aside>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ flex: 1, padding: '32px', overflowY: 'auto' }}
      >
        {children}
      </motion.main>
    </div>
  );
}
