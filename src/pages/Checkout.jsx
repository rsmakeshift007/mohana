import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { settingsDB, ordersDB } from '../services/db';

const STORE_NAME = 'Mohanah';

// Read live from admin settings (with fallbacks)
function getPaySettings() {
  const s = settingsDB.get();
  return {
    upiId:           s.upiId           || 'mohanah@ybl',
    whatsappNumber:  s.whatsappNumber  || '919876543210',
    upiQrCode:       s.upiQrCode       || '',
  };
}

const STEPS = ['Address', 'Payment', 'Review', 'Confirm'];

export default function Checkout() {
  const { items, subtotal, couponDiscount, delivery, giftWrapCharge, total, dispatch } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [address, setAddress] = useState({
    name: 'Rajan Shrivastawa', phone: '9876543210',
    line1: '123, Silk Road', line2: 'Varanasi, Uttar Pradesh',
    city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001',
  });
  const [payMethod, setPayMethod] = useState('upi');
  const [agreedSteps, setAgreedSteps] = useState(false);
  const [copied, setCopied]           = useState(false);
  const { upiId: STORE_UPI_ID, whatsappNumber: WHATSAPP_NUMBER, upiQrCode } = getPaySettings();

  if (items.length === 0 && !placed) {
    navigate('/cart');
    return null;
  }

  if (placed) {
    return (
      <div className="page" style={{ paddingTop: 68, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
            Order Placed!
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
            Thank you for shopping with Mohanah!<br />
            Your saree(s) are being packed with love.
          </p>
          <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ORDER ID</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
              {orderId || 'MNH-XXXXXX'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/orders')} className="btn btn-primary">Track Order</button>
            <button onClick={() => navigate('/catalog')} className="btn btn-outline">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  function handleNext() {
    if (step < STEPS.length - 2) setStep(s => s + 1);
    else placeOrder();
  }

  function placeOrder() {
    setPlacing(true);
    setTimeout(() => {
      // Build order object for each cart item (or one combined order)
      const mainItem = items[0] || {};
      const newOrder = ordersDB.add({
        product: items.length === 1 ? mainItem.name : `${mainItem.name} + ${items.length - 1} more`,
        fabric: mainItem.fabric || '',
        color: mainItem.color || '#C9956C',
        images: mainItem.images || [],
        imageUrl: mainItem.imageUrl || mainItem.images?.[0]?.src || '',
        price: total,
        address: { ...address },
        items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        paymentMethod: 'UPI',
        trackingNumber: '',
        estimatedDelivery: '',
      });
      setOrderId(newOrder.id);
      dispatch({ type: 'CLEAR_CART' });
      setPlacing(false);
      setPlaced(true);
    }, 1800);
  }

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 16 }}>
            Checkout
          </h1>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 0 }}>
            {STEPS.slice(0, -1).map((s, i) => (
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
                {i < STEPS.length - 2 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? 'var(--accent)' : 'rgba(255,255,255,0.2)', margin: '14px 8px 0', borderRadius: 1 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── Left: Step Content ── */}
          <div className="card" style={{ padding: 24 }}>

            {/* Step 0: Address */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
                  📍 Delivery Address
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Full Name', key: 'name', col: 2 },
                    { label: 'Phone Number', key: 'phone', col: 1 },
                    { label: 'Address Line 1', key: 'line1', col: 2 },
                    { label: 'Address Line 2', key: 'line2', col: 2 },
                    { label: 'City', key: 'city', col: 1 },
                    { label: 'State', key: 'state', col: 1 },
                    { label: 'Pincode', key: 'pincode', col: 1 },
                  ].map(field => (
                    <div key={field.key} style={{ gridColumn: `span ${field.col}` }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
                        {field.label.toUpperCase()}
                      </label>
                      <input value={address[field.key]}
                        onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--border)', outline: 'none',
                          fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                  📱 Pay via UPI
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 22 }}>
                  Please read the payment steps carefully before proceeding.
                </p>

                {/* ── PHASE 1: Steps + Agreement (always visible) ── */}
                <div style={{ background: '#FAFAF5', border: '1.5px solid #E8DCC8', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', marginBottom: 16, letterSpacing: 0.3 }}>
                    📋 How to Complete Your Payment
                  </div>
                  {[
                    { icon: '📱', title: 'Open Your UPI App',      desc: 'Open Google Pay, PhonePe, Paytm, BHIM or any UPI-enabled banking app on your phone.' },
                    { icon: '🔍', title: 'Go to "Send Money"',      desc: 'Tap "Send Money" or "Pay" and enter our UPI ID exactly as shown below.' },
                    { icon: '💰', title: 'Enter the Exact Amount',  desc: `Enter ₹${total.toLocaleString('en-IN')} as the amount. In the note/remark, write your name or phone number.` },
                    { icon: '🔑', title: 'Enter Your UPI PIN',      desc: 'Enter your UPI PIN to confirm. Wait for the "Payment Successful" screen.' },
                    { icon: '📸', title: 'Take a Screenshot',       desc: 'Take a screenshot of the "Payment Successful" screen and share it on WhatsApp using the button below.' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 4 ? 16 : 0, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'var(--primary)', color: 'var(--accent)',
                        fontWeight: 900, fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>
                          {s.icon} {s.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.7 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Agreement Checkbox (BEFORE payment details) ── */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                  background: agreedSteps ? '#E8F5E9' : 'white',
                  border: `2px solid ${agreedSteps ? '#2E7D32' : '#F2C4A0'}`,
                  borderRadius: 12, padding: '16px',
                  marginBottom: 24, transition: 'all 0.25s',
                }}>
                  <input
                    type="checkbox"
                    checked={agreedSteps}
                    onChange={e => setAgreedSteps(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#2E7D32', marginTop: 1, flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: agreedSteps ? '#1B5E20' : 'var(--primary)', marginBottom: 4 }}>
                      {agreedSteps ? '✅ Confirmed! Now complete your payment below.' : 'I have read all the payment steps above and I am ready to pay'}
                    </div>
                    <div style={{ fontSize: 12, color: agreedSteps ? '#388E3C' : 'var(--text-sec)', lineHeight: 1.6 }}>
                      I understand that I need to pay <strong>₹{total.toLocaleString('en-IN')}</strong> via UPI and share the payment screenshot on WhatsApp to confirm my order.
                    </div>
                  </div>
                </label>

                {/* ── PHASE 2: UPI Details (visible only after agreement) ── */}
                {agreedSteps && (
                  <div>
                    {/* Amount + UPI ID box */}
                    <div style={{
                      background: 'linear-gradient(135deg, var(--primary) 0%, #2D3A18 100%)',
                      borderRadius: 14, padding: '20px 22px', marginBottom: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>TOTAL AMOUNT TO PAY</div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
                          ₹{total.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>PAY TO UPI ID</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 8 }}>{STORE_UPI_ID}</div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(STORE_UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                          style={{ padding: '6px 16px', borderRadius: 20, background: copied ? '#2E7D32' : 'var(--accent)', color: '#1E2A10', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, transition: 'background 0.2s' }}>
                          {copied ? '✓ Copied!' : '📋 Copy UPI ID'}
                        </button>
                      </div>
                    </div>

                    {/* QR Code (if uploaded in admin) */}
                    {upiQrCode && (
                      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface-alt)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
                        <img
                          src={upiQrCode}
                          alt="UPI QR Code"
                          style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8, background: 'white', padding: 6, border: '1px solid var(--border)', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>📱 Scan & Pay with Any UPI App</div>
                          <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.7 }}>
                            Open Google Pay, PhonePe or Paytm → tap the scanner icon → scan this QR code → amount will be auto-filled.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI App Quick Buttons */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>OPEN YOUR UPI APP DIRECTLY:</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { name: 'Google Pay',  bg: '#4285F4', emoji: 'G' },
                          { name: 'PhonePe',     bg: '#5F259F', emoji: 'P' },
                          { name: 'Paytm',       bg: '#00BAF2', emoji: 'P' },
                          { name: 'BHIM UPI',    bg: '#FF6B00', emoji: 'B' },
                        ].map(app => (
                          <a key={app.name}
                            href={`upi://pay?pa=${STORE_UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent('Mohanah Order')}`}
                            style={{ padding: '9px 18px', borderRadius: 24, background: app.bg, color: 'white', fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>{app.emoji}</span>
                            {app.name}
                          </a>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                        💡 On mobile — tap any button above to open the app with amount pre-filled.
                      </div>
                    </div>

                    {/* WhatsApp Screenshot Share */}
                    <div style={{
                      background: 'linear-gradient(135deg, #E8F5E9, #F1F8F1)',
                      border: '2px solid #A5D6A7',
                      borderRadius: 14, padding: '18px 20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 28 }}>💬</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#1B5E20' }}>Share Payment Screenshot on WhatsApp</div>
                          <div style={{ fontSize: 12, color: '#388E3C' }}>After paying, take a screenshot and tap the button below to send it to us.</div>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Mohanah! 🙏\n\nI have placed an order and completed the UPI payment.\n\n📦 Order Amount: ₹${total.toLocaleString('en-IN')}\n💳 Paid to UPI: ${STORE_UPI_ID}\n📍 Delivery: ${address.name}, ${address.city}\n\nPlease find my payment screenshot attached. Kindly confirm my order. 🥻\n\nThank you!`)}`}
                        target="_blank" rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          padding: '13px 20px', borderRadius: 12,
                          background: '#25D366', color: 'white',
                          fontWeight: 800, fontSize: 14, textDecoration: 'none',
                          boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
                          transition: 'transform 0.15s',
                        }}>
                        <span style={{ fontSize: 20 }}>📲</span>
                        Send Screenshot on WhatsApp to Confirm Order
                      </a>
                      <div style={{ fontSize: 11, color: '#66BB6A', textAlign: 'center', marginTop: 8 }}>
                        Your order details are pre-filled — just attach your screenshot and hit Send ✅
                      </div>
                    </div>
                  </div>
                )}

                {/* Hint before agreement */}
                {!agreedSteps && (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-alt)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                    ☝️ Please tick the checkbox above to reveal the UPI payment details.
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
                  📋 Review Order
                </h2>
                {/* Address review */}
                <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>DELIVERING TO</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{address.name} · {address.phone}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{address.line1}, {address.line2}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{address.city}, {address.state} — {address.pincode}</div>
                </div>
                {/* Payment review */}
                <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>PAYMENT</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2E7D32' }}>✅ UPI Payment — {STORE_UPI_ID}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Amount: ₹{total.toLocaleString('en-IN')} · Screenshot shared on WhatsApp</div>
                </div>
                {/* Items */}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>ITEMS</div>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: `${item.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥻</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-outline">
                  ← Back
                </button>
              )}
              {/* Payment step — only enabled after agreement checkbox */}
              {step === 1 ? (
                <button
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ flex: 1, opacity: agreedSteps ? 1 : 0.4, cursor: agreedSteps ? 'pointer' : 'not-allowed' }}
                  disabled={!agreedSteps}
                >
                  {agreedSteps ? 'I Have Paid — Continue →' : 'Please agree to the steps first'}
                </button>
              ) : (
                <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }} disabled={placing}>
                  {placing ? '⏳ Placing Order...' : step === 2 ? '🎉 Place Order' : 'Continue →'}
                </button>
              )}
            </div>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Bill Summary</h3>
            {[
              ['Subtotal', `₹${subtotal.toLocaleString('en-IN')}`],
              couponDiscount > 0 ? ['Coupon Savings', `-₹${couponDiscount.toLocaleString('en-IN')}`] : null,
              ['Delivery', delivery === 0 ? 'FREE' : `₹${delivery}`],
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
                <div style={{ width: 28, height: 28, borderRadius: 4, background: `${item.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🥻</div>
                <div style={{ flex: 1, fontSize: 11, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>×{item.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
