import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { reviewsDB, productsDB } from '../services/db';
import { productsAPI } from '../services/supabase';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch, wishlist, items } = useCart();
  const { user, isLoggedIn } = useAuth();
  const [product, setProduct] = useState(() => productsDB.getAll().find(p => p.id === id) || null);
  const [loadingProduct, setLoadingProduct] = useState(!product);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [added, setAdded] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewHovered, setReviewHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewImages, setReviewImages] = useState([]); // [{id, src, file}]
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  // -1 = main product, 0..n = colorVariants index
  const [activeVariantIdx, setActiveVariantIdx] = useState(-1);
  const [deliveryInfo, setDeliveryInfo] = useState({
    line1: 'Free delivery on orders above ₹2,000',
    line2: '7-day easy returns & exchange',
    line3: '100% authentic, quality guaranteed',
  });

  useEffect(() => {
    if (id) setProductReviews(reviewsDB.getByProduct(id));
  }, [id]);

  // Load delivery info from Supabase settings
  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      Promise.all([
        settingsAPI.get('deliveryLine1').catch(() => null),
        settingsAPI.get('deliveryLine2').catch(() => null),
        settingsAPI.get('deliveryLine3').catch(() => null),
      ]).then(([l1, l2, l3]) => {
        setDeliveryInfo({
          line1: l1 || 'Free delivery on orders above ₹2,000',
          line2: l2 || '7-day easy returns & exchange',
          line3: l3 || '100% authentic, quality guaranteed',
        });
      });
    });
  }, []);

  function normalizeProduct(p) {
    if (!p) return null;
    return {
      ...p,
      imageUrl:      p.imageUrl      || p.image_url      || '',
      originalPrice: p.originalPrice ?? p.original_price ?? null,
      inStock:       p.inStock       ?? p.in_stock       ?? p.stock ?? true,
      isNew:         p.isNew         ?? p.is_new         ?? false,
      isTrending:    p.isTrending    ?? p.is_trending    ?? false,
      occasions:     Array.isArray(p.occasions) && p.occasions.length ? p.occasions : (p.occasion ? [p.occasion] : []),
      images:        Array.isArray(p.images) ? p.images : (p.imageUrl || p.image_url ? [{ src: p.imageUrl || p.image_url }] : []),
      color:             p.color             || '#8B1A1A',
      rating:            p.rating            || 4.5,
      reviews:           p.reviews           || 0,
      length:            p.length            || '',
      blousePiece:       p.blousePiece       || p.blouse_piece       || '',
      careInstructions:  p.careInstructions  || p.care_instructions  || '',
      colorVariants:     Array.isArray(p.colorVariants) ? p.colorVariants : (Array.isArray(p.color_variants) ? p.color_variants : []),
    };
  }

  useEffect(() => {
    if (!product) setLoadingProduct(true);
    productsAPI.getById(id)
      .then(data => {
        if (data) {
          const norm = normalizeProduct(data);
          setProduct(norm);
          // Load related products from Supabase
          productsAPI.getAll()
            .then(all => {
              const rel = all
                .filter(p => p.fabric === data.fabric && p.id !== data.id)
                .slice(0, 4)
                .map(normalizeProduct);
              setRelatedProducts(rel);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        const local = productsDB.getAll().find(p => p.id === id);
        if (local) setProduct(normalizeProduct(local));
      })
      .finally(() => setLoadingProduct(false));
  }, [id]);

  if (loadingProduct) {
    return (
      <div className="page" style={{ paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥻</div>
          <p style={{ color: 'var(--text-sec)' }}>Loading...</p>
        </div>
      </div>
    );
  }

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
  const related = relatedProducts;

  // Build product with selected color variant info for cart/orders
  // If no color selected → auto-use main product (first/default)
  function getProductForCart() {
    const activeVariant = activeVariantIdx >= 0 ? product.colorVariants?.[activeVariantIdx] : null;
    const hasVariants = product.colorVariants?.length > 0;

    // Get the color name — if main product selected, use first variant label or product name
    const defaultColorName = hasVariants
      ? `${product.name} (Main Color)`
      : null; // no variants → don't show color info at all

    return {
      ...product,
      selectedColorName:  activeVariant ? activeVariant.colorName : defaultColorName,
      selectedColorHex:   activeVariant ? activeVariant.colorHex  : product.color,
      selectedColorImage: activeVariant?.images?.[0]?.src || product.images?.[0]?.src || product.imageUrl || '',
      imageUrl:           activeVariant?.images?.[0]?.src || product.images?.[0]?.src || product.imageUrl || '',
    };
  }

  function handleAddToCart() {
    const p = getProductForCart();
    for (let i = 0; i < qty; i++) {
      dispatch({ type: 'ADD_TO_CART', product: p });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    dispatch({ type: 'ADD_TO_CART', product: getProductForCart() });
    navigate('/cart');
  }

  return (
    <div className="page" style={{ paddingTop: 68, background: 'var(--bg)' }}>
      <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: 11, color: 'var(--text-muted)', letterSpacing: 0.3 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <Link to="/catalog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Catalog</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div className="product-detail-grid">

          {/* ── Left: Image Gallery ── */}
          {(() => {
            const activeVariant = activeVariantIdx >= 0 ? product.colorVariants?.[activeVariantIdx] : null;
            const allImages = activeVariant?.images?.length
              ? activeVariant.images
              : (product.images?.length ? product.images : (product.imageUrl ? [{ src: product.imageUrl }] : []));
            const mainImg = allImages[activeImageIdx]?.src || null;

            let touchStartX = null;
            function handleTouchStart(e) { touchStartX = e.touches[0].clientX; }
            function handleTouchEnd(e) {
              if (touchStartX === null) return;
              const diff = touchStartX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) setActiveImageIdx(i => Math.min(i + 1, allImages.length - 1));
                else setActiveImageIdx(i => Math.max(i - 1, 0));
              }
              touchStartX = null;
            }

            return (
          <div className="pd-image-col">
            {/* Vertical thumbnails (desktop) + Main image */}
            <div style={{ display: 'flex', gap: 10 }}>

              {/* Vertical thumbnail strip — desktop only */}
              {allImages.length > 1 && (
                <div className="pd-thumbs-vertical" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {allImages.map((img, idx) => (
                    <div key={idx} onClick={() => setActiveImageIdx(idx)}
                      style={{
                        width: 60, height: 68, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                        border: idx === activeImageIdx ? '2px solid var(--accent)' : '2px solid transparent',
                        background: '#f5f0eb', flexShrink: 0,
                        opacity: idx === activeImageIdx ? 1 : 0.65,
                        transition: 'all 0.15s',
                        boxShadow: idx === activeImageIdx ? '0 2px 10px rgba(0,0,0,0.12)' : 'none',
                      }}>
                      <img src={img.src} alt={`view ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="product-image-container"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (allImages.length > 1) {
                      setActiveImageIdx(prev => (prev + 1) % allImages.length);
                    }
                  }}
                  style={{
                    borderRadius: 16,
                    background: '#FAFAF8',
                    border: '1px solid #EDE8E1',
                    position: 'relative', overflow: 'hidden',
                    cursor: allImages.length > 1 ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}>
                  {mainImg ? (
                    <img src={mainImg} alt={product.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${product.color}22, ${product.color}08)` }}>
                      <span style={{ fontSize: 100, opacity: 0.2 }}>🥻</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10 }}>
                    {product.isNew && <span style={{ background: 'var(--primary)', color: 'var(--accent-light)', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: 0.8 }}>NEW ARRIVAL</span>}
                    {product.discount > 0 && <span style={{ background: '#2E7D32', color: 'white', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>{product.discount}% OFF</span>}
                  </div>

                  {/* Wishlist */}
                  <button onClick={() => dispatch({ type: 'TOGGLE_WISHLIST', product })}
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: '1px solid #EDE8E1', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isWishlisted ? '❤️' : '🤍'}
                  </button>

                  {/* Dots — mobile */}
                  {allImages.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 10 }}>
                      {allImages.map((_, i) => (
                        <div key={i} onClick={() => setActiveImageIdx(i)} style={{ width: i === activeImageIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeImageIdx ? 'var(--primary)' : 'rgba(0,0,0,0.2)', transition: 'all 0.2s', cursor: 'pointer' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Horizontal thumbnails — mobile only */}
                {allImages.length > 1 && (
                  <div className="pd-thumbs-horizontal" style={{ display: 'none', gap: 6, marginTop: 8, overflowX: 'auto' }}>
                    {allImages.map((img, idx) => (
                      <div key={idx} onClick={() => setActiveImageIdx(idx)}
                        style={{ width: 56, height: 64, borderRadius: 7, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: idx === activeImageIdx ? '2px solid var(--accent)' : '2px solid transparent', opacity: idx === activeImageIdx ? 1 : 0.6, background: '#f5f0eb' }}>
                        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
            );
          })()}

          {/* ── Right: Details ── */}
          <div className="pd-details-col">

            {/* Brand / Fabric label */}
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {product.fabric}{product.region ? ` · ${product.region}` : ''}
            </div>

            {/* Product name */}
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 900, color: 'var(--text)', lineHeight: 1.15, marginBottom: 14 }}>
              {product.name}
            </h1>

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= product.rating ? '#F59E0B' : '#E5E7EB', fontSize: 15 }}>★</span>)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{product.rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({product.reviews} reviews)</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: product.inStock ? '#15803D' : '#DC2626', background: product.inStock ? '#DCFCE7' : '#FEE2E2', padding: '3px 10px', borderRadius: 20 }}>
                {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, color: 'var(--primary)', letterSpacing: -0.5 }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 400 }}>
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {product.discount > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{product.discount}% off</span>
                )}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: 12, color: '#15803D', marginTop: 3 }}>
                  You save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Variant thumbnails — small circles, click to switch variant */}
            {product.colorVariants?.some(v => v.images?.length > 0) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {/* Main product */}
                {(product.images?.[0]?.src || product.imageUrl) && (
                  <button onClick={() => { setActiveVariantIdx(-1); setActiveImageIdx(0); }}
                    title="Main"
                    style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', padding: 0, border: 'none', background: '#f0ebe4', outline: activeVariantIdx === -1 ? '3px solid var(--accent)' : '2px solid #E0D9D0', outlineOffset: 2, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', transform: activeVariantIdx === -1 ? 'scale(1.12)' : 'scale(1)' }}>
                    <img src={product.images?.[0]?.src || product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                )}
                {/* Each variant */}
                {product.colorVariants.filter(v => v.images?.length > 0).map((v, i) => {
                  const realIdx = product.colorVariants.indexOf(v);
                  const isActive = activeVariantIdx === realIdx;
                  return (
                    <button key={v.id || i} onClick={() => { setActiveVariantIdx(realIdx); setActiveImageIdx(0); }}
                      title={v.colorName}
                      style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', padding: 0, border: 'none', background: '#f0ebe4', outline: isActive ? '3px solid var(--accent)' : '2px solid #E0D9D0', outlineOffset: 2, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', transform: isActive ? 'scale(1.12)' : 'scale(1)' }}>
                      <img src={v.images[0].src} alt={v.colorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product details pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 18, paddingTop: 18, borderTop: product.colorVariants?.length > 0 ? '1px solid var(--border)' : 'none' }}>
              {[
                product.fabric && { label: product.fabric, icon: '🧵' },
                product.region && { label: product.region, icon: '📍' },
                product.occasions?.length && { label: product.occasions.join(', '), icon: '🎭' },
                product.length && { label: product.length, icon: '📏' },
                product.blousePiece && { label: product.blousePiece, icon: '👘' },
              ].filter(Boolean).map(c => (
                <span key={c.label} style={{ padding: '5px 11px', borderRadius: 20, background: '#F5F0EB', border: '1px solid #EDE8E1', fontSize: 11, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.icon} {c.label}
                </span>
              ))}
            </div>

            {/* Qty + CTA */}
            <div style={{ marginTop: 24 }}>
              {product.inStock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Qty</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text)', fontWeight: 300 }}>−</button>
                    <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: 14, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', height: 38, lineHeight: '38px' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(5, q + 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text)', fontWeight: 300 }}>+</button>
                  </div>
                </div>
              )}

              {product.inStock ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleAddToCart} style={{ flex: 1, height: 48, borderRadius: 12, border: '2px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.3, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'var(--accent-light)'; }}
                    onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary)'; }}>
                    {added ? '✓ Added' : 'Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--accent-light)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.3 }}>
                    Buy Now
                  </button>
                </div>
              ) : (
                <button style={{ width: '100%', height: 48, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  🔔 Notify When Available
                </button>
              )}
            </div>

            {/* Delivery info — minimal */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: '🚚', text: deliveryInfo.line1 },
                { icon: '↩️', text: deliveryInfo.line2 },
                { icon: '✅', text: deliveryInfo.line3 },
              ].filter(i => i.text).map(item => (
                <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.text}</span>
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
                product.region ? ['Origin', product.region] : null,
                ['Occasion', (Array.isArray(product.occasions) && product.occasions.length ? product.occasions : [product.occasion]).join(', ')],
                product.length ? ['Length', product.length] : null,
                product.blousePiece ? ['Blouse Piece', product.blousePiece] : null,
                product.careInstructions ? ['Care', product.careInstructions] : null,
              ].filter(Boolean).map(([key, val]) => (
                <div key={key} style={{ background: 'var(--surface-alt)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{key.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'care' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 500 }}>
              {product.careInstructions ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--surface-alt)', borderRadius: 10 }}>
                  <span style={{ fontSize: 20 }}>🧺</span>
                  <span style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7 }}>{product.careInstructions}</span>
                </div>
              ) : (
                [
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
                ))
              )}
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

              {/* Photo upload */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  📷 Add Photos <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — max 3)</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {reviewImages.map((img, i) => (
                    <div key={img.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                      <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setReviewImages(prev => prev.filter(x => x.id !== img.id))}
                        style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(198,40,40,0.9)', border: 'none', color: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        ×
                      </button>
                    </div>
                  ))}
                  {reviewImages.length < 3 && (
                    <label style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-alt)', gap: 3 }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>ADD PHOTO</span>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => {
                          const files = Array.from(e.target.files).slice(0, 3 - reviewImages.length);
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = ev => setReviewImages(prev => [...prev, { id: Date.now() + Math.random(), src: ev.target.result, file }]);
                            reader.readAsDataURL(file);
                          });
                          e.target.value = '';
                        }} />
                    </label>
                  )}
                </div>
              </div>

              <button
                disabled={reviewStars === 0 || !reviewText.trim() || reviewSubmitting}
                onClick={async () => {
                  if (reviewStars > 0 && reviewText.trim()) {
                    setReviewSubmitting(true);
                    try {
                      // Upload images to Supabase storage
                      let uploadedImgs = [];
                      if (reviewImages.length > 0) {
                        const { storageAPI } = await import('../services/supabase');
                        uploadedImgs = await Promise.all(
                          reviewImages.map(async img => {
                            if (img.file) {
                              const url = await storageAPI.uploadImage(img.file, 'reviews');
                              return { src: url };
                            }
                            return { src: img.src };
                          })
                        );
                      }
                      const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer';
                      reviewsDB.add({
                        productId: id,
                        productName: product.name,
                        name: displayName,
                        city: user?.user_metadata?.city || '',
                        rating: reviewStars,
                        text: reviewText.trim(),
                        images: uploadedImgs,
                      });
                      setProductReviews(reviewsDB.getByProduct(id));
                      setReviewSubmitted(true);
                      setShowReviewForm(false);
                      setReviewImages([]);
                    } catch (err) {
                      console.warn('Review submit error:', err.message);
                    }
                    setReviewSubmitting(false);
                  }
                }}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none',
                  cursor: reviewStars && reviewText.trim() && !reviewSubmitting ? 'pointer' : 'not-allowed',
                  background: reviewStars && reviewText.trim() ? 'var(--primary)' : 'var(--border)',
                  color: reviewStars && reviewText.trim() ? 'var(--accent-light)' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                }}>
                {reviewSubmitting ? '⏳ Uploading...' : '⭐ Submit Review'}
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
                  {/* Review photos */}
                  {r.images?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {r.images.map((img, i) => (
                        <img key={i} src={img.src} alt={`review photo ${i+1}`}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => window.open(img.src, '_blank')}
                        />
                      ))}
                    </div>
                  )}
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
        .product-detail-grid {
          display: grid;
          grid-template-columns: 52% 1fr;
          gap: 48px;
          align-items: start;
        }
        .product-image-container {
          width: 100%;
          aspect-ratio: 4/5;
          max-height: 500px;
          touch-action: pan-y;
        }
        .pd-thumbs-vertical { display: flex; }
        .pd-thumbs-horizontal { display: none; }

        @media (max-width: 900px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .product-image-container {
            max-height: none;
            aspect-ratio: 4/5;
          }
          .pd-thumbs-vertical { display: none !important; }
          .pd-thumbs-horizontal { display: flex !important; }
          .pd-image-col, .pd-details-col { width: 100%; }
        }
      `}</style>
    </div>
  );
}
