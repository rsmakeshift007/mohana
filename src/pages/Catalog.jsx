import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { priceRanges } from '../data/products';
import { productsDB, categoriesDB } from '../services/db';
import { productsAPI, categoriesAPI } from '../services/supabase';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { dispatch, wishlist } = useCart();
  const [added, setAdded] = useState(false);
  const isWishlisted = wishlist.find(i => i.id === product.id);

  function handleAddToCart(e) {
    e.stopPropagation(); e.preventDefault();
    dispatch({ type: 'ADD_TO_CART', product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div className="card fade-in" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      >
        {/* Product image */}
        {(() => {
          const imgSrc = product.images?.[0]?.src || product.imageUrl || null;
          return (
            <div style={{
              height: 180,
              background: imgSrc ? '#f5f0eb' : `linear-gradient(135deg, ${product.color}CC, ${product.color}44)`,
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden',
            }}>
              {imgSrc ? (
                <>
                  {/* Blur backdrop */}
                  <div style={{ position: 'absolute', inset: -10, backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px) brightness(0.45)', transform: 'scale(1.08)' }} />
                  {/* Full image */}
                  <img src={imgSrc} alt={product.name} loading="lazy"
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block', zIndex: 1 }} />
                </>
              ) : (
                <>
                  <div style={{ fontSize: 56, opacity: 0.3 }}>🥻</div>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent)' }} />
                </>
              )}
              <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {product.isNew && <span className="badge badge-accent" style={{ fontSize: 9 }}>NEW</span>}
                {product.discount > 0 && <span className="badge badge-green" style={{ fontSize: 9 }}>{product.discount}% OFF</span>}
              </div>
              <button onClick={e => { e.stopPropagation(); e.preventDefault(); dispatch({ type: 'TOGGLE_WISHLIST', product }); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isWishlisted ? '❤️' : '🤍'}
              </button>
              {!product.inStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                  OUT OF STOCK
                </div>
              )}
            </div>
          );
        })()}
        <div style={{ padding: '12px 12px 14px' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>
            {product.fabric} · {product.region}
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
            {product.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
            <span style={{ color: '#F57F17', fontSize: 11 }}>{'★'.repeat(Math.floor(product.rating))}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({product.reviews})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.inStock ? (
            <button onClick={handleAddToCart} className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: 11 }}>
              {added ? '✓ Added' : '+ Cart'}
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" style={{ width: '100%', fontSize: 11 }} disabled>
              Notify Me
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState(searchParams.get('occasion') || 'All');
  const [selectedFabric, setSelectedFabric] = useState(searchParams.get('fabric') || 'All');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [showInStock, setShowInStock] = useState(false);
  const searchQuery = searchParams.get('search') || '';
  const filterType = searchParams.get('filter') || '';

  // ── Products: load from Supabase, fallback to localStorage ──
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occasions, setOccasions] = useState(() => ['All', ...categoriesDB.getOccasions()]);
  const [fabrics,   setFabrics]   = useState(() => ['All', ...categoriesDB.getFabrics()]);

  // Load categories from Supabase
  useEffect(() => {
    categoriesAPI.getOccasions()
      .then(data => { if (data && data.length) setOccasions(['All', ...data]); })
      .catch(() => {});
    categoriesAPI.getFabrics()
      .then(data => { if (data && data.length) setFabrics(['All', ...data]); })
      .catch(() => {});
  }, []);

  // Normalize Supabase snake_case → camelCase
  function normalizeProduct(p) {
    return {
      ...p,
      imageUrl:      p.imageUrl      || p.image_url      || '',
      originalPrice: p.originalPrice ?? p.original_price ?? null,
      inStock:       p.inStock       ?? p.in_stock       ?? p.stock ?? true,
      isNew:         p.isNew         ?? p.is_new         ?? false,
      isTrending:    p.isTrending    ?? p.is_trending    ?? false,
      occasions:     Array.isArray(p.occasions) && p.occasions.length ? p.occasions : (p.occasion ? [p.occasion] : []),
      images:        Array.isArray(p.images) ? p.images : [],
      color:         p.color || '#8B1A1A',
    };
  }

  useEffect(() => {
    setLoading(true);
    productsAPI.getAll()
      .then(data => {
        setProducts((data || []).map(normalizeProduct));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('occasion')) setSelectedOccasion(searchParams.get('occasion'));
    if (searchParams.get('fabric')) setSelectedFabric(searchParams.get('fabric'));
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...products];

    // Helper: get all occasions for a product (supports both array and string)
    const getOccasions = (p) => {
      if (Array.isArray(p.occasions) && p.occasions.length) return p.occasions;
      if (p.occasion) return [p.occasion];
      return [];
    };

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        getOccasions(p).some(o => o.toLowerCase().includes(q)) ||
        (p.region || '').toLowerCase().includes(q)
      );
    }
    if (filterType === 'new') list = list.filter(p => p.isNew);
    if (filterType === 'trending') list = list.filter(p => p.isTrending);
    if (selectedOccasion !== 'All') list = list.filter(p => getOccasions(p).includes(selectedOccasion));
    if (selectedFabric !== 'All') list = list.filter(p => p.fabric === selectedFabric);
    if (showInStock) list = list.filter(p => p.inStock);

    const range = priceRanges[selectedPrice];
    if (range.max !== Infinity || range.min > 0) {
      list = list.filter(p => p.price >= range.min && p.price <= range.max);
    }

    switch (sortBy) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'discount': list.sort((a, b) => b.discount - a.discount); break;
      default: break;
    }

    return list;
  }, [searchQuery, filterType, selectedOccasion, selectedFabric, selectedPrice, showInStock, sortBy]);

  function clearFilters() {
    setSelectedOccasion('All');
    setSelectedFabric('All');
    setSelectedPrice(0);
    setShowInStock(false);
    setSortBy('default');
    setSearchParams({});
  }

  return (
    <div className="page" style={{ paddingTop: 68, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        padding: '32px 0 28px',
      }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            {searchQuery ? `Results for "${searchQuery}"` : filterType === 'new' ? '✨ New Arrivals' : filterType === 'trending' ? '🔥 Trending' : 'Our Collection'}
          </h1>
          <p style={{ color: '#A0B080', fontSize: 13 }}>{filtered.length} sarees found</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Sidebar Filters ── */}
          <aside style={{
            width: 220, flexShrink: 0,
            display: showFilters ? 'block' : 'none',
          }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700 }}>Filters</h3>
                <button onClick={clearFilters} style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                  Clear all
                </button>
              </div>

              {/* Occasion */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>OCCASION</div>
                {occasions.map(occ => (
                  <label key={occ} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="radio" name="occasion" checked={selectedOccasion === occ}
                      onChange={() => setSelectedOccasion(occ)}
                      style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, color: selectedOccasion === occ ? 'var(--accent)' : 'var(--text)', fontWeight: selectedOccasion === occ ? 700 : 400 }}>
                      {occ}
                    </span>
                  </label>
                ))}
              </div>

              {/* Fabric */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>FABRIC</div>
                {fabrics.map(fab => (
                  <label key={fab} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="radio" name="fabric" checked={selectedFabric === fab}
                      onChange={() => setSelectedFabric(fab)}
                      style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, color: selectedFabric === fab ? 'var(--accent)' : 'var(--text)', fontWeight: selectedFabric === fab ? 700 : 400 }}>
                      {fab}
                    </span>
                  </label>
                ))}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>PRICE RANGE</div>
                {priceRanges.map((range, i) => (
                  <label key={range.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="radio" name="price" checked={selectedPrice === i}
                      onChange={() => setSelectedPrice(i)}
                      style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, color: selectedPrice === i ? 'var(--accent)' : 'var(--text)', fontWeight: selectedPrice === i ? 700 : 400 }}>
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* In Stock */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={showInStock}
                  onChange={e => setShowInStock(e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* ── Main Grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Sort Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 10,
            }}>
              <button onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: showFilters ? 'var(--primary)' : 'var(--surface)',
                  color: showFilters ? 'var(--accent-light)' : 'var(--text)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}>
                {showFilters ? '◀ Hide Filters' : '▶ Show Filters'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sort by:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  <option value="default">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Best Discount</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>🥻</div>
                <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Sarees load ho rahi hain...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>No sarees found</h3>
                <p style={{ color: 'var(--text-sec)', marginBottom: 20 }}>Try adjusting your filters or search terms.</p>
                <button onClick={clearFilters} className="btn btn-accent">Clear Filters</button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}>
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
