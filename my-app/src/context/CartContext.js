import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, getProducts } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_TO_CART':
      // return { ...state, items: [...state.items, action.payload] };
      return state; // State'i değiştirme, loadCart ile güncellenecek
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
      loadCart();
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

  const addItemToCart = async (productId, quantity = 1) => {
    try {
      const cartItem = {
        user: userId,
        product: productId,
        quantity
      };
      const response = await addToCart(cartItem);
      // dispatch({ type: 'ADD_TO_CART', payload: response.data });
      await loadCart(); // Sepeti tekrar yükle
    } catch (error) {
      console.error('Sepete eklenirken hata:', error);
    }
  };

  const updateItemQuantity = async (cartItemId, quantity) => {
    try {
      const response = await updateCartItem(cartItemId, { quantity });
      // dispatch({ type: 'UPDATE_CART_ITEM', payload: response.data });
      await loadCart(); // Sepeti tekrar yükle
    } catch (error) {
      console.error('Sepet güncellenirken hata:', error);
    }
  };

  const removeItemFromCart = async (cartItemId) => {
    try {
      await removeFromCart(cartItemId);
      // dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId });
      await loadCart(); // Sepeti tekrar yükle
    } catch (error) {
      console.error('Sepetten silinirken hata:', error);
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
      loadCart
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