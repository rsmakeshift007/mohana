import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannersAPI, reelsAPI } from '../services/supabase';

// ─── Default image slides ─────────────────────────────────────────────────────
const DEFAULT_IMAGES = [
  { id: 'i1', src: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85&fit=crop&crop=top', badge: '✨ New Arrival',    title: 'Royal Banarasi Silk',   subtitle: 'Varanasi Ghat · UP',         desc: 'Handcrafted with pure zari by master weavers', price: '₹4,299', cta: 'Shop Banarasi', ctaLink: '/catalog?fabric=Banarasi', color: '#8B1A1A' },
  { id: 'i2', src: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=85&fit=crop&crop=top', badge: '💍 Bridal Special',  title: 'Bridal Kanjivaram',     subtitle: 'Udaipur Palace · Rajasthan', desc: 'A timeless heirloom for your wedding day',     price: '₹7,800', cta: 'Explore Bridal', ctaLink: '/catalog?occasion=Bridal', color: '#6B2A00' },
  { id: 'i3', src: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85&fit=crop&crop=top', badge: '🔥 Trending',         title: 'Crimson Chanderi',     subtitle: 'Jaipur Haveli · Rajasthan',  desc: 'Delicate Chanderi silk with silver zari',      price: '₹2,699', cta: 'Shop Festive',  ctaLink: '/catalog?occasion=Festival', color: '#C62828' },
  { id: 'i4', src: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e30?w=900&q=85&fit=crop&crop=top', badge: '💙 Party Wear',      title: 'Peacock Georgette',    subtitle: 'Mumbai · Maharashtra',      desc: 'Flowing georgette with peacock motifs',        price: '₹2,199', cta: 'Shop Party',    ctaLink: '/catalog?occasion=Party', color: '#1565C0' },
  { id: 'i5', src: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85&fit=crop&crop=top', badge: '👑 Premium',         title: 'Golden Tissue Silk',   subtitle: 'Delhi Heritage · NCR',      desc: 'Luxurious tissue silk with all-over golden weave', price: '₹8,900', cta: 'Shop Premium', ctaLink: '/catalog', color: '#F9A825' },
  { id: 'i6', src: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=85&fit=crop&crop=top', badge: '💜 Elegant',         title: 'Violet Mysore Silk',   subtitle: 'Mysore Palace · Karnataka', desc: 'Pure Mysore silk — Karnataka heritage',        price: '₹5,499', cta: 'Shop Silk',     ctaLink: '/catalog?fabric=Pure+Silk', color: '#6A1B9A' },
  { id: 'i7', src: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85&fit=crop&crop=top', badge: '💚 Festive',         title: 'Emerald Banarasi',     subtitle: 'Kashi Vishwanath · UP',    desc: 'Deep emerald with silver brocade florals',    price: '₹3,499', cta: 'Shop Now',      ctaLink: '/catalog', color: '#1B5E20' },
  { id: 'i8', src: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e30?w=900&q=85&fit=crop&crop=top', badge: '🧡 Daily Wear',      title: 'Saffron Tant Saree',   subtitle: 'Kolkata Victoria · WB',    desc: 'Breezy Bengal Tant cotton for everyday grace', price: '₹1,899', cta: 'Shop Cotton',   ctaLink: '/catalog?fabric=Cotton+Silk', color: '#E65100' },
];

const DEFAULT_REELS = [
  { id: 'r1', src: null, label: 'Banarasi Draping' },
  { id: 'r2', src: null, label: 'Bridal Look' },
  { id: 'r3', src: null, label: 'Festive Collection' },
  { id: 'r4', src: null, label: 'Party Wear' },
  { id: 'r5', src: null, label: 'Premium Silk' },
];

function buildImageList() {
  try {
    const saved = JSON.parse(localStorage.getItem('mohanah_db_banner') || '{}');
    if (saved.images?.length) {
      return saved.images.map((img, i) => {
        const def = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length];
        return {
          id: `ci-${i}`, src: img.src, color: def.color,
          title: img.title || def.title, subtitle: img.subtitle || def.subtitle,
          desc: img.desc || def.desc, price: img.price || def.price,
          badge: img.badge || def.badge, cta: img.cta || def.cta,
          ctaLink: img.ctaLink || def.ctaLink,
        };
      });
    }
  } catch {}
  return DEFAULT_IMAGES;
}

function buildReelList() {
  try {
    const saved = JSON.parse(localStorage.getItem('mohanah_db_banner') || '{}');
    if (saved.reels?.length) {
      return saved.reels.map((r, i) => ({
        ...(DEFAULT_REELS[i] || { id: `cr-${i}`, label: `Reel ${i + 1}` }),
        id: `cr-${i}`, src: r.src || null, name: r.name || `Reel ${i + 1}`,
      }));
    }
  } catch {}
  return DEFAULT_REELS;
}

function usePanel(list) {
  const [idx, setIdx]   = useState(0);
  const [dir, setDir]   = useState(null);
  const [busy, setBusy] = useState(false);
  const total = list.length;

  const goTo = useCallback((next, direction) => {
    if (busy || total < 2) return;
    setDir(direction);
    setBusy(true);
    setTimeout(() => { setIdx(next); setBusy(false); setDir(null); }, 340);
  }, [busy, total]);

  const next = useCallback(() => total > 0 && goTo((idx + 1) % total, 'up'),           [idx, total, goTo]);
  const prev = useCallback(() => total > 0 && goTo((idx - 1 + total) % total, 'down'), [idx, total, goTo]);
  return { idx: Math.min(idx, Math.max(total - 1, 0)), dir, busy, next, prev, goTo, total };
}

function panelStyle(busy, dir) {
  return {
    position: 'absolute', inset: 0,
    transition: busy ? 'transform 0.34s cubic-bezier(0.4,0,0.2,1), opacity 0.34s' : 'none',
    transform: busy ? (dir === 'up' ? 'translateY(-100%)' : 'translateY(100%)') : 'translateY(0)',
    opacity: busy ? 0 : 1,
  };
}

const BTN = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'rgba(20,30,12,0.85)',
  border: '1.5px solid rgba(201,149,108,0.45)',
  color: 'var(--accent)', fontSize: 13, fontWeight: 800,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 10px rgba(0,0,0,0.4)', transition: 'transform 0.15s, background 0.15s',
};

// ── Photo Panel ───────────────────────────────────────────────────────────────
function PhotoPanel({ imgList, img, isMobile }) {
  const navigate = useNavigate();
  const slide = imgList[img.idx] || imgList[0];

  function navBtn(onClick, label) {
    return (
      <button onClick={onClick} style={BTN}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.background = 'rgba(201,149,108,0.85)'; e.currentTarget.style.color = '#1E2A10'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.background = 'rgba(20,30,12,0.85)';      e.currentTarget.style.color = 'var(--accent)'; }}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Slide */}
      <div key={`img-${img.idx}`} style={panelStyle(img.busy, img.dir)}>
        {/* Blurred background — same image, cover + blur */}
        <div style={{
          position: 'absolute', inset: -30,
          backgroundImage: `url("${slide.src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: slide.color || '#3E4A2C',
          filter: 'blur(18px) brightness(0.55)',
          transform: 'scale(1.08)',
        }} />
        {/* Full image — contain so nothing is cropped */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${slide.src}")`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
      </div>

      {/* Gradient overlay — only bottom for text readability, top stays clear */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Bottom text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '16px 16px 52px' : '20px 22px 56px', zIndex: 2,
        transform: img.busy ? `translateY(${img.dir === 'up' ? '-14px' : '14px'})` : 'translateY(0)',
        opacity: img.busy ? 0 : 1, transition: 'transform 0.34s ease, opacity 0.34s ease',
        pointerEvents: 'none',
      }}>
        {slide.badge && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(201,149,108,0.22)', border: '1px solid rgba(201,149,108,0.4)', borderRadius: 20, padding: '3px 10px', marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: '#F2C4A0', fontWeight: 700, letterSpacing: 1 }}>{slide.badge}</span>
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 'clamp(18px,5vw,26px)' : 'clamp(20px,2.8vw,30px)', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 3 }}>{slide.title}</h2>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>{slide.subtitle}</p>
        {slide.price && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 18 : 22, fontWeight: 900, color: 'var(--accent)' }}>{slide.price}</span>
          </div>
        )}
        <div style={{ pointerEvents: 'auto' }}>
          <button onClick={() => navigate(slide.ctaLink || '/catalog')}
            style={{ padding: isMobile ? '9px 18px' : '10px 22px', borderRadius: 24, background: 'var(--accent)', color: '#1E2A10', fontWeight: 800, fontSize: isMobile ? 12 : 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 16px rgba(201,149,108,0.45)', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {slide.cta || 'Shop Now'} →
          </button>
        </div>
      </div>

      {/* Counter */}
      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 3, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
        {String(img.idx + 1).padStart(2,'0')} <span style={{ opacity: 0.4 }}>/ {String(img.total).padStart(2,'0')}</span>
      </div>

      {/* Nav buttons */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10, display: 'flex', gap: 7, alignItems: 'center' }}>
        {!isMobile && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, marginRight: 2 }}>PHOTO</span>}
        {navBtn(img.prev, '▲')}
        {navBtn(img.next, '▼')}
      </div>

      {/* Dot indicators */}
      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 5, zIndex: 5 }}>
        {imgList.map((_, i) => (
          <button key={i} onClick={() => img.goTo(i, i > img.idx ? 'up' : 'down')}
            style={{ width: 4, height: i === img.idx ? 20 : 6, borderRadius: 3, background: i === img.idx ? 'var(--accent)' : 'rgba(255,255,255,0.28)', border: 'none', cursor: 'pointer', padding: 0, transition: 'height 0.3s, background 0.3s' }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 20, display: 'flex', gap: 2, padding: '0 2px' }}>
        {imgList.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: i === img.idx ? 'var(--accent)' : 'rgba(255,255,255,0.18)', borderRadius: 2, transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

// ── Reel Panel ────────────────────────────────────────────────────────────────
function ReelPanel({ reelList, reel, imgList, isMobile }) {
  const [videoMuted,  setVideoMuted]  = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const videoRefs = useRef({});
  const reelSlide = reelList[reel.idx] || reelList[0];
  const slide     = imgList[0]; // for fallback color

  function navBtn(onClick, label) {
    return (
      <button onClick={onClick} style={BTN}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.background = 'rgba(201,149,108,0.85)'; e.currentTarget.style.color = '#1E2A10'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.background = 'rgba(20,30,12,0.85)';      e.currentTarget.style.color = 'var(--accent)'; }}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#080D08' }}>
      {/* Reel */}
      <div key={`reel-${reel.idx}`} style={panelStyle(reel.busy, reel.dir)}>
        {reelSlide.src ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
            <video src={reelSlide.src} autoPlay loop playsInline muted
              style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', objectFit: 'cover', filter: 'blur(18px) brightness(0.35)' }} />
            <video
              ref={el => videoRefs.current[reelSlide.id] = el}
              src={reelSlide.src} autoPlay loop playsInline muted={videoMuted}
              style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(180deg, #0A0F0A 0%, ${slide?.color || '#3E4A2C'}22 50%, #0A0F0A 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 56, opacity: 0.1 }}>🎬</div>
            <div style={{ textAlign: 'center', padding: '0 18px' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 4 }}>
                {reelSlide.name || reelSlide.label || 'Add Reel'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                Admin → Banner/Reels se upload karo
              </div>
            </div>
            <div style={{ width: 54, height: 54, borderRadius: '50%', border: '1.5px solid rgba(201,149,108,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 20, color: 'rgba(201,149,108,0.4)' }}>▶</div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* REEL label */}
      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF3B30', animation: 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: 2 }}>REEL</span>
      </div>

      {/* Reel name */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '16px 16px 52px' : '16px 16px 56px', zIndex: 4,
        transform: reel.busy ? `translateY(${reel.dir === 'up' ? '-14px' : '14px'})` : 'translateY(0)',
        opacity: reel.busy ? 0 : 1, transition: 'transform 0.34s ease, opacity 0.34s ease', pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 17 : 16, fontWeight: 900, color: 'white', marginBottom: 2 }}>
          {reelSlide.name || reelSlide.label}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          {String(reel.idx + 1).padStart(2,'0')} / {String(reel.total).padStart(2,'0')}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 5, zIndex: 5 }}>
        {reelList.map((_, i) => (
          <button key={i} onClick={() => reel.goTo(i, i > reel.idx ? 'up' : 'down')}
            style={{ width: 4, height: i === reel.idx ? 20 : 6, borderRadius: 3, background: i === reel.idx ? '#FF3B30' : 'rgba(255,255,255,0.22)', border: 'none', cursor: 'pointer', padding: 0, transition: 'height 0.3s, background 0.3s' }} />
        ))}
      </div>

      {/* Nav buttons */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 10, display: 'flex', gap: 7, alignItems: 'center' }}>
        {navBtn(reel.prev, '▲')}
        {navBtn(reel.next, '▼')}
        {!isMobile && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, marginLeft: 2 }}>REEL</span>}
      </div>

      {/* Video controls */}
      {reelSlide.src && (
        <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 7, zIndex: 10 }}>
          <button onClick={() => setVideoMuted(m => !m)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={() => {
            const v = videoRefs.current[reelSlide.id];
            if (v) { if (v.paused) { v.play(); setVideoPaused(false); } else { v.pause(); setVideoPaused(true); } }
          }}
            style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoPaused ? '▶' : '⏸'}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 20, display: 'flex', gap: 2, padding: '0 2px' }}>
        {reelList.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: i === reel.idx ? '#FF3B30' : 'rgba(255,255,255,0.18)', borderRadius: 2, transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main HeroBanner ──────────────────────────────────────────────────────────
export default function HeroBanner() {
  const [imgList,  setImgList]  = useState([]);
  const [reelList, setReelList] = useState([]);
  const img  = usePanel(imgList);
  const reel = usePanel(reelList);

  // Mobile state: which tab is active
  const [mobileTab, setMobileTab] = useState('photos'); // 'photos' | 'reels'
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch banners + reels from Supabase (live data — sabko dikhega)
  useEffect(() => {
    bannersAPI.getAll()
      .then(data => {
        if (data && data.length > 0) {
          setImgList(data.map((b, i) => ({
            id:       b.id,
            src:      b.image_url,
            title:    b.title    || '',
            subtitle: b.subtitle || '',
            desc:     b.description || '',
            price:    b.price    || '',
            badge:    b.badge    || '',
            cta:      b.cta_text || 'Shop Now',
            ctaLink:  b.cta_link || '/catalog',
            color:    DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]?.color || '#8B1A1A',
          })));
        } else {
          // Koi banner nahi → empty (no hardcoded fallback)
          setImgList([]);
        }
      })
      .catch(() => setImgList([]));

    reelsAPI.getAll()
      .then(data => {
        if (data && data.length > 0) {
          setReelList(data.map((r, i) => ({
            id:    r.id,
            src:   r.video_url,
            label: r.label || `Reel ${i + 1}`,
          })));
        } else {
          setReelList([]);
        }
      })
      .catch(() => setReelList([]));
  }, []);

  const DESKTOP_HEIGHT = 560;
  const MOBILE_HEIGHT  = 480;
  const height = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

  // Jab tak Supabase se data load ho raha hai ya koi banner nahi
  if (imgList.length === 0) return null;

  const hasReels = reelList.length > 0;

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ width: '100%', userSelect: 'none' }}>

        {/* Toggle tabs — sirf tab dikhao jab reels hon */}
        {hasReels && (
          <div style={{ display: 'flex', background: '#0A0F0A', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'photos', icon: '📸', label: 'Photos' },
              { key: 'reels',  icon: '🎬', label: 'Reels'  },
            ].map(tab => (
              <button key={tab.key} onClick={() => setMobileTab(tab.key)} style={{
                flex: 1, padding: '12px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: mobileTab === tab.key ? 'rgba(201,149,108,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer',
                borderBottom: mobileTab === tab.key ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
              }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, color: mobileTab === tab.key ? 'var(--accent)' : 'rgba(255,255,255,0.45)' }}>{tab.label}</span>
                {tab.key === 'reels' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: mobileTab === 'reels' ? '#FF3B30' : 'rgba(255,255,255,0.25)', animation: mobileTab === 'reels' ? 'pulse 1.5s infinite' : 'none' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Panel */}
        <div style={{ height: MOBILE_HEIGHT, position: 'relative', overflow: 'hidden' }}>
          {(!hasReels || mobileTab === 'photos') ? (
            <PhotoPanel imgList={imgList} img={img} isMobile={true} />
          ) : (
            <ReelPanel reelList={reelList} reel={reel} imgList={imgList} isMobile={true} />
          )}
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }`}</style>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  // Agar reels nahi hain → photos full width dikhao
  return (
    <div style={{ width: '100%', height: DESKTOP_HEIGHT, position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
      <div style={{ display: 'flex', height: '100%' }}>

        {/* Photos — full width if no reels, else 55% */}
        <div style={{ flex: hasReels ? '0 0 55%' : '1', position: 'relative', overflow: 'hidden' }}>
          <PhotoPanel imgList={imgList} img={img} isMobile={false} />
        </div>

        {/* Reels panel — sirf tab dikhao jab reels hon */}
        {hasReels && (
          <>
            <div style={{ width: 2, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
            <div style={{ flex: '0 0 calc(45% - 2px)', position: 'relative', overflow: 'hidden' }}>
              <ReelPanel reelList={reelList} reel={reel} imgList={imgList} isMobile={false} />
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }`}</style>
    </div>
  );
}
