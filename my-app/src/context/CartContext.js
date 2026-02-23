import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, getProducts, getProduct } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'guest_cart';

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_TO_CART':
      return state;
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// localStorage helper fonksiyonları
const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch { return []; }
};

const saveGuestCart = (cart) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: false
  });
  const [products, setProducts] = useState([]);

  const { user } = useAuth();
  const userId = user?._id;

  useEffect(() => {
    if (userId) {
      // Giriş yapıldığında: localStorage sepetini backend'e aktar, sonra yükle
      migrateGuestCartToBackend().then(() => loadCart());
    } else {
      // Misafir: localStorage'dan yükle
      loadGuestCart();
    }
    loadProducts();
    // eslint-disable-next-line
  }, [userId]);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    }
  };

  // Misafir sepetini localStorage'dan yükle (ürün detayları ile)
  const loadGuestCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const guestItems = getGuestCart();

    // Her ürünün detaylarını çek
    const enrichedItems = [];
    for (const item of guestItems) {
      try {
        const res = await getProduct(item.productId);
        enrichedItems.push({
          _id: item.productId,
          product: res.data,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant || null
        });
      } catch {
        // Ürün bulunamazsa atla
      }
    }

    dispatch({ type: 'SET_CART', payload: enrichedItems });
  };

  // Giriş yapıldığında misafir sepetini backend'e aktar
  const migrateGuestCartToBackend = async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;

    for (const item of guestItems) {
      try {
        await addToCart({ user: userId, product: item.productId, quantity: item.quantity, selectedVariant: item.selectedVariant || undefined });
      } catch (err) {
        console.error('Misafir sepet aktarımı hatası:', err);
      }
    }
    clearGuestCart();
  };

  const loadCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getCart(userId);
      dispatch({ type: 'SET_CART', payload: response.data });
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addItemToCart = async (productId, quantity = 1, selectedVariant = null) => {
    if (userId) {
      // --- Giriş yapmış kullanıcı: backend ---
      try {
        await addToCart({ user: userId, product: productId, quantity, selectedVariant: selectedVariant || undefined });
        await loadCart();
      } catch (error) {
        console.error('Sepete eklenirken hata:', error);
      }
    } else {
      // --- Misafir: localStorage ---
      const guestItems = getGuestCart();
      const variantKey = selectedVariant ? JSON.stringify(selectedVariant) : null;
      const existing = guestItems.find(i => {
        const iKey = i.selectedVariant ? JSON.stringify(i.selectedVariant) : null;
        return i.productId === productId && iKey === variantKey;
      });
      if (existing) {
        existing.quantity += quantity;
      } else {
        guestItems.push({ productId, quantity, selectedVariant });
      }
      saveGuestCart(guestItems);
      await loadGuestCart();
    }
  };

  const updateItemQuantity = async (cartItemId, quantity) => {
    if (userId) {
      try {
        await updateCartItem(cartItemId, { quantity });
        await loadCart();
      } catch (error) {
        console.error('Sepet güncellenirken hata:', error);
      }
    } else {
      // Misafir: cartItemId aslında productId
      const guestItems = getGuestCart();
      const item = guestItems.find(i => i.productId === cartItemId);
      if (item) {
        item.quantity = quantity;
        saveGuestCart(guestItems);
        await loadGuestCart();
      }
    }
  };

  const removeItemFromCart = async (cartItemId) => {
    if (userId) {
      try {
        await removeFromCart(cartItemId);
        await loadCart();
      } catch (error) {
        console.error('Sepetten silinirken hata:', error);
      }
    } else {
      // Misafir: cartItemId aslında productId
      const guestItems = getGuestCart().filter(i => i.productId !== cartItemId);
      saveGuestCart(guestItems);
      await loadGuestCart();
    }
  };

  const getProductById = (productId) => {
    return products.find(product => product.id === productId);
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      const product = item.product;
      if (product) {
        return total + (item.quantity * product.price);
      }
      return total;
    }, 0);
  };

  const getCartItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart: state.items,
      loading: state.loading,
      products,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      getCartTotal,
      getCartItemCount,
      getProductById,
      loadCart,
      clearGuestCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};