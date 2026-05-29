import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { wishlist, dispatch } = useCart();
  const navigate = useNavigate();

  return (
    <div className="page" style={{ paddingTop: 68 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: 'white' }}>
            💖 My Wishlist
          </h1>
          <p style={{ color: '#A0B080', fontSize: 13 }}>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>🤍</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-sec)', marginBottom: 24 }}>Save your favourite sarees here!</p>
            <button onClick={() => navigate('/catalog')} className="btn btn-primary btn-lg">Explore Collection</button>
          </div>
        ) : (
          <div className="grid-4">
            {wishlist.map(product => (
              <div key={product.id} className="card fade-in" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                  {(() => {
                    const mainImg = product.images?.[0]?.src || product.imageUrl || null;
                    return (
                      <div style={{ height: 180, borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden', position: 'relative', background: '#f5f0eb' }}>
                        {mainImg ? (
                          <>
                            <div style={{ position: 'absolute', inset: -10, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(14px) brightness(0.55)', transform: 'scale(1.1)' }} />
                            <img src={mainImg} alt={product.name} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                          </>
                        ) : (
                          <div style={{ height: '100%', background: `linear-gradient(135deg, ${product.color}CC, ${product.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, opacity: 0.7 }}>🥻</div>
                        )}
                        <button onClick={e => { e.stopPropagation(); e.preventDefault(); dispatch({ type: 'TOGGLE_WISHLIST', product }); }}
                          style={{
                            position: 'absolute', top: 8, right: 8, zIndex: 2,
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.9)', border: 'none',
                            cursor: 'pointer', fontSize: 14, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>❤️</button>
                      </div>
                    );
                  })()}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>{product.fabric} · {product.region}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 10 }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </Link>
                <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
                  <button onClick={() => { dispatch({ type: 'ADD_TO_CART', product }); }} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 11 }}>
                    + Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
