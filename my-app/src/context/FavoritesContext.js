import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

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
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const API_BASE_URL = 'http://localhost:5000';

  // Kullanıcının favorilerini yükle
  const loadFavorites = async () => {
    if (!user?._id) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/auth/favorites/${user._id}`);
      console.log('Favoriler yüklendi:', response.data);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error.response?.data || error.message);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Favori ekle
  const addToFavorites = async (productId) => {
    if (!user?._id) {
      alert('Favori eklemek için giriş yapmalısınız');
      return false;
    }

    try {
      console.log('Favori ekleniyor:', { userId: user._id, productId });
      const response = await axios.post(`${API_BASE_URL}/api/auth/favorites/add`, {
        userId: user._id,
        productId: productId
      });
      
      console.log('Favori ekleme başarılı:', response.data);
      setFavorites(response.data.favorites);
      setLastUpdate(Date.now()); // State'i güncelle
      return true;
    } catch (error) {
      console.error('Favori eklenemedi:', error.response?.data || error.message);
      alert(`Favori eklenirken hata oluştu: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Favoriden çıkar
  const removeFromFavorites = async (productId) => {
    if (!user?._id) return false;

    try {
      console.log('Favori çıkarılıyor:', { userId: user._id, productId });
      const response = await axios.post(`${API_BASE_URL}/api/auth/favorites/remove`, {
        userId: user._id,
        productId: productId
      });
      
      console.log('Favori çıkarma başarılı:', response.data);
      setFavorites(response.data.favorites);
      setLastUpdate(Date.now()); // State'i güncelle
      return true;
    } catch (error) {
      console.error('Favori çıkarılamadı:', error.response?.data || error.message);
      alert(`Favori çıkarılırken hata oluştu: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Favori toggle (ekle/çıkar)
  const toggleFavorite = async (productId) => {
    const isFavorite = favorites.some(fav => fav._id === productId);
    
    if (isFavorite) {
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
  }, [user]);

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