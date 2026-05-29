import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../services/supabase';

const CartContext = createContext(null);

const initialState = {
  items: [],
  wishlist: [],
  coupon: null,
  giftWrap: false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.items.find(i => i.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.product, qty: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY':
      if (action.qty < 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, qty: action.qty } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [], coupon: null, giftWrap: false };
    case 'TOGGLE_GIFT_WRAP':
      return { ...state, giftWrap: !state.giftWrap };
    case 'APPLY_COUPON':
      return { ...state, coupon: action.coupon };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null };
    case 'TOGGLE_WISHLIST': {
      const inWishlist = state.wishlist.find(i => i.id === action.product.id);
      return {
        ...state,
        wishlist: inWishlist
          ? state.wishlist.filter(i => i.id !== action.product.id)
          : [...state.wishlist, action.product],
      };
    }
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

// Get per-user cart key
function getCartKey(userId) {
  return userId ? `mohanah_cart_${userId}` : 'mohanah_cart_guest';
}

export function CartProvider({ children }) {
  const [userId, setUserId] = React.useState(null);
  const cartKey = getCartKey(userId);

  const [state, dispatch] = useReducer(cartReducer, initialState, () => {
    try {
      // Load guest cart initially — will reload when user logs in
      const saved = localStorage.getItem('mohanah_cart_guest');
      return saved ? JSON.parse(saved) : initialState;
    } catch {
      return initialState;
    }
  });

  // Listen for auth changes — reload cart when user logs in/out
  useEffect(() => {
    // One-time cleanup: remove old shared cart key
    localStorage.removeItem('mohanah_cart');

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      try {
        const saved = localStorage.getItem(getCartKey(uid));
        if (saved) dispatch({ type: 'LOAD_STATE', state: JSON.parse(saved) });
        else dispatch({ type: 'LOAD_STATE', state: initialState });
      } catch {}
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      try {
        const saved = localStorage.getItem(getCartKey(uid));
        if (saved) dispatch({ type: 'LOAD_STATE', state: JSON.parse(saved) });
        else dispatch({ type: 'LOAD_STATE', state: initialState });
      } catch {}
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(state));
  }, [state, cartKey]);

  // Computed values
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const originalTotal = state.items.reduce(
    (sum, i) => sum + (i.originalPrice || i.price) * i.qty, 0
  );
  const savings = originalTotal - subtotal;
  const couponDiscount = state.coupon
    ? Math.round(subtotal * (state.coupon.percent / 100))
    : 0;
  const delivery = subtotal > 2000 ? 0 : 99;
  const giftWrapCharge = state.giftWrap ? 49 : 0;
  const total = subtotal - couponDiscount + delivery + giftWrapCharge;
  const cartCount = state.items.reduce((sum, i) => sum + i.qty, 0);

  const COUPONS = {
    WELCOME10: { percent: 10, label: 'WELCOME10' },
    MOHANAH15: { percent: 15, label: 'MOHANAH15' },
    SILK20: { percent: 20, label: 'SILK20' },
  };

  function applyCoupon(code) {
    const coupon = COUPONS[code.toUpperCase()];
    if (coupon) {
      dispatch({ type: 'APPLY_COUPON', coupon });
      return { success: true, message: `${coupon.percent}% discount applied!` };
    }
    return { success: false, message: 'Invalid coupon code' };
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        subtotal,
        savings,
        couponDiscount,
        delivery,
        giftWrapCharge,
        total,
        cartCount,
        dispatch,
        applyCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
