import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, subtotal, savings, couponDiscount, delivery, giftWrapCharge, total, cartCount, giftWrap, coupon, dispatch, applyCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const navigate = useNavigate();

  function handleCoupon() {
    const result = applyCoupon(couponInput);
    setCouponMsg(result);
    if (result.success) setCouponInput('');
    setTimeout(() => setCouponMsg(null), 3000);
  }

  if (items.length === 0) {
    return (
      <div className="page" style={{ paddingTop: 68, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🛍️</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-sec)', marginBottom: 24 }}>Add some beautiful sarees to get started!</p>
          <button onClick={() => navigate('/catalog')} className="btn btn-primary btn-lg">
            Explore Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'white' }}>
            🛍️ My Cart ({cartCount} item{cartCount !== 1 ? 's' : ''})
          </h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ── Cart Items ── */}
          <div>
            {items.map(item => (
              <div key={item.id} className="card" style={{ marginBottom: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Color swatch */}
                <Link to={`/product/${item.id}`}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: `linear-gradient(135deg, ${item.color}CC, ${item.color}44)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, opacity: 0.7,
                  }}>🥻</div>
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                    {item.fabric} · {item.region}
                  </div>
                  <Link to={`/product/${item.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                      {item.name}
                    </div>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    {item.originalPrice && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Qty */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty - 1 })}
                        style={{ width: 30, height: 30, background: 'var(--surface-alt)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                        −
                      </button>
                      <span style={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{item.qty}</span>
                      <button onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty + 1 })}
                        style={{ width: 30, height: 30, background: 'var(--surface-alt)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                        +
                      </button>
                    </div>

                    <button onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
                      style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                      🗑 Remove
                    </button>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--primary)', flexShrink: 0, textAlign: 'right' }}>
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </div>
              </div>
            ))}

            {/* Gift Wrap */}
            <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                <input type="checkbox" checked={giftWrap}
                  onChange={() => dispatch({ type: 'TOGGLE_GIFT_WRAP' })}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🎁 Add Gift Wrapping</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Premium packaging with a personal note</div>
                </div>
              </label>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>+₹49</span>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sec)' }}>
                  <span>Subtotal ({cartCount} items)</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {savings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
                    <span>Product Savings</span>
                    <span style={{ fontWeight: 700 }}>−₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
                    <span>Coupon ({coupon?.label})</span>
                    <span style={{ fontWeight: 700 }}>−₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sec)' }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 600, color: delivery === 0 ? 'var(--success)' : 'var(--text)' }}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                {giftWrapCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sec)' }}>
                    <span>Gift Wrapping</span>
                    <span style={{ fontWeight: 600 }}>₹{giftWrapCharge}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 20, color: 'var(--primary)' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              {!coupon ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
                    APPLY COUPON
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 12,
                        fontFamily: 'var(--font-sans)', fontWeight: 600,
                        background: 'var(--bg)', outline: 'none',
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleCoupon()} />
                    <button onClick={handleCoupon} className="btn btn-accent btn-sm">Apply</button>
                  </div>
                  {couponMsg && (
                    <div style={{ fontSize: 11, marginTop: 6, color: couponMsg.success ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                      {couponMsg.success ? '✓ ' : '✗ '}{couponMsg.message}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                    Try: WELCOME10 · MOHANAH15 · SILK20
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 16, background: '#E8F5E9', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ {coupon.label} applied</span>
                  <button onClick={() => dispatch({ type: 'REMOVE_COUPON' })}
                    style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                    Remove
                  </button>
                </div>
              )}

              <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: '14px' }}>
                Proceed to Checkout →
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/catalog" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="card" style={{ padding: 16, marginTop: 12 }}>
              {[
                { icon: '🔒', text: '100% Secure Checkout' },
                { icon: '🚚', text: 'Free delivery above ₹2,000' },
                { icon: '🔄', text: '7-day easy returns' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 12, color: 'var(--text-sec)' }}>
                  <span>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
