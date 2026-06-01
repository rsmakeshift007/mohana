import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import HeroBanner from '../components/HeroBanner';
import { reviewsDB, productsDB } from '../services/db';
import { productsAPI } from '../services/supabase';

function ProductCard({ product }) {
  const { dispatch, wishlist } = useCart();
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const isWishlisted = wishlist.find(i => i.id === product.id);

  function handleAddToCart(e) {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'ADD_TO_CART', product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleWishlist(e) {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'TOGGLE_WISHLIST', product });
  }

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div className="card fade-in" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'visible' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      >
        {/* Product image */}
        {(() => {
          const imgSrc = product.images?.[0]?.src || product.imageUrl || null;
          return (
            <div style={{
              aspectRatio: '3/4',
              background: imgSrc ? '#f0ebe4' : `linear-gradient(135deg, ${product.color}CC, ${product.color}66)`,
              position: 'relative',
              overflow: 'hidden', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              display: 'flex', alignItems: 'stretch',
            }}>
              {imgSrc ? (
                <img src={imgSrc} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, opacity: 0.35 }}>🥻</div>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)` }} />
                </>
              )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {product.isNew && (
              <span className="badge badge-accent" style={{ fontSize: 10 }}>NEW</span>
            )}
            {product.isTrending && (
              <span className="badge" style={{ background: '#FFF8E1', color: 'var(--warning)', fontSize: 10 }}>🔥 HOT</span>
            )}
            {product.discount > 0 && (
              <span className="badge badge-green" style={{ fontSize: 10 }}>{product.discount}% OFF</span>
            )}
          </div>

          {/* Wishlist */}
          <button onClick={handleWishlist} style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, border: 'none', cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>

          {/* Out of stock */}
          {!product.inStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14,
            }}>OUT OF STOCK</div>
          )}
            </div>
          );
        })()}

        {/* Info */}
        <div style={{ padding: '14px 14px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
            {product.fabric} · {product.region}
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700,
            color: 'var(--text)', marginBottom: 6, lineHeight: 1.3,
          }}>{product.name}</div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <span style={{ color: '#F57F17', fontSize: 12 }}>{'★'.repeat(Math.floor(product.rating))}</span>
            <span style={{ fontSize: 11, color: 'var(--text-sec)', fontWeight: 600 }}>{product.rating}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({product.reviews})</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* CTA */}
          {product.inStock ? (
            <button onClick={handleAddToCart} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              {added ? '✓ Added to Cart' : '+ Add to Cart'}
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }} disabled>
              Notify Me
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

const FALLBACK_REVIEWS = [
  { id: 'f1', name: 'Priya Sharma', city: 'Mumbai', text: 'Absolutely stunning Banarasi saree! The quality is exceptional and it arrived beautifully packed. Will definitely order again!', rating: 5, productName: 'Royal Banarasi Silk' },
  { id: 'f2', name: 'Deepika Nair', city: 'Bangalore', text: "The Kanjivaram Gold is breathtaking. The zari work is so intricate. Perfect for my sister's wedding. Highly recommend!", rating: 5, productName: 'Kanjivaram Gold' },
  { id: 'f3', name: 'Sunita Agarwal', city: 'Delhi', text: 'Fast delivery, authentic product, and the customer service was amazing. My go-to saree store now!', rating: 5, productName: 'Crimson Zari Silk' },
];

const HERO_DEFAULTS = {
  badge: 'NEW COLLECTION 2024',
  title1: 'Where Every Saree',
  title2: 'Tells A Story',
  subtitle: 'Discover handcrafted Banarasi, Kanjivaram, and Chanderi sarees — woven with generations of tradition for the modern woman.',
  btn1: 'Explore Collection',
  btn2: 'New Arrivals',
  stat1Num: '500+', stat1Label: 'Sarees',
  stat2Num: '10K+', stat2Label: 'Happy Customers',
  stat3Num: '4.8★', stat3Label: 'Avg Rating',
};

export default function Home() {
  const navigate = useNavigate();
  const [homeReviews, setHomeReviews] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [heroText, setHeroText] = useState(HERO_DEFAULTS);

  useEffect(() => {
    const real = reviewsDB.getRecent(6).filter(r => r.productId !== '__app__');
    setHomeReviews(real.length >= 3 ? real.slice(0, 3) : FALLBACK_REVIEWS);
  }, []);

  // Load hero text from Supabase settings
  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      const keys = ['heroBadge','heroTitle1','heroTitle2','heroSubtitle','heroBtn1','heroBtn2','heroStat1Num','heroStat1Label','heroStat2Num','heroStat2Label','heroStat3Num','heroStat3Label'];
      Promise.all(keys.map(k => settingsAPI.get(k).catch(() => null))).then(vals => {
        const [badge,title1,title2,subtitle,btn1,btn2,s1n,s1l,s2n,s2l,s3n,s3l] = vals;
        setHeroText({
          badge:      badge      || HERO_DEFAULTS.badge,
          title1:     title1     || HERO_DEFAULTS.title1,
          title2:     title2     || HERO_DEFAULTS.title2,
          subtitle:   subtitle   || HERO_DEFAULTS.subtitle,
          btn1:       btn1       || HERO_DEFAULTS.btn1,
          btn2:       btn2       || HERO_DEFAULTS.btn2,
          stat1Num:   s1n        || HERO_DEFAULTS.stat1Num,
          stat1Label: s1l        || HERO_DEFAULTS.stat1Label,
          stat2Num:   s2n        || HERO_DEFAULTS.stat2Num,
          stat2Label: s2l        || HERO_DEFAULTS.stat2Label,
          stat3Num:   s3n        || HERO_DEFAULTS.stat3Num,
          stat3Label: s3l        || HERO_DEFAULTS.stat3Label,
        });
      });
    });
  }, []);

  function normalizeProduct(p) {
    return {
      ...p,
      imageUrl:      p.imageUrl   || p.image_url      || '',
      originalPrice: p.originalPrice ?? p.original_price ?? null,
      inStock:       p.inStock    ?? p.in_stock       ?? p.stock ?? true,
      isNew:         p.isNew      ?? p.is_new         ?? false,
      isTrending:    p.isTrending ?? p.is_trending    ?? false,
      occasions:     Array.isArray(p.occasions) && p.occasions.length ? p.occasions : (p.occasion ? [p.occasion] : []),
      images:        Array.isArray(p.images) ? p.images : (p.imageUrl || p.image_url ? [{ src: p.imageUrl || p.image_url }] : []),
      color:         p.color || '#8B1A1A',
    };
  }

  useEffect(() => {
    productsAPI.getAll()
      .then(data => { setAllProducts((data || []).map(normalizeProduct)); })
      .catch(() => setAllProducts([]));
  }, []);

  const occasions = [
    { icon: '💍', label: 'Bridal', color: '#8B1A1A' },
    { icon: '🎊', label: 'Wedding', color: '#6B2A00' },
    { icon: '🪔', label: 'Festival', color: '#E65100' },
    { icon: '🥂', label: 'Party', color: '#4A2D6B' },
    { icon: '🌿', label: 'Casual', color: '#1a5c3a' },
    { icon: '💼', label: 'Office', color: '#0D47A1' },
  ];

  const getOcc = (p) => Array.isArray(p.occasions) && p.occasions.length ? p.occasions : (p.occasion ? [p.occasion] : []);
  const newArrivals = allProducts.filter(p => p.isNew);
  const trending = allProducts.filter(p => p.isTrending);
  const bridal = allProducts.filter(p => getOcc(p).some(o => o === 'Bridal' || o === 'Wedding'));

  return (
    <div className="page" style={{ paddingTop: 68 }}>

      {/* ── Image Slider Banner ─────────────────────── */}
      <HeroBanner />

      {/* ── Hero Banner ─────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1E2A10 50%, #2D3A1A 100%)',
        minHeight: 520,
        display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: -80, top: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(201,149,108,0.12)',
        }} />
        <div style={{
          position: 'absolute', right: 100, bottom: -100,
          width: 250, height: 250, borderRadius: '50%',
          background: 'rgba(176,122,138,0.10)',
        }} />
        <div style={{
          position: 'absolute', left: -40, bottom: 40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(201,149,108,0.08)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '60px 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 40,
            alignItems: 'center',
          }}>
            {/* Left: Text */}
            <div>
              {heroText.badge && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(201,149,108,0.2)', borderRadius: 20,
                  padding: '6px 14px', marginBottom: 20,
                }}>
                  <span style={{ fontSize: 12 }}>✨</span>
                  <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
                    {heroText.badge}
                  </span>
                </div>
              )}

              <h1 style={{
                fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 54px)',
                fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 16,
              }}>
                {heroText.title1}<br />
                <span style={{ color: 'var(--accent)' }}>{heroText.title2}</span>
              </h1>

              <p style={{ color: '#A0B080', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
                {heroText.subtitle}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/catalog')} className="btn btn-accent btn-lg">
                  {heroText.btn1 || 'Explore Collection'}
                </button>
                <button onClick={() => navigate('/catalog?filter=new')}
                  className="btn btn-outline btn-lg"
                  style={{ color: 'var(--accent-light)', borderColor: 'var(--accent-light)' }}>
                  {heroText.btn2 || 'New Arrivals'}
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
                {[
                  { num: heroText.stat1Num, label: heroText.stat1Label },
                  { num: heroText.stat2Num, label: heroText.stat2Label },
                  { num: heroText.stat3Num, label: heroText.stat3Label },
                ].filter(s => s.num).map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                      {stat.num}
                    </div>
                    <div style={{ fontSize: 11, color: '#6A8A5A', fontWeight: 600, letterSpacing: 1 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating product cards */}
            <div className="hero-products-desktop" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allProducts.slice(0, 3).map((p, i) => (
                <div key={p.id} style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: 210,
                  transform: `translateX(${i * 8}px)`,
                  animation: `fadeIn 0.5s ease ${i * 0.15}s forwards`,
                  opacity: 0,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${p.color}88`, fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>🥻</div>
                  <div>
                    <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{p.name}</div>
                    <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 800 }}>₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 860px) {
            .hero-products-desktop { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── Occasions ─────────────────────────────── */}
      <section style={{ padding: '48px 0 40px' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title serif">Shop by Occasion</h2>
            <Link to="/catalog" className="section-link">View all →</Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 12,
          }}>
            {occasions.map(occ => (
              <button
                key={occ.label}
                onClick={() => navigate(`/catalog?occasion=${occ.label}`)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = '#FBF0E8';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${occ.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>{occ.icon}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{occ.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ─────────────────────────────── */}
      <section style={{ padding: '8px 0 48px', background: 'var(--surface-alt)' }}>
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="section-header">
            <h2 className="section-title serif">✨ New Arrivals</h2>
            <Link to="/catalog?filter=new" className="section-link">See all →</Link>
          </div>
          <div className="grid-4">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── AR Try-On Banner ─────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, #3E4A2C 100%)',
        padding: '48px 0',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{
              fontSize: 11, color: 'var(--accent)', fontWeight: 700,
              letterSpacing: 2, marginBottom: 8,
            }}>COMING SOON</div>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 900,
              color: 'white', marginBottom: 10,
            }}>
              AR Try-On Feature 🪞
            </h2>
            <p style={{ color: '#A0B080', fontSize: 14, maxWidth: 420, lineHeight: 1.7 }}>
              Try any saree virtually using your phone camera with real-time body tracking.
              Drape, style, and decide — before you buy.
            </p>
          </div>
          <button onClick={() => navigate('/catalog')}
            className="btn btn-accent btn-lg">
            🛍️ Shop Now
          </button>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title serif">🔥 Trending Now</h2>
            <Link to="/catalog?filter=trending" className="section-link">View all →</Link>
          </div>
          <div className="grid-4">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Bridal Collection ─────────────────────── */}
      <section style={{ padding: '8px 0 48px', background: 'var(--surface-alt)' }}>
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="section-header">
            <h2 className="section-title serif">💍 Bridal & Wedding</h2>
            <Link to="/catalog?occasion=Bridal" className="section-link">Explore →</Link>
          </div>
          <div className="grid-4">
            {bridal.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Why Mohanah ──────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <h2 className="section-title serif" style={{ textAlign: 'center', marginBottom: 36 }}>
            Why Choose Mohanah?
          </h2>
          <div className="grid-4">
            {[
              { icon: '🧵', title: 'Handcrafted Quality', desc: 'Every saree is woven by master artisans with decades of experience.' },
              { icon: '🚚', title: 'Free Delivery', desc: 'Free shipping on all orders above ₹2,000 across India.' },
              { icon: '🔄', title: 'Easy Returns', desc: '7-day hassle-free returns if you\'re not completely satisfied.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'UPI, cards, netbanking & EMI — all fully encrypted & secure.' },
            ].map(item => (
              <div key={item.title} className="card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700,
                  color: 'var(--text)', marginBottom: 8,
                }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────── */}
      <section style={{ padding: '8px 0 56px', background: 'var(--surface-alt)' }}>
        <div className="container" style={{ paddingTop: 40 }}>
          <h2 className="section-title serif" style={{ textAlign: 'center', marginBottom: 36 }}>
            What Our Customers Say
          </h2>
          <div className="grid-3">
            {homeReviews.map(t => (
              <div key={t.id || t.name} className="card" style={{ padding: 24 }}>
                <div style={{ color: '#F57F17', fontSize: 16, marginBottom: 12 }}>
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-light)', fontWeight: 700, fontSize: 13,
                    fontFamily: 'var(--font-serif)',
                  }}>{t.name?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t.city && `${t.city} · `}{t.productName || t.product || 'Mohanah Saree'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
