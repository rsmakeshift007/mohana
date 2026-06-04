import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, bannersAPI, reelsAPI, storageAPI, productsAPI as supabaseProductsAPI, categoriesAPI as supabaseCategoriesAPI } from '../services/supabase';
import { productsDB, ordersDB, customersDB, settingsDB, getDBStats, bannerDB, legalDB, vendorDB, manualOrdersDB, categoriesDB, faqsDB } from '../services/db';
import { productsAPI, ordersAPI, customersAPI, settingsAPI, getAPIStats, isBackendAvailable } from '../services/api';

// ─── Sidebar nav items ───────────────────────
const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'inventory', icon: '🥻', label: 'Inventory' },
  { id: 'add-product', icon: '🆕', label: 'Add Product' },
  { id: 'orders', icon: '📦', label: 'Orders' },
  { id: 'customers', icon: '👥', label: 'Customers' },
  { id: 'banner', icon: '🖼️', label: 'Banner/Reels' },
  { id: 'vendors',       icon: '🏭', label: 'Vendors' },
  { id: 'social-orders', icon: '📱', label: 'Social Orders' },
  { id: 'about',         icon: '🏛️', label: 'About Us' },
  { id: 'settings',      icon: '⚙️', label: 'Settings' },
  { id: 'legal',         icon: '📜', label: 'Legal Pages' },
];

// ─── Stat Card ───────────────────────────────
function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -10, top: -10, width: 70, height: 70, borderRadius: '50%', background: `${color}18` }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 900, color: color || 'var(--primary)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Image Upload Zone ───────────────────────
function ImageUploadZone({ images, onAdd, onRemove, onSetMain }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function processFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => onAdd({ id: Date.now() + Math.random(), src: e.target.result, file, name: file.name, size: file.size });
      reader.readAsDataURL(file);
    });
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: '28px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#FBF0E8' : 'var(--surface-alt)',
          transition: 'all 0.2s',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          {dragging ? 'Drop photos here!' : 'Click or drag & drop photos'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          JPG, PNG, WEBP — unlimited photos allowed
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => processFiles(e.target.files)} />
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: i === 0 ? '2.5px solid var(--accent)' : '2px solid var(--border)' }}>
              <img src={img.src} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Main badge */}
              {i === 0 && (
                <div style={{ position: 'absolute', top: 3, left: 3, background: 'var(--accent)', color: 'white', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4 }}>MAIN</div>
              )}
              {/* Remove button */}
              <button onClick={() => onRemove(img.id)}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(198,40,40,0.9)', border: 'none', cursor: 'pointer', fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                ✕
              </button>
              {/* Set as main */}
              {i !== 0 && (
                <button onClick={() => onSetMain(img.id)}
                  style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Set main
                </button>
              )}
            </div>
          ))}
          {/* Add more button */}
          <div onClick={() => inputRef.current.click()}
            style={{ aspectRatio: '1', border: '2px dashed var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-alt)', gap: 4 }}>
            <span style={{ fontSize: 20 }}>+</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>ADD MORE</span>
          </div>
        </div>
      )}
      {images.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          {images.length} photo{images.length !== 1 ? 's' : ''} added · First photo = main display image
        </div>
      )}
    </div>
  );
}

