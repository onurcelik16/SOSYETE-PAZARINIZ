import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { FaHeart } from 'react-icons/fa';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite, lastUpdate } = useFavorites();
  const { user } = useAuth();
  
  // Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
      });
  }, []);

  // Filtreleme fonksiyonu
  useEffect(() => {
    let filtered = [...products];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kategori filtresi
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category === selectedCategory
      );
    }

    // Fiyat aralığı filtresi
    if (priceRange.min !== '' || priceRange.max !== '') {
      filtered = filtered.filter(product => {
        const price = product.price;
        const min = priceRange.min === '' ? 0 : parseFloat(priceRange.min);
        const max = priceRange.max === '' ? Infinity : parseFloat(priceRange.max);
        return price >= min && price <= max;
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Favori durumu değiştiğinde sayfayı yeniden render et
  useEffect(() => {
    // Bu useEffect favori durumu değiştiğinde çalışacak
    // lastUpdate değiştiğinde sayfa otomatik yenilenecek
  }, [lastUpdate]);

  const handleFavoriteClick = async (e, productId) => {
    e.preventDefault(); // Link'e tıklamayı engelle
    e.stopPropagation(); // Event bubbling'i engelle
    
    if (!user) {
      alert('Favori eklemek için giriş yapmalısınız');
      return;
    }

    const success = await toggleFavorite(productId);
    if (success) {
      // Favori durumu başarıyla güncellendi, sayfa otomatik güncellenecek
      console.log('Favori durumu güncellendi');
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  // Mevcut kategorileri al
  const categories = [...new Set(products.map(product => product.category))];

  return (
    <div className="products-container">
      {/* Filtreleme Bölümü */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`category-filter ${selectedCategory ? 'selected' : ''}`}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="price-filter">
            <input
              type="number"
              placeholder="Min Fiyat"
              value={priceRange.min}
              onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
              className="price-input"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max Fiyat"
              value={priceRange.max}
              onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
              className="price-input"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`sort-filter ${sortBy !== 'name' ? 'selected' : ''}`}
          >
            <option value="name">İsme Göre</option>
            <option value="price-low">Fiyat (Düşük-Yüksek)</option>
            <option value="price-high">Fiyat (Yüksek-Düşük)</option>
            <option value="stock">Stok (Yüksek-Düşük)</option>
          </select>
        </div>
        
        <div className="filter-results">
          <span>{filteredProducts.length} ürün bulundu</span>
          {(searchTerm || selectedCategory || priceRange.min || priceRange.max) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setPriceRange({ min: '', max: '' });
                setSortBy('name');
              }}
              className="clear-filters"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>
      
      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product._id} className="product-card">
            <Link
              to={`/product/${product._id}`}
              className="product-link"
            >
              <div className="product-image-container">
                <img 
                  src={product.image || (product.images?.[0]) || 'https://via.placeholder.com/300x250?text=Resim+Yok'} 
                  alt={product.title} 
                  className="product-image"
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
                  className={`favorite-button ${isFavorite(product._id) ? 'favorited' : ''}`}
                  onClick={(e) => handleFavoriteClick(e, product._id)}
                  title={isFavorite(product._id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                  <FaHeart />
                </button>
              </div>
              
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <div className="product-price">{product.price.toFixed(2)} ₺</div>
                <div className="product-description">{product.description}</div>
                <div className="product-details">
                  <span className="product-stock">Stok: {product.stock}</span>
                  <span className="product-category">Kategori: {product.category}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage; 