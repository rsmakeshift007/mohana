import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { reviewsDB } from '../services/db';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch, wishlist, items } = useCart();
  const { user, isLoggedIn } = useAuth();
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [added, setAdded] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewHovered, setReviewHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) setProductReviews(reviewsDB.getByProduct(id));
  }, [id]);

  if (!product) {
    return (
      <div className="page" style={{ paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🥻</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Saree Not Found</h2>
          <p style={{ color: 'var(--text-sec)', marginBottom: 20 }}>This product doesn't exist.</p>
          <button onClick={() => navigate('/catalog')} className="btn btn-primary">Back to Catalog</button>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.find(i => i.id === product.id);
  const inCart = items.find(i => i.id === product.id);
  const related = products.filter(p => p.fabric === product.fabric && p.id !== product.id).slice(0, 4);

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      dispatch({ type: 'ADD_TO_CART', product });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    dispatch({ type: 'ADD_TO_CART', product });
    navigate('/cart');
  }

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/catalog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Catalog</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* ── Left: Image ── */}
          {(() => {
            const allImages = product.images?.length ? product.images : (product.imageUrl ? [{ src: product.imageUrl }] : []);
            const [activeIdx, setActiveIdx] = React.useState(0);
            const mainImg = allImages[activeIdx]?.src || null;
            return (
          <div>
            <div style={{
              borderRadius: 'var(--radius-xl)',
              background: mainImg ? '#f5f0eb' : `linear-gradient(135deg, ${product.color}DD, ${product.color}55)`,
              height: 420,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {mainImg ? (
                <>
                  {/* Blur backdrop — fills empty space */}
                  <div style={{ position: 'absolute', inset: -20, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(0.4)', transform: 'scale(1.08)' }} />
                  {/* Full image — no crop */}
                  <img src={mainImg} alt={product.name}
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block', zIndex: 1 }} />
                </>
              ) : (
                <>
                  <div style={{ fontSize: 120, opacity: 0.25 }}>🥻</div>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2), transparent 60%)' }} />
                </>
              )}

              {/* Badges */}
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {product.isNew && <span className="badge badge-accent">NEW ARRIVAL</span>}
                {product.isTrending && <span className="badge" style={{ background: '#FFF8E1', color: 'var(--warning)' }}>🔥 TRENDING</span>}
                {product.discount > 0 && <span className="badge badge-green">{product.discount}% OFF</span>}
              </div>

              {/* Wishlist */}
              <button onClick={() => dispatch({ type: 'TOGGLE_WISHLIST', product })}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)', border: 'none',
                  cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                {isWishlisted ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Thumbnail row — show uploaded images or fallback color swatches */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              {allImages.length > 0 ? allImages.map((img, i) => (
                <div key={i} onClick={() => setActiveIdx(i)} style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-sm)',
                  border: i === activeIdx ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                  position: 'relative', background: '#f5f0eb',
                }}>
                  <div style={{ position: 'absolute', inset: -4, backgroundImage: `url(${img.src})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px) brightness(0.5)' }} />
                  <img src={img.src} alt={`view ${i + 1}`}
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                </div>
              )) : [product.color, `${product.color}88`, `${product.color}55`].map((c, i) => (
                <div key={i} style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-sm)',
                  background: `linear-gradient(135deg, ${c}, ${c}88)`,
                  border: i === 0 ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, opacity: 0.7 + i * 0.1,
                }}>🥻</div>
              ))}
            </div>
          </div>
            );
          })()}

          {/* ── Right: Details ── */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>
              {product.fabric} · {product.region}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900,
              color: 'var(--text)', lineHeight: 1.2, marginBottom: 12,
            }}>{product.name}</h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ color: s <= product.rating ? '#F57F17' : '#DDD', fontSize: 16 }}>★</span>
                ))}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{product.rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({product.reviews} reviews)</span>
              <span style={{ fontSize: 11, color: product.inStock ? 'var(--success)' : 'var(--error)', fontWeight: 700, padding: '2px 8px', background: product.inStock ? '#E8F5E9' : '#FFEBEE', borderRadius: 10 }}>
                {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div style={{
              background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)',
              padding: '14px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="badge badge-green">{product.discount}% OFF</span>
                </>
              )}
            </div>

            {product.originalPrice && (
              <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 16 }}>
                💰 You save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
              </div>
            )}

            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { icon: '🧵', label: product.fabric },
                { icon: '📍', label: product.region },
                { icon: '🎭', label: (Array.isArray(product.occasions) && product.occasions.length ? product.occasions : [product.occasion]).join(', ') },
                { icon: '📏', label: '5.5 Metres' },
              ].map(chip => (
                <span key={chip.label} style={{
                  padding: '5px 12px', borderRadius: 20,
                  background: 'var(--surface-alt)', border: '1px solid var(--border)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>

            {/* Qty selector */}
            {product.inStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Quantity:</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, background: 'var(--surface-alt)', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
                    −
                  </button>
                  <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(5, q + 1))}
                    style={{ width: 36, height: 36, background: 'var(--surface-alt)', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
                    +
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {product.inStock ? (
                <>
                  <button onClick={handleAddToCart} className="btn btn-outline" style={{ flex: 1 }}>
                    {added ? '✓ Added to Cart' : '🛍️ Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} className="btn btn-primary" style={{ flex: 1 }}>
                    ⚡ Buy Now
                  </button>
                </>
              ) : (
                <button className="btn btn-outline" style={{ flex: 1 }}>
                  🔔 Notify When Available
                </button>
              )}
            </div>

            {/* Delivery info */}
            <div style={{
              background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)',
              padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {[
                { icon: '🚚', text: 'Free delivery on orders above ₹2,000' },
                { icon: '🔄', text: '7-day easy returns & exchange' },
                { icon: '🔒', text: '100% authentic, quality guaranteed' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-sec)' }}>
                  <span>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
            {['desc', 'details', 'care'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px', fontSize: 13, fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -2,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}>
                {tab === 'desc' ? 'Description' : tab === 'details' ? 'Product Details' : 'Care Instructions'}
              </button>
            ))}
          </div>

          {activeTab === 'desc' && (
            <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.8, maxWidth: 600 }}>
              {product.description}
            </p>
          )}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, maxWidth: 600 }}>
              {[
                ['Fabric', product.fabric],
                ['Origin', product.region],
                ['Occasion', (Array.isArray(product.occasions) && product.occasions.length ? product.occasions : [product.occasion]).join(', ')],
                ['Length', '5.5 Metres'],
                ['Blouse Piece', 'Included (0.8m)'],
                ['Care', 'Dry Clean Only'],
              ].map(([key, val]) => (
                <div key={key} style={{ background: 'var(--surface-alt)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{key.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'care' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 500 }}>
              {[
                ['🧼', 'Dry clean recommended for silk sarees'],
                ['💧', 'If hand washing, use cold water with mild detergent'],
                ['☀️', 'Dry in shade, avoid direct sunlight'],
                ['🔥', 'Iron on low heat with a cloth between iron and saree'],
                ['📦', 'Store in muslin cloth, avoid plastic bags'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Customer Reviews ── */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="section-title serif">⭐ Customer Reviews ({productReviews.length})</h2>
            {isLoggedIn && !reviewSubmitted && (
              <button onClick={() => setShowReviewForm(v => !v)} className="btn btn-outline btn-sm">
                {showReviewForm ? '✕ Cancel' : '✏️ Write a Review'}
              </button>
            )}
            {!isLoggedIn && (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn btn-outline btn-sm">🔑 Login to Review</button>
              </Link>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && isLoggedIn && !reviewSubmitted && (
            <div style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Your Review</div>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onMouseEnter={() => setReviewHovered(s)}
                    onMouseLeave={() => setReviewHovered(0)}
                    onClick={() => setReviewStars(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 30, padding: '0 2px',
                      color: s <= (reviewHovered || reviewStars) ? '#F57F17' : '#DDD', transition: 'color 0.1s' }}>
                    ★
                  </button>
                ))}
                {reviewStars > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: 'var(--accent)', alignSelf: 'center' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][reviewStars]}
                  </span>
                )}
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience with this saree..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', marginBottom: 14 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                disabled={reviewStars === 0 || !reviewText.trim()}
                onClick={() => {
                  if (reviewStars > 0 && reviewText.trim()) {
                    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer';
                    const newReview = reviewsDB.add({
                      productId: id,
                      productName: product.name,
                      name: displayName,
                      city: user?.user_metadata?.city || '',
                      rating: reviewStars,
                      text: reviewText.trim(),
                    });
                    setProductReviews(reviewsDB.getByProduct(id));
                    setReviewSubmitted(true);
                    setShowReviewForm(false);
                  }
                }}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none', cursor: reviewStars && reviewText.trim() ? 'pointer' : 'not-allowed',
                  background: reviewStars && reviewText.trim() ? 'var(--primary)' : 'var(--border)',
                  color: reviewStars && reviewText.trim() ? 'var(--accent-light)' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                }}>
                ⭐ Submit Review
              </button>
            </div>
          )}

          {reviewSubmitted && (
            <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2E7D32', fontSize: 14 }}>Thank you for your review!</div>
                <div style={{ fontSize: 12, color: '#388E3C' }}>Your feedback helps other shoppers.</div>
              </div>
            </div>
          )}

          {/* Review cards */}
          {productReviews.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {productReviews.map(r => (
                <div key={r.id} className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ color: '#F57F17', fontSize: 15, marginBottom: 8 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 12, fontStyle: 'italic' }}>
                    "{r.text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-light)', fontWeight: 700, fontSize: 13,
                    }}>{r.name?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.city && `${r.city} · `}{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-alt)', borderRadius: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No reviews yet</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {isLoggedIn ? 'Be the first to review this saree!' : 'Login to write the first review.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div className="section-header">
              <h2 className="section-title serif">Similar Sarees</h2>
              <Link to="/catalog" className="section-link">View all →</Link>
            </div>
            <div className="grid-4">
              {related.map(p => (
                <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{
                      height: 140, background: `linear-gradient(135deg, ${p.color}CC, ${p.color}44)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.6,
                    }}>🥻</div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
