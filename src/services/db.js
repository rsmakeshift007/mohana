/**
 * MOHANAH — Browser localStorage Database
 * Works without any backend server.
 * Data persists across page refreshes in the browser.
 */

import { products as defaultProducts, orders as defaultOrders } from '../data/products';

const KEYS = {
  products:      'mohanah_db_products',
  orders:        'mohanah_db_orders',
  customers:     'mohanah_db_customers',
  settings:      'mohanah_db_settings',
  banner:        'mohanah_db_banner',
  legal:         'mohanah_db_legal',
  vendors:       'mohanah_db_vendors',
  manualOrders:  'mohanah_db_manual_orders',
  categories:    'mohanah_db_categories',
};

// ── Helpers ───────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('DB save error:', e);
    return false;
  }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Initialize DB on first load ───────────────────────
function initDB() {
  if (!localStorage.getItem(KEYS.products)) {
    save(KEYS.products, defaultProducts);
  }
  if (!localStorage.getItem(KEYS.orders)) {
    save(KEYS.orders, defaultOrders);
  }
  if (!localStorage.getItem(KEYS.customers)) {
    save(KEYS.customers, [
      { id: '1', name: 'Priya Sharma',    email: 'priya@email.com',    phone: '9876543210', city: 'Mumbai',    orders: 3, spent: 12897, joined: '12 Jan 2024', active: true },
      { id: '2', name: 'Deepika Nair',    email: 'deepika@email.com',  phone: '9123456789', city: 'Bangalore', orders: 2, spent: 15300, joined: '3 Feb 2024',  active: true },
      { id: '3', name: 'Sunita Agarwal',  email: 'sunita@email.com',   phone: '9988776655', city: 'Delhi',     orders: 5, spent: 27500, joined: '18 Nov 2023', active: true },
      { id: '4', name: 'Kavitha Reddy',   email: 'kavitha@email.com',  phone: '9654321098', city: 'Hyderabad', orders: 1, spent: 4299,  joined: '20 Mar 2024', active: true },
    ]);
  }
  if (!localStorage.getItem(KEYS.settings)) {
    save(KEYS.settings, {
      storeName: 'Mohanah', tagline: 'Drape The Charm',
      email: 'hello@mohanah.com', phone: '+91 98765 43210',
      address: 'Varanasi, Uttar Pradesh', currency: '₹',
      freeDeliveryAbove: '2000', gstNumber: '',
      paymentMethods: ['UPI', 'Cards', 'NetBanking', 'COD', 'EMI'],
      upiId: '', whatsappNumber: '', upiQrCode: '',
      instagram: '', facebook: '',
    });
  }
}

initDB();

// ────────────────────────────────────────────────────
//  PRODUCTS
// ────────────────────────────────────────────────────
export const productsDB = {
  getAll() {
    return load(KEYS.products, defaultProducts);
  },

  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },

  add(productData) {
    const all = this.getAll();
    const product = {
      ...productData,
      id:        newId(),
      rating:    productData.rating    ?? 4.5,
      reviews:   productData.reviews   ?? 0,
      isNew:     productData.isNew     ?? true,
      isTrending:productData.isTrending ?? false,
      createdAt: new Date().toISOString(),
    };
    all.unshift(product); // newest first
    save(KEYS.products, all);
    return product;
  },

  update(id, data) {
    const all = this.getAll().map(p =>
      p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
    );
    save(KEYS.products, all);
    return all.find(p => p.id === id);
  },

  delete(id) {
    const all = this.getAll().filter(p => p.id !== id);
    save(KEYS.products, all);
    return true;
  },

  toggleStock(id) {
    const product = this.getById(id);
    if (!product) return null;
    return this.update(id, { inStock: !product.inStock });
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.fabric.toLowerCase().includes(q) ||
      p.occasion.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q)
    );
  },

  reset() {
    save(KEYS.products, defaultProducts);
    return defaultProducts;
  },
};

// ────────────────────────────────────────────────────
//  ORDERS
// ────────────────────────────────────────────────────
export const ordersDB = {
  getAll() {
    return load(KEYS.orders, defaultOrders);
  },

  add(orderData) {
    const all = this.getAll();
    const order = {
      ...orderData,
      id:        `MNH-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`,
      date:      new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status:    'placed',
      progress:  10,
      createdAt: new Date().toISOString(),
    };
    all.unshift(order);
    save(KEYS.orders, all);
    return order;
  },

  updateStatus(id, status) {
    const progressMap = { placed: 10, confirmed: 25, packed: 40, shipped: 65, out_for_delivery: 85, delivered: 100, cancelled: 0 };
    const all = this.getAll().map(o =>
      o.id === id ? { ...o, status, progress: progressMap[status] ?? o.progress } : o
    );
    save(KEYS.orders, all);
    return all.find(o => o.id === id);
  },

  updateFields(id, fields) {
    const all = this.getAll().map(o =>
      o.id === id ? { ...o, ...fields, updatedAt: new Date().toISOString() } : o
    );
    save(KEYS.orders, all);
    return all.find(o => o.id === id);
  },
};

