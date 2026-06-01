import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsDB } from '../services/db';

const DEFAULT_WA      = '919334836250';
const DEFAULT_PHONE   = '+91 93348 36250';
const DEFAULT_EMAIL   = 'hello@mohanah.com';
const DEFAULT_ADDRESS = 'Dhanbad, Jharkhand';

export default function Footer() {
  const local = settingsDB.get();
  const [cfg, setCfg] = useState({
    phone:          local.phone          || DEFAULT_PHONE,
    email:          local.email          || DEFAULT_EMAIL,
    address:        local.address        || DEFAULT_ADDRESS,
    whatsappNumber: local.whatsappNumber || DEFAULT_WA,
    instagram:      local.instagram      || '',
    facebook:       local.facebook       || '',
  });

  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      ['phone','email','address','whatsappNumber','instagram','facebook'].forEach(k => {
        settingsAPI.get(k).then(v => { if (v) setCfg(s => ({ ...s, [k]: v })); }).catch(() => {});
      });
    });
  }, []);

  const waNumber  = (cfg.whatsappNumber || DEFAULT_WA).replace(/[\s\+\-]/g, '');
  const phone     = cfg.phone     || DEFAULT_PHONE;
  const email     = cfg.email     || DEFAULT_EMAIL;
  const address   = cfg.address   || DEFAULT_ADDRESS;
  const instagram = cfg.instagram || '';
  const facebook  = cfg.facebook  || '';

  return (
    <footer style={{
      background: 'var(--primary)',
      color: 'var(--accent-light)',
      padding: '48px 0 24px',
      marginTop: 64,
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 32,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <img
              src="/mohanah_logo.svg"
              alt="Mohanah"
              style={{ width: 180, height: 'auto', borderRadius: 10, marginBottom: 14, display: 'block' }}
            />
            <p style={{ fontSize: 13, color: '#A0B080', lineHeight: 1.7, maxWidth: 220 }}>
              Premium handcrafted sarees from the finest weavers across India. Elegance in every thread.
            </p>
            {/* Contact info */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ fontSize: 12, color: '#A0B080', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📞 {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} style={{ fontSize: 12, color: '#A0B080', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✉️ {email}
                </a>
              )}
              {address && (
                <div style={{ fontSize: 12, color: '#A0B080', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  📍 {address}
                </div>
              )}
            </div>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {waNumber && (
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none' }}
                  title="WhatsApp">💬</a>
              )}
              {instagram && (
                <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@','')}`} target="_blank" rel="noreferrer"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none' }}
                  title="Instagram">📸</a>
              )}
              {!instagram && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📸</div>
              )}
              {facebook && (
                <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook.replace('@','')}`} target="_blank" rel="noreferrer"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none' }}
                  title="Facebook">📘</a>
              )}
              {!facebook && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📘</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#FFFFFF' }}>
              Shop
            </h4>
            {[
              { label: 'New Arrivals', to: '/catalog?filter=new' },
              { label: 'Bridal Collection', to: '/catalog?occasion=Bridal' },
              { label: 'Wedding Sarees', to: '/catalog?occasion=Wedding' },
              { label: 'Festival Wear', to: '/catalog?occasion=Festival' },
              { label: 'Kanjivaram', to: '/catalog?fabric=Kanjivaram' },
              { label: 'Banarasi', to: '/catalog?fabric=Banarasi' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'block', color: '#A0B080',
                fontSize: 13, marginBottom: 8,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = '#A0B080'}
              >{l.label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#FFFFFF' }}>
              Company
            </h4>
            {[
              { label: 'About Us', to: '/about' },
              { label: 'Contact Us', to: '/legal/contact' },
              { label: 'Track My Order', to: '/orders' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ display: 'block', color: '#A0B080', fontSize: 13, marginBottom: 8, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = '#A0B080'}
              >{l.label}</Link>
            ))}
          </div>

          {/* Customer */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#FFFFFF' }}>
              Customer Care
            </h4>
            {[
              { label: 'Return & Exchange', to: '/legal/refund' },
              { label: 'Shipping Policy', to: '/legal/shipping' },
              { label: 'Privacy Policy', to: '/legal/privacy' },
              { label: 'Terms & Conditions', to: '/legal/terms' },
              { label: 'Contact Us', to: '/legal/contact' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'block', color: '#A0B080',
                fontSize: 13, marginBottom: 8,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = '#A0B080'}
              >{l.label}</Link>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#FFFFFF' }}>
              Stay in Touch
            </h4>
            <p style={{ fontSize: 13, color: '#A0B080', marginBottom: 12, lineHeight: 1.6 }}>
              Get exclusive offers & new arrivals in your inbox.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="your@email.com" style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: 'white', fontSize: 12,
                outline: 'none', fontFamily: 'var(--font-sans)',
              }} />
              <button style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--accent)', color: 'white',
                border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>→</button>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello Mohanah! I would like to know more about your sarees.')}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 16, padding: '10px 14px', borderRadius: 10,
                background: '#25D366', color: 'white',
                textDecoration: 'none', fontSize: 12, fontWeight: 700,
              }}>
              💬 Chat on WhatsApp
            </a>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#A0B080', marginBottom: 8 }}>We accept</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['💳 Visa', '🏦 UPI', '📱 PayTM', '🪙 EMI'].map(p => (
                  <span key={p} style={{
                    fontSize: 10, padding: '3px 7px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4, color: '#A0B080',
                  }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#6A7A5A',
        }}>
          <div>© {new Date().getFullYear()} Mohanah. All rights reserved. Made with 🥻 in India.</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', to: '/legal/privacy' },
              { label: 'Terms of Service', to: '/legal/terms' },
              { label: 'Refund Policy', to: '/legal/refund' },
              { label: 'Shipping', to: '/legal/shipping' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ color: '#6A7A5A', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = '#6A7A5A'}
              >{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
