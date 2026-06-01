import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersDB, settingsDB, faqsDB, reviewsDB } from '../services/db';

// ── Address helpers ──────────────────────────
function getAddrKey(uid) { return `mohanah_addresses_${uid}`; }
function loadAddresses(uid) {
  try { return JSON.parse(localStorage.getItem(getAddrKey(uid))) || []; } catch { return []; }
}
function saveAddresses(uid, list) {
  localStorage.setItem(getAddrKey(uid), JSON.stringify(list));
}

const BLANK_ADDR = { name: '', phone: '', line1: '', line2: '', city: '', district: '', state: '', pincode: '', isDefault: false };

export default function Profile() {
  const { cartCount, wishlist } = useCart();
  const { user, isLoggedIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [orderStats, setOrderStats] = useState({ count: 0, spent: 0 });
  const [showAddresses, setShowAddresses] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState(null); // null=closed, obj=editing
  const [addrIdx, setAddrIdx] = useState(null);
  const [showFaqs, setShowFaqs] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [ratingDone, setRatingDone] = useState(false);

  const storePhone = settingsDB.get().phone || '+91 98765 43210';
  const faqs = faqsDB.getAll();

  useEffect(() => {
    if (user) setAddresses(loadAddresses(user.id));
  }, [user]);

  function saveAddr() {
    if (!addrForm.name || !addrForm.line1 || !addrForm.city || !addrForm.pincode) {
      alert('Name, address, city and pincode are required.'); return;
    }
    let list = [...addresses];
    if (addrForm.isDefault) list = list.map(a => ({ ...a, isDefault: false }));
    if (addrIdx !== null) list[addrIdx] = addrForm;
    else list.push(addrForm);
    setAddresses(list);
    saveAddresses(user.id, list);
    setAddrForm(null); setAddrIdx(null);
  }

  function deleteAddr(i) {
    const list = addresses.filter((_, idx) => idx !== i);
    setAddresses(list);
    saveAddresses(user.id, list);
  }

  function setDefault(i) {
    const list = addresses.map((a, idx) => ({ ...a, isDefault: idx === i }));
    setAddresses(list);
    saveAddresses(user.id, list);
  }

  // Build profile from Supabase user
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    city: user?.user_metadata?.city || '',
  });
  const [saving, setSaving] = useState(false);

  // Sync profile from Supabase profiles table on mount
  useEffect(() => {
    if (!user?.id) return;
    import('../services/supabase').then(({ supabase }) => {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setProfile(p => ({
            ...p,
            name: data.name || p.name,
            phone: data.phone || p.phone,
            city: data.city || p.city,
          }));
        }).catch(() => {});
    });
  }, [user?.id]);

  async function handleSaveProfile() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { supabase } = await import('../services/supabase');
      // Update Supabase auth metadata
      await supabase.auth.updateUser({ data: { name: profile.name, phone: profile.phone, city: profile.city } });
      // Update profiles table
      await supabase.from('profiles').upsert({
        id: user.id, email: user.email,
        name: profile.name, phone: profile.phone, city: profile.city,
      }, { onConflict: 'id' });
    } catch (e) { console.warn('Profile save:', e.message); }
    setSaving(false);
    setEditMode(false);
  }

  const initial = profile.name.charAt(0).toUpperCase();

  useEffect(() => {
    const allOrders = ordersDB.getAll();
    // Filter orders belonging to current user by email
    const myOrders = user
      ? allOrders.filter(o => o.email === user.email || o.customerEmail === user.email)
      : [];
    const count = myOrders.length;
    const spent = myOrders.reduce((s, o) => s + (Number(o.total) || Number(o.price) || 0), 0);
    setOrderStats({ count, spent });
  }, [user]);

  const menuSections = [
    {
      title: 'My Account',
      items: [
        { icon: '📦', label: 'My Orders', sub: `${orderStats.count} order${orderStats.count !== 1 ? 's' : ''}`, to: '/orders' },
        { icon: '💖', label: 'Wishlist', sub: `${wishlist.length} items`, to: '/wishlist' },
        { icon: '📍', label: 'Saved Addresses', sub: `${addresses.length} saved`, to: '#', action: () => setShowAddresses(true) },
        { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cards', to: '#' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', label: 'Notifications', sub: 'Offers & updates', to: '#' },
        { icon: '🌐', label: 'Language', sub: 'English', to: '#' },
        { icon: '💰', label: 'Currency', sub: '₹ Indian Rupee', to: '#' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '💬', label: 'Chat with Us', sub: 'Available 9AM – 9PM', to: '#' },
        { icon: '📞', label: 'Call Support', sub: storePhone, to: '#', action: () => { window.location.href = `tel:${storePhone.replace(/\s/g, '')}`; } },
        { icon: '❓', label: 'FAQs', sub: `${faqs.length} questions answered`, to: '#', action: () => setShowFaqs(true) },
        { icon: '⭐', label: 'Rate the App', sub: 'Share your feedback', to: '#', action: () => { setRatingDone(false); setRatingStars(0); setRatingText(''); setShowRating(true); } },
      ],
    },
  ];

  return (
    <div className="page" style={{ paddingTop: 68, minHeight: '100vh' }}>

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1E2A10 60%, #2A3A18 100%)',
        padding: '36px 0 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,149,108,0.1)' }} />
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--mauve))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 28, color: 'white',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: 'var(--shadow-lg)',
            }}>{initial}</div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 2 }}>
                {profile.name}
              </h2>
              <p style={{ color: '#A0B080', fontSize: 13, marginBottom: 6 }}>{profile.email}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(201,149,108,0.2)', border: '1px solid rgba(201,149,108,0.4)',
                  color: 'var(--accent)', fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>✨ Premium Member</span>
              </div>
            </div>

            <button onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: editMode ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {saving ? '⏳ Saving...' : editMode ? '✓ Save' : '✏️ Edit'}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -24, paddingBottom: 48, position: 'relative' }}>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0, background: 'white',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', marginBottom: 24,
        }}>
          {[
            { num: `${orderStats.count}`, label: 'Orders' },
            { num: `${wishlist.length}`, label: 'Wishlist' },
            { num: `${cartCount}`, label: 'In Cart' },
            { num: orderStats.spent >= 1000 ? `₹${(orderStats.spent / 1000).toFixed(1)}K` : `₹${orderStats.spent}`, label: 'Spent' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: '16px 12px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {editMode && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Edit Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {Object.entries(profile).map(([key, val]) => (
                <div key={key}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                    {key.toUpperCase()}
                  </label>
                  <input value={val} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1.5px solid var(--border)', fontSize: 13,
                      fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium banner */}
        <div style={{
          background: 'linear-gradient(135deg, #2D1B69 0%, #4A2D6B 100%)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#B39DDB', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
              MOHANAH PREMIUM
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 900, color: 'white', marginBottom: 4 }}>
              ✨ Upgrade for exclusive benefits
            </div>
            <p style={{ fontSize: 12, color: '#B39DDB' }}>Early access · Extra discounts · Free priority shipping</p>
          </div>
          <button style={{
            padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--gold), #C9956C)',
            color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            border: 'none', boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
          }}>Get Premium →</button>
        </div>

        {/* Menu sections */}
        {menuSections.map(section => (
          <div key={section.title} className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>
                {section.title.toUpperCase()}
              </span>
            </div>
            {section.items.map((item, i) => (
              <div key={item.label} onClick={() => item.action ? item.action() : item.to !== '#' && navigate(item.to)}
                style={{
                  padding: '13px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>›</span>
              </div>
            ))}
          </div>
        ))}

        {/* Logout */}
        {isLoggedIn ? (
          <button onClick={async () => { await signOut(); navigate('/login'); }}
            style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
              background: '#FFEBEE', color: '#c62828',
              border: '1px solid #FFCDD2', cursor: 'pointer',
              fontWeight: 800, fontSize: 14,
            }}>
            🚪 Logout
          </button>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
              background: 'var(--primary)', color: 'var(--accent-light)',
              border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 14,
            }}>
              🔑 Login / Sign Up
            </button>
          </Link>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          Mohanah v1.0.0 · Made with 🥻 in India
        </div>
      </div>

      {/* ── FAQ Modal ── */}
      {showFaqs && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowFaqs(false); }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 900 }}>❓ Frequently Asked Questions</h3>
              <button onClick={() => setShowFaqs(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            {faqs.map((faq, i) => (
              <div key={faq.id || i} style={{ borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', textAlign: 'left',
                    padding: '14px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                  }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ color: 'var(--accent)', fontSize: 18, flexShrink: 0, marginTop: 1 }}>{faqOpen === i ? '▲' : '▼'}</span>
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 0 14px', fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop: 20, padding: '14px', background: 'var(--surface-alt)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>Still have questions?</div>
              <button
                onClick={() => { setShowFaqs(false); window.location.href = `https://wa.me/${settingsDB.get().whatsappNumber || '919876543210'}`; }}
                style={{ padding: '9px 20px', borderRadius: 10, background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                💬 Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate the App Modal ── */}
      {showRating && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowRating(false); }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 24px 32px' }}>
            {!ratingDone ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Rate Your Experience</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Your feedback helps us improve Mohanah for everyone.</p>
                </div>
                {/* Star selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s}
                      onMouseEnter={() => setRatingHover(s)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRatingStars(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, lineHeight: 1, padding: '0 2px', color: s <= (ratingHover || ratingStars) ? '#F57F17' : '#DDD', transition: 'color 0.1s' }}>
                      ★
                    </button>
                  ))}
                </div>
                {ratingStars > 0 && (
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 16 }}>
                    {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent! 🤩'][ratingStars]}
                  </div>
                )}
                <textarea
                  value={ratingText}
                  onChange={e => setRatingText(e.target.value)}
                  placeholder="Tell us what you loved or what we can improve..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setShowRating(false)}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button
                    disabled={ratingStars === 0}
                    onClick={() => {
                      if (ratingStars > 0) {
                        reviewsDB.add({
                          productId: '__app__',
                          name: profile.name,
                          city: profile.city || '',
                          rating: ratingStars,
                          text: ratingText.trim() || `${['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][ratingStars]} experience`,
                          product: 'Mohanah App',
                        });
                        setRatingDone(true);
                      }
                    }}
                    style={{
                      flex: 2, padding: 12, borderRadius: 10, cursor: ratingStars ? 'pointer' : 'not-allowed',
                      background: ratingStars ? 'var(--primary)' : 'var(--border)', color: ratingStars ? 'var(--accent-light)' : 'var(--text-muted)',
                      border: 'none', fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                    }}>
                    ⭐ Submit Rating
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Thank You!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 24 }}>
                  Your {ratingStars}★ rating has been submitted. We appreciate your feedback!
                </p>
                <button onClick={() => setShowRating(false)} className="btn btn-primary">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Address Manager Overlay ── */}
      {showAddresses && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAddresses(false); setAddrForm(null); } }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 900 }}>📍 Saved Addresses</h3>
              <button onClick={() => { setShowAddresses(false); setAddrForm(null); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {!addrForm ? (
              <>
                {addresses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                    No saved addresses yet.<br />Add your first address below.
                  </div>
                )}
                {addresses.map((addr, i) => (
                  <div key={i} style={{ border: `1.5px solid ${addr.isDefault ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12, position: 'relative' }}>
                    {addr.isDefault && <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 10, background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>DEFAULT</span>}
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{addr.name} · {addr.phone}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}{addr.district ? `, ${addr.district}` : ''}, {addr.state} — {addr.pincode}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button onClick={() => { setAddrForm({ ...addr }); setAddrIdx(i); }}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                      {!addr.isDefault && (
                        <button onClick={() => setDefault(i)}
                          style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--accent)', background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--accent)' }}>Set Default</button>
                      )}
                      <button onClick={() => deleteAddr(i)}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid #ffcdd2', background: '#fff5f5', cursor: 'pointer', fontWeight: 600, color: '#c62828' }}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setAddrForm({ ...BLANK_ADDR }); setAddrIdx(null); }}
                  className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  + Add New Address
                </button>
              </>
            ) : (
              <>
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{addrIdx !== null ? 'Edit Address' : 'Add New Address'}</h4>
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'Recipient name' },
                  { label: 'Phone', key: 'phone', placeholder: '10-digit mobile' },
                  { label: 'Address Line 1', key: 'line1', placeholder: 'House/Flat no, Street' },
                  { label: 'Address Line 2 (optional)', key: 'line2', placeholder: 'Area, Landmark' },
                  { label: 'City', key: 'city', placeholder: 'City' },
                  { label: 'District', key: 'district', placeholder: 'District' },
                  { label: 'State', key: 'state', placeholder: 'State' },
                  { label: 'Pincode', key: 'pincode', placeholder: '6-digit pincode' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f.label.toUpperCase()}</label>
                    <input value={addrForm[f.key] || ''} onChange={e => setAddrForm(a => ({ ...a, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
                  <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm(a => ({ ...a, isDefault: e.target.checked }))} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  Set as default address
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setAddrForm(null); setAddrIdx(null); }}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button onClick={saveAddr} className="btn btn-primary" style={{ flex: 2 }}>
                    💾 Save Address
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