// ────────────────────────────────────────────────────
//  CUSTOMERS
// ────────────────────────────────────────────────────
export const customersDB = {
  getAll() {
    return load(KEYS.customers, []);
  },

  add(data) {
    const all = this.getAll();
    const customer = { ...data, id: newId(), orders: 0, spent: 0, joined: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), active: true };
    all.unshift(customer);
    save(KEYS.customers, all);
    return customer;
  },

  update(id, data) {
    const all = this.getAll().map(c => c.id === id ? { ...c, ...data } : c);
    save(KEYS.customers, all);
    return all.find(c => c.id === id);
  },
};

// ────────────────────────────────────────────────────
//  SETTINGS
// ────────────────────────────────────────────────────
export const settingsDB = {
  get() {
    return load(KEYS.settings, {});
  },

  save(data) {
    const current = this.get();
    const updated = { ...current, ...data, savedAt: new Date().toISOString() };
    save(KEYS.settings, updated);
    return updated;
  },
};

// ────────────────────────────────────────────────────
//  DB STATS (for dashboard)
// ────────────────────────────────────────────────────
export function getDBStats() {
  const products  = productsDB.getAll();
  const orders    = ordersDB.getAll();
  const customers = customersDB.getAll();

  const totalRevenue  = orders.reduce((s, o) => s + (o.price || 0), 0);
  const activeOrders  = orders.filter(o => !['delivered','cancelled'].includes(o.status)).length;
  const inStockCount  = products.filter(p => p.inStock).length;
  const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  return { totalRevenue, activeOrders, inStockCount, avgOrderValue, totalProducts: products.length, totalOrders: orders.length, totalCustomers: customers.length };
}

// ────────────────────────────────────────────────────
//  BANNER
// ────────────────────────────────────────────────────
export const bannerDB = {
  get() {
    return load(KEYS.banner, { images: [], reels: [] });
  },

  saveImages(images) {
    const current = this.get();
    const updated = { ...current, images, savedAt: new Date().toISOString() };
    save(KEYS.banner, updated);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.banner, newValue: JSON.stringify(updated) }));
    return updated;
  },

  saveReels(reels) {
    const current = this.get();
    const updated = { ...current, reels, savedAt: new Date().toISOString() };
    save(KEYS.banner, updated);
    return updated;
  },

  saveAll(images, reels) {
    const updated = { images, reels, savedAt: new Date().toISOString() };
    save(KEYS.banner, updated);
    // Notify same-tab listeners (storage event only fires across tabs)
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.banner, newValue: JSON.stringify(updated) }));
    return updated;
  },
};

// ────────────────────────────────────────────────────
//  VENDORS  (admin-only, never shown to customers)
// ────────────────────────────────────────────────────
export const vendorDB = {
  getAll() {
    return load(KEYS.vendors, []);
  },

  add(data) {
    const all = this.getAll();
    const vendor = {
      ...data,
      id:        newId(),
      createdAt: new Date().toISOString(),
      active:    true,
    };
    all.unshift(vendor);
    save(KEYS.vendors, all);
    return vendor;
  },

  update(id, data) {
    const all = this.getAll().map(v =>
      v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
    );
    save(KEYS.vendors, all);
    return all.find(v => v.id === id);
  },

  delete(id) {
    const all = this.getAll().filter(v => v.id !== id);
    save(KEYS.vendors, all);
    return true;
  },

  getById(id) {
    return this.getAll().find(v => v.id === id) || null;
  },
};

