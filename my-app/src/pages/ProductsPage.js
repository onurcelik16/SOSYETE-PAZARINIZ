import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';
import { FaFilter, FaSortAmountDown, FaSearch, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { useLocation } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const location = useLocation();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);

  // Mobile Filter Drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce timer
  const [searchTimer, setSearchTimer] = useState(null);

  // URL'den parametreleri oku
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const categoryParam = params.get('category');

    if (searchParam !== null) {
      setSearchTerm(searchParam);
    } else {
      setSearchTerm('');
    }

    if (categoryParam !== null) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('');
    }
  }, [location.search]);

  // Kategorileri bir kere yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getProducts({ limit: 1000 });
        const allProducts = res.data.products || res.data;
        const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err);
      }
    };
    fetchCategories();
  }, []);

  // Sort mapping
  const getSortParams = useCallback(() => {
    switch (sortBy) {
      case 'price-low': return { sortBy: 'price', sortOrder: 'asc' };
      case 'price-high': return { sortBy: 'price', sortOrder: 'desc' };
      case 'name': return { sortBy: 'title', sortOrder: 'asc' };
      case 'stock': return { sortBy: 'stock', sortOrder: 'desc' };
      default: return { sortBy: 'createdAt', sortOrder: 'desc' };
    }
  }, [sortBy]);

  // Server-side ürün çekme
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const sort = getSortParams();
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...sort,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange.min !== '') params.minPrice = priceRange.min;
      if (priceRange.max !== '') params.maxPrice = priceRange.max;

      const res = await getProducts(params);

      if (res.data.products) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      } else {
        // Fallback: eski format
        setProducts(res.data);
        setPagination({ page: 1, total: res.data.length, pages: 1 });
      }
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, priceRange, getSortParams]);

  // Filtre/sıralama değişince sayfa 1'den yeniden yükle
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, searchTerm, priceRange]);

  // Arama debounce (searchTerm onChange yerine)
  const handleSearchChange = (value) => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setSearchTerm(value);
    }, 400);
    setSearchTimer(timer);
  };

  // Sayfa değiştirme
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="products-page">
      <Helmet>
        <title>{selectedCategory ? `${selectedCategory} Ürünleri` : searchTerm ? `"${searchTerm}" Arama Sonuçları` : 'Tüm Ürünler'} — Sosyete Pazarı</title>
        <meta name="description" content={`Sosyete Pazarı'nda ${selectedCategory || 'tüm kategorilerde'} ${pagination.total} ürün. En uygun fiyatlarla hemen alışverişe başlayın.`} />
      </Helmet>
      <div className="products-header">
        <h1>Tüm Ürünler</h1>
        <p>{pagination.total} ürün listeleniyor</p>
      </div>

      <div className="products-layout">
        {/* Mobile Filter Toggle */}
        <button
          className="mobile-filter-btn"
          onClick={() => setShowMobileFilters(true)}
        >
          <FaFilter /> Filtrele & Sırala
        </button>

        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${showMobileFilters ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Filtreler</h3>
            <button className="close-sidebar" onClick={() => setShowMobileFilters(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="filter-group">
            <label className="filter-label">Arama</label>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon-small" />
              <input
                type="text"
                placeholder="Ürün ara..."
                defaultValue={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Kategoriler</label>
            <div className="category-options">
              <label className={`category-option ${selectedCategory === '' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                />
                Tümü
              </label>
              {categories.map(cat => (
                <label key={cat} className={`category-option ${selectedCategory === cat ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Fiyat Aralığı</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sıralama</label>
            <div className="select-wrapper">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">En Yeniler</option>
                <option value="price-low">Fiyat (Artan)</option>
                <option value="price-high">Fiyat (Azalan)</option>
                <option value="name">İsim (A-Z)</option>
                <option value="stock">Stok Durumu</option>
              </select>
              <FaSortAmountDown className="select-icon" />
            </div>
          </div>

          <button
            className="btn btn-secondary w-full"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setPriceRange({ min: '', max: '' });
              setSortBy('newest');
            }}
          >
            Filtreleri Temizle
          </button>
        </aside>

        {/* Product Grid */}
        <main className="products-grid-container">
          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-card"></div>)}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <FaChevronLeft /> Önceki
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`dots-${idx}`} className="pagination-dots">...</span>
                        ) : (
                          <button
                            key={item}
                            className={`pagination-num ${pagination.page === item ? 'active' : ''}`}
                            onClick={() => handlePageChange(item)}
                          >
                            {item}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Sonraki <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Ürün bulunamadı</h3>
              <p>Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div className="sidebar-overlay" onClick={() => setShowMobileFilters(false)}></div>
      )}
    </div>
  );
};

export default ProductsPage;