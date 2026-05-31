import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { legalDB, settingsDB } from '../services/db';

const PAGE_META = {
  privacy:  { icon: '🔒', color: '#1565C0', bg: '#E3F2FD' },
  terms:    { icon: '📋', color: '#6A1B9A', bg: '#F3E5F5' },
  refund:   { icon: '↩️', color: '#E65100', bg: '#FFF3E0' },
  shipping: { icon: '🚚', color: '#2E7D32', bg: '#E8F5E9' },
  contact:  { icon: '💬', color: '#C9956C', bg: '#FFF8F0' },
};

// Simple markdown-like renderer
function renderContent(text, settings) {
  if (!text) return null;

  // Replace placeholders with settings values
  let processed = text;
  if (settings) {
    processed = processed
      .replace(/\{storeName\}/g, settings.storeName || 'Mohanah')
      .replace(/\{email\}/g, settings.email || 'hello@mohanah.com')
      .replace(/\{phone\}/g, settings.phone || '+91 98765 43210')
      .replace(/\{address\}/g, settings.address || 'Varanasi, Uttar Pradesh')
      .replace(/\{whatsapp\}/g, settings.whatsappNumber ? `+${settings.whatsappNumber}` : settings.phone || '+91 98765 43210')
      .replace(/\{freeDelivery\}/g, settings.freeDeliveryAbove || '2000');
  }

  const lines = processed.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 10 }} />;

    // Bold heading: **text**
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
      return (
        <h3 key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginTop: 22, marginBottom: 8, lineHeight: 1.3 }}>
          {trimmed.slice(2, -2)}
        </h3>
      );
    }

    // Inline bold: replace **x** inside text
    function boldify(str) {
      const parts = str.split(/\*\*(.*?)\*\*/g);
      return parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 700 }}>{p}</strong> : p);
    }

    // Checkmark / cross lines
    if (trimmed.startsWith('✅') || trimmed.startsWith('❌') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.startsWith('-') ? trimmed.slice(1).trim() : trimmed;
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7 }}>
          {boldify(content)}
        </div>
      );
    }

    return (
      <p key={i} style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.9, marginBottom: 4 }}>
        {boldify(trimmed)}
      </p>
    );
  });
}

export default function LegalPage() {
  const { page } = useParams();
  const [pages, setPages] = useState(() => legalDB.getAll());
  const [settings, setSettings] = useState(settingsDB.get());

  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      // Load settings
      const settingKeys = ['phone', 'email', 'address', 'whatsappNumber', 'storeName', 'freeDeliveryAbove'];
      settingKeys.forEach(k => {
        settingsAPI.get(k)
          .then(v => { if (v) setSettings(s => ({ ...s, [k]: v })); })
          .catch(() => {});
      });
      // Load legal page content from Supabase
      const legalKeys = ['privacy', 'terms', 'refund', 'shipping', 'contact'];
      legalKeys.forEach(k => {
        settingsAPI.get(`legal_${k}`)
          .then(val => {
            if (val) {
              try {
                const parsed = JSON.parse(val);
                setPages(p => ({ ...p, [k]: { ...p[k], ...parsed } }));
              } catch {}
            }
          })
          .catch(() => {});
      });
    });
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'mohanah_db_legal') {
        setPages(legalDB.getAll());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const meta = PAGE_META[page];
  const pageData = pages[page];

  if (!meta || !pageData) {
    return (
      <div className="page" style={{ paddingTop: 68, textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Page not found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Go Home</Link>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '32px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {meta.icon}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 2 }}>
                {pageData.title}
              </h1>
              <p style={{ color: '#A0B080', fontSize: 12 }}>
                Mohanah — {pageData.updatedAt ? `Last updated: ${new Date(pageData.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Drape The Charm'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 820 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span>{pageData.title}</span>
        </div>

        {/* Content card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          {renderContent(pageData.content, settings)}
        </div>

        {/* Contact info card (shown on contact page) */}
        {page === 'contact' && (
          <div style={{
            marginTop: 20,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14,
          }}>
            {[
              { icon: '💬', label: 'WhatsApp', value: settings.whatsappNumber ? `+${settings.whatsappNumber}` : settings.phone || '+91 98765 43210', href: `https://wa.me/${settings.whatsappNumber || '919876543210'}`, color: '#25D366' },
              { icon: '✉️', label: 'Email', value: settings.email || 'hello@mohanah.com', href: `mailto:${settings.email || 'hello@mohanah.com'}`, color: '#1565C0' },
              { icon: '📍', label: 'Address', value: settings.address || 'Varanasi, Uttar Pradesh', href: null, color: '#C9956C' },
            ].map(item => (
              <a key={item.label} href={item.href || '#'} target={item.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 3 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color, lineHeight: 1.4 }}>{item.value}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* WhatsApp CTA (not on contact page) */}
        {page !== 'contact' && (
          <div style={{
            marginTop: 20, background: 'linear-gradient(135deg, #E8F5E9, #F1F8F1)',
            border: '1.5px solid #A5D6A7', borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1B5E20' }}>Still have questions?</div>
              <div style={{ fontSize: 12, color: '#388E3C' }}>Chat with us on WhatsApp — Mon–Sat, 9AM to 9PM</div>
            </div>
            <Link to="/legal/contact" style={{
              padding: '9px 20px', borderRadius: 10, background: 'var(--primary)', color: 'var(--accent-light)',
              fontWeight: 800, fontSize: 12, textDecoration: 'none',
            }}>Contact Us →</Link>
          </div>
        )}

        {/* Navigation pills */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(PAGE_META).map(([key, m]) => (
            <Link key={key} to={`/legal/${key}`} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12,
              background: key === page ? 'var(--primary)' : 'var(--surface-alt)',
              color: key === page ? 'var(--accent-light)' : 'var(--text-muted)',
              border: `1px solid ${key === page ? 'var(--primary)' : 'var(--border)'}`,
              textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{m.icon}</span>
              <span>{pages[key]?.title || key}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