// ────────────────────────────────────────────────────
//  LEGAL PAGES
// ────────────────────────────────────────────────────
const DEFAULT_LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    content: `We are committed to protecting your personal information.\n\n**Information We Collect**\nWe collect your name, phone number, and delivery address when you place an order. Payment screenshots shared via WhatsApp are used only for order confirmation.\n\n**How We Use Your Information**\nTo process and deliver your orders, communicate about order status via WhatsApp, and improve our services.\n\n**Data Storage**\nYour order and cart data is stored locally on your device. We do not store your payment details on any server.\n\n**Sharing of Information**\nWe do not sell, trade, or rent your personal information to third parties.\n\n**Contact Us**\nFor privacy-related queries, reach us via WhatsApp or email listed in the Contact Us page.`,
  },
  terms: {
    title: 'Terms & Conditions',
    content: `By using our website, you agree to these terms.\n\n**Use of Website**\nYou must be 18+ years old to make purchases. All product descriptions are accurate to the best of our knowledge. Prices are in Indian Rupees (₹) and include applicable taxes.\n\n**Orders & Payments**\nOrders are confirmed only after payment verification via WhatsApp screenshot. UPI payment must be made to the displayed UPI ID. Order confirmation is sent via WhatsApp within 24 hours.\n\n**Product Authenticity**\nAll sarees are handcrafted by verified Indian weavers. Colors may slightly vary due to photography and screen settings.\n\n**Liability**\nWe are not liable for delays caused by courier partners or natural events beyond our control.`,
  },
  refund: {
    title: 'Refund & Return Policy',
    content: `We want you to love your saree. Here is our return policy.\n\n**Return Window**\nReturns accepted within 7 days of delivery. Item must be unused, unwashed, with original tags intact and in original packaging.\n\n**Eligible for Return**\n✅ Damaged or defective product received\n✅ Wrong item delivered\n✅ Product significantly different from description\n\n**Not Eligible for Return**\n❌ Used, washed, or altered items\n❌ Items without original packaging\n❌ Custom or personalized orders\n\n**Refund Process**\nContact us on WhatsApp with your order ID and photos of the issue. We will arrange a pickup within 3-5 business days. Refund is processed within 7-10 business days after we receive the item back.\n\n**Exchange**\nWe offer free size/color exchange subject to availability.`,
  },
  shipping: {
    title: 'Shipping Policy',
    content: `**Delivery Charges**\nFree delivery on orders above ₹2000. Standard delivery ₹99 for orders below ₹2000.\n\n**Processing Time**\nOrders are processed within 1-2 business days after payment confirmation. You will receive a WhatsApp message with tracking details once shipped.\n\n**Delivery Time**\nMetro cities (Mumbai, Delhi, Bangalore): 3-5 business days\nTier 2 cities: 5-7 business days\nRemote areas: 7-10 business days\n\n**Tracking**\nTracking number will be shared on WhatsApp once your order is shipped. You can also track your order in the My Orders section of the app.\n\n**Shipping Partners**\nWe ship via trusted courier partners: Blue Dart, DTDC, Delhivery, India Post.\n\n**Damaged in Transit**\nIf your package arrives damaged, photograph it before opening and contact us immediately on WhatsApp.`,
  },
  contact: {
    title: 'Contact Us',
    content: `We are here to help! Reach out to us through any of the following channels.\n\n**WhatsApp (Fastest Response)**\nAvailable Monday–Saturday, 9 AM – 9 PM IST\nTap the WhatsApp chat button on our website.\n\n**Email**\nWe respond within 24 hours.\n\n**For Orders & Payments**\nAll order-related queries are best resolved via WhatsApp for fastest response.\n\n**Business Hours**\nMonday to Saturday: 9:00 AM – 9:00 PM IST\nSunday: 11:00 AM – 6:00 PM IST`,
  },
};

export const legalDB = {
  getAll() {
    return load(KEYS.legal, DEFAULT_LEGAL);
  },

  getPage(key) {
    const all = this.getAll();
    return all[key] || DEFAULT_LEGAL[key] || null;
  },

  savePage(key, data) {
    const all = this.getAll();
    const updated = { ...all, [key]: { ...all[key], ...data, updatedAt: new Date().toISOString() } };
    save(KEYS.legal, updated);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.legal, newValue: JSON.stringify(updated) }));
    return updated;
  },

  saveAll(pages) {
    save(KEYS.legal, pages);
    return pages;
  },
};

// ────────────────────────────────────────────────────
//  CATEGORIES  (Fabrics & Occasions — admin editable)
// ────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = {
  fabrics:   ['Pure Silk', 'Banarasi', 'Kanjivaram', 'Cotton Silk', 'Georgette', 'Chanderi', 'Tussar', 'Chiffon', 'Linen', 'Organza', 'Crepe'],
  occasions: ['Wedding', 'Bridal', 'Festival', 'Party', 'Casual', 'Office', 'Sangeet', 'Reception'],
};

