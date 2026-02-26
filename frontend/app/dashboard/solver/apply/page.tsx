'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Application {
  _id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  createdAt: string;
}

const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444' };
const STATUS_ICON  = { Pending: '⏳', Approved: '✅', Rejected: '❌' };

export default function ApplyForBuyerPage() {
  const { token } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchMyApp = async () => {
      try {
        const res = await fetch(`${API}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setApplication(await res.json());
      } finally {
        setLoadingStatus(false);
      }
    };
    if (token) fetchMyApp();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      showToast('Please write at least 20 characters explaining your reason.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, 'error'); return; }
      setApplication(data.application);
      setReason('');
      showToast('🎉 Application submitted! An admin will review it shortly.', 'success');
    } catch {
      showToast('Failed to submit application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: '72px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: '500', fontSize: '0.875rem', backdropFilter: 'blur(10px)' }}
          >{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Role Upgrade</div>
        <h1 style={{ fontWeight: '800', fontSize: '1.8rem', marginBottom: '8px' }}>Apply for Buyer Role</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          As a Buyer, you can post projects and hire Problem Solvers. Tell an Admin why you&apos;d like Buyer access.
        </p>
      </motion.div>

      {/* What you can do as Buyer card */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Buyer Privileges</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { icon: '📋', label: 'Post Projects', desc: 'Create and describe projects for solvers' },
            { icon: '👥', label: 'Review Requests', desc: 'See who wants to work on your project' },
            { icon: '🎯', label: 'Assign Solvers', desc: 'Pick the best fit for the job' },
            { icon: '✅', label: 'Accept Deliveries', desc: 'Review and approve submitted work' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.82rem', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Existing application status */}
      {!loadingStatus && application && (
        <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ padding: '24px', marginBottom: '24px', borderColor: `${STATUS_COLOR[application.status]}40`, background: `${STATUS_COLOR[application.status]}06` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>{STATUS_ICON[application.status]}</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: STATUS_COLOR[application.status] }}>
                {application.status === 'Pending' ? 'Application Under Review' :
                 application.status === 'Approved' ? 'Application Approved! 🎉' : 'Application Rejected'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Submitted {new Date(application.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            &ldquo;{application.reason}&rdquo;
          </div>

          {application.status === 'Pending' && (
            <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>⏳ An admin will review your application soon.</div>
          )}
          {application.status === 'Approved' && (
            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>🎉 You now have Buyer access. Log out and back in, or refresh to see your new role.</div>
          )}
          {application.status === 'Rejected' && (
            <div style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '16px' }}>Your application was rejected. You can submit a new application below.</div>
          )}
        </motion.div>
      )}

      {/* Application form — show if no application OR if rejected */}
      {!loadingStatus && (!application || application.status === 'Rejected') && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: '28px' }}>
          <h2 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
            {application?.status === 'Rejected' ? '🔄 Resubmit Application' : '📝 Submit Application'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '20px', lineHeight: 1.5 }}>
            Explain why you&apos;d like Buyer access. Be specific — mention your project goals, experience, or use case.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Your reason <span style={{ color: 'var(--text-muted)' }}>(min. 20 characters)</span></label>
              <textarea
                className="input-field"
                placeholder="e.g. I'm a small business owner looking to outsource web development work. I have 3 projects ready to post..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={5}
                maxLength={1000}
                style={{ resize: 'vertical', lineHeight: 1.7, marginTop: '6px' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.73rem', color: reason.length < 20 ? '#ef4444' : 'var(--text-muted)', marginTop: '4px' }}>
                {reason.trim().length} / 1000
              </div>
            </div>

            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={submitting}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', opacity: submitting ? 0.6 : 1, boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                  />
                  Submitting...
                </span>
              ) : application?.status === 'Rejected' ? '🔄 Resubmit Application' : '🚀 Submit Application'}
            </motion.button>
          </form>
        </motion.div>
      )}

      {loadingStatus && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '28px', height: '28px', border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto' }}
          />
        </div>
      )}
    </div>
  );
}
