/**
 * MOHANAH — Backend API Client
 * Calls the Express + SQLite backend at localhost:3001
 *
 * If the backend is offline, functions fall back to localStorage automatically.
 */

const BASE_URL = 'http://localhost:3001/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('mohanah_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('mohanah_token', token);
  else localStorage.removeItem('mohanah_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('mohanah_user') || 'null');
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (user) localStorage.setItem('mohanah_user', JSON.stringify(user));
  else localStorage.removeItem('mohanah_user');
}

export function logout() {
  setToken(null);
  setUser(null);
  localStorage.removeItem('mohanah_admin');
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const adminToken = localStorage.getItem('mohanah_admin_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach auth token (admin token takes priority)
  const activeToken = adminToken || token;
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Check if backend is available ─────────────────────────────────────────────
let _backendAvailable = null;

export async function isBackendAvailable() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }
  // Reset cache after 30 seconds
  setTimeout(() => { _backendAvailable = null; }, 30000);
  return _backendAvailable;
}

// ────────────────────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  async register(name, email, phone, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async adminLogin(email, password) {
    const data = await apiFetch('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Store admin token separately so it's used for admin API calls
    localStorage.setItem('mohanah_admin_token', data.token);
    localStorage.setItem('mohanah_admin', 'true');
    return data;
  },

  logout() {
    logout();
    localStorage.removeItem('mohanah_admin_token');
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  PRODUCTS
// ────────────────────────────────────────────────────────────────────────────
export const productsAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search)  params.set('search', filters.search);
    if (filters.fabric)  params.set('fabric', filters.fabric);
    if (filters.occasion) params.set('occasion', filters.occasion);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.trending) params.set('trending', 'true');
    if (filters.isNew)   params.set('isNew', 'true');
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/products${qs}`);
  },

  async getById(id) {
    return apiFetch(`/products/${id}`);
  },

  async add(productData) {
    return apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async update(id, productData) {
    return apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async delete(id) {
    return apiFetch(`/products/${id}`, { method: 'DELETE' });
  },

  async toggleStock(id) {
    return apiFetch(`/products/${id}/toggle-stock`, { method: 'PATCH' });
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  ORDERS
// ────────────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  async getAll() {
    return apiFetch('/orders');
  },

  async getById(id) {
    return apiFetch(`/orders/${id}`);
  },

  async create(orderData) {
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async updateStatus(id, status) {
    return apiFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  CUSTOMERS
// ────────────────────────────────────────────────────────────────────────────
export const customersAPI = {
  async getAll() {
    return apiFetch('/customers');
  },

  async getById(id) {
    return apiFetch(`/customers/${id}`);
  },

  async update(id, data) {
    return apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  SETTINGS
// ────────────────────────────────────────────────────────────────────────────
export const settingsAPI = {
  async get() {
    return apiFetch('/settings');
  },

  async save(data) {
    return apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS
// ────────────────────────────────────────────────────────────────────────────
export async function getAPIStats() {
  const [products, orders, customers] = await Promise.all([
    apiFetch('/products'),
    apiFetch('/orders'),
    apiFetch('/customers'),
  ]);

  const totalRevenue  = orders.reduce((s, o) => s + (o.price || 0), 0);
  const activeOrders  = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const inStockCount  = products.filter(p => p.inStock).length;
  const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  return {
    totalRevenue, activeOrders, inStockCount, avgOrderValue,
    totalProducts: products.length, totalOrders: orders.length, totalCustomers: customers.length,
  };
}