// ─── Reel/Video Upload Zone ──────────────────
function ReelUploadZone({ reels, onAdd, onRemove, onLabelChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function processFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) return;
      const url = URL.createObjectURL(file);
      onAdd({ id: Date.now() + Math.random(), src: url, file, name: file.name, label: file.name.replace(/\.[^.]+$/, ''), size: (file.size / 1024 / 1024).toFixed(1) });
    });
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? '#AD1457' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: '24px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#FCE4EC' : 'var(--surface-alt)',
          transition: 'all 0.2s',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          {dragging ? 'Drop reels here!' : 'Click or drag & drop reels/videos'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          MP4, MOV, WEBM — multiple reels allowed
        </div>
        <input ref={inputRef} type="file" accept="video/*" multiple style={{ display: 'none' }}
          onChange={e => processFiles(e.target.files)} />
      </div>

      {/* Video previews */}
      {reels.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reels.map((reel, i) => (
            <div key={reel.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface-alt)', borderRadius: 10, padding: '8px 12px', border: '1px solid var(--border)' }}>
              <video src={reel.src} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, background: '#000' }} muted />
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={reel.label || reel.name || ''}
                  onChange={e => onLabelChange && onLabelChange(reel.id, e.target.value)}
                  placeholder="Reel label (e.g. Banarasi Draping)"
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-sans)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', marginBottom: 3 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{reel.size} MB · Reel #{i + 1}</div>
              </div>
              <button onClick={() => onRemove(reel.id)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFEBEE', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{reels.length} reel{reels.length !== 1 ? 's' : ''} added</div>
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit Product Form ─────────────────
function ProductForm({ onSave, onCancel, editProduct }) {
  const [form, setForm] = useState(() => {
    const base = editProduct || {
      name: '', fabric: 'Pure Silk', price: '', originalPrice: '',
      region: '', color: '#8B1A1A', description: '', inStock: true,
      vendorId: '', vendorName: '',
      length: '5.5 Metres', blousePiece: 'Included (0.8m)', careInstructions: 'Dry Clean Only',
    };
    let occ = base.occasions || (base.occasion ? [base.occasion] : ['Wedding']);
    if (!Array.isArray(occ)) occ = [occ];
    return { ...base, occasions: occ };
  });
  // Color variants state: [{id, colorName, colorHex, images:[{id,src,name,file?}]}]
  const [colorVariants, setColorVariants] = useState(() =>
    Array.isArray(editProduct?.colorVariants) ? editProduct.colorVariants : []
  );
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({ colorName: '', colorHex: '#8B1A1A', images: [] });
  const [vendors, setVendors] = useState(() => vendorDB.getAll().filter(v => v.active !== false));
  // Refresh vendor list when localStorage changes (e.g., admin just added a new vendor)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'mohanah_db_vendors') {
        setVendors(vendorDB.getAll().filter(v => v.active !== false));
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [images, setImages] = useState(() => {
    // Pre-load existing images when editing a product
    if (editProduct?.images?.length) return editProduct.images;
    if (editProduct?.imageUrl) return [{ id: 'existing-0', src: editProduct.imageUrl, name: 'existing.jpg', size: 0 }];
    return [];
  });
  const [reels, setReels] = useState(() => editProduct?.reels || []);
  const [saving, setSaving] = useState(false);

  const [fabrics,   setFabrics]   = useState(() => categoriesDB.getFabrics());
  const [occasions, setOccasions] = useState(() => categoriesDB.getOccasions());

  // Load from Supabase on mount (overrides localStorage)
  useEffect(() => {
    supabaseCategoriesAPI.getFabrics()
      .then(data => { if (data && data.length) setFabrics(data); })
      .catch(() => {});
    supabaseCategoriesAPI.getOccasions()
      .then(data => { if (data && data.length) setOccasions(data); })
      .catch(() => {});
  }, []);

  const inputSt = { width: '100%', padding: '10px 13px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)' };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 };

  async function handleSave() {
    if (!form.name || !form.price) { alert('Name and price are required!'); return; }
    setSaving(true);
    try {
      // Upload new images to Supabase Storage
      const uploadedImages = await Promise.all(
        images.map(async img => {
          if (img.file) {
            const url = await storageAPI.uploadImage(img.file, 'products');
            return { id: img.id, src: url, name: img.name };
          }
          return { id: img.id, src: img.src, name: img.name };
        })
      );

      // Upload new reels to Supabase Storage
      const uploadedReels = await Promise.all(
        reels.map(async r => {
          if (r.file) {
            const url = await storageAPI.uploadVideo(r.file, 'reels');
            return { id: r.id, src: url, name: r.name, label: r.label || r.name };
          }
          return r;
        })
      );

      const mainImageUrl = uploadedImages[0]?.src || form.imageUrl || '';

      // Upload color variant images to Supabase Storage
      const uploadedVariants = await Promise.all(
        colorVariants.map(async v => ({
          id: v.id,
          colorName: v.colorName,
          colorHex: v.colorHex,
          images: await Promise.all(
            (v.images || []).map(async img => {
              if (img.file) {
                const url = await storageAPI.uploadImage(img.file, 'products');
                return { id: img.id, src: url, name: img.name };
              }
              return { id: img.id, src: img.src, name: img.name };
            })
          ),
        }))
      );

      const occArr = Array.isArray(form.occasions) && form.occasions.length ? form.occasions : ['Wedding'];
      onSave({
        ...form,
        id:            editProduct?.id || String(Date.now()),
        images:        uploadedImages,
        reels:         uploadedReels,
        imageUrl:      mainImageUrl,
        price:         Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        discount:      form.originalPrice ? Math.round((1 - form.price / form.originalPrice) * 100) : 0,
        occasions:     occArr,
        occasion:      occArr[0],
        rating:        editProduct?.rating  ?? 4.5,
        reviews:       editProduct?.reviews ?? 0,
        isNew:         true,
        isTrending:    false,
        colorVariants: uploadedVariants,
      });
    } catch (err) {
      alert('❌ Upload failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900 }}>
          {editProduct ? '✏️ Edit Product' : '➕ Add New Product'}
        </h2>
        {onCancel && <button onClick={onCancel} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Cancel</button>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Occasion — FULL WIDTH at top so all chips visible */}
      <div>
        <label style={labelSt}>OCCASION * <span style={{ fontWeight: 400, color: 'var(--accent)', textTransform: 'none', letterSpacing: 0 }}>(select multiple)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
          {occasions.map(o => {
            const selected = (form.occasions || []).includes(o);
            return (
              <button key={o} type="button"
                onClick={() => setForm(f => {
                  const cur = f.occasions || [];
                  const next = cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o];
                  return { ...f, occasions: next.length ? next : [o] };
                })}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: selected ? 'var(--primary)' : 'var(--surface-alt)', color: selected ? 'var(--accent-light)' : 'var(--text-sec)', boxShadow: selected ? '0 2px 6px rgba(62,74,44,0.25)' : 'none', transition: 'all 0.18s' }}>
                {selected ? '✓ ' : ''}{o}
              </button>
            );
          })}
        </div>
        {(form.occasions || []).length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Selected: {form.occasions.join(', ')}</div>
        )}
      </div>

      </div>

      <div className="product-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={labelSt}>PRODUCT NAME *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Royal Banarasi Silk" style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Fabric */}
          <div>
            <label style={labelSt}>FABRIC *</label>
            <select value={form.fabric} onChange={e => setForm(f => ({ ...f, fabric: e.target.value }))}
              style={{ ...inputSt, cursor: 'pointer' }}>
              {fabrics.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          {/* Occasion moved to full-width section above */}
          <div style={{ display: 'none' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {occasions.map(o => {
                const selected = (form.occasions || []).includes(o);
                return (
                  <button key={o} type="button"
                    onClick={() => setForm(f => {
                      const cur = f.occasions || [];
                      const next = cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o];
                      return { ...f, occasions: next.length ? next : [o] };
                    })}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                    {selected ? '✓ ' : ''}{o}
                  </button>
                );
              })}
            </div>
            {(form.occasions || []).length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Selected: {(form.occasions).join(', ')}
              </div>
            )}
          </div>

          {/* Price + Original Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>SELLING PRICE (₹) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="4299" style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelSt}>MRP / ORIGINAL PRICE (₹)</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                placeholder="6000 (optional)" style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {/* If discount auto-calculated */}
          {form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
            <div style={{ background: '#E8F5E9', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
              ✓ Discount: {Math.round((1 - form.price / form.originalPrice) * 100)}% — Customer saves ₹{(form.originalPrice - form.price).toLocaleString('en-IN')}
            </div>
          )}

          {/* Region + Saree Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelSt}>ORIGIN / REGION <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                placeholder="e.g. Varanasi, Kanchipuram (leave blank to hide)" style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            {/* Saree thumbnail preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <label style={{ ...labelSt, textAlign: 'center' }}>PREVIEW</label>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {images[0]?.src
                  ? <img src={images[0].src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22, opacity: 0.4 }}>🥻</span>
                }
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelSt}>DESCRIPTION</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the saree — fabric quality, weaving style, ideal occasions..."
              rows={4}
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Length + Blouse Piece */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>SAREE LENGTH <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input value={form.length || ''} onChange={e => setForm(f => ({ ...f, length: e.target.value }))}
                placeholder="e.g. 5.5 Metres, 6 Metres" style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelSt}>BLOUSE PIECE <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
              <select value={form.blousePiece || ''} onChange={e => setForm(f => ({ ...f, blousePiece: e.target.value }))}
                style={{ ...inputSt, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                <option value="">— Hide this field —</option>
                <option value="Included (0.8m)">Included (0.8m)</option>
                <option value="Included (1m)">Included (1m)</option>
                <option value="Not Included">Not Included</option>
                <option value="Custom">Custom (type below)</option>
              </select>
              {form.blousePiece === 'Custom' && (
                <input value={form.blousePieceCustom || ''} onChange={e => setForm(f => ({ ...f, blousePieceCustom: e.target.value }))}
                  placeholder="e.g. Included (1.2m)" style={{ ...inputSt, marginTop: 6 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              )}
            </div>
          </div>

          {/* Care Instructions */}
          <div>
            <label style={labelSt}>CARE INSTRUCTIONS <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea value={form.careInstructions || ''} onChange={e => setForm(f => ({ ...f, careInstructions: e.target.value }))}
              placeholder="e.g. Dry clean only. Store in muslin cloth. Avoid direct sunlight."
              rows={2}
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Leave blank to use default care tips</div>
          </div>

          {/* Vendor / Supplier (admin-only) */}
          <div style={{ background: '#FFF8F0', border: '1.5px dashed var(--accent)', borderRadius: 10, padding: '12px 14px' }}>
            <label style={{ ...labelSt, color: 'var(--accent)' }}>🏭 VENDOR / SUPPLIER <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(admin only — not shown to customers)</span></label>
            <select
              value={form.vendorId}
              onChange={e => {
                const v = vendors.find(v => v.id === e.target.value);
                setForm(f => ({ ...f, vendorId: e.target.value, vendorName: v ? v.name : '' }));
              }}
              style={{ ...inputSt, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="">— Select vendor (optional) —</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.city ? ` · ${v.city}` : ''}{v.fabrics ? ` · ${v.fabrics}` : ''}
                </option>
              ))}
            </select>
            {form.vendorId && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                ✓ Vendor: {form.vendorName}
              </div>
            )}
            {vendors.length === 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                No vendors added yet. Go to <strong>Vendors</strong> section to add them.
              </div>
            )}
          </div>

          {/* ── Saree Variants (same saree, different colors/styles) ── */}
          <div style={{ background: '#F0F7FF', border: '1.5px dashed #1565C0', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1565C0' }}>🎨 Saree Variants</div>
                <div style={{ fontSize: 11, color: '#1976D2', marginTop: 2 }}>Add same saree in different colors — each variant has its own photos</div>
              </div>
              <button type="button" onClick={() => setShowVariantForm(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#1565C0', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {showVariantForm ? '✕ Cancel' : '+ Add Variant'}
              </button>
            </div>

            {/* Existing variants */}
            {colorVariants.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {colorVariants.map((v, idx) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid #BBDEFB' }}>
                    {/* Variant thumbnail circle */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #1565C0', flexShrink: 0, background: '#f0ebe4' }}>
                      {v.images?.[0]?.src
                        ? <img src={v.images[0].src} alt={v.colorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🥻</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{v.colorName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.images?.length || 0} photo{v.images?.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(v.images || []).slice(0, 3).map((img, i) => (
                        <img key={i} src={img.src} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} />
                      ))}
                    </div>
                    <button type="button" onClick={() => setColorVariants(prev => prev.filter((_, i) => i !== idx))}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: '#FFEBEE', border: 'none', cursor: 'pointer', color: '#C62828', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add variant form — NO color picker, just name + images */}
            {showVariantForm && (
              <div style={{ background: 'white', borderRadius: 10, padding: '14px', border: '1px solid #BBDEFB', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#1565C0', letterSpacing: 1, display: 'block', marginBottom: 4 }}>VARIANT NAME *</label>
                  <input value={newVariant.colorName} onChange={e => setNewVariant(v => ({ ...v, colorName: e.target.value }))}
                    placeholder="e.g. Bottle Green, Royal Blue, Golden Yellow"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #BBDEFB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#1565C0', letterSpacing: 1, display: 'block', marginBottom: 6 }}>PHOTOS FOR THIS VARIANT</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(newVariant.images || []).map((img, i) => (
                      <div key={img.id} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setNewVariant(v => ({ ...v, images: v.images.filter(x => x.id !== img.id) }))}
                          style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(198,40,40,0.9)', border: 'none', color: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                    <label style={{ width: 64, height: 64, borderRadius: 8, border: '2px dashed #BBDEFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F0F7FF', fontSize: 10, color: '#1565C0', fontWeight: 700, gap: 2 }}>
                      <span style={{ fontSize: 20 }}>📷</span>ADD
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                        Array.from(e.target.files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = ev => setNewVariant(v => ({ ...v, images: [...v.images, { id: Date.now() + Math.random(), src: ev.target.result, name: file.name, file }] }));
                          reader.readAsDataURL(file);
                        });
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>

                <button type="button" disabled={!newVariant.colorName.trim()}
                  onClick={() => {
                    if (!newVariant.colorName.trim()) return;
                    setColorVariants(prev => [...prev, { ...newVariant, id: Date.now() + '' }]);
                    setNewVariant({ colorName: '', colorHex: '', images: [] });
                    setShowVariantForm(false);
                  }}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: newVariant.colorName.trim() ? '#1565C0' : '#DDD', color: newVariant.colorName.trim() ? 'white' : '#999', fontWeight: 700, fontSize: 13, cursor: newVariant.colorName.trim() ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' }}>
                  ✓ Save Variant
                </button>
              </div>
            )}

            {colorVariants.length === 0 && !showVariantForm && (
              <div style={{ fontSize: 11, color: '#1976D2', opacity: 0.7 }}>No variants added yet. Click "+ Add Variant" to add same saree in different colors.</div>
            )}
          </div>

          {/* Stock toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-alt)', borderRadius: 10, padding: '12px 14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
              <div
                onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: form.inStock ? 'var(--success)' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: 3, left: form.inStock ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {form.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toggle availability</div>
              </div>
            </label>
          </div>
        </div>

        {/* Right column — Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Photos */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📸 Product Photos</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>Add unlimited photos — drag to reorder, click to set as main</div>
            <ImageUploadZone
              images={images}
              onAdd={img => setImages(prev => [...prev, img])}
              onRemove={id => setImages(prev => prev.filter(i => i.id !== id))}
              onSetMain={id => setImages(prev => {
                const idx = prev.findIndex(i => i.id === id);
                if (idx < 1) return prev;
                const arr = [...prev];
                const [item] = arr.splice(idx, 1);
                arr.unshift(item);
                return arr;
              })}
            />
          </div>

          {/* Reels */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🎬 Product Reels / Videos</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>Add reels to showcase how the saree drapes & looks</div>
            <ReelUploadZone
              reels={reels}
              onAdd={r => setReels(prev => [...prev, r])}
              onRemove={id => setReels(prev => prev.filter(r => r.id !== id))}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg" style={{ minWidth: 180 }}>
          {saving ? '⏳ Saving...' : editProduct ? '✓ Update Product' : '✓ Add to Inventory'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn btn-outline">Cancel</button>
        )}
        {form.name && (
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
            💡 {images.length} photo{images.length !== 1 ? 's' : ''} · {reels.length} reel{reels.length !== 1 ? 's' : ''} added
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .product-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Orders Section ──────────────────────────
function OrdersSection({ useBackend }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [orderList, setOrderList] = useState(() => ordersDB.getAll());
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [savedOrderId, setSavedOrderId] = useState(null);

  useEffect(() => {
    if (useBackend) {
      ordersAPI.getAll()
        .then(data => setOrderList(data))
        .catch(() => setOrderList(ordersDB.getAll()));
    }
  }, [useBackend]);

  const statuses = ['All', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  const statusLabel = { placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
  const statusColor = { placed: '#1565C0', confirmed: '#1565C0', packed: '#F57F17', shipped: '#1565C0', out_for_delivery: '#C9956C', delivered: '#2E7D32', cancelled: '#C62828' };
  const statusBg = { placed: '#E3F2FD', confirmed: '#E3F2FD', packed: '#FFF8E1', shipped: '#E3F2FD', out_for_delivery: '#FFF3E8', delivered: '#E8F5E9', cancelled: '#FFEBEE' };

  function refreshOrders() {
    setOrderList(ordersDB.getAll());
  }

  async function handleStatusChange(id, newStatus) {
    if (useBackend) {
      try { await ordersAPI.updateStatus(id, newStatus); } catch {}
    }
    ordersDB.updateStatus(id, newStatus);
    refreshOrders();
  }

  function handleTrackingChange(id, field, value) {
    setTrackingInputs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function saveTracking(id) {
    const order = orderList.find(o => o.id === id);
    const inputs = trackingInputs[id] || {};
    const trackingNumber = inputs.trackingNumber !== undefined ? inputs.trackingNumber : (order?.trackingNumber || '');
    const estimatedDelivery = inputs.estimatedDelivery !== undefined ? inputs.estimatedDelivery : (order?.estimatedDelivery || '');
    ordersDB.updateFields(id, { trackingNumber, estimatedDelivery });
    refreshOrders();
    setSavedOrderId(id);
    setTimeout(() => setSavedOrderId(null), 2000);
  }

  const filtered = orderList.filter(o => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (search && !o.product?.toLowerCase().includes(search.toLowerCase()) && !o.id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900 }}>📦 Orders ({orderList.length})</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search orders..."
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', minWidth: 180 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : statusLabel[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(o => {
          const isExpanded = expandedOrderId === o.id;
          const inputs = trackingInputs[o.id] || {};
          const trackingVal = inputs.trackingNumber !== undefined ? inputs.trackingNumber : (o.trackingNumber || '');
          const deliveryVal = inputs.estimatedDelivery !== undefined ? inputs.estimatedDelivery : (o.estimatedDelivery || '');

          // Build display items list — use detailed items[] if available, else fallback to order-level fields
          const displayItems = (o.items && o.items.length > 0)
            ? o.items
            : [{ id: o.id, name: o.product, qty: 1, price: o.price, fabric: o.fabric, imageUrl: o.selectedColorImage || o.imageUrl || o.images?.[0]?.src || '', selectedColorName: o.selectedColorName, selectedColorImage: o.selectedColorImage, selectedColorHex: o.selectedColorHex }];

          return (
            <div key={o.id} className="card" style={{ overflow: 'hidden' }}>
              {/* ── Clickable Row ── */}
              <div
                onClick={() => setExpandedOrderId(id => id === o.id ? null : o.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', flexWrap: 'wrap', cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Product thumb */}
                <div style={{ width: 48, height: 56, borderRadius: 8, overflow: 'hidden', background: `${o.color || '#C9956C'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: '1px solid var(--border)' }}>
                  {o.selectedColorImage || o.images?.[0]?.src || o.imageUrl
                    ? <img src={o.selectedColorImage || o.images?.[0]?.src || o.imageUrl} alt={o.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🥻'
                  }
                </div>

                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                    {o.product}
                    {o.items?.length > 1 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginLeft: 6 }}>({o.items.length} items)</span>}
                  </div>
                  {o.selectedColorName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', background: '#E3F2FD', padding: '1px 7px', borderRadius: 10 }}>🎨 {o.selectedColorName}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{o.id} · {o.date}</div>
                  {(o.trackingNumber || o.estimatedDelivery) && (
                    <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 600, marginTop: 2 }}>
                      {o.trackingNumber && `🚚 ${o.trackingNumber}`}
                      {o.trackingNumber && o.estimatedDelivery && ' · '}
                      {o.estimatedDelivery && `📅 ${o.estimatedDelivery}`}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    ₹{(o.price || 0).toLocaleString('en-IN')}
                  </span>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg[o.status], color: statusColor[o.status], whiteSpace: 'nowrap' }}>
                    {statusLabel[o.status]}
                  </span>
                  <select value={o.status}
                    onChange={e => handleStatusChange(o.id, e.target.value)}
                    style={{ fontSize: 11, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                {/* Expand indicator */}
                <div style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
                  {isExpanded ? '▲' : '▼'}
                </div>
              </div>

              {/* ── Expanded: Full Order Details ── */}
              {isExpanded && (
                <div style={{ borderTop: '2px solid var(--border)', background: '#FDFAF7', padding: '20px 20px' }}>

                  {/* ── Items Ordered ── */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
                      🛍️ ORDERED ITEMS ({displayItems.length})
                    </div>
                    {displayItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: 8, border: '1px solid var(--border)' }}>
                        {/* Item image */}
                        <div style={{ width: 52, height: 62, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5f0eb', border: '1px solid var(--border)' }}>
                          {item.imageUrl || item.selectedColorImage
                            ? <img src={item.selectedColorImage || item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🥻</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                          {item.fabric && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>🧵 {item.fabric}</div>}
                          {item.selectedColorName && (
                            <div style={{ marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', background: '#E3F2FD', padding: '2px 8px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {item.selectedColorImage && <img src={item.selectedColorImage} alt="" style={{ width: 14, height: 16, objectFit: 'cover', borderRadius: 3 }} />}
                                🎨 {item.selectedColorName}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>₹{((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Qty: {item.qty || 1}</div>
                        </div>
                      </div>
                    ))}
                    {/* Total row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--primary)', borderRadius: 8, color: 'white' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Total Paid</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 16 }}>₹{(o.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* ── Customer Details ── */}
                  {o.address && (
                    <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>📍 CUSTOMER & DELIVERY</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                          {o.address.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{o.address.name}</div>
                          <div style={{ fontSize: 12, color: '#1565C0', fontWeight: 700, marginTop: 3 }}>📞 {o.address.phone}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4, lineHeight: 1.6 }}>
                            {o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ''}<br />
                            {o.address.city}, {o.address.state} — {o.address.pincode}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Tracking Section ── */}
                  <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>🚚 TRACKING INFO</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>TRACKING NUMBER (AWB)</label>
                        <input
                          value={trackingVal}
                          onChange={e => handleTrackingChange(o.id, 'trackingNumber', e.target.value)}
                          placeholder="e.g. BD123456789IN"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>ESTIMATED DELIVERY DATE</label>
                        <input
                          type="date"
                          value={deliveryVal}
                          onChange={e => handleTrackingChange(o.id, 'estimatedDelivery', e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)', boxSizing: 'border-box', cursor: 'pointer' }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveTracking(o.id)}
                      style={{
                        padding: '10px 24px', borderRadius: 8,
                        background: savedOrderId === o.id ? '#2E7D32' : 'var(--primary)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-sans)',
                        transition: 'background 0.2s',
                      }}>
                      {savedOrderId === o.id ? '✅ Saved! Customer can see this now.' : '💾 Save Tracking Info'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No orders found</div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory List ──────────────────────────
function InventorySection({ products, onEdit, onDelete, onToggleStock }) {
  const [search, setSearch] = useState('');
  const [fabricFilter, setFabricFilter] = useState('All');
  const fabrics = ['All', 'Pure Silk', 'Banarasi', 'Kanjivaram', 'Cotton Silk', 'Georgette', 'Chanderi', 'Tussar', 'Chiffon', 'Linen'];

  const filtered = products.filter(p => {
    if (fabricFilter !== 'All' && p.fabric !== fabricFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900 }}>🥻 Inventory ({products.length})</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products..."
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', minWidth: 180 }} />
          <select value={fabricFilter} onChange={e => setFabricFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            {fabrics.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
            {/* Product image / color swatch */}
            {(() => {
              const mainImg = p.images?.[0]?.src || p.imageUrl || null;
              return mainImg ? (
                <div style={{ height: 140, position: 'relative', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden', background: '#f5f0eb' }}>
                  {/* Blur backdrop */}
                  <div style={{ position: 'absolute', inset: -10, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px) brightness(0.5)', transform: 'scale(1.08)' }} />
                  {/* Full image */}
                  <img src={mainImg} alt={p.name}
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block', zIndex: 1 }} />
                  {/* Dark overlay for badges */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: p.inStock ? 'rgba(232,245,233,0.95)' : 'rgba(255,235,238,0.95)', color: p.inStock ? 'var(--success)' : 'var(--error)' }}>
                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                  {p.isNew && <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: 'white' }}>NEW</div>}
                  {p.images?.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, fontWeight: 700, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 7px', borderRadius: 10 }}>
                      📸 {p.images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 110, background: `linear-gradient(135deg, ${p.color}CC, ${p.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                  🥻
                  <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: p.inStock ? '#E8F5E9' : '#FFEBEE', color: p.inStock ? 'var(--success)' : 'var(--error)' }}>
                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                  {p.isNew && <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: 'white' }}>NEW</div>}
                </div>
              );
            })()}
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>{p.fabric} · {p.region}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>{p.name}</div>
              {p.vendorName && (
                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🏭 <span>{p.vendorName}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                {p.originalPrice && <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{p.originalPrice.toLocaleString('en-IN')}</span>}
                {p.discount > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#E8F5E9', color: 'var(--success)', padding: '1px 6px', borderRadius: 8 }}>{p.discount}%</span>}
              </div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <button onClick={() => onEdit(p)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: '#E3F2FD', color: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✏️ Edit</button>
                <button onClick={() => onToggleStock(p.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: p.inStock ? '#FFF8E1' : '#E8F5E9', color: p.inStock ? '#F57F17' : 'var(--success)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {p.inStock ? 'Mark OOS' : 'In Stock'}
                </button>
                <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p.id); }} style={{ width: 30, height: 30, borderRadius: 7, background: '#FFEBEE', color: 'var(--error)', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Banner Management ───────────────────────
function BannerSection() {
  const [bannerImages, setBannerImages] = useState([]);
  const [bannerReels,  setBannerReels]  = useState([]);
  const [savingImgs,   setSavingImgs]   = useState(false);
  const [savingReels,  setSavingReels]  = useState(false);
  const [imgSaved,     setImgSaved]     = useState(false);
  const [reelSaved,    setReelSaved]    = useState(false);
  const [showMeta,     setShowMeta]     = useState(true);
  const [uploadMsg,    setUploadMsg]    = useState('');
  const [loading,      setLoading]      = useState(true);

  // All products for the link picker
  const allProducts = productsDB.getAll();

  // Load existing banners + reels from Supabase on mount
  useEffect(() => {
    Promise.all([
      bannersAPI.getAllAdmin().catch(() => []),
      reelsAPI.getAllAdmin().catch(() => []),
    ]).then(([bData, rData]) => {
      if (bData.length > 0) {
        setBannerImages(bData.map(b => ({
          id: b.id, src: b.image_url, file: null, dbId: b.id,
          title: b.title, subtitle: b.subtitle, desc: b.description,
          price: b.price, badge: b.badge,
          cta: b.cta_text, ctaLink: b.cta_link,
        })));
      }
      if (rData.length > 0) {
        setBannerReels(rData.map(r => ({
          id: r.id, src: r.video_url, file: null, dbId: r.id,
          name: r.label || 'Reel', label: r.label || '', size: '',
        })));
      }
    }).finally(() => setLoading(false));
  }, []);

  const metaLabelSt = { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 3 };
  const metaInputSt = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };

  function updateImageMeta(id, key, value) {
    setBannerImages(prev => prev.map(img => img.id === id ? { ...img, [key]: value } : img));
  }

  async function handleSaveImages() {
    setSavingImgs(true);
    setUploadMsg('🔄 Uploading to Supabase...');
    try {
      // 1. Upload any new files to Supabase Storage
      const processed = await Promise.all(
        bannerImages.map(async (img, i) => {
          let imageUrl = img.src;
          if (img.file) {
            setUploadMsg(`📤 Uploading photo ${i + 1} of ${bannerImages.length}...`);
            imageUrl = await storageAPI.uploadImage(img.file, 'banners');
          }
          return { ...img, imageUrl, sort_order: i };
        })
      );

      // 2. Delete all existing banners from Supabase
      setUploadMsg('💾 Saving to database...');
      const existing = await bannersAPI.getAllAdmin();
      await Promise.all(existing.map(b => bannersAPI.delete(b.id)));

      // 3. Insert new banners
      await Promise.all(processed.map(img =>
        bannersAPI.add({
          image_url: img.imageUrl,
          title: img.title || '',
          subtitle: img.subtitle || '',
          description: img.desc || '',
          price: img.price || '',
          badge: img.badge || '',
          cta_text: img.cta || 'Shop Now',
          cta_link: img.ctaLink || '/catalog',
          sort_order: img.sort_order,
          is_active: true,
        })
      ));

      // 4. Refresh state (clear file references, update src)
      setBannerImages(processed.map(img => ({ ...img, src: img.imageUrl, file: null })));
      setImgSaved(true);
      setUploadMsg('');
      setTimeout(() => setImgSaved(false), 3000);
    } catch (err) {
      alert('❌ Error: ' + err.message);
      setUploadMsg('');
    } finally {
      setSavingImgs(false);
    }
  }

  async function handleSaveReels() {
    setSavingReels(true);
    setUploadMsg('🔄 Uploading reels...');
    try {
      // 1. Upload new video files
      const processed = await Promise.all(
        bannerReels.map(async (reel, i) => {
          let videoUrl = reel.src;
          if (reel.file) {
            setUploadMsg(`📤 Uploading reel ${i + 1} of ${bannerReels.length}...`);
            videoUrl = await storageAPI.uploadVideo(reel.file, 'reels');
          }
          return { ...reel, videoUrl, sort_order: i };
        })
      );

      // 2. Delete existing reels
      setUploadMsg('💾 Saving reels...');
      const existing = await reelsAPI.getAllAdmin();
      await Promise.all(existing.map(r => reelsAPI.delete(r.id)));

      // 3. Insert new reels
      await Promise.all(processed.map(r =>
        reelsAPI.add({
          video_url: r.videoUrl,
          label: r.label || r.name || 'Reel',
          sort_order: r.sort_order,
          is_active: true,
        })
      ));

      setBannerReels(processed.map(r => ({ ...r, src: r.videoUrl, file: null })));
      setReelSaved(true);
      setUploadMsg('');
      setTimeout(() => { setSavingReels(false); setReelSaved(false); }, 3000);
    } catch (err) {
      alert('❌ Error: ' + err.message);
      setUploadMsg('');
      setSavingReels(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-sec)' }}>⏳ Loading banners from Supabase...</div>;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, marginBottom: 6 }}>🖼️ Banner & Reels Management</h2>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 24 }}>Upload photos and reels — <strong>sabko dikhega</strong> (Supabase storage se).</p>
      {uploadMsg && <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#1565C0' }}>{uploadMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ── Banner Photos + Slide Details ── */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>📸 Banner Photos</div>
          <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 18 }}>
            Each photo = one banner slide. Upload photos, fill in the details, save — changes go live on homepage instantly.
          </div>

          <ImageUploadZone
            images={bannerImages}
            onAdd={img => setBannerImages(prev => [...prev, img])}
            onRemove={id => setBannerImages(prev => prev.filter(i => i.id !== id))}
            onSetMain={id => setBannerImages(prev => {
              const idx = prev.findIndex(i => i.id === id);
              if (idx < 1) return prev;
              const arr = [...prev]; const [item] = arr.splice(idx, 1); arr.unshift(item); return arr;
            })}
          />

          {/* ── Per-Slide Metadata Editor ── */}
          {bannerImages.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button
                onClick={() => setShowMeta(m => !m)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', marginBottom: showMeta ? 14 : 0 }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>✏️ Slide Details — set title, price &amp; button for each slide</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{showMeta ? '▲ Hide' : '▼ Show'} ({bannerImages.length} slides)</span>
              </button>

              {showMeta && bannerImages.map((img, i) => (
                <div key={img.id} style={{ marginBottom: 14, borderRadius: 10, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                  {/* Slide header */}
                  <div style={{ background: 'var(--primary)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(201,149,108,0.5)' }}>
                      <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--accent-light)', fontWeight: 800, fontSize: 13 }}>Slide #{i + 1}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                        {img.title ? `"${img.title}"` : 'No title set'}
                      </div>
                    </div>
                    {img.title && img.ctaLink && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: 'rgba(46,125,50,0.3)', color: '#A5D6A7', padding: '3px 8px', borderRadius: 10 }}>✓ Ready</span>
                    )}
                  </div>

                  {/* Metadata fields */}
                  <div style={{ padding: 12, background: '#FAFAF8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {/* Saree Name */}
                    <div>
                      <label style={metaLabelSt}>SAREE NAME *</label>
                      <input
                        value={img.title || ''}
                        onChange={e => updateImageMeta(img.id, 'title', e.target.value)}
                        placeholder="e.g. Royal Banarasi Silk"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Price */}
                    <div>
                      <label style={metaLabelSt}>PRICE</label>
                      <input
                        value={img.price || ''}
                        onChange={e => updateImageMeta(img.id, 'price', e.target.value)}
                        placeholder="e.g. ₹4,299"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Badge */}
                    <div>
                      <label style={metaLabelSt}>BADGE / TAG</label>
                      <input
                        value={img.badge || ''}
                        onChange={e => updateImageMeta(img.id, 'badge', e.target.value)}
                        placeholder="e.g. ✨ New Arrival"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Subtitle */}
                    <div>
                      <label style={metaLabelSt}>SUBTITLE / LOCATION</label>
                      <input
                        value={img.subtitle || ''}
                        onChange={e => updateImageMeta(img.id, 'subtitle', e.target.value)}
                        placeholder="e.g. Varanasi · UP"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Description — full width */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={metaLabelSt}>SHORT DESCRIPTION</label>
                      <input
                        value={img.desc || ''}
                        onChange={e => updateImageMeta(img.id, 'desc', e.target.value)}
                        placeholder="e.g. Handcrafted with pure zari by master weavers"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Button text */}
                    <div>
                      <label style={metaLabelSt}>BUTTON TEXT</label>
                      <input
                        value={img.cta || ''}
                        onChange={e => updateImageMeta(img.id, 'cta', e.target.value)}
                        placeholder="e.g. Shop Now"
                        style={metaInputSt}
                      />
                    </div>
                    {/* Link — text + product picker */}
                    <div>
                      <label style={metaLabelSt}>LINK (PRODUCT / PAGE)</label>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <input
                          value={img.ctaLink || ''}
                          onChange={e => updateImageMeta(img.id, 'ctaLink', e.target.value)}
                          placeholder="/catalog"
                          style={{ ...metaInputSt, flex: 1 }}
                        />
                        {/* Quick-pick dropdown */}
                        <select
                          defaultValue=""
                          onChange={e => { if (e.target.value) { updateImageMeta(img.id, 'ctaLink', e.target.value); e.target.value = ''; } }}
                          style={{ padding: '7px 5px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', background: 'var(--bg)', color: 'var(--text)', flexShrink: 0 }}
                          title="Pick from product / page list"
                        >
                          <option value="">Pick…</option>
                          <optgroup label="Pages">
                            <option value="/catalog">All Sarees</option>
                            <option value="/catalog?occasion=Bridal">Bridal Collection</option>
                            <option value="/catalog?occasion=Festival">Festive Collection</option>
                            <option value="/catalog?occasion=Party">Party Wear</option>
                            <option value="/catalog?filter=new">New Arrivals</option>
                            <option value="/catalog?filter=trending">Trending</option>
                          </optgroup>
                          {allProducts.length > 0 && (
                            <optgroup label="Products">
                              {allProducts.map(p => (
                                <option key={p.id} value={`/product/${p.id}`}>
                                  {p.name} — ₹{Number(p.price).toLocaleString('en-IN')}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            disabled={savingImgs || bannerImages.length === 0}
            onClick={handleSaveImages}
            style={{ marginTop: 16, width: '100%', opacity: bannerImages.length === 0 ? 0.5 : 1 }}>
            {savingImgs ? '⏳ Compressing & Saving...' : imgSaved ? '✅ Photos + Details Saved!' : `💾 Save ${bannerImages.length} Banner Slide${bannerImages.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* ── Banner Reels ── */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>🎬 Banner Reels</div>
          <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 18 }}>
            Each reel = right panel of corresponding banner slide.
          </div>
          <ReelUploadZone
            reels={bannerReels}
            onAdd={r => setBannerReels(prev => [...prev, r])}
            onRemove={id => setBannerReels(prev => prev.filter(r => r.id !== id))}
            onLabelChange={(id, val) => setBannerReels(prev => prev.map(r => r.id === id ? { ...r, label: val } : r))}
          />
          <button
            className="btn btn-primary btn-sm"
            disabled={savingReels || bannerReels.length === 0}
            onClick={handleSaveReels}
            style={{ marginTop: 14, width: '100%', opacity: bannerReels.length === 0 ? 0.5 : 1 }}>
            {reelSaved ? '✅ Reels Saved!' : `💾 Save ${bannerReels.length} Reel${bannerReels.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Pairing guide */}
      <div style={{ marginTop: 20, background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📌 How it works</div>
        <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.8 }}>
          <strong>Step 1:</strong> Upload photos. &nbsp;·&nbsp; <strong>Step 2:</strong> Fill in the title, price &amp; button for each slide. &nbsp;·&nbsp; <strong>Step 3:</strong> Click "Save".<br />
          Customers clicking the banner button will land directly on that product page and can add it to cart. 🛍️
        </div>
      </div>
    </div>
  );
}

// ─── Vendors Section ─────────────────────────
function VendorSection() {
  const [vendors,    setVendors]    = useState(() => vendorDB.getAll());
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [saved,      setSaved]      = useState(false);

  const EMPTY = {
    name: '', contactPerson: '', phone: '', phone2: '',
    email: '', city: '', state: '', address: '',
    gstNumber: '', bankName: '', accountNumber: '', ifscCode: '',
    accountHolder: '', upiId: '', fabrics: '', notes: '',
  };
  const [form, setForm] = useState(EMPTY);

  const inputSt = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid var(--border)', fontSize: 13,
    fontFamily: 'var(--font-sans)', background: 'var(--bg)',
    outline: 'none', color: 'var(--text)', boxSizing: 'border-box',
  };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 };

  function openAdd() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
    setSaved(false);
  }

  function openEdit(v) {
    setForm({ ...EMPTY, ...v });
    setEditId(v.id);
    setShowForm(true);
    setSaved(false);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      vendorDB.update(editId, form);
    } else {
      vendorDB.add(form);
    }
    const updated = vendorDB.getAll();
    setVendors(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mohanah_db_vendors', newValue: JSON.stringify(updated) }));
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); }, 1400);
  }

  function handleDelete(id) {
    vendorDB.delete(id);
    const updated = vendorDB.getAll();
    setVendors(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mohanah_db_vendors', newValue: JSON.stringify(updated) }));
    setDeleteId(null);
    if (editId === id) { setShowForm(false); setEditId(null); }
  }

  function toggleActive(v) {
    vendorDB.update(v.id, { active: !v.active });
    const updated = vendorDB.getAll();
    setVendors(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mohanah_db_vendors', newValue: JSON.stringify(updated) }));
  }

  const filtered = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase()) ||
    v.fabrics?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, marginBottom: 2 }}>🏭 Vendors ({vendors.length})</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vendor details — visible to admin only, never shown to customers</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search vendors..."
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', minWidth: 200 }} />
          <button onClick={openAdd} className="btn btn-accent btn-sm" style={{ whiteSpace: 'nowrap' }}>
            ➕ Add Vendor
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24, border: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 800 }}>
              {editId ? '✏️ Edit Vendor' : '➕ New Vendor'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

            {/* ── Basic Info ── */}
            <div style={{ gridColumn: 'span 3' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                🏭 BASIC INFORMATION
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelSt}>VENDOR / SHOP NAME *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ramesh Silk Weavers"
                style={{ ...inputSt, borderColor: !form.name && saved ? 'red' : 'var(--border)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>CONTACT PERSON</label>
              <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. Ramesh Kumar"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>PHONE NUMBER *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>ALTERNATE PHONE</label>
              <input value={form.phone2} onChange={e => setForm(f => ({ ...f, phone2: e.target.value }))} placeholder="+91 98765 43211"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>EMAIL</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vendor@email.com"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>CITY</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Varanasi"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>STATE</label>
              <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Uttar Pradesh"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <label style={labelSt}>FULL ADDRESS</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, Area, City, PIN"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>GST NUMBER</label>
              <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="e.g. 09ABCDE1234F1Z5"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelSt}>FABRICS SUPPLIED (comma separated)</label>
              <input value={form.fabrics} onChange={e => setForm(f => ({ ...f, fabrics: e.target.value }))} placeholder="e.g. Banarasi Silk, Pure Silk, Kanjivaram"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* ── Payment Details ── */}
            <div style={{ gridColumn: 'span 3', marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                💳 PAYMENT DETAILS (private)
              </div>
            </div>

            <div>
              <label style={labelSt}>UPI ID</label>
              <input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} placeholder="vendor@ybl"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>BANK NAME</label>
              <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. SBI, HDFC"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>ACCOUNT HOLDER NAME</label>
              <input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="As per bank records"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>ACCOUNT NUMBER</label>
              <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="Bank account number"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={labelSt}>IFSC CODE</label>
              <input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))} placeholder="e.g. SBIN0001234"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* ── Notes ── */}
            <div style={{ gridColumn: 'span 3', marginTop: 4 }}>
              <label style={labelSt}>NOTES / REMARKS</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                placeholder="Any additional notes about this vendor..."
                style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {/* Form buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
            <button onClick={handleSave}
              style={{ padding: '10px 28px', borderRadius: 10, background: saved ? '#2E7D32' : 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-sans)' }}>
              {saved ? '✅ Saved!' : editId ? '💾 Update Vendor' : '➕ Add Vendor'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-sans)' }}>
              Cancel
            </button>
            {!form.name.trim() && (
              <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>⚠️ Vendor name required</span>
            )}
          </div>
        </div>
      )}

      {/* Vendors List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏭</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>No vendors added yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Save your saree suppliers and weavers details here</div>
          <button onClick={openAdd} className="btn btn-accent">➕ Add First Vendor</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(v => (
            <div key={v.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: v.active ? 1 : 0.6 }}>
              {/* Card header */}
              <div style={{ background: v.active ? 'linear-gradient(135deg, var(--primary), #2D3A18)' : '#888', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(201,149,108,0.25)', border: '2px solid rgba(201,149,108,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 18, color: 'var(--accent)', flexShrink: 0 }}>
                  {v.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                  {v.city && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>📍 {v.city}{v.state ? `, ${v.state}` : ''}</div>}
                </div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: v.active ? 'rgba(46,125,50,0.35)' : 'rgba(198,40,40,0.35)', color: v.active ? '#90EE90' : '#FF8A80', fontWeight: 700 }}>
                  {v.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 18px' }}>
                {/* Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {v.contactPerson && (
                    <div style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>👤</span> {v.contactPerson}
                    </div>
                  )}
                  {v.phone && (
                    <a href={`tel:${v.phone}`} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📞</span> {v.phone}
                      {v.phone2 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {v.phone2}</span>}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} style={{ fontSize: 12, color: 'var(--text-sec)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✉️</span> {v.email}
                    </a>
                  )}
                  {v.upiId && (
                    <div style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💳</span> UPI: <strong style={{ color: 'var(--primary)' }}>{v.upiId}</strong>
                    </div>
                  )}
                </div>

                {/* Fabrics */}
                {v.fabrics && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 5 }}>FABRICS</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {v.fabrics.split(',').map(f => f.trim()).filter(Boolean).map(f => (
                        <span key={f} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--surface-alt)', color: 'var(--text-sec)', fontWeight: 600, border: '1px solid var(--border)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* GST */}
                {v.gstNumber && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    GST: <strong style={{ color: 'var(--text)' }}>{v.gstNumber}</strong>
                  </div>
                )}

                {/* Notes */}
                {v.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-alt)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, lineHeight: 1.6, fontStyle: 'italic' }}>
                    {v.notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => openEdit(v)}
                    style={{ flex: 1, padding: '7px', borderRadius: 7, background: '#E3F2FD', color: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => toggleActive(v)}
                    style={{ flex: 1, padding: '7px', borderRadius: 7, background: v.active ? '#FFF8E1' : '#E8F5E9', color: v.active ? '#F57F17' : '#2E7D32', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    {v.active ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button onClick={() => setDeleteId(v.id)}
                    style={{ padding: '7px 10px', borderRadius: 7, background: '#FFEBEE', color: '#C62828', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: 28, maxWidth: 360, margin: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 8 }}>Delete this vendor?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.6 }}>
              Deleting "{vendors.find(v => v.id === deleteId)?.name}" is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => handleDelete(deleteId)}
                style={{ padding: '9px 24px', borderRadius: 8, background: '#C62828', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>
                Haan, Delete Karo
              </button>
              <button onClick={() => setDeleteId(null)}
                style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legal Pages Section ─────────────────────
const LEGAL_PAGES = [
  { key: 'privacy',  icon: '🔒', label: 'Privacy Policy',       color: '#1565C0' },
  { key: 'terms',    icon: '📋', label: 'Terms & Conditions',    color: '#6A1B9A' },
  { key: 'refund',   icon: '↩️', label: 'Refund & Return Policy', color: '#E65100' },
  { key: 'shipping', icon: '🚚', label: 'Shipping Policy',       color: '#2E7D32' },
  { key: 'contact',  icon: '💬', label: 'Contact Us',            color: '#C9956C' },
];

// ─── About Us Section ────────────────────────
const ABOUT_FIELDS = [
  { section: 'Hero',        fields: [
    { key: 'heroTitle',    label: 'Hero Title',    placeholder: 'Our Story' },
    { key: 'heroSubtitle', label: 'Hero Subtitle', placeholder: 'Weaving Tradition into Every Thread' },
    { key: 'heroDesc',     label: 'Hero Description', placeholder: 'Mohanah was born from...', multiline: true },
  ]},
  { section: 'Our Story',   fields: [
    { key: 'storyTitle', label: 'Section Title', placeholder: 'From the Looms of India to Your Doorstep' },
    { key: 'storyP1',    label: 'Paragraph 1',   placeholder: 'Story paragraph 1...', multiline: true },
    { key: 'storyP2',    label: 'Paragraph 2',   placeholder: 'Story paragraph 2...', multiline: true },
    { key: 'storyP3',    label: 'Paragraph 3',   placeholder: 'Story paragraph 3...', multiline: true },
  ]},
  { section: 'Values',      fields: [
    { key: 'value1Icon', label: 'Value 1 Icon',  placeholder: '🤝' },
    { key: 'value1Title',label: 'Value 1 Title', placeholder: 'Direct from Weavers' },
    { key: 'value1Desc', label: 'Value 1 Desc',  placeholder: 'We work directly...', multiline: true },
    { key: 'value2Icon', label: 'Value 2 Icon',  placeholder: '✨' },
    { key: 'value2Title',label: 'Value 2 Title', placeholder: '100% Authentic' },
    { key: 'value2Desc', label: 'Value 2 Desc',  placeholder: 'Every saree is handpicked...', multiline: true },
    { key: 'value3Icon', label: 'Value 3 Icon',  placeholder: '🌿' },
    { key: 'value3Title',label: 'Value 3 Title', placeholder: 'Sustainable Heritage' },
    { key: 'value3Desc', label: 'Value 3 Desc',  placeholder: 'We support sustainable...', multiline: true },
  ]},
  { section: 'Stats',       fields: [
    { key: 'stat1Num',   label: 'Stat 1 Number', placeholder: '500+' },
    { key: 'stat1Label', label: 'Stat 1 Label',  placeholder: 'Sarees Curated' },
    { key: 'stat2Num',   label: 'Stat 2 Number', placeholder: '50+' },
    { key: 'stat2Label', label: 'Stat 2 Label',  placeholder: 'Artisan Families' },
    { key: 'stat3Num',   label: 'Stat 3 Number', placeholder: '10K+' },
    { key: 'stat3Label', label: 'Stat 3 Label',  placeholder: 'Happy Customers' },
    { key: 'stat4Num',   label: 'Stat 4 Number', placeholder: '15+' },
    { key: 'stat4Label', label: 'Stat 4 Label',  placeholder: 'Weaving Traditions' },
  ]},
  { section: 'Our Promise', fields: [
    { key: 'promiseTitle', label: 'Section Title', placeholder: 'The Mohanah Promise' },
    { key: 'promise1', label: 'Promise 1', placeholder: 'Every saree is handpicked...' },
    { key: 'promise2', label: 'Promise 2', placeholder: 'Quality checked before dispatch...' },
    { key: 'promise3', label: 'Promise 3', placeholder: 'Free delivery on orders above ₹2,000.' },
    { key: 'promise4', label: 'Promise 4', placeholder: '7-day easy returns...' },
    { key: 'promise5', label: 'Promise 5', placeholder: 'Secure payments...' },
  ]},
  { section: 'CTA Banner',  fields: [
    { key: 'ctaTitle', label: 'CTA Title', placeholder: 'Experience the Art of the Saree' },
    { key: 'ctaDesc',  label: 'CTA Description', placeholder: 'Explore our curated collection...', multiline: true },
  ]},
];

function AboutSection() {
  const [content, setContent] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI }) => {
      const allKeys = ABOUT_FIELDS.flatMap(s => s.fields.map(f => `about_${f.key}`));
      Promise.all(allKeys.map(k => settingsAPI.get(k).catch(() => null))).then(vals => {
        const fromDB = {};
        allKeys.forEach((k, i) => { if (vals[i]) fromDB[k.replace('about_', '')] = vals[i]; });
        setContent(fromDB);
      });
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { settingsAPI } = await import('../services/supabase');
      await Promise.all(
        Object.entries(content).map(([k, v]) => v != null ? settingsAPI.set(`about_${k}`, v) : Promise.resolve())
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  }

  const inputSt = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🏛️ About Us Page</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Edit all content on the About Us page. Changes go live instantly.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/about" target="_blank" style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            👁 Preview Page →
          </a>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save All Changes'}
          </button>
        </div>
      </div>

      {ABOUT_FIELDS.map(({ section, fields }) => (
        <div key={section} className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
            {section}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: fields.length <= 2 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {fields.map(({ key, label, placeholder, multiline }) => (
              <div key={key} style={multiline ? { gridColumn: '1 / -1' } : {}}>
                <label style={labelSt}>{label.toUpperCase()}</label>
                {multiline ? (
                  <textarea
                    value={content[key] || ''}
                    onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                    style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                ) : (
                  <input
                    value={content[key] || ''}
                    onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={inputSt}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg" style={{ marginTop: 4 }}>
        {saving ? '⏳ Saving...' : saved ? '✅ All Changes Saved!' : '💾 Save All Changes'}
      </button>
    </div>
  );
}

function LegalSection() {
  const [pages,       setPages]       = useState(() => legalDB.getAll());
  const [activeKey,   setActiveKey]   = useState('privacy');
  const [saved,       setSaved]       = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load legal pages from Supabase on mount (cross-device)
  useEffect(() => {
    import('../services/supabase').then(({ settingsAPI: sAPI }) => {
      const keys = ['privacy', 'terms', 'refund', 'shipping', 'contact'];
      keys.forEach(k => {
        sAPI.get(`legal_${k}`)
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

  const current = pages[activeKey] || {};

  function handleChange(field, value) {
    setPages(p => ({ ...p, [activeKey]: { ...p[activeKey], [field]: value } }));
  }

  async function handleSave() {
    legalDB.savePage(activeKey, pages[activeKey]);
    // Also save to Supabase
    try {
      const { settingsAPI: sAPI } = await import('../services/supabase');
      await sAPI.set(`legal_${activeKey}`, JSON.stringify(pages[activeKey]));
    } catch (e) { console.warn('Legal save to Supabase failed:', e.message); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSaveAll() {
    legalDB.saveAll(pages);
    // Save all to Supabase
    try {
      const { settingsAPI: sAPI } = await import('../services/supabase');
      const keys = ['privacy', 'terms', 'refund', 'shipping', 'contact'];
      await Promise.all(keys.map(k => sAPI.set(`legal_${k}`, JSON.stringify(pages[k]))));
    } catch (e) { console.warn('Legal saveAll to Supabase failed:', e.message); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputSt = {
    width: '100%', padding: '10px 13px', borderRadius: 8,
    border: '1.5px solid var(--border)', fontSize: 13,
    fontFamily: 'var(--font-sans)', background: 'var(--bg)',
    outline: 'none', color: 'var(--text)', boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>📜 Legal Pages</h2>
          <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>
            Update the content for all legal pages below. Changes are reflected on the website immediately.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/legal/${activeKey}`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            👁️ Preview Page
          </a>
          <button onClick={handleSaveAll}
            style={{ padding: '9px 20px', borderRadius: 8, background: saved ? '#2E7D32' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-sans)', transition: 'background 0.2s' }}>
            {saved ? '✅ All Saved!' : '💾 Save All Pages'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left sidebar: page list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEGAL_PAGES.map(p => (
            <button key={p.key} onClick={() => { setActiveKey(p.key); setSaved(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${activeKey === p.key ? p.color : 'var(--border)'}`,
                background: activeKey === p.key ? `${p.color}12` : 'var(--surface)',
                fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: activeKey === p.key ? p.color : 'var(--text)' }}>{p.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {pages[p.key]?.updatedAt
                    ? new Date(pages[p.key].updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Not edited yet'}
                </div>
              </div>
            </button>
          ))}

          {/* Tip */}
          <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 10, background: '#FFF8E1', border: '1px solid #FFE082' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F57F17', marginBottom: 4 }}>💡 Tip</div>
            <div style={{ fontSize: 11, color: '#795548', lineHeight: 1.6 }}>
              Use <strong>**bold text**</strong> to make headings.<br />
              Use ✅ or ❌ at line start for checkmarks.<br />
              Empty line = spacing.
            </div>
          </div>
        </div>

        {/* ── Right: editor ── */}
        <div className="card" style={{ padding: 24 }}>
          {/* Page title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              PAGE TITLE
            </label>
            <input
              value={current.title || ''}
              onChange={e => handleChange('title', e.target.value)}
              style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Page content */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>
                PAGE CONTENT
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {current.content?.length || 0} characters
              </span>
            </div>
            <textarea
              value={current.content || ''}
              onChange={e => handleChange('content', e.target.value)}
              rows={20}
              placeholder={`Write the ${current.title || 'page'} content here...\n\nFormatting:\n**Heading Text** — bold heading\n✅ Point 1 — green checkmark\n❌ Point 2 — red cross\nNormal paragraph text\n(empty line for spacing)`}
              style={{
                ...inputSt,
                resize: 'vertical', lineHeight: 1.7,
                fontFamily: 'monospace', fontSize: 13,
                minHeight: 400,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Formatting guide */}
          <div style={{ marginBottom: 20, background: 'var(--surface-alt)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontFamily: 'monospace', background: 'white', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>**Heading**</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>→ Bold heading</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontFamily: 'monospace', background: 'white', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>✅ Point</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>→ Green checkmark</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontFamily: 'monospace', background: 'white', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>❌ Point</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>→ Red cross</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontFamily: 'monospace', background: 'white', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{'{phone}'}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>→ Auto-fill from Settings</span>
            </div>
          </div>

          {/* Auto-fill variables info */}
          <div style={{ marginBottom: 20, background: '#E3F2FD', borderRadius: 10, padding: '12px 16px', border: '1px solid #BBDEFB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>🔁 Auto-fill Variables (automatically replaced from your Settings)</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['{storeName}', '{phone}', '{email}', '{address}', '{whatsapp}', '{freeDelivery}'].map(v => (
                <code key={v} style={{ fontSize: 11, background: 'white', padding: '2px 8px', borderRadius: 4, border: '1px solid #BBDEFB', color: '#1565C0' }}>{v}</code>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSave}
              style={{ padding: '11px 28px', borderRadius: 10, background: saved ? '#2E7D32' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-sans)', transition: 'background 0.2s' }}>
              {saved ? `✅ ${current.title} Saved!` : `💾 Save ${current.title}`}
            </button>
            <a href={`/legal/${activeKey}`} target="_blank" rel="noreferrer"
              style={{ padding: '11px 20px', borderRadius: 10, background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              👁️ Live Preview →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Social / Manual Orders Section ──────────
function SocialOrdersSection() {
  const SOURCES = [
    { id: 'whatsapp',  label: 'WhatsApp',  icon: '💬', color: '#25D366', bg: '#E8F5E9' },
    { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C', bg: '#FCE4EC' },
    { id: 'facebook',  label: 'Facebook',  icon: '📘', color: '#1877F2', bg: '#E3F2FD' },
    { id: 'phone',     label: 'Phone Call',icon: '📞', color: '#7B1FA2', bg: '#F3E5F5' },
    { id: 'walkin',    label: 'Walk-in',   icon: '🚶', color: '#E65100', bg: '#FFF3E0' },
    { id: 'other',     label: 'Other',     icon: '🌐', color: '#546E7A', bg: '#ECEFF1' },
  ];
  const STATUS_LIST = ['pending','confirmed','packed','shipped','delivered','cancelled'];
  const STATUS_COLOR = { pending:'#1565C0', confirmed:'#2E7D32', packed:'#F57F17', shipped:'#1565C0', delivered:'#2E7D32', cancelled:'#C62828' };
  const STATUS_BG    = { pending:'#E3F2FD', confirmed:'#E8F5E9', packed:'#FFF8E1', shipped:'#DDEEFF', delivered:'#C8E6C9', cancelled:'#FFEBEE' };

  const blankForm = { customerName:'', phone:'', source:'whatsapp', productName:'', productDesc:'', quantity:1, soldPrice:'', costPrice:'', vendorId:'', vendorName:'', trackingId:'', courier:'', status:'pending', notes:'' };

  const [orders,     setOrders]     = useState(() => manualOrdersDB.getAll());
  const [vendors,    setVendors]    = useState(() => vendorDB.getAll().filter(v => v.active !== false));
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(blankForm);
  const [search,     setSearch]     = useState('');
  const [srcFilter,  setSrcFilter]  = useState('All');
  const [stFilter,   setStFilter]   = useState('All');
  const [deleteId,   setDeleteId]   = useState(null);
  const [saved,      setSaved]      = useState(false);

  // Listen for cross-tab updates
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'mohanah_db_manual_orders') setOrders(manualOrdersDB.getAll());
      if (e.key === 'mohanah_db_vendors') setVendors(vendorDB.getAll().filter(v => v.active !== false));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const stats = manualOrdersDB.getStats();

  function openAdd() {
    setEditId(null);
    setForm(blankForm);
    setShowForm(true);
    setTimeout(() => document.getElementById('so-customer-name')?.focus(), 100);
  }

  function openEdit(o) {
    setEditId(o.id);
    setForm({
      customerName: o.customerName || '',
      phone:        o.phone        || '',
      source:       o.source       || 'whatsapp',
      productName:  o.productName  || '',
      productDesc:  o.productDesc  || '',
      quantity:     o.quantity     || 1,
      soldPrice:    o.soldPrice    || '',
      costPrice:    o.costPrice    || '',
      vendorId:     o.vendorId     || '',
      vendorName:   o.vendorName   || '',
      trackingId:   o.trackingId   || '',
      courier:      o.courier      || '',
      status:       o.status       || 'pending',
      notes:        o.notes        || '',
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.customerName.trim() || !form.productName.trim() || !form.soldPrice) {
      alert('Customer name, product name and sold price are required!');
      return;
    }
    const payload = {
      ...form,
      soldPrice: Number(form.soldPrice),
      costPrice: Number(form.costPrice) || 0,
      quantity:  Number(form.quantity)  || 1,
      profit:    (Number(form.soldPrice) || 0) - (Number(form.costPrice) || 0),
    };
    if (editId) {
      manualOrdersDB.update(editId, payload);
    } else {
      manualOrdersDB.add(payload);
    }
    setOrders(manualOrdersDB.getAll());
    setShowForm(false);
    setEditId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDelete(id) {
    manualOrdersDB.delete(id);
    setOrders(manualOrdersDB.getAll());
    setDeleteId(null);
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.customerName?.toLowerCase().includes(q) || o.phone?.includes(q) || o.productName?.toLowerCase().includes(q) || o.trackingId?.toLowerCase().includes(q);
    const matchSrc = srcFilter === 'All' || o.source === srcFilter;
    const matchSt  = stFilter  === 'All' || o.status === stFilter;
    return matchSearch && matchSrc && matchSt;
  });

  const inputSt = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, fontFamily:'var(--font-sans)', background:'var(--bg)', outline:'none', color:'var(--text)', boxSizing:'border-box' };
  const labelSt = { fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, display:'block', marginBottom:5 };
  const srcMeta = id => SOURCES.find(s => s.id === id) || SOURCES[5];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:900, marginBottom:2 }}>📱 Social Orders</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>WhatsApp, Instagram, Facebook, Phone — all manual orders in one place</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ New Order</button>
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:24 }}>
        {[
          { icon:'📦', label:'Total Orders',  value: stats.total,                                 color:'#1565C0', bg:'#E3F2FD' },
          { icon:'💰', label:'Total Revenue', value:`₹${stats.totalRevenue.toLocaleString('en-IN')}`, color:'#2E7D32', bg:'#E8F5E9' },
          { icon:'🛒', label:'Total Cost',    value:`₹${stats.totalCost.toLocaleString('en-IN')}`,    color:'#E65100', bg:'#FFF3E0' },
          { icon:'📈', label:'Net Profit',    value:`₹${stats.totalProfit.toLocaleString('en-IN')}`,  color: stats.totalProfit >= 0 ? '#2E7D32' : '#C62828', bg: stats.totalProfit >= 0 ? '#E8F5E9' : '#FFEBEE' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:4, border:`1px solid ${s.color}30` }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Source chips */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        {['All', ...SOURCES.map(s => s.id)].map(id => {
          const src = id === 'All' ? { label:'All', icon:'🔍', color:'var(--primary)', bg:'var(--surface-alt)' } : srcMeta(id);
          const active = srcFilter === id;
          const cnt = id === 'All' ? orders.length : orders.filter(o => o.source === id).length;
          return (
            <button key={id} onClick={() => setSrcFilter(id)} style={{
              padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
              background: active ? src.color : src.bg,
              color: active ? 'white' : src.color,
              transition:'all 0.2s',
            }}>{src.icon} {src.label} ({cnt})</button>
          );
        })}
      </div>

      {/* Search + Status filter */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Customer, product, tracking ID..."
          style={{ ...inputSt, flex:1, minWidth:200 }}
          onFocus={e => e.target.style.borderColor='var(--accent)'}
          onBlur={e => e.target.style.borderColor='var(--border)'} />
        <select value={stFilter} onChange={e => setStFilter(e.target.value)}
          style={{ ...inputSt, width:'auto', cursor:'pointer' }}>
          <option value="All">All Status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {/* Save toast */}
      {saved && (
        <div style={{ background:'#E8F5E9', border:'1px solid #A5D6A7', borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, color:'#2E7D32', fontWeight:700 }}>
          ✓ Order saved successfully!
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card" style={{ padding:'24px', marginBottom:24, border:'2px solid var(--accent)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:900 }}>
              {editId ? '✏️ Edit Order' : '➕ New Social Order'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>

            {/* Source */}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={labelSt}>ORDER SOURCE *</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {SOURCES.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, source:s.id }))} style={{
                    padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
                    background: form.source === s.id ? s.color : s.bg,
                    color: form.source === s.id ? 'white' : s.color,
                    transition:'all 0.2s',
                  }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label style={labelSt}>CUSTOMER NAME *</label>
              <input id="so-customer-name" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName:e.target.value }))}
                placeholder="e.g. Priya Sharma" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Phone */}
            <div>
              <label style={labelSt}>PHONE / WHATSAPP NUMBER</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone:e.target.value }))}
                placeholder="e.g. 9876543210" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Product Name */}
            <div>
              <label style={labelSt}>PRODUCT NAME *</label>
              <input value={form.productName} onChange={e => setForm(f => ({ ...f, productName:e.target.value }))}
                placeholder="e.g. Banarasi Silk Red" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Quantity */}
            <div>
              <label style={labelSt}>QUANTITY</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity:e.target.value }))}
                style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Product Desc */}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={labelSt}>PRODUCT DETAILS / NOTES (optional)</label>
              <input value={form.productDesc} onChange={e => setForm(f => ({ ...f, productDesc:e.target.value }))}
                placeholder="e.g. Size, color variant, special customization..." style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Sold Price */}
            <div>
              <label style={labelSt}>SOLD PRICE (₹) * <span style={{ color:'var(--success)', fontWeight:400 }}>— amount paid by customer</span></label>
              <input type="number" value={form.soldPrice} onChange={e => setForm(f => ({ ...f, soldPrice:e.target.value }))}
                placeholder="e.g. 4500" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Cost Price */}
            <div>
              <label style={labelSt}>COST / PURCHASE PRICE (₹) <span style={{ color:'var(--error)', fontWeight:400 }}>— your purchase cost</span></label>
              <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice:e.target.value }))}
                placeholder="e.g. 2800" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Vendor */}
            <div>
              <label style={labelSt}>VENDOR / SUPPLIER</label>
              <select
                value={form.vendorId}
                onChange={e => {
                  const v = vendors.find(v => v.id === e.target.value);
                  setForm(f => ({ ...f, vendorId: e.target.value, vendorName: v ? v.name : '' }));
                }}
                style={{ ...inputSt, cursor:'pointer' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              >
                <option value="">— Select vendor (optional) —</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.city ? ` · ${v.city}` : ''}
                  </option>
                ))}
              </select>
              {form.vendorId && (
                <div style={{ marginTop:5, fontSize:11, color:'var(--accent)', fontWeight:600 }}>✓ {form.vendorName}</div>
              )}
              {vendors.length === 0 && (
                <div style={{ marginTop:5, fontSize:11, color:'var(--text-muted)' }}>No vendors added yet — go to the <strong>Vendors</strong> section first.</div>
              )}
            </div>

            {/* Auto Profit Preview */}
            {form.soldPrice && (
              <div style={{ gridColumn:'1 / -1', background: Number(form.soldPrice) - Number(form.costPrice || 0) >= 0 ? '#E8F5E9' : '#FFEBEE', borderRadius:10, padding:'12px 16px' }}>
                <span style={{ fontSize:13, fontWeight:800, color: Number(form.soldPrice) - Number(form.costPrice || 0) >= 0 ? '#2E7D32' : '#C62828' }}>
                  📈 Profit: ₹{(Number(form.soldPrice) - Number(form.costPrice || 0)).toLocaleString('en-IN')}
                  {form.costPrice && Number(form.costPrice) > 0 && (
                    <span style={{ fontWeight:400, fontSize:12, marginLeft:8 }}>
                      ({Math.round(((Number(form.soldPrice) - Number(form.costPrice)) / Number(form.costPrice)) * 100)}% margin)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Tracking ID */}
            <div>
              <label style={labelSt}>TRACKING ID / AWB NUMBER</label>
              <input value={form.trackingId} onChange={e => setForm(f => ({ ...f, trackingId:e.target.value }))}
                placeholder="e.g. DTDC123456789" style={inputSt}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Courier */}
            <div>
              <label style={labelSt}>COURIER / SHIPPING PARTNER</label>
              <select value={form.courier} onChange={e => setForm(f => ({ ...f, courier:e.target.value }))}
                style={{ ...inputSt, cursor:'pointer' }}>
                <option value="">— Select —</option>
                {['DTDC','Blue Dart','Delhivery','India Post','Ekart','Xpressbees','Amazon Shipping','Self Delivery','Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={labelSt}>ORDER STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))}
                style={{ ...inputSt, cursor:'pointer' }}>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={labelSt}>INTERNAL NOTES (admin only)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))}
                placeholder="Any extra notes — payment received via UPI, special instructions, etc."
                rows={2} style={{ ...inputSt, resize:'vertical', lineHeight:1.5 }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
          </div>

          <div style={{ display:'flex', gap:12, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <button onClick={handleSave} className="btn btn-primary" style={{ minWidth:160 }}>
              {editId ? '✓ Update Order' : '✓ Save Order'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📱</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:800, marginBottom:8 }}>
            {orders.length === 0 ? 'No social orders yet' : 'No results found'}
          </div>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
            {orders.length === 0 ? 'Add orders received via WhatsApp, Instagram, phone or any other channel.' : 'Try adjusting your search or filters.'}
          </p>
          {orders.length === 0 && <button onClick={openAdd} className="btn btn-primary">+ Add First Order</button>}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(o => {
            const src = srcMeta(o.source);
            const profit = (Number(o.soldPrice) || 0) - (Number(o.costPrice) || 0);
            return (
              <div key={o.id} className="card" style={{ padding:'16px 18px', border:`1.5px solid ${src.color}30` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>

                  {/* Source badge */}
                  <div style={{ width:42, height:42, borderRadius:12, background:src.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {src.icon}
                  </div>

                  {/* Main info */}
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--font-serif)', fontWeight:800, fontSize:15, color:'var(--text)' }}>{o.customerName}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:src.color, background:src.bg, padding:'2px 8px', borderRadius:12 }}>{src.icon} {src.label}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:STATUS_COLOR[o.status] || '#546E7A', background:STATUS_BG[o.status] || '#ECEFF1', padding:'2px 8px', borderRadius:12 }}>
                        {o.status?.charAt(0).toUpperCase()+o.status?.slice(1)}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:3 }}>{o.productName}{o.quantity > 1 ? ` × ${o.quantity}` : ''}</div>
                    {o.vendorName && (
                      <div style={{ fontSize:11, color:'var(--accent)', fontWeight:700, marginBottom:3 }}>🏭 {o.vendorName}</div>
                    )}
                    {o.productDesc && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{o.productDesc}</div>}
                    {o.phone && (
                      <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer"
                        style={{ fontSize:11, color:'#25D366', fontWeight:700, textDecoration:'none' }}>
                        💬 {o.phone}
                      </a>
                    )}
                  </div>

                  {/* Price & Profit */}
                  <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'flex-end', minWidth:120 }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:18, fontWeight:900, color:'var(--primary)' }}>₹{Number(o.soldPrice).toLocaleString('en-IN')}</div>
                    {o.costPrice > 0 && (
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>Cost: ₹{Number(o.costPrice).toLocaleString('en-IN')}</div>
                    )}
                    <div style={{ fontSize:12, fontWeight:800, color: profit >= 0 ? '#2E7D32' : '#C62828', background: profit >= 0 ? '#E8F5E9' : '#FFEBEE', padding:'2px 8px', borderRadius:8 }}>
                      📈 ₹{profit.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Tracking + Date row */}
                <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', marginTop:12, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  {o.trackingId ? (
                    <div style={{ fontSize:12, color:'var(--text)', background:'#E3F2FD', padding:'4px 10px', borderRadius:8, fontWeight:700 }}>
                      🚚 {o.trackingId}{o.courier ? ` · ${o.courier}` : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>🚚 No tracking yet</div>
                  )}
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>📅 {o.date}</div>
                  {o.notes && (
                    <div style={{ width:'100%', fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>📝 {o.notes}</div>
                  )}
                  {/* Actions */}
                  <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                    {o.phone && (
                      <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`Hello ${o.customerName}! Your order "${o.productName}" has been ${o.status}.${o.trackingId ? ` Tracking ID: ${o.trackingId}` : ''}`)}`}
                        target="_blank" rel="noreferrer"
                        style={{ padding:'5px 10px', borderRadius:7, background:'#E8F5E9', color:'#25D366', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
                        💬 Update
                      </a>
                    )}
                    <button onClick={() => openEdit(o)} style={{ padding:'5px 12px', borderRadius:7, background:'#E3F2FD', color:'#1565C0', border:'none', cursor:'pointer', fontSize:12, fontWeight:700 }}>✏️ Edit</button>
                    <button onClick={() => setDeleteId(o.id)} style={{ padding:'5px 10px', borderRadius:7, background:'#FFEBEE', color:'var(--error)', border:'none', cursor:'pointer', fontSize:12, fontWeight:700 }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ padding:'28px 28px', maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:900, marginBottom:8 }}>Delete this order?</h3>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>This action cannot be undone.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => handleDelete(deleteId)} className="btn" style={{ background:'var(--error)', color:'white', padding:'9px 24px', borderRadius:9, border:'none', cursor:'pointer', fontWeight:700, fontSize:13 }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ────────────────────────
function SettingsSection({ useBackend }) {
  const [settings, setSettings]   = useState(() => settingsDB.get());
  const [saved,    setSaved]      = useState(false);
  const qrInputRef                = useRef();

  useEffect(() => {
    // Load from Supabase (cross-device)
    supabaseCategoriesAPI.getAll && (() => {})(); // ensure import loaded
    import('../services/supabase').then(({ settingsAPI: sAPI }) => {
      const keys = ['storeName','tagline','email','phone','address','gstNumber','instagram','facebook','whatsappNumber','upiId','currency','deliveryLine1','deliveryLine2','deliveryLine3','heroBadge','heroTitle1','heroTitle2','heroSubtitle','heroBtn1','heroBtn2','heroStat1Num','heroStat1Label','heroStat2Num','heroStat2Label','heroStat3Num','heroStat3Label'];
      Promise.all(keys.map(k => sAPI.get(k).then(v => ({ k, v })).catch(() => ({ k, v: null }))))
        .then(results => {
          const fromDB = {};
          results.forEach(({ k, v }) => { if (v !== null) fromDB[k] = v; });
          if (Object.keys(fromDB).length > 0) {
            setSettings(s => ({ ...s, ...fromDB }));
          }
        });
    });
  }, []);

  const inputSt = { width: '100%', padding: '10px 13px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 };

  async function handleSave() {
    settingsDB.save(settings);
    // Save each key to Supabase (cross-device)
    try {
      const { settingsAPI: sAPI } = await import('../services/supabase');
      const keys = ['storeName','tagline','email','phone','address','gstNumber','instagram','facebook','whatsappNumber','upiId','currency','deliveryLine1','deliveryLine2','deliveryLine3','heroBadge','heroTitle1','heroTitle2','heroSubtitle','heroBtn1','heroBtn2','heroStat1Num','heroStat1Label','heroStat2Num','heroStat2Label','heroStat3Num','heroStat3Label'];
      await Promise.all(keys.map(k => settings[k] != null ? sAPI.set(k, settings[k]) : Promise.resolve()));
    } catch (e) { console.warn('Settings Supabase save failed:', e.message); }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleQrUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setSettings(s => ({ ...s, upiQrCode: e.target.result }));
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, marginBottom: 24 }}>⚙️ Store Settings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Store Info */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🏪 Store Information</div>
          {[['STORE NAME', 'storeName', 'text'], ['TAGLINE', 'tagline', 'text'], ['CONTACT EMAIL', 'email', 'email'], ['PHONE NUMBER', 'phone', 'tel'], ['STORE ADDRESS', 'address', 'text'], ['GST NUMBER', 'gstNumber', 'text'], ['INSTAGRAM PAGE/HANDLE', 'instagram', 'text'], ['FACEBOOK PAGE/LINK', 'facebook', 'text']].map(([label, key, type]) => (
            <div key={key}>
              <label style={labelSt}>{label}</label>
              <input type={type} value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── UPI & WhatsApp Payment Card ── */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>💳 UPI & WhatsApp Settings</div>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: -8 }}>
              These values are used on the checkout payment page and the WhatsApp chat button.
            </p>

            {/* UPI ID */}
            <div>
              <label style={labelSt}>UPI ID *</label>
              <input
                type="text"
                value={settings.upiId || ''}
                onChange={e => setSettings(s => ({ ...s, upiId: e.target.value }))}
                placeholder="e.g. mohanah@ybl or 9876543210@paytm"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                This UPI ID will be shown to customers on the payment page.
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label style={labelSt}>WHATSAPP NUMBER *</label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={e => setSettings(s => ({ ...s, whatsappNumber: e.target.value }))}
                placeholder="e.g. 919876543210 (91 + your number)"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Enter 91 followed by your 10-digit mobile number. No spaces or + sign.
              </div>
            </div>

            {/* UPI QR Code Upload */}
            <div>
              <label style={labelSt}>UPI QR CODE IMAGE</label>
              <input ref={qrInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleQrUpload(e.target.files[0])} />

              {settings.upiQrCode ? (
                /* QR Preview */
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--surface-alt)', borderRadius: 10, padding: 12, border: '1.5px solid var(--border)' }}>
                  <img
                    src={settings.upiQrCode}
                    alt="UPI QR"
                    style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 8, background: 'white', padding: 4, border: '1px solid var(--border)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#2E7D32', marginBottom: 4 }}>✅ QR Code Uploaded</div>
                    <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
                      This QR code is shown to customers so they can scan and pay directly.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => qrInputRef.current.click()}
                        style={{ padding: '5px 12px', borderRadius: 7, background: '#E3F2FD', color: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        🔄 Replace
                      </button>
                      <button onClick={() => setSettings(s => ({ ...s, upiQrCode: '' }))}
                        style={{ padding: '5px 12px', borderRadius: 7, background: '#FFEBEE', color: '#C62828', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload zone */
                <div
                  onClick={() => qrInputRef.current.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#FBF0E8'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  onDrop={e => { e.preventDefault(); handleQrUpload(e.dataTransfer.files[0]); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface-alt)', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📱</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>Click or drag & drop your UPI QR Code</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download your QR from Google Pay / PhonePe / Paytm app</div>
                </div>
              )}
            </div>

            {/* Live Preview */}
            {(settings.upiId || settings.whatsappNumber) && (
              <div style={{ background: '#F0F7FF', borderRadius: 10, padding: '12px 14px', border: '1px solid #BBDEFB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 6, letterSpacing: 0.5 }}>LIVE PREVIEW</div>
                {settings.upiId && (
                  <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 4 }}>
                    💳 <strong>UPI ID on checkout:</strong> {settings.upiId}
                  </div>
                )}
                {settings.whatsappNumber && (
                  <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                    💬 <strong>WhatsApp chat:</strong> +{settings.whatsappNumber}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delivery Card */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🚚 Delivery & Payment</div>
            <div>
              <label style={labelSt}>FREE DELIVERY ABOVE (₹)</label>
              <input type="number" value={settings.freeDeliveryAbove || ''} onChange={e => setSettings(s => ({ ...s, freeDeliveryAbove: e.target.value }))} style={inputSt} />
            </div>
            <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Payment Methods</div>
              {['UPI / Google Pay / PhonePe', 'Credit / Debit Cards', 'Net Banking', 'Cash on Delivery', 'EMI (via Razorpay)'].map(pm => (
                <label key={pm} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                  {pm}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery Info (shown on every product page) ── */}
      <div className="card" style={{ padding: 24, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🚚 Product Page — Delivery Info</div>
        <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: -8 }}>These 3 lines appear on every product detail page. Edit or leave blank to hide.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['DELIVERY LINE', 'deliveryLine1', '🚚', 'Free delivery on orders above ₹2,000'],
            ['RETURNS LINE', 'deliveryLine2', '🔄', '7-day easy returns & exchange'],
            ['QUALITY LINE', 'deliveryLine3', '🔒', '100% authentic, quality guaranteed'],
          ].map(([label, key, icon, placeholder]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <label style={labelSt}>{label}</label>
                <input value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder} style={inputSt}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero Banner Text ── */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🏠 Home Page — Hero Text</div>
        <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 16 }}>Edit the home page heading, subtitle, buttons and stats from here.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['BADGE TEXT', 'heroBadge', 'NEW COLLECTION 2024'],
            ['HEADING LINE 1', 'heroTitle1', 'Where Every Saree'],
            ['HEADING LINE 2 (colored)', 'heroTitle2', 'Tells A Story'],
            ['SUBTITLE', 'heroSubtitle', 'Discover handcrafted sarees...'],
            ['BUTTON 1', 'heroBtn1', 'Explore Collection'],
            ['BUTTON 2', 'heroBtn2', 'New Arrivals'],
          ].map(([label, key, placeholder]) => (
            <div key={key} style={key === 'heroSubtitle' ? { gridColumn: '1 / -1' } : {}}>
              <label style={labelSt}>{label}</label>
              <input value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                placeholder={placeholder} style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ ...labelSt, marginBottom: 10 }}>STATS (3 numbers shown below buttons)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              ['heroStat1Num', '500+', 'heroStat1Label', 'Sarees'],
              ['heroStat2Num', '10K+', 'heroStat2Label', 'Happy Customers'],
              ['heroStat3Num', '4.8★', 'heroStat3Label', 'Avg Rating'],
            ].map(([nKey, nPh, lKey, lPh]) => (
              <div key={nKey} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={settings[nKey] || ''} onChange={e => setSettings(s => ({ ...s, [nKey]: e.target.value }))}
                  placeholder={nPh} style={{ ...inputSt, fontWeight: 800, fontSize: 16 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <input value={settings[lKey] || ''} onChange={e => setSettings(s => ({ ...s, [lKey]: e.target.value }))}
                  placeholder={lPh} style={{ ...inputSt, fontSize: 11 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button — full width at bottom */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleSave}
          className="btn btn-primary btn-lg"
          style={{ minWidth: 220 }}>
          {saved ? '✅ All Settings Saved!' : '💾 Save All Settings'}
        </button>
        {saved && <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Changes applied to checkout & WhatsApp chat.</span>}
      </div>

      {/* ── Categories Manager ── */}
      <CategoriesManager />

      {/* ── FAQ Manager ── */}
      <FaqManager />

      {/* ── Change Admin Password ── */}
      <AdminPasswordChanger />
    </div>
  );
}

// ─── FAQ Manager ─────────────────────────────
function FaqManager() {
  const [faqs, setFaqs] = useState(() => faqsDB.getAll());
  const [editIdx, setEditIdx] = useState(null); // null = add new
  const [form, setForm] = useState({ q: '', a: '' });
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputSt = { width: '100%', padding: '10px 13px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 };

  function openAdd() {
    setForm({ q: '', a: '' });
    setEditIdx(null);
    setShowForm(true);
  }

  function openEdit(i) {
    setForm({ q: faqs[i].q, a: faqs[i].a });
    setEditIdx(i);
    setShowForm(true);
  }

  function saveFaq() {
    if (!form.q.trim() || !form.a.trim()) return;
    let updated;
    if (editIdx !== null) {
      updated = faqs.map((f, i) => i === editIdx ? { ...f, q: form.q.trim(), a: form.a.trim() } : f);
    } else {
      updated = [...faqs, { id: `faq${Date.now()}`, q: form.q.trim(), a: form.a.trim() }];
    }
    setFaqs(updated);
    faqsDB.save(updated);
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function deleteFaq(i) {
    const updated = faqs.filter((_, idx) => idx !== i);
    setFaqs(updated);
    faqsDB.save(updated);
  }

  function moveUp(i) {
    if (i === 0) return;
    const updated = [...faqs];
    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
    setFaqs(updated);
    faqsDB.save(updated);
  }

  function moveDown(i) {
    if (i === faqs.length - 1) return;
    const updated = [...faqs];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    setFaqs(updated);
    faqsDB.save(updated);
  }

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>❓ FAQ Manager</div>
        <button onClick={openAdd} className="btn btn-primary btn-sm">+ Add FAQ</button>
      </div>

      {saved && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#2E7D32', fontWeight: 700 }}>
          ✅ FAQs saved successfully!
        </div>
      )}

      {/* FAQ list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {faqs.map((faq, i) => (
          <div key={faq.id || i} style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--surface-alt)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>Q: {faq.q}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5 }}>A: {faq.a}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 11, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => moveDown(i)} disabled={i === faqs.length - 1}
                    style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 11, opacity: i === faqs.length - 1 ? 0.3 : 1 }}>▼</button>
                  <button onClick={() => openEdit(i)}
                    style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✏️</button>
                  <button onClick={() => deleteFaq(i)}
                    style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #FFCDD2', background: '#FFF5F5', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#C62828' }}>✕</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
            No FAQs yet. Click "+ Add FAQ" to get started.
          </div>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>{editIdx !== null ? '✏️ Edit FAQ' : '➕ Add New FAQ'}</div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>QUESTION</label>
            <input value={form.q} onChange={e => setForm(f => ({ ...f, q: e.target.value }))}
              placeholder="e.g. How long does delivery take?"
              style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>ANSWER</label>
            <textarea value={form.a} onChange={e => setForm(f => ({ ...f, a: e.target.value }))}
              placeholder="Type the answer here..."
              rows={3}
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
            <button onClick={saveFaq} disabled={!form.q.trim() || !form.a.trim()}
              className="btn btn-primary" style={{ flex: 2 }}>
              💾 {editIdx !== null ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Password Changer ──────────────────
const ADMIN_CREDS_KEY = 'mohanah_admin_creds';
function getAdminCreds() {
  try { return JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY)) || { email: '', password: '' }; } catch { return { email: '', password: '' }; }
}

function AdminPasswordChanger() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ cur: false, new: false, con: false });
  const [msg, setMsg] = useState({ text: '', error: false });
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMsg({ text: 'All fields are required.', error: true }); return;
    }
    if (form.newPassword.length < 8) {
      setMsg({ text: 'New password must be at least 8 characters.', error: true }); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ text: 'New passwords do not match.', error: true }); return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('../services/supabase');

      // Step 1: Verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: form.currentPassword,
      });
      if (signInError) {
        setMsg({ text: '❌ Current password is incorrect.', error: true });
        setLoading(false); return;
      }

      // Step 2: Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.newPassword,
      });
      if (updateError) {
        setMsg({ text: '❌ Failed: ' + updateError.message, error: true });
        setLoading(false); return;
      }

      // Step 3: Also update localStorage for backward compat
      const creds = getAdminCreds();
      localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify({ ...creds, password: form.newPassword }));

      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMsg({ text: '✅ Password changed successfully! Use new password next time you login.', error: false });
      setTimeout(() => setMsg({ text: '', error: false }), 5000);
    } catch (err) {
      setMsg({ text: '❌ Error: ' + err.message, error: true });
    }
    setLoading(false);
  }

  const inputSt = { width: '100%', padding: '10px 13px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };
  const labelSt = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 5 };

  return (
    <div className="card" style={{ padding: 24, marginTop: 24, maxWidth: 480 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, marginBottom: 18 }}>🔐 Change Admin Password</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'CURRENT PASSWORD', key: 'currentPassword', vis: show.cur, toggle: () => setShow(s => ({ ...s, cur: !s.cur })) },
          { label: 'NEW PASSWORD', key: 'newPassword', vis: show.new, toggle: () => setShow(s => ({ ...s, new: !s.new })) },
          { label: 'CONFIRM NEW PASSWORD', key: 'confirmPassword', vis: show.con, toggle: () => setShow(s => ({ ...s, con: !s.con })) },
        ].map(({ label, key, vis, toggle }) => (
          <div key={key}>
            <label style={labelSt}>{label}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={vis ? 'text' : 'password'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ ...inputSt, paddingRight: 40 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="button" onClick={toggle}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}>
                {vis ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        ))}
        {msg.text && (
          <div style={{ fontSize: 13, color: msg.error ? 'var(--error, #c62828)' : 'var(--success, #2e7d32)', fontWeight: 600, padding: '8px 12px', background: msg.error ? '#ffebee' : '#e8f5e9', borderRadius: 8 }}>
            {msg.text}
          </div>
        )}
        <button onClick={handleChange} disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          {loading ? '⏳ Updating...' : '🔑 Update Password'}
        </button>
      </div>
    </div>
  );
}

// ─── Categories Manager (Fabrics & Occasions) — Supabase ─
function CategoriesManager() {
  const [fabrics,      setFabrics]      = useState([]);
  const [occasions,    setOccasions]    = useState([]);
  const [allCats,      setAllCats]      = useState([]); // full objects with id
  const [newFabric,    setNewFabric]    = useState('');
  const [newOccasion,  setNewOccasion]  = useState('');
  const [saved,        setSaved]        = useState('');
  const [loading,      setLoading]      = useState(true);

  async function loadCats() {
    try {
      const data = await supabaseCategoriesAPI.getAll();
      setAllCats(data || []);
      setFabrics((data || []).filter(c => c.type === 'fabric').map(c => ({ id: c.id, name: c.name })));
      setOccasions((data || []).filter(c => c.type === 'occasion').map(c => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.warn('Categories load failed:', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCats(); }, []);

  async function addFabric() {
    const v = newFabric.trim();
    if (!v) return;
    try {
      await supabaseCategoriesAPI.add('fabric', v);
      setNewFabric('');
      flash('Fabric added!');
      loadCats();
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function removeFabric(id) {
    try {
      await supabaseCategoriesAPI.remove(id);
      flash('Removed!');
      loadCats();
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function addOccasion() {
    const v = newOccasion.trim();
    if (!v) return;
    try {
      await supabaseCategoriesAPI.add('occasion', v);
      setNewOccasion('');
      flash('Occasion added!');
      loadCats();
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function removeOccasion(id) {
    try {
      await supabaseCategoriesAPI.remove(id);
      flash('Removed!');
      loadCats();
    } catch (e) { alert('Error: ' + e.message); }
  }

  function flash(msg) {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2000);
  }

  const inputSt = { flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg)', outline: 'none', color: 'var(--text)' };
  const chipSt  = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text)' };

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>🏷️ Product Categories</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Supabase se sync — har device par same dikhega</div>
        </div>
        {saved && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ {saved}</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading from Supabase...</div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

        {/* ── Fabrics ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1.2, marginBottom: 12 }}>🧵 FABRIC TYPES ({fabrics.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, minHeight: 36 }}>
            {fabrics.map(f => (
              <span key={f.id} style={chipSt}>
                {f.name}
                <button onClick={() => removeFabric(f.id)}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'var(--error)', color: 'white', fontSize: 9, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newFabric} onChange={e => setNewFabric(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFabric()}
              placeholder="e.g. Patola, Pochampally..."
              style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <button onClick={addFabric}
              style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>
              + Add
            </button>
          </div>
        </div>

        {/* ── Occasions ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1.2, marginBottom: 12 }}>🎉 OCCASION TYPES ({occasions.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, minHeight: 36 }}>
            {occasions.map(o => (
              <span key={o.id} style={chipSt}>
                {o.name}
                <button onClick={() => removeOccasion(o.id)}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'var(--error)', color: 'white', fontSize: 9, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newOccasion} onChange={e => setNewOccasion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addOccasion()}
              placeholder="e.g. Diwali, Eid, Navratri..."
              style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <button onClick={addOccasion}
              style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>
              + Add
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Customers Section ───────────────────────
function CustomersSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    import('../services/supabase').then(({ supabase }) => {
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setCustomers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').includes(q);
  });

  function exportCSV() {
    const rows = [['Name','Email','Phone','City','Joined']];
    customers.forEach(c => rows.push([c.name||'', c.email||'', c.phone||'', c.city||'', c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'mohanah_customers.csv'; a.click();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900 }}>👥 Customers ({customers.length})</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, email, phone..."
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', minWidth: 220 }} />
          <button onClick={exportCSV} className="btn btn-accent btn-sm">📥 Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No customers yet</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Customers will appear here once they sign up on your store.<br />
            Make sure the profiles table and trigger are set up in Supabase.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)' }}>
                {['Customer', 'Email', 'Phone', 'City', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {(c.name || c.email || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-sec)' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-sec)' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-sec)' }}>{c.city || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.email && (
                      <a href={`mailto:${c.email}`}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#E8F5E9', color: 'var(--success)', textDecoration: 'none', fontWeight: 700 }}>
                        ✉️ Email
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>No customers match "{search}"</div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
//  MAIN ADMIN PAGE
// ────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [productList, setProductList] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useBackend, setUseBackend] = useState(false);
  const [stats, setStats] = useState(() => getDBStats());
  const [backendStatus, setBackendStatus] = useState('checking');

  // Load products from Supabase on mount — works on ALL devices
  useEffect(() => {
    setBackendStatus('online');
    supabaseProductsAPI.getAll()
      .then(data => {
        if (data && data.length > 0) {
          setProductList(data.map(normalizeAdminProduct));
        } else {
          // Supabase empty — try localStorage as last resort
          const local = productsDB.getAll();
          if (local.length > 0) setProductList(local);
        }
      })
      .catch(() => {
        // Fallback to localStorage if Supabase fails
        setProductList(productsDB.getAll());
        setBackendStatus('offline');
      });
  }, []);

  function normalizeAdminProduct(p) {
    return {
      ...p,
      imageUrl:          p.imageUrl          || p.image_url          || '',
      originalPrice:     p.originalPrice     ?? p.original_price     ?? null,
      inStock:           p.inStock           ?? p.in_stock           ?? p.stock ?? true,
      isNew:             p.isNew             ?? p.is_new             ?? false,
      isTrending:        p.isTrending        ?? p.is_trending        ?? false,
      occasions:         Array.isArray(p.occasions) && p.occasions.length ? p.occasions : (p.occasion ? [p.occasion] : []),
      images:            Array.isArray(p.images) ? p.images : (p.image_url ? [{ src: p.image_url }] : []),
      color:             p.color             || '#8B1A1A',
      length:            p.length            || '',
      blousePiece:       p.blousePiece       || p.blouse_piece       || '',
      careInstructions:  p.careInstructions  || p.care_instructions  || '',
      colorVariants:     Array.isArray(p.colorVariants) ? p.colorVariants : (Array.isArray(p.color_variants) ? p.color_variants : []),
    };
  }

  async function refreshProducts() {
    // Try Supabase first
    try {
      const data = await supabaseProductsAPI.getAll();
      if (data && data.length > 0) {
        setProductList(data.map(normalizeAdminProduct));
        setStats(getDBStats());
        return;
      }
    } catch {}
    // Fallback to localStorage
    setProductList(productsDB.getAll());
    setStats(getDBStats());
  }

  async function handleSaveProduct(product) {
    const supabaseProduct = {
      name:             product.name,
      fabric:           product.fabric,
      occasion:         product.occasion || (product.occasions?.[0] ?? 'Wedding'),
      occasions:        product.occasions || [product.occasion || 'Wedding'],
      price:            product.price,
      original_price:   product.originalPrice || null,
      discount:         product.discount || 0,
      image_url:        product.imageUrl || '',
      images:           product.images || [],
      reels:            product.reels || [],
      color:            product.color || '#8B1A1A',
      region:           product.region || '',
      description:      product.description || '',
      stock:            product.inStock !== false,
      in_stock:         product.inStock !== false,
      is_new:           product.isNew || false,
      is_trending:      product.isTrending || false,
      rating:           product.rating || 4.5,
      reviews:          product.reviews || 0,
      vendor_id:        null,
      vendor_name:      product.vendorName || '',
      length:           product.length || '',
      blouse_piece:     product.blousePiece === 'Custom' ? (product.blousePieceCustom || '') : (product.blousePiece || ''),
      care_instructions: product.careInstructions || '',
      color_variants:   product.colorVariants || [],
    };

    try {
      if (editProduct) {
        // UPDATE
        const targetId = editProduct._supabase_id || editProduct.id;
        const updated = await supabaseProductsAPI.update(targetId, supabaseProduct);
        // Immediately update productList state — no wait needed
        setProductList(prev => prev.map(p => p.id === targetId ? normalizeAdminProduct({ ...updated }) : p));
      } else {
        // INSERT — get back UUID
        const saved = await supabaseProductsAPI.add(supabaseProduct);
        if (saved?.id) {
          // Immediately add to top of list — no race condition
          setProductList(prev => [normalizeAdminProduct(saved), ...prev]);
          productsDB.add({ ...product, _supabase_id: saved.id });
        }
      }
    } catch (err) {
      console.error('Supabase save error:', err.message);
      alert('❌ Save failed: ' + err.message);
      return;
    }

    setEditProduct(null);
    setActiveSection('inventory');
    // Sync full list from Supabase in background (no blocking)
    setTimeout(() => refreshProducts(), 800);
  }

  function handleEdit(product) {
    setEditProduct(product);
    setActiveSection('add-product');
  }

  async function handleDelete(id) {
    // Delete from Supabase (cross-device)
    try { await supabaseProductsAPI.delete(id); } catch {}
    // Also try to delete using supabase_id if stored
    const local = productsDB.getAll().find(p => p.id === id);
    if (local?._supabase_id) {
      try { await supabaseProductsAPI.delete(local._supabase_id); } catch {}
    }
    productsDB.delete(id);
    await refreshProducts();
  }

  async function handleToggleStock(id) {
    // Get current stock from productList (Supabase normalized data)
    const current = productList.find(p => p.id === id);
    const newStock = !(current?.inStock !== false);
    try {
      // id is Supabase UUID directly
      await supabaseProductsAPI.update(id, { stock: newStock, in_stock: newStock });
    } catch (err) {
      console.warn('Toggle stock error:', err.message);
    }
    await refreshProducts();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F8' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 220 : 64, flexShrink: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Collapse toggle */}
        <button onClick={() => setSidebarOpen(o => !o)}
          style={{ padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-end' : 'center', paddingRight: sidebarOpen ? 16 : 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, transition: 'all 0.2s' }}>
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* Logo */}
        {sidebarOpen && (
          <div style={{ padding: '4px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img
              src="/mohanah_logo.svg"
              alt="Mohanah"
              style={{ width: 168, height: 'auto', borderRadius: 8, display: 'block' }}
            />
            <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: 3, fontWeight: 700, textAlign: 'center' }}>ADMIN PANEL</div>
          </div>
        )}
        {/* Collapsed — show mini saree icon */}
        {!sidebarOpen && (
          <div style={{ padding: '4px 0 12px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <img
              src="/mohanah_logo.svg"
              alt="M"
              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActiveSection(item.id); if (item.id !== 'add-product') setEditProduct(null); }}
              style={{
                width: '100%', padding: sidebarOpen ? '11px 20px' : '11px 0',
                display: 'flex', alignItems: 'center', gap: 12,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeSection === item.id ? 'rgba(201,149,108,0.2)' : 'transparent',
                borderLeft: activeSection === item.id ? '3px solid var(--accent)' : '3px solid transparent',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <span style={{ fontSize: 13, fontWeight: activeSection === item.id ? 800 : 500, color: activeSection === item.id ? 'var(--accent-light)' : 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>


        {/* Bottom: logout */}
        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: sidebarOpen ? '10px 20px' : '10px 0', display: 'flex', alignItems: 'center', gap: 12, justifyContent: sidebarOpen ? 'flex-start' : 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🏪</span>
            {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>View Store</span>}
          </button>
          <button onClick={async () => { await authAPI.signOut(); navigate('/admin-login'); }}
            style={{ width: '100%', padding: sidebarOpen ? '10px 20px' : '10px 0', display: 'flex', alignItems: 'center', gap: 12, justifyContent: sidebarOpen ? 'flex-start' : 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.6)', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: '28px 28px 48px', minWidth: 0, overflowX: 'hidden' }}>

        {/* ── Dashboard ── */}
        {activeSection === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 900, marginBottom: 2 }}>Good morning, Admin 👋</h1>
              <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Here's what's happening with Mohanah today.</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard icon="💰" label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} sub="All time" color="#2E7D32" />
              <StatCard icon="📦" label="Total Orders" value={stats.totalOrders} sub={`${stats.activeOrders} active`} color="#1565C0" />
              <StatCard icon="🥻" label="Products" value={stats.totalProducts} sub={`${stats.inStockCount} in stock`} color="var(--accent)" />
              <StatCard icon="👥" label="Customers" value={stats.totalCustomers} sub="Registered users" color="#AD1457" />
              <StatCard icon="💎" label="Avg Order Value" value={`₹${stats.avgOrderValue.toLocaleString('en-IN')}`} sub="Per order" color="#F57F17" />
              <StatCard icon="🔄" label="Return Rate" value="2.1%" sub="Last 30 days" color="var(--success)" />
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 28 }}>
              {[
                { icon: '➕', label: 'Add Product', section: 'add-product', color: 'var(--primary)' },
                { icon: '📦', label: 'View Orders', section: 'orders', color: '#1565C0' },
                { icon: '🖼️', label: 'Update Banner', section: 'banner', color: '#AD1457' },
                { icon: '⚙️', label: 'Settings', section: 'settings', color: 'var(--text-sec)' },
              ].map(action => (
                <button key={action.label} onClick={() => setActiveSection(action.section)}
                  style={{ padding: '14px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <span style={{ fontSize: 20 }}>{action.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: action.color }}>{action.label}</span>
                </button>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>Recent Orders</h3>
                <button onClick={() => setActiveSection('orders')} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead><tr style={{ background: 'var(--surface-alt)' }}>{['Order', 'Product', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{h.toUpperCase()}</th>)}</tr></thead>
                  <tbody>
                    {ordersDB.getAll().slice(0, 5).map(o => {
                      const cfg = { placed: { l: 'Placed', bg: '#E3F2FD', c: '#1565C0' }, confirmed: { l: 'Confirmed', bg: '#E3F2FD', c: '#1565C0' }, out_for_delivery: { l: 'Out for Delivery', bg: '#FFF3E8', c: '#C9956C' }, delivered: { l: 'Delivered', bg: '#E8F5E9', c: '#2E7D32' }, packed: { l: 'Packed', bg: '#FFF8E1', c: '#F57F17' }, shipped: { l: 'Shipped', bg: '#E3F2FD', c: '#1565C0' }, cancelled: { l: 'Cancelled', bg: '#FFEBEE', c: '#C62828' } }[o.status] || { l: o.status, bg: '#F5F5F5', c: '#666' };
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{o.id}</td>
                          <td style={{ padding: '11px 16px', fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700 }}>{o.product}</td>
                          <td style={{ padding: '11px 16px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>₹{o.price.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '11px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.c }}>{cfg.l}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top products */}
            <div className="card">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>Top Products by Reviews</h3>
                <button onClick={() => setActiveSection('inventory')} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              <div style={{ padding: '8px 16px 14px' }}>
                {[...productList].sort((a, b) => b.reviews - a.reviews).slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)', width: 22, textAlign: 'center' }}>#{i + 1}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: `${p.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🥻</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.reviews} reviews</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#F57F17' }}>{p.rating}★</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Product ── */}
        {activeSection === 'add-product' && (
          <div className="card" style={{ padding: 28 }}>
            <ProductForm
              onSave={handleSaveProduct}
              onCancel={editProduct ? () => { setEditProduct(null); setActiveSection('inventory'); } : undefined}
              editProduct={editProduct}
            />
          </div>
        )}

        {/* ── Inventory ── */}
        {activeSection === 'inventory' && (
          <InventorySection products={productList} onEdit={handleEdit} onDelete={handleDelete} onToggleStock={handleToggleStock} />
        )}

        {/* ── Orders ── */}
        {activeSection === 'orders' && <OrdersSection useBackend={useBackend} />}

        {/* ── Customers ── */}
        {activeSection === 'customers' && <CustomersSection />}

        {/* ── Banner ── */}
        {activeSection === 'banner' && <BannerSection />}

        {/* ── Vendors ── */}
        {activeSection === 'vendors' && <VendorSection />}

        {/* ── Social Orders ── */}
        {activeSection === 'social-orders' && <SocialOrdersSection />}

        {/* ── About Us ── */}
        {activeSection === 'about' && <AboutSection />}

        {/* ── Settings ── */}
        {activeSection === 'settings' && <SettingsSection useBackend={useBackend} />}

        {/* ── Legal Pages ── */}
        {activeSection === 'legal' && <LegalSection />}
      </main>
    </div>
  );
}
