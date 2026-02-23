import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFavorites, addFavorite, removeFavorite } from '../services/api';
import { useToast } from '../components/Toast';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Kullanıcının favorilerini yükle
  const loadFavorites = useCallback(async () => {
    if (!user?._id) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getFavorites(user._id);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Favori ekle
  const addToFavorites = async (productId) => {
    if (!user?._id) {
      toast.warning('Favori eklemek için giriş yapmalısınız');
      return false;
    }

    try {
      const response = await addFavorite(user._id, productId);
      setFavorites(response.data.favorites);
      setLastUpdate(Date.now());
      return true;
    } catch (error) {
      toast.error(`Favori eklenirken hata oluştu: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Favoriden çıkar
  const removeFromFavorites = async (productId) => {
    if (!user?._id) return false;

    try {
      const response = await removeFavorite(user._id, productId);
      setFavorites(response.data.favorites);
      setLastUpdate(Date.now());
      return true;
    } catch (error) {
      toast.error(`Favori çıkarılırken hata oluştu: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Favori toggle (ekle/çıkar)
  const toggleFavorite = async (productId) => {
    const isFav = favorites.some(fav => fav._id === productId);

    if (isFav) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  };

  // Ürünün favori olup olmadığını kontrol et
  const isFavorite = (productId) => {
    return favorites.some(fav => fav._id === productId);
  };

  // Favori sayısını getir
  const getFavoritesCount = () => {
    return favorites.length;
  };

  // Kullanıcı değiştiğinde favorileri yeniden yükle
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    loadFavorites,
    lastUpdate
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};