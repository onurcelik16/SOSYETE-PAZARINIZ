import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import './FavoritesPage.css';
import { FaHeart, FaTrash } from 'react-icons/fa';

const FavoritesPage = () => {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { user } = useAuth();

  const handleRemoveFavorite = async (productId) => {
    const success = await removeFromFavorites(productId);
    if (success) {
      // Favori başarıyla çıkarıldı, sayfa otomatik güncellenecek
      console.log('Favori çıkarıldı');
    }
  };

  if (!user) {
    return (
      <div className="favorites-container">
        <div className="login-required">
          <h2>Favorilerinizi görmek için giriş yapın</h2>
          <p>Favori ürünlerinizi görüntülemek ve yönetmek için hesabınıza giriş yapmalısınız.</p>
          <Link to="/login" className="login-button">Giriş Yap</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="favorites-container">
        <div className="loading">Favorileriniz yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>Favorilerim</h1>
        <p>{favorites.length} ürün favorilerinizde</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <div className="empty-icon">❤️</div>
          <h2>Henüz favori ürününüz yok</h2>
          <p>Beğendiğiniz ürünleri favorilere ekleyerek burada görüntüleyebilirsiniz.</p>
          <Link to="/products" className="browse-button">Ürünleri Keşfet</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((product) => (
            <div key={product._id} className="favorite-card">
              <div className="favorite-image">
                <img 
                  src={product.images?.[0] || product.image || 'https://via.placeholder.com/300x250?text=Resim+Yok'} 
                  alt={product.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x250?text=Resim+Yok';
                    e.target.style.objectFit = 'cover';
                  }}
                  onLoad={(e) => {
                    // Resim yüklendiğinde boyutları kontrol et
                    if (e.target.naturalWidth < 100 || e.target.naturalHeight < 100) {
                      e.target.style.objectFit = 'cover';
                    }
                  }}
                />
                <button 
                  className="remove-favorite-btn"
                  onClick={() => handleRemoveFavorite(product._id)}
                  title="Favorilerden çıkar"
                >
                  <FaTrash />
                </button>
              </div>
              
                              <div className="favorite-content">
                  <h3>{product.title || 'Ürün Adı Yok'}</h3>
                  <p className="favorite-price">₺{product.price ? product.price.toFixed(2) : '0.00'}</p>
                  <p className="favorite-description">
                    {product.description 
                      ? (product.description.length > 100 
                          ? `${product.description.substring(0, 100)}...` 
                          : product.description)
                      : 'Açıklama bulunmuyor'
                    }
                  </p>
                
                <div className="favorite-actions">
                  <Link to={`/product/${product._id}`} className="view-button">
                    Ürünü Görüntüle
                  </Link>
                  <button 
                    className="remove-button"
                    onClick={() => handleRemoveFavorite(product._id)}
                  >
                    <FaHeart /> Favoriden Çıkar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="favorites-footer">
          <Link to="/products" className="continue-shopping">
            Alışverişe Devam Et
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage; 