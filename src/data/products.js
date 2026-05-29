// ✅ Hardcoded products hata diye — ab Admin se products add karo
export const products = [];

export const occasions = ['All', 'Wedding', 'Festival', 'Bridal', 'Party', 'Casual', 'Office'];
export const fabrics = ['All', 'Pure Silk', 'Banarasi', 'Kanjivaram', 'Cotton Silk', 'Georgette', 'Chanderi', 'Tussar', 'Chiffon', 'Linen'];
export const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 – ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: Infinity },
];

export const orders = [
  { id: 'MNH-2024-001', date: '23 May 2024', product: 'Royal Banarasi Silk', fabric: 'Pure Silk', price: 4299, status: 'out_for_delivery', progress: 85, color: '#8B1A1A' },
  { id: 'MNH-2024-002', date: '18 May 2024', product: 'Crimson Zari Silk', fabric: 'Pure Silk', price: 5499, status: 'delivered', progress: 100, color: '#C62828' },
  { id: 'MNH-2024-003', date: '10 May 2024', product: 'Emerald Grace Cotton', fabric: 'Cotton Silk', price: 1899, status: 'packed', progress: 40, color: '#1a5c3a' },
];

export const statusConfig = {
  placed:           { label: 'Order Placed',       color: '#1565C0', bg: '#E3F2FD' },
  confirmed:        { label: 'Confirmed',           color: '#1565C0', bg: '#E3F2FD' },
  packed:           { label: 'Packed & Ready',      color: '#F57F17', bg: '#FFF8E1' },
  shipped:          { label: 'Shipped',             color: '#1565C0', bg: '#E3F2FD' },
  out_for_delivery: { label: '🚚 Out for Delivery', color: '#C9956C', bg: '#FFF3E8' },
  delivered:        { label: '✅ Delivered',        color: '#2E7D32', bg: '#E8F5E9' },
  cancelled:        { label: '❌ Cancelled',        color: '#C62828', bg: '#FFEBEE' },
};
