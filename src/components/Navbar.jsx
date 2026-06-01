import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartCount, wishlist } = useCart();
  const { user, isLoggedIn, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Get display name/initial from Supabase user
  const displayName = user?.user_metadata?.name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,251,242,0.97)' : 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.3s',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68, gap: 24 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img
              src="/mohanah_logo.svg"
              alt="Mohanah"
              style={{ height: 52, width: 'auto', borderRadius: 10, display: 'block' }}
            />
            <div className="nav-brand-text">
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: 3, lineHeight: 1 }}>
                MOHANAH
              </div>
              <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: 2, fontWeight: 600 }}>
                DRAPE THE CHARM
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}
               className="nav-desktop">
            {[
              { label: 'Home', to: '/' },
              { label: 'Catalog', to: '/catalog' },
              { label: 'About', to: '/about' },
              { label: 'Orders', to: '/orders' },
              { label: 'Profile', to: '/profile' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                color: isActive(link.to) ? 'var(--accent)' : 'var(--text)',
                background: isActive(link.to) ? '#F2C4A020' : 'transparent',
                borderBottom: isActive(link.to) ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}>{link.label}</Link>
            ))}
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>

            {/* Search — desktop only */}
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="nav-desktop"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: searchOpen ? 'var(--surface-alt)' : 'transparent',
                border: '1px solid transparent',
                fontSize: 16, color: 'var(--text)',
                transition: 'all 0.2s',
              }}>🔍</button>

            {/* Wishlist — desktop only */}
            <Link to="/wishlist"
              className="nav-desktop"
              style={{ position: 'relative', textDecoration: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                fontSize: 16, color: 'var(--text)',
                transition: 'all 0.2s',
              }}>🤍</div>
              {wishlist.length > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'var(--mauve)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{wishlist.length}</span>
              )}
            </Link>

            {/* Cart — always visible */}
            <Link to="/cart" style={{ position: 'relative', textDecoration: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: cartCount > 0 ? '#F2C4A020' : 'transparent',
                border: cartCount > 0 ? '1px solid var(--accent)' : '1px solid transparent',
                fontSize: 16, color: 'var(--text)',
                transition: 'all 0.2s',
              }}>🛍️</div>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'var(--accent)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount}</span>
              )}
            </Link>

            {/* Login button — only when not logged in */}
            {!isLoggedIn && (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '7px 16px', borderRadius: 20,
                  background: 'var(--primary)', color: 'var(--accent-light)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                >Login</button>
              </Link>
            )}

            {/* Profile avatar — only shows when logged in, always visible on mobile too */}
            {isLoggedIn && (
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-light)', fontWeight: 700, fontSize: 15,
                  fontFamily: 'var(--font-serif)',
                  border: '2px solid var(--accent)',
                  boxShadow: '0 2px 8px rgba(62,74,44,0.25)',
                  flexShrink: 0,
                }}>{initial || '👤'}</div>
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="nav-mobile-btn"
              style={{
                width: 38, height: 38, borderRadius: 8,
                display: 'none', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'var(--surface-alt)' : 'transparent',
                border: '1px solid var(--border)',
                fontSize: 18, color: 'var(--text)',
              }}>☰</button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px 24px', background: 'var(--surface)' }}>
            <form onSubmit={handleSearch} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8 }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sarees by name, fabric, occasion..."
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--border)', outline: 'none',
                  fontSize: 14, background: 'var(--bg)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '12px 24px 20px',
          }}>
            {[
              { label: '🏠 Home', to: '/' },
              { label: '🥻 Catalog', to: '/catalog' },
              { label: '🏛️ About Us', to: '/about' },
              { label: '💖 Wishlist', to: '/wishlist' },
              { label: '📦 Orders', to: '/orders' },
              { label: '👤 Profile', to: '/profile' },
              ...(!isLoggedIn ? [{ label: '🔑 Login', to: '/login' }] : []),
            ].map(link => (
              <Link key={link.to} to={link.to} style={{
                display: 'block', padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: 14, fontWeight: 600,
                color: isActive(link.to) ? 'var(--accent)' : 'var(--text)',
                textDecoration: 'none',
              }}>{link.label}</Link>
            ))}
            {isLoggedIn && (
              <button onClick={async () => { await signOut(); navigate('/login'); setMenuOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 0', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: '#c62828', background: 'none', cursor: 'pointer' }}>
                🚪 Logout
              </button>
            )}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-hide-mobile { display: none !important; }
          .nav-brand-text { display: none !important; }
        }
        @media (min-width: 769px) {
          .nav-brand-text { display: block !important; }
        }
      `}</style>
    </>
  );
}
