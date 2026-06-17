import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI as supabaseOrdersAPI } from '../services/supabase';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const STEPS = ['Address', 'Review'];

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { items, subtotal, couponDiscount, delivery, giftWrapCharge, total, dispatch } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [step,    setStep]    = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placed,  setPlaced]  = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error,   setError]   = useState('');

  const [address, setAddress] = useState({
    name: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '',
  });

  if (items.length === 0 && !placed) { navigate('/cart'); return null; }

  // ─── Success screen ─────────────────────────────────────────
  if (placed) {
    return (
      <div className="page" style={{ paddingTop: 68, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 20px' }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
            Payment Successful!
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
            Thank you for shopping with Mohanah! 🥻<br />
            Your saree is being packed with love.
          </p>
          <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ORDER ID</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{orderId}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/orders')} className="btn btn-primary">Track Order</button>
            <button onClick={() => navigate('/catalog')} className="btn btn-outline">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Save confirmed order to Supabase ───────────────────────
  async function saveConfirmedOrder(razorpayPaymentId, razorpayOrderId) {
    const mainItem    = items[0] || {};
    const year        = new Date().getFullYear();
    const orderNumber = `MNH-${year}-${String(Date.now()).slice(-6)}`;

    const saved = await supabaseOrdersAPI.add({
      order_number:          orderNumber,
      user_id:               user?.id    || null,
      user_email:            user?.email || '',
      product:               items.length === 1 ? mainItem.name : `${mainItem.name} + ${items.length - 1} more`,
      fabric:                mainItem.fabric || '',
      color:                 mainItem.color  || '#C9956C',
      images:                mainItem.images || [],
      image_url:             mainItem.selectedColorImage || mainItem.imageUrl || mainItem.images?.[0]?.src || '',
      price:                 total,
      address:               { ...address },
      selected_color_name:   mainItem.selectedColorName  || '',
      selected_color_hex:    mainItem.selectedColorHex   || mainItem.color || '',
      selected_color_image:  mainItem.selectedColorImage || mainItem.imageUrl || mainItem.images?.[0]?.src || '',
      items: items.map(i => ({
        id:                 i.id,
        name:               i.name,
        qty:                i.qty,
        price:              i.price,
        fabric:             i.fabric || '',
        imageUrl:           i.selectedColorImage || i.imageUrl || i.images?.[0]?.src || '',
        selectedColorName:  i.selectedColorName  || '',
        selectedColorImage: i.selectedColorImage || '',
        selectedColorHex:   i.selectedColorHex   || i.color || '',
      })),
      payment_method:        'Razorpay',
      razorpay_payment_id:   razorpayPaymentId,
      razorpay_order_id:     razorpayOrderId,
      tracking_number:       '',
      estimated_delivery:    '',
      status:                'confirmed',   // confirmed immediately on payment
      progress:              25,
      date:                  new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    });

    return saved.order_number || orderNumber;
  }

  // ─── Open Razorpay ──────────────────────────────────────────
  async function handlePay() {
    setError('');
    setPlacing(true);

    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('❌ Razorpay load nahi hua. Internet check karein aur retry karein.');
      setPlacing(false);
      return;
    }

    // 2. Create order on backend
    let razorpayOrderId, orderAmount;
    try {
      const res  = await fetch('/api/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: total * 100 }), // paise
      });
      const data = await res.json();
      if (!res.ok || !data.order_id) throw new Error(data.error || 'Order create failed');
      razorpayOrderId = data.order_id;
      orderAmount     = data.amount;
    } catch (err) {
      setError('❌ ' + err.message);
      setPlacing(false);
      return;
    }

    // 3. Open Razorpay modal
    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      orderAmount,
      currency:    'INR',
      order_id:    razorpayOrderId,
      name:        'Mohanah',
      description: items.map(i => i.name).join(', '),
      image:       'https://www.mohanah.com/mohanah_logo.svg',
      prefill: {
        name:    address.name,
        contact: address.phone,
        email:   user?.email || '',
      },
      notes: {
        delivery_address: `${address.line1}, ${address.city}, ${address.state} - ${address.pincode}`,
      },
      theme: { color: '#3E4A2C' },

      handler: async function(response) {
        // 4. Verify signature on backend
        try {
          const vRes  = await fetch('/api/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const vData = await vRes.json();

          if (!vRes.ok || !vData.valid) {
            throw new Error(vData.error || 'Payment verification failed');
          }

          // 5. Save confirmed order to Supabase
          const oid = await saveConfirmedOrder(response.razorpay_payment_id, response.razorpay_order_id);
          dispatch({ type: 'CLEAR_CART' });
          setOrderId(oid);
          setPlaced(true);
        } catch (err) {
          setError('⚠️ Payment done but verification failed. Contact us with Payment ID: ' + response.razorpay_payment_id);
          setPlacing(false);
        }
      },

      modal: {
        ondismiss: () => {
          setPlacing(false);
          setError('Payment cancelled. Try again when ready.');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      setError('❌ Payment failed: ' + (resp.error?.description || 'Please try again.'));
      setPlacing(false);
    });
    rzp.open();
  }

  const inputSt = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', outline: 'none',
    fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)',
    boxSizing: 'border-box',
  };

  const addressFilled = address.name && address.phone && address.line1 && address.city && address.state && address.pincode;

  return (
    <div className="page" style={{ paddingTop: 68 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 16 }}>
            Checkout
          </h1>
          <div style={{ display: 'flex', gap: 0 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i < step ? 'var(--accent)' : i === step ? 'white' : 'rgba(255,255,255,0.3)',
                    color: i === step ? 'var(--primary)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12,
                  }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: i <= step ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? 'var(--accent)' : 'rgba(255,255,255,0.2)', margin: '14px 8px 0', borderRadius: 1 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          <div className="card" style={{ padding: 24 }}>

            {/* Step 0: Address */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
                  📍 Delivery Address
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Full Name *',            key: 'name',    col: 2 },
                    { label: 'Phone Number *',          key: 'phone',   col: 1 },
                    { label: 'Address Line 1 *',        key: 'line1',   col: 2 },
                    { label: 'Address Line 2 (optional)', key: 'line2', col: 2 },
                    { label: 'City *',                  key: 'city',    col: 1 },
                    { label: 'State *',                 key: 'state',   col: 1 },
                    { label: 'Pincode *',               key: 'pincode', col: 1 },
                  ].map(field => (
                    <div key={field.key} style={{ gridColumn: `span ${field.col}` }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
                        {field.label.toUpperCase()}
                      </label>
                      <input
                        value={address[field.key]}
                        onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                        style={inputSt}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { if (addressFilled) setStep(1); }}
                  className="btn btn-primary"
                  style={{ marginTop: 20, width: '100%', opacity: addressFilled ? 1 : 0.45, cursor: addressFilled ? 'pointer' : 'not-allowed' }}
                  disabled={!addressFilled}
                >
                  Continue to Review →
                </button>
              </div>
            )}

            {/* Step 1: Review + Pay */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
                  📋 Review & Pay
                </h2>

                {/* Address review */}
                <div style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>DELIVERING TO</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{address.name} · {address.phone}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{address.city}, {address.state} — {address.pincode}</div>
                  <button onClick={() => setStep(0)} style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ✏️ Edit Address
                  </button>
                </div>

                {/* Items */}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ITEMS ({items.length})</div>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 8 }}>
                    {(item.selectedColorImage || item.imageUrl || item.images?.[0]?.src) ? (
                      <img src={item.selectedColorImage || item.imageUrl || item.images?.[0]?.src} alt={item.name}
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: `${item.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🥻</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                      {item.selectedColorName && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.selectedColorName}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                  </div>
                ))}

                {/* Pay button */}
                {error && (
                  <div style={{ background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: '#C62828', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={placing}
                  style={{
                    width: '100%', marginTop: 8,
                    padding: '16px 24px', borderRadius: 14,
                    background: placing ? '#aaa' : 'var(--primary)',
                    color: 'var(--accent-light)',
                    border: 'none', cursor: placing ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 900,
                    boxShadow: placing ? 'none' : '0 4px 16px rgba(62,74,44,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {placing ? '⏳ Opening Payment...' : `🔒 Pay ₹${total.toLocaleString('en-IN')} Securely`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                  {['💳 Cards', '📱 UPI', '🏦 NetBanking', '👜 Wallets'].map(m => (
                    <span key={m} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{m}</span>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  🔒 Powered by Razorpay · 100% Secure · SSL Encrypted
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Bill Summary</h3>
            {[
              ['Subtotal',    `₹${subtotal.toLocaleString('en-IN')}`],
              couponDiscount > 0 ? ['Coupon Savings', `-₹${couponDiscount.toLocaleString('en-IN')}`] : null,
              ['Delivery',    delivery === 0 ? 'FREE' : `₹${delivery}`],
              giftWrapCharge > 0 ? ['Gift Wrap', `₹${giftWrapCharge}`] : null,
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
                <span>{k}</span>
                <span style={{ fontWeight: 600, color: k.includes('Saving') ? 'var(--success)' : 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 17, color: 'var(--primary)' }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, padding: '8px 10px', background: 'var(--surface-alt)', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: `${item.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🥻</div>
                <div style={{ flex: 1, fontSize: 11, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>×{item.qty}</div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#F1F8E9', borderRadius: 10, border: '1px solid #C5E1A5' }}>
              <div style={{ fontSize: 11, color: '#33691E', fontWeight: 700, textAlign: 'center' }}>
                🔒 Secure Payment · Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
