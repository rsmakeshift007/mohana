import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersDB } from '../services/db';
import { useAuth } from '../context/AuthContext';

const TABS = ['All', 'Active', 'Delivered', 'Cancelled'];

const statusConfig = {
  placed:           { label: 'Order Placed',       bg: '#E3F2FD', color: '#1565C0' },
  confirmed:        { label: 'Confirmed',           bg: '#E8F5E9', color: '#2E7D32' },
  packed:           { label: 'Packed & Ready',      bg: '#FFF8E1', color: '#F57F17' },
  shipped:          { label: 'Shipped',             bg: '#E3F2FD', color: '#1565C0' },
  out_for_delivery: { label: 'Out for Delivery',    bg: '#FFF3E8', color: '#C9956C' },
  delivered:        { label: 'Delivered',           bg: '#E8F5E9', color: '#2E7D32' },
  cancelled:        { label: 'Cancelled',           bg: '#FFEBEE', color: '#C62828' },
};

const TIMELINE = [
  { key: 'placed',           label: 'Order Placed',     icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',         icon: '✅' },
  { key: 'packed',           label: 'Packed & Ready',    icon: '📦' },
  { key: 'shipped',          label: 'Shipped',           icon: '🚛' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: '🏍️' },
  { key: 'delivered',        label: 'Delivered',         icon: '🎁' },
];

const statusOrder = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

function OrderCard({ order, expanded, onToggle }) {
  const cfg = statusConfig[order.status] || statusConfig.placed;
  const navigate = useNavigate();
  const currentIdx = statusOrder.indexOf(order.status);

  // Main image
  const mainImg = order.images?.[0]?.src || order.imageUrl || null;

  return (
    <div className="card" style={{ marginBottom: 14, overflow: 'visible' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Product thumbnail */}
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)',
          background: `${order.color || '#C9956C'}33`,
          overflow: 'hidden', flexShrink: 0, position: 'relative',
        }}>
          {mainImg ? (
            <>
              <div style={{ position: 'absolute', inset: -4, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px) brightness(0.6)' }} />
              <img src={mainImg} alt={order.product} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 24 }}>🥻</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
            {order.product}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            {order.id} · {order.date} {order.fabric ? `· ${order.fabric}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: cfg.bg, color: cfg.color,
            }}>{cfg.label}</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{(order.price || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button onClick={onToggle} className="btn btn-outline btn-sm">
              {expanded ? '▲ Hide' : '▼ Track'}
            </button>
          )}
          {order.status === 'delivered' && (
            <button onClick={() => navigate('/catalog')} className="btn btn-primary btn-sm">
              Reorder
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {order.status !== 'cancelled' && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${order.progress || 10}%`,
              background: `linear-gradient(90deg, var(--primary), var(--accent))`,
              borderRadius: 4, transition: 'width 0.5s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Order Placed</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.progress || 10}%</span>
            <span>Delivered</span>
          </div>
        </div>
      )}

      {/* Tracking info banner (if tracking number or estimated delivery set by admin) */}
      {(order.trackingNumber || order.estimatedDelivery) && order.status !== 'cancelled' && (
        <div style={{
          margin: '0 20px 16px',
          background: 'linear-gradient(135deg, #E8F5E9, #F1F8F1)',
          border: '1.5px solid #A5D6A7',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', gap: 20, flexWrap: 'wrap',
        }}>
          {order.trackingNumber && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>TRACKING NUMBER</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14, color: '#2E7D32', letterSpacing: 0.5 }}>
                🚚 {order.trackingNumber}
              </div>
            </div>
          )}
          {order.estimatedDelivery && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>ESTIMATED DELIVERY</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14, color: '#1565C0' }}>
                📅 {order.estimatedDelivery}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking timeline */}
      {expanded && order.status !== 'cancelled' && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TIMELINE.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.key} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {/* Line */}
                  {i < TIMELINE.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 14, top: 28, width: 2, height: 32,
                      background: done ? 'var(--accent)' : 'var(--border)',
                    }} />
                  )}
                  {/* Circle */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: done ? (active ? 'var(--accent)' : 'var(--primary)') : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, zIndex: 1,
                  }}>
                    {done ? (active ? step.icon : '✓') : <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{i + 1}</span>}
                  </div>
                  <div style={{ paddingBottom: i < TIMELINE.length - 1 ? 24 : 0 }}>
                    <div style={{
                      fontWeight: active ? 800 : done ? 600 : 400,
                      fontSize: 13, color: done ? 'var(--text)' : 'var(--text-muted)',
                    }}>{step.label}</div>
                    {active && order.estimatedDelivery && (
                      <div style={{ fontSize: 11, color: '#1565C0', fontWeight: 600 }}>
                        Expected by {order.estimatedDelivery}
                      </div>
                    )}
                    {active && !order.estimatedDelivery && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Current Status</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  function loadUserOrders() {
    const all = ordersDB.getAll();
    // Filter by current user's email — if no user logged in, show nothing
    if (!user) { setOrders([]); return; }
    const mine = all.filter(o =>
      o.email === user.email ||
      o.customerEmail === user.email ||
      o.userEmail === user.email
    );
    setOrders(mine);
  }

  useEffect(() => {
    loadUserOrders();
  }, [user]);

  // Refresh when localStorage changes (e.g. admin updates order)
  useEffect(() => {
    function handleStorage() {
      loadUserOrders();
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return !['delivered', 'cancelled'].includes(o.status);
    if (activeTab === 'Delivered') return o.status === 'delivered';
    if (activeTab === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            📦 My Orders
          </h1>
          <p style={{ color: '#A0B080', fontSize: 13 }}>{orders.length} orders total</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: activeTab === tab ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === tab ? 'var(--accent-light)' : 'var(--text)',
                border: `1px solid ${activeTab === tab ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: 'var(--text-sec)', marginBottom: 24 }}>
              {activeTab === 'All'
                ? 'Once you place an order, it will appear here.'
                : `Your ${activeTab.toLowerCase()} orders will appear here.`}
            </p>
            <button onClick={() => window.location.href = '/catalog'} className="btn btn-primary">
              Shop Now →
            </button>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(id => id === order.id ? null : order.id)}
            />
          ))
        )}

        {/* Explore banner */}
        <div style={{
          marginTop: 32,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          borderRadius: 'var(--radius-xl)', padding: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>
              Explore more sarees 🥻
            </div>
            <p style={{ color: '#A0B080', fontSize: 13 }}>500+ premium sarees from India's finest weavers</p>
          </div>
          <button onClick={() => window.location.href = '/catalog'} className="btn btn-accent">
            Shop Now →
          </button>
        </div>
      </div>
    </div>
  );
}
