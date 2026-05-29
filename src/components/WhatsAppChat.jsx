import React, { useState } from 'react';
import { settingsDB } from '../services/db';

// Always reads the latest value saved from Admin → Settings
function getWANumber() {
  const s = settingsDB.get();
  return s.whatsappNumber || '919876543210';
}

const QUICK_MESSAGES = [
  {
    icon: '📦',
    label: 'Track My Order',
    message: `Hello Mohanah! 👋\n\nI would like to track my order.\n\nPlease share the current status of my order. Thank you! 🥻`,
  },
  {
    icon: '🚚',
    label: 'Where is My Delivery?',
    message: `Hello Mohanah! 👋\n\nI am waiting for my delivery. Could you please tell me when my saree will be delivered?\n\nThank you!`,
  },
  {
    icon: '🥻',
    label: 'Ask About a Product',
    message: `Hello Mohanah! 👋\n\nI have a question about one of your sarees. Could you please help me with more details?\n\nThank you!`,
  },
  {
    icon: '↩️',
    label: 'Return or Exchange',
    message: `Hello Mohanah! 👋\n\nI would like to request a return or exchange for my recent order. Please guide me on the process.\n\nThank you!`,
  },
  {
    icon: '💳',
    label: 'Payment Issue',
    message: `Hello Mohanah! 👋\n\nI have a payment-related query regarding my order. Could you please assist me?\n\nThank you!`,
  },
  {
    icon: '🎁',
    label: 'Custom / Bulk Order',
    message: `Hello Mohanah! 👋\n\nI am interested in placing a custom or bulk order. Could you please share more details?\n\nThank you!`,
  },
];

export default function WhatsAppChat() {
  const [open, setOpen] = useState(false);

  function openChat(message) {
    const number = getWANumber();
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  return (
    <>
      {/* Popup menu */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 9998,
          width: 300,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid #E0E0E0',
          overflow: 'hidden',
          animation: 'slideUpChat 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🥻</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>Mohanah Support</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#90EE90', display: 'inline-block' }} />
                Usually replies within minutes
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>

          {/* Greeting bubble */}
          <div style={{ padding: '14px 16px 8px' }}>
            <div style={{
              background: '#F0F4EF', borderRadius: '0 12px 12px 12px',
              padding: '10px 14px', fontSize: 13, color: '#333', lineHeight: 1.6,
              maxWidth: '90%', marginBottom: 12,
            }}>
              👋 Hi! How can we help you today?<br />
              <span style={{ fontSize: 12, color: '#888' }}>Choose a topic below or type your own message.</span>
            </div>

            {/* Quick reply options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
              {QUICK_MESSAGES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => openChat(q.message)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', borderRadius: 10,
                    border: '1.5px solid #E0F2E0',
                    background: 'white', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0FFF4'; e.currentTarget.style.borderColor = '#25D366'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E0F2E0'; }}
                >
                  <span style={{ fontSize: 18 }}>{q.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>{q.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>→</span>
                </button>
              ))}
            </div>

            {/* Custom message */}
            <button
              onClick={() => openChat('Hello Mohanah! 👋\n\nI have a query regarding your sarees. Could you please help me?')}
              style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: '#25D366', color: 'white',
                border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 18 }}>💬</span>
              Chat on WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 58, height: 58, borderRadius: '50%',
          background: open ? '#128C7E' : '#25D366',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Chat with us on WhatsApp"
      >
        {open ? '✕' : '💬'}
        {/* Pulse ring */}
        {!open && (
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: '2px solid rgba(37,211,102,0.4)',
            animation: 'waPulse 2s infinite',
          }} />
        )}
      </button>

      <style>{`
        @keyframes waPulse {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes slideUpChat {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
