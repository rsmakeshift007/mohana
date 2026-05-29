import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [authMsg, setAuthMsg] = useState({ text: '', error: false });
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [errors, setErrors] = useState({});

  function validateLogin() {
    const e = {};
    if (!loginData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) e.email = 'Invalid email';
    if (!loginData.password) e.password = 'Password is required';
    else if (loginData.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateRegister() {
    const e = {};
    if (!regData.name.trim()) e.name = 'Name is required';
    if (!regData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(regData.email)) e.email = 'Invalid email';
    if (!regData.phone) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(regData.phone)) e.phone = 'Enter valid 10-digit mobile';
    if (!regData.password) e.password = 'Password is required';
    else if (regData.password.length < 6) e.password = 'Min 6 characters';
    if (regData.password !== regData.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    setAuthMsg({ text: '', error: false });
    try {
      await signIn(loginData.email, loginData.password);
      navigate('/');
    } catch (err) {
      setAuthMsg({ text: err.message || 'Login failed. Check your email and password.', error: true });
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    setAuthMsg({ text: '', error: false });
    try {
      await signUp(regData.email, regData.password, { name: regData.name, phone: regData.phone });
      setAuthMsg({ text: '✅ Account created! Check your email to confirm your account.', error: false });
    } catch (err) {
      setAuthMsg({ text: err.message || 'Registration failed. Please try again.', error: true });
    }
    setLoading(false);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!forgotEmail) { setErrors({ forgotEmail: 'Email is required' }); return; }
    setLoading(true);
    setAuthMsg({ text: '', error: false });
    try {
      await resetPassword(forgotEmail);
      setAuthMsg({ text: '✅ Password reset link sent! Check your email inbox.', error: false });
    } catch (err) {
      setAuthMsg({ text: err.message || 'Failed to send reset email.', error: true });
    }
    setLoading(false);
  }

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${hasErr ? 'var(--error)' : 'var(--border)'}`,
    outline: 'none', fontSize: 14,
    fontFamily: 'var(--font-sans)',
    background: 'var(--bg)',
    color: 'var(--text)',
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      paddingTop: 68,
    }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(135deg, var(--primary) 0%, #1E2A10 60%, #2D3A18 100%)',
        alignItems: 'center', justifyContent: 'center', padding: 48,
        position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(201,149,108,0.1)' }} />
        <div style={{ position: 'absolute', left: -40, bottom: 40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(176,122,138,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img
            src="/mohanah_logo.svg"
            alt="Mohanah"
            style={{ width: 240, height: 'auto', borderRadius: 14, margin: '0 auto 28px', display: 'block', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
          />
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 3, fontWeight: 700, marginBottom: 28 }}>DRAPE THE CHARM</div>
          <p style={{ color: '#A0B080', fontSize: 15, lineHeight: 1.8, maxWidth: 300 }}>
            Join thousands of women who discover premium handcrafted sarees from India's finest weavers.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {[['500+', 'Sarees'], ['10K+', 'Members'], ['4.8★', 'Rating']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{n}</div>
                <div style={{ fontSize: 10, color: '#6A8A5A', fontWeight: 600, letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <img src="/mohanah_logo.svg" alt="Mohanah" style={{ height: 44, width: 'auto', borderRadius: 7, display: 'block' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, color: 'var(--primary)', letterSpacing: 3, lineHeight: 1 }}>MOHANAH</div>
                <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: 2, fontWeight: 600 }}>DRAPE THE CHARM</div>
              </div>
            </Link>
          </div>

          <div className="card" style={{ padding: 32 }}>
              {/* Tabs — only login/register, not forgot */}
              {tab !== 'forgot' && (
              <div style={{
                display: 'flex', background: 'var(--surface-alt)',
                borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24, gap: 4,
              }}>
                {[['login', 'Login'], ['register', 'Sign Up']].map(([key, label]) => (
                  <button key={key} onClick={() => { setTab(key); setErrors({}); setAuthMsg({ text: '', error: false }); }}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none',
                      background: tab === key ? 'var(--primary)' : 'transparent',
                      color: tab === key ? 'var(--accent-light)' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                      fontFamily: 'var(--font-sans)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              )}

              {/* Login Form */}
              {tab === 'login' && (
                <form onSubmit={handleLogin}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Welcome back 👋</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 22 }}>Sign in to your Mohanah account</p>

                  {/* Google Login */}
                  <button type="button" style={{
                    width: '100%', padding: '11px', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 16,
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Continue with Google
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>EMAIL ADDRESS</label>
                    <input type="email" value={loginData.email}
                      onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))}
                      placeholder="yourname@email.com"
                      style={inputStyle(errors.email)}
                      onFocus={e => !errors.email && (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => !errors.email && (e.target.style.borderColor = 'var(--border)')}
                    />
                    {errors.email && <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>⚠ {errors.email}</div>}
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} value={loginData.password}
                        onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                        placeholder="Enter your password"
                        style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                        onFocus={e => !errors.password && (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => !errors.password && (e.target.style.borderColor = 'var(--border)')}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>⚠ {errors.password}</div>}
                  </div>

                  <div style={{ textAlign: 'right', marginBottom: 20 }}>
                    <span onClick={() => { setTab('forgot'); setAuthMsg({ text: '', error: false }); }} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>Forgot password?</span>
                  </div>

                  {authMsg.text && (
                    <div style={{ fontSize: 13, color: authMsg.error ? 'var(--error, #c62828)' : 'var(--success, #2e7d32)', fontWeight: 600, padding: '8px 12px', background: authMsg.error ? '#ffebee' : '#e8f5e9', borderRadius: 8, marginBottom: 14 }}>
                      {authMsg.text}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 14 }}>
                    {loading ? '⏳ Signing in...' : '→ Sign In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    New to Mohanah?{' '}
                    <button type="button" onClick={() => { setTab('register'); setErrors({}); setAuthMsg({ text: '', error: false }); }}
                      style={{ color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      Create an account
                    </button>
                  </div>
                </form>
              )}

              {/* Register Form */}
              {tab === 'register' && (
                <form onSubmit={handleRegister}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Create Account ✨</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20 }}>Join Mohanah — explore premium sarees</p>

                  {[
                    { label: 'FULL NAME', key: 'name', type: 'text', placeholder: 'Your full name' },
                    { label: 'EMAIL ADDRESS', key: 'email', type: 'email', placeholder: 'yourname@email.com' },
                    { label: 'MOBILE NUMBER', key: 'phone', type: 'tel', placeholder: '10-digit mobile number' },
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>{field.label}</label>
                      <input type={field.type} value={regData[field.key]}
                        onChange={e => setRegData(d => ({ ...d, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={inputStyle(errors[field.key])}
                        onFocus={e => !errors[field.key] && (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => !errors[field.key] && (e.target.style.borderColor = 'var(--border)')}
                      />
                      {errors[field.key] && <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>⚠ {errors[field.key]}</div>}
                    </div>
                  ))}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
                    {[['PASSWORD', 'password', 'Create password'], ['CONFIRM', 'confirm', 'Repeat password']].map(([label, key, ph]) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>{label}</label>
                        <input type="password" value={regData[key]}
                          onChange={e => setRegData(d => ({ ...d, [key]: e.target.value }))}
                          placeholder={ph}
                          style={inputStyle(errors[key])}
                          onFocus={e => !errors[key] && (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={e => !errors[key] && (e.target.style.borderColor = 'var(--border)')}
                        />
                        {errors[key] && <div style={{ fontSize: 10, color: 'var(--error)', marginTop: 3 }}>⚠ {errors[key]}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, marginTop: 10 }}>
                    By creating an account, you agree to our{' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>Terms & Privacy Policy</span>
                  </div>

                  {authMsg.text && (
                    <div style={{ fontSize: 13, color: authMsg.error ? 'var(--error, #c62828)' : 'var(--success, #2e7d32)', fontWeight: 600, padding: '8px 12px', background: authMsg.error ? '#ffebee' : '#e8f5e9', borderRadius: 8, marginBottom: 14 }}>
                      {authMsg.text}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 14 }}>
                    {loading ? '⏳ Creating account...' : '→ Create Account'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setTab('login'); setErrors({}); setAuthMsg({ text: '', error: false }); }}
                      style={{ color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      Sign in
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot Password */}
              {tab === 'forgot' && (
                <form onSubmit={handleForgotPassword}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Reset Password</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Enter your email — we'll send a reset link</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>EMAIL ADDRESS</label>
                    <input type="email" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="yourname@email.com"
                      style={inputStyle(errors.forgotEmail)}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    {errors.forgotEmail && <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>⚠ {errors.forgotEmail}</div>}
                  </div>

                  {authMsg.text && (
                    <div style={{ fontSize: 13, color: authMsg.error ? 'var(--error, #c62828)' : 'var(--success, #2e7d32)', fontWeight: 600, padding: '8px 12px', background: authMsg.error ? '#ffebee' : '#e8f5e9', borderRadius: 8, marginBottom: 14 }}>
                      {authMsg.text}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 14 }}>
                    {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button type="button" onClick={() => { setTab('login'); setAuthMsg({ text: '', error: false }); }}
                      style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                      ← Back to Login
                    </button>
                  </div>
                </form>
              )}

            </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
