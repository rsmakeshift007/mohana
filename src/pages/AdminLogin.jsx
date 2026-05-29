import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, isAdmin, user } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Already logged in as admin — go straight to dashboard
  React.useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!credentials.username || !credentials.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await signIn(credentials.username, credentials.password);
      const role = data?.user?.app_metadata?.role;
      if (role !== 'admin') {
        await import('../services/supabase').then(m => m.authAPI.signOut());
        setError('Access denied. This account is not an admin.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1923 0%, #1a2535 50%, #0f1923 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(201,149,108,0.06)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(62,74,44,0.15)' }} />
      <div style={{ position: 'absolute', top: '40%', left: '15%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(176,122,138,0.06)' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/mohanah_logo.svg"
            alt="Mohanah"
            style={{
              width: 200, height: 'auto', borderRadius: 14,
              margin: '0 auto 16px', display: 'block',
              boxShadow: '0 0 40px rgba(201,149,108,0.25)',
            }}
          />
          <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: 3, fontWeight: 700, marginBottom: 6 }}>
            ADMIN PORTAL
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 22 }}>
            Admin Sign In
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                ADMIN EMAIL
              </label>
              <input
                type="email"
                value={credentials.username}
                onChange={e => setCredentials(c => ({ ...c, username: e.target.value }))}
                placeholder="admin@mohanah.com"
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white', fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={e => setCredentials(c => ({ ...c, password: e.target.value }))}
                  placeholder="Enter admin password"
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.07)',
                    color: 'white', fontSize: 14,
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(198,40,40,0.15)', border: '1px solid rgba(198,40,40,0.3)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: '#ff8a80', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14,
              borderRadius: 'var(--radius-md)',
              background: loading ? 'rgba(201,149,108,0.5)' : 'var(--accent)',
              color: '#1E2A10', fontWeight: 800, fontSize: 15,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(201,149,108,0.3)',
            }}>
              {loading ? '⏳ Verifying...' : '🔐 Access Dashboard'}
            </button>
          </form>

        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >
            ← Back to Mohanah Store
          </Link>
        </div>
      </div>
    </div>
  );
}
