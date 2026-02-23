import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import './FavoritesPage.css';
import { FaHeart, FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';

const FavoritesPage = () => {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { addItemToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const handleRemoveFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromFavorites(productId);
    toast.info('Ürün favorilerden kaldırıldı');
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addItemToCart(product._id, 1);
    toast.success('Ürün sepete eklendi');
  };

  if (!user) {
    return (
      <div className="favorites-page">
        <div className="empty-state-card">
          <div className="empty-icon-wrapper">
            <FaHeart />
          </div>
          <h2>Giriş Yapmalısınız</h2>
          <p>Favorilerinizi görmek için lütfen giriş yapın veya hesap oluşturun.</p>
          <div className="empty-actions">
            <Link to="/login" className="btn btn-primary">Giriş Yap</Link>
            <Link to="/register" className="btn btn-secondary">Kayıt Ol</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Favorilerim</h1>
          <p>Beğendiğiniz ürünler bir arada ({favorites.length})</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-card">
            <div className="empty-icon-wrapper bounce">
              <FaHeart />
            </div>
            <h2>Favori Listeniz Boş</h2>
            <p>Henüz hiç favori ürün eklemediniz. İlgilendiğiniz ürünleri kalp ikonuna tıklayarak buraya ekleyebilirsiniz.</p>
            <Link to="/products" className="btn btn-primary">
              <FaArrowLeft /> Ürünleri Keşfet
            </Link>
          </div>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((product) => (
            <Link to={`/product/${product.slug || product._id}`} key={product._id} className="fav-card">
              <div className="fav-image-wrapper">
                <img
                  src={product.images?.[0] || product.image || 'https://via.placeholder.com/300x250'}
                  alt={product.title}
                  className="fav-image"
                />
                <button
                  className="remove-fav-btn"
                  onClick={(e) => handleRemoveFavorite(e, product._id)}
                  title="Favorilerden Çıkar"
                >
                  <FaTrash />
                </button>
                {product.stock <= 0 && <span className="out-of-stock">Tükendi</span>}
              </div>

              <div className="fav-content">
                <h3 className="fav-title" title={product.title}>{product.title}</h3>
                <div className="fav-price-row">
                  <span className="fav-price">
                    {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>

                <button
                  className="btn btn-primary w-100 add-cart-btn-sm"
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.stock <= 0}
                >
                  <FaShoppingCart /> Sepete Ekle
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;