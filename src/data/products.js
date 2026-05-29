export const products = [
  { id: '1', name: 'Royal Banarasi Silk', fabric: 'Pure Silk', occasion: 'Wedding', price: 4299, originalPrice: 6000, discount: 28, color: '#8B1A1A', region: 'Varanasi', rating: 4.8, reviews: 234, isNew: true, isTrending: true, inStock: true, description: 'Exquisite pure silk Banarasi saree with intricate zari work and traditional motifs. Perfect for weddings and grand celebrations.' },
  { id: '2', name: 'Violet Dreams Banarasi', fabric: 'Banarasi', occasion: 'Festival', price: 3499, originalPrice: 5200, discount: 33, color: '#2D1B69', region: 'Varanasi', rating: 4.6, reviews: 189, isNew: true, isTrending: false, inStock: true, description: 'Rich violet Banarasi saree with gold zari border and pallav. Ideal for festive occasions and family gatherings.' },
  { id: '3', name: 'Emerald Grace Cotton', fabric: 'Cotton Silk', occasion: 'Casual', price: 1899, originalPrice: null, discount: 0, color: '#1a5c3a', region: 'West Bengal', rating: 4.5, reviews: 156, isNew: false, isTrending: true, inStock: true, description: 'Lightweight cotton silk blend in refreshing emerald green. Perfect for daily wear and office.' },
  { id: '4', name: 'Kanjivaram Gold', fabric: 'Kanjivaram', occasion: 'Bridal', price: 7800, originalPrice: 11000, discount: 29, color: '#6B2A00', region: 'Kanchipuram', rating: 4.9, reviews: 312, isNew: false, isTrending: true, inStock: true, description: 'Authentic Kanjivaram silk with rich gold zari. A timeless bridal classic from the silk city of Kanchipuram.' },
  { id: '5', name: 'Lavender Mist Georgette', fabric: 'Georgette', occasion: 'Party', price: 2199, originalPrice: 3000, discount: 27, color: '#4A2D6B', region: 'Surat', rating: 4.4, reviews: 98, isNew: false, isTrending: false, inStock: true, description: 'Flowing georgette saree in soft lavender with sequin work. Perfect for evening parties and receptions.' },
  { id: '6', name: 'Crimson Zari Silk', fabric: 'Pure Silk', occasion: 'Bridal', price: 5499, originalPrice: 8000, discount: 31, color: '#8B1A1A', region: 'Varanasi', rating: 4.7, reviews: 201, isNew: false, isTrending: true, inStock: true, description: 'Deep crimson pure silk with elaborate zari work. An heirloom quality saree for the most special occasions.' },
  { id: '7', name: 'Peacock Chanderi', fabric: 'Chanderi', occasion: 'Festival', price: 2699, originalPrice: 3800, discount: 29, color: '#1565C0', region: 'Chanderi, MP', rating: 4.3, reviews: 87, isNew: true, isTrending: false, inStock: true, description: 'Delicate Chanderi silk with peacock motifs and silver zari border. Light as a feather, graceful as a peacock.' },
  { id: '8', name: 'Saffron Kanjivaram', fabric: 'Kanjivaram', occasion: 'Wedding', price: 6500, originalPrice: 9200, discount: 29, color: '#E65100', region: 'Kanchipuram', rating: 4.8, reviews: 178, isNew: false, isTrending: false, inStock: true, description: 'Vibrant saffron Kanjivaram with traditional temple border. A celebration of South Indian weaving excellence.' },
  { id: '9', name: 'Midnight Blue Tussar', fabric: 'Tussar', occasion: 'Office', price: 3199, originalPrice: 4500, discount: 29, color: '#0D47A1', region: 'Jharkhand', rating: 4.2, reviews: 64, isNew: true, isTrending: false, inStock: true, description: 'Natural Tussar silk in midnight blue with subtle texture. Professional, elegant and comfortable for all-day wear.' },
  { id: '10', name: 'Rose Chiffon Elegance', fabric: 'Chiffon', occasion: 'Party', price: 1599, originalPrice: 2200, discount: 27, color: '#AD1457', region: 'Surat', rating: 4.1, reviews: 142, isNew: false, isTrending: false, inStock: false, description: 'Breezy rose chiffon with embroidered border. Effortlessly elegant for cocktail parties and evening events.' },
  { id: '11', name: 'Golden Tissue Silk', fabric: 'Pure Silk', occasion: 'Wedding', price: 8900, originalPrice: 13000, discount: 32, color: '#F57F17', region: 'Varanasi', rating: 4.9, reviews: 267, isNew: false, isTrending: true, inStock: true, description: 'Lustrous tissue silk saree that glows like gold in the light. Reserved for the most auspicious occasions.' },
  { id: '12', name: 'Pastel Pink Linen', fabric: 'Linen', occasion: 'Casual', price: 1299, originalPrice: null, discount: 0, color: '#F48FB1', region: 'Bihar', rating: 4.0, reviews: 93, isNew: true, isTrending: false, inStock: true, description: 'Breathable linen saree in soft pastel pink. Perfect for summer days and casual outings.' },
];

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
