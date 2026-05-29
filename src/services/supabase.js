import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xyhrvccrxaviynfpfnno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5aHJ2Y2NyeGF2aXluZnBmbm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDcyMTEsImV4cCI6MjA5NTYyMzIxMX0.PhrP9UtY_TNa_x65G5u9t2BKDyHIpLT9xOdScyFkDLs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const authAPI = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  isAdmin(user) {
    return user?.app_metadata?.role === 'admin';
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
export const productsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async add(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────
export const vendorsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async add(vendor) {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
export const ordersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async add(order) {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// SOCIAL ORDERS (WhatsApp / Instagram / Phone)
// ─────────────────────────────────────────────
export const socialOrdersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('social_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async add(order) {
    const { data, error } = await supabase
      .from('social_orders')
      .insert([order])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('social_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('social_orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase
      .from('social_orders')
      .select('sold_price, cost_price, profit, source');
    if (error) throw error;
    const total = data.length;
    const totalRevenue = data.reduce((s, o) => s + Number(o.sold_price || 0), 0);
    const totalCost    = data.reduce((s, o) => s + Number(o.cost_price || 0), 0);
    const totalProfit  = data.reduce((s, o) => s + Number(o.profit || 0), 0);
    const bySource = data.reduce((acc, o) => {
      acc[o.source] = (acc[o.source] || 0) + 1;
      return acc;
    }, {});
    return { total, totalRevenue, totalCost, totalProfit, bySource };
  },
};

// ─────────────────────────────────────────────
// CATEGORIES (fabrics + occasions)
// ─────────────────────────────────────────────
export const categoriesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getFabrics() {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('type', 'fabric')
      .order('sort_order');
    if (error) throw error;
    return data.map(d => d.name);
  },

  async getOccasions() {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('type', 'occasion')
      .order('sort_order');
    if (error) throw error;
    return data.map(d => d.name);
  },

  async add(type, name) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ type, name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────
export const bannersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async add(banner) {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// STORAGE (image + video uploads)
// ─────────────────────────────────────────────
export const storageAPI = {
  async uploadImage(file, folder = 'banners') {
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('mohanah-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('mohanah-images')
      .getPublicUrl(data.path);
    return publicUrl;
  },

  async uploadVideo(file, folder = 'reels') {
    const ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('mohanah-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('mohanah-images')
      .getPublicUrl(data.path);
    return publicUrl;
  },

  async deleteFile(url) {
    try {
      const path = url.split('/mohanah-images/')[1];
      if (!path) return;
      await supabase.storage.from('mohanah-images').remove([decodeURIComponent(path)]);
    } catch {}
  },
};

// ─────────────────────────────────────────────
// REELS
// ─────────────────────────────────────────────
export const reelsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async add(reel) {
    const { data, error } = await supabase
      .from('reels')
      .insert([reel])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('reels').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// SETTINGS (key-value store)
// ─────────────────────────────────────────────
export const settingsAPI = {
  async get(key) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value ?? null;
  },

  async set(key, value) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });
    if (error) throw error;
  },
};