export const categoriesDB = {
  get() {
    return load(KEYS.categories, DEFAULT_CATEGORIES);
  },
  getFabrics() {
    return this.get().fabrics || DEFAULT_CATEGORIES.fabrics;
  },
  getOccasions() {
    return this.get().occasions || DEFAULT_CATEGORIES.occasions;
  },
  save(data) {
    save(KEYS.categories, data);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.categories, newValue: JSON.stringify(data) }));
    return data;
  },
  addFabric(name) {
    const cats = this.get();
    if (!cats.fabrics.includes(name)) {
      cats.fabrics = [...cats.fabrics, name];
      this.save(cats);
    }
    return cats;
  },
  removeFabric(name) {
    const cats = this.get();
    cats.fabrics = cats.fabrics.filter(f => f !== name);
    this.save(cats);
    return cats;
  },
  addOccasion(name) {
    const cats = this.get();
    if (!cats.occasions.includes(name)) {
      cats.occasions = [...cats.occasions, name];
      this.save(cats);
    }
    return cats;
  },
  removeOccasion(name) {
    const cats = this.get();
    cats.occasions = cats.occasions.filter(o => o !== name);
    this.save(cats);
    return cats;
  },
};

// ────────────────────────────────────────────────────
//  MANUAL / SOCIAL ORDERS  (WhatsApp, Instagram, etc.)
// ────────────────────────────────────────────────────
export const manualOrdersDB = {
  getAll() {
    return load(KEYS.manualOrders, []);
  },

  add(data) {
    const all = this.getAll();
    const order = {
      ...data,
      id:        newId(),
      createdAt: new Date().toISOString(),
      date:      new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    all.unshift(order);
    save(KEYS.manualOrders, all);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.manualOrders, newValue: JSON.stringify(all) }));
    return order;
  },

  update(id, data) {
    const all = this.getAll().map(o =>
      o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
    );
    save(KEYS.manualOrders, all);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.manualOrders, newValue: JSON.stringify(all) }));
    return all.find(o => o.id === id);
  },

  delete(id) {
    const all = this.getAll().filter(o => o.id !== id);
    save(KEYS.manualOrders, all);
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.manualOrders, newValue: JSON.stringify(all) }));
    return true;
  },

  getStats() {
    const all = this.getAll();
    const totalRevenue = all.reduce((s, o) => s + (Number(o.soldPrice) || 0), 0);
    const totalCost    = all.reduce((s, o) => s + (Number(o.costPrice) || 0), 0);
    const totalProfit  = totalRevenue - totalCost;
    const bySource = all.reduce((acc, o) => {
      acc[o.source] = (acc[o.source] || 0) + 1;
      return acc;
    }, {});
    return { total: all.length, totalRevenue, totalCost, totalProfit, bySource };
  },
};

// ────────────────────────────────────────────────────
//  FAQs  (admin editable, customer facing)
// ────────────────────────────────────────────────────
const FAQ_KEY = 'mohanah_db_faqs';

const DEFAULT_FAQS = [
  { id: 'faq1', q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days. Express delivery (2–3 days) is available for select pin codes.' },
  { id: 'faq2', q: 'Can I return or exchange a saree?', a: 'Yes! We accept returns within 7 days of delivery. The saree must be unused and in original packaging.' },
  { id: 'faq3', q: 'Are the sarees authentic?', a: 'All our sarees are 100% authentic, sourced directly from master weavers across India.' },
  { id: 'faq4', q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes, COD is available for orders up to ₹5,000 with an additional ₹50 handling charge.' },
  { id: 'faq5', q: 'How do I care for my silk saree?', a: 'Dry clean only for silk sarees. Store in a muslin cloth to prevent moisture and avoid direct sunlight.' },
  { id: 'faq6', q: 'How do I track my order?', a: 'Go to My Orders in your profile. Once shipped, you will see the tracking number and estimated delivery date.' },
];

export const faqsDB = {
  getAll() { return load(FAQ_KEY, DEFAULT_FAQS); },
  save(faqs) { save(FAQ_KEY, faqs); return faqs; },
};

// ────────────────────────────────────────────────────
//  PRODUCT REVIEWS  (customers submit, shown on product & home)
// ────────────────────────────────────────────────────
const REVIEWS_KEY = 'mohanah_db_reviews';

export const reviewsDB = {
  getAll() { return load(REVIEWS_KEY, []); },

  getByProduct(productId) {
    return this.getAll().filter(r => r.productId === productId);
  },

  add(review) {
    const all = this.getAll();
    const r = { ...review, id: newId(), createdAt: new Date().toISOString() };
    all.unshift(r);
    save(REVIEWS_KEY, all);
    return r;
  },

  getRecent(n = 6) {
    return this.getAll().slice(0, n);
  },

  delete(id) {
    const all = this.getAll().filter(r => r.id !== id);
    save(REVIEWS_KEY, all);
  },
};

// ────────────────────────────────────────────────────
//  RESET ALL (danger — clears everything)
// ────────────────────────────────────────────────────
export function resetAllData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  initDB();
}
