import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DEFAULTS = {
  heroTitle:    'Our Story',
  heroSubtitle: 'Weaving Tradition into Every Thread',
  heroDesc:     'Mohanah was born from a deep love for India\'s handloom heritage — a desire to bring the finest handcrafted sarees from master weavers directly to modern women across the country.',

  storyTitle:   'From the Looms of India to Your Doorstep',
  storyP1:      'Mohanah was founded with a single mission — to preserve and celebrate India\'s extraordinary weaving traditions. Our name, Mohanah, means "enchanting" — a reflection of the timeless beauty we see in every saree we curate.',
  storyP2:      'We work directly with master weavers and artisan families across Varanasi, Kanjivaram, Chanderi, and beyond — ensuring fair wages, authentic craftsmanship, and the preservation of centuries-old techniques that would otherwise be lost.',
  storyP3:      'Every saree in our collection carries a story — of the weaver\'s hands, the family\'s tradition, and the region\'s cultural heritage. When you wear a Mohanah saree, you carry that story with you.',

  value1Icon:  '🤝', value1Title: 'Direct from Weavers',  value1Desc: 'We work directly with artisan families — no middlemen, fair prices for weavers, authentic products for you.',
  value2Icon:  '✨', value2Title: '100% Authentic',        value2Desc: 'Every saree is handpicked and verified for quality and authenticity before reaching your doorstep.',
  value3Icon:  '🌿', value3Title: 'Sustainable Heritage',  value3Desc: 'We support sustainable, handloom weaving practices that protect the environment and preserve cultural traditions.',

  stat1Num: '500+',  stat1Label: 'Sarees Curated',
  stat2Num: '50+',   stat2Label: 'Artisan Families',
  stat3Num: '10K+',  stat3Label: 'Happy Customers',
  stat4Num: '15+',   stat4Label: 'Weaving Traditions',

  promiseTitle: 'The Mohanah Promise',
  promise1: 'Every saree is handpicked directly from verified artisan families.',
  promise2: 'Quality checked before dispatch — no compromises.',
  promise3: 'Free delivery on orders above ₹2,000.',
  promise4: '7-day easy returns — your satisfaction, guaranteed.',
  promise5: 'Secure payments — UPI, cards, net banking all accepted.',

  ctaTitle: 'Experience the Art of the Saree',
  ctaDesc:  'Explore our curated collection of handcrafted sarees — each one a masterpiece.',
};

export default function About() {
  const navigate = useNavigate();
  const [c, setC] = useState(DEFAULTS);

  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      const keys = Object.keys(DEFAULTS).map(k => `about_${k}`);
      Promise.all(keys.map(k => settingsAPI.get(k).catch(() => null))).then(vals => {
        const fromDB = {};
        keys.forEach((k, i) => { if (vals[i]) fromDB[k.replace('about_', '')] = vals[i]; });
        if (Object.keys(fromDB).length) setC(prev => ({ ...prev, ...fromDB }));
      });
    });
  }, []);

  return (
    <div className="page" style={{ paddingTop: 68 }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '64px 0 48px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,149,108,0.2)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
            <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>🥻 ABOUT MOHANAH</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: 'white', marginBottom: 14, lineHeight: 1.1 }}>
            {c.heroTitle}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            {c.heroSubtitle}
          </p>
          <p style={{ color: '#A0B080', fontSize: 15, lineHeight: 1.8, maxWidth: 620, margin: '0 auto' }}>
            {c.heroDesc}
          </p>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: 'var(--accent)', padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              [c.stat1Num, c.stat1Label],
              [c.stat2Num, c.stat2Label],
              [c.stat3Num, c.stat3Label],
              [c.stat4Num, c.stat4Label],
            ].map(([num, label], i) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0', borderRight: i < 3 ? '1px solid rgba(62,74,44,0.2)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>{num}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', opacity: 0.7, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Story ── */}
      <div style={{ padding: '72px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* Left — decorative */}
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary)22, var(--accent)33)', borderRadius: 24, aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 80, marginBottom: 16 }}>🥻</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>Mohanah</div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Drape The Charm</div>
                  <div style={{ width: 40, height: 2, background: 'var(--accent)', margin: '16px auto' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, fontStyle: 'italic' }}>
                    "Where every saree<br />tells a story"
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div style={{ position: 'absolute', bottom: -16, right: -16, background: 'var(--primary)', borderRadius: 16, padding: '14px 20px', boxShadow: 'var(--shadow-lg)', color: 'var(--accent-light)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900 }}>15+</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>YEARS OF CRAFT</div>
              </div>
            </div>
            {/* Right — text */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Our Journey</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, marginBottom: 24 }}>
                {c.storyTitle}
              </h2>
              {[c.storyP1, c.storyP2, c.storyP3].filter(Boolean).map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.9, marginBottom: 16 }}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Values ── */}
      <div style={{ padding: '72px 0', background: 'var(--surface-alt)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>What We Stand For</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'var(--text)' }}>Our Values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              [c.value1Icon, c.value1Title, c.value1Desc],
              [c.value2Icon, c.value2Title, c.value2Desc],
              [c.value3Icon, c.value3Title, c.value3Desc],
            ].map(([icon, title, desc]) => (
              <div key={title} className="card" style={{ padding: '32px 28px', textAlign: 'center', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Promise ── */}
      <div style={{ padding: '72px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Why Choose Us</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'var(--text)', marginBottom: 32, lineHeight: 1.2 }}>
                {c.promiseTitle}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[c.promise1, c.promise2, c.promise3, c.promise4, c.promise5].filter(Boolean).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ color: 'var(--accent-light)', fontSize: 13, fontWeight: 700 }}>✓</span>
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Right — decorative card */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: 24, padding: '40px 36px', color: 'white' }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🏆</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'var(--accent-light)', marginBottom: 12 }}>Trusted by Thousands</h3>
              <p style={{ color: '#A0B080', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                Over 10,000 women across India trust Mohanah for their most important occasions — weddings, festivals, and everyday elegance.
              </p>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['10K+', 'Customers'], ['4.8★', 'Rating'], ['500+', 'Sarees']].map(([n, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{n}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1 }}>{l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--surface-alt)', padding: '72px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, color: 'var(--text)', marginBottom: 14 }}>
            {c.ctaTitle}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            {c.ctaDesc}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/catalog')}
              style={{ padding: '14px 36px', borderRadius: 12, background: 'var(--primary)', color: 'var(--accent-light)', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Shop Collection
            </button>
            <Link to="/legal/contact" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 36px', borderRadius: 12, background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: 15, border: '2px solid var(--primary)', cursor: 'pointer' }}>
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          .about-grid-2 { grid-template-columns: 1fr !important; gap: 32px !important; }
          .about-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
