import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import { FaUser, FaShoppingBag, FaBars, FaTimes, FaSearch, FaSignOutAlt, FaBox, FaHeart } from 'react-icons/fa';

const Header = () => {
  const { getCartItemCount } = useCart();
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sadece header scroll efekti için
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobil menü açıkken scroll'u engelle
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserDropdown(false);
  }, [window.location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menüyü Aç"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">Sosyete<span className="logo-accent">Pazarı</span></span>
        </Link>

        {/* Desktop Search */}
        <form className="search-bar desktop-search" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Ürün, kategori veya marka ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-dropdown-container">
              <button
                className="action-btn user-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <FaUser />
                <span className="user-name d-none-mobile">{user?.name}</span>
              </button>

              {showUserDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <strong>{user?.name} {user?.surname}</strong>
                    <span className="user-email">{user?.email}</span>
                  </div>
                  <Link to="/profile" className="dropdown-item"><FaUser /> Profilim</Link>
                  <Link to="/orders" className="dropdown-item"><FaBox /> Siparişlerim</Link>
                  <Link to="/favorites" className="dropdown-item"><FaHeart /> Favorilerim</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item admin-link">⚡ Admin Paneli</Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item text-danger">
                    <FaSignOutAlt /> Çıkış Yap
                  </button>
                </div>
              )}

              {/* Backdrop for dropdown */}
              {showUserDropdown && (
                <div
                  className="dropdown-backdrop"
                  onClick={() => setShowUserDropdown(false)}
                />
              )}
            </div>
          ) : (
            <Link to="/login" className="action-btn login-link">
              <FaUser />
              <span className="d-none-mobile">Giriş Yap</span>
            </Link>
          )}

          <Link to="/cart" className="action-btn cart-btn">
            <FaShoppingBag />
            {getCartItemCount() > 0 && (
              <span className="cart-badge">{getCartItemCount()}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu & Search Overlay */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <form className="mobile-search-form" onSubmit={handleSearch}>
            <FaSearch className="mobile-search-icon" />
            <input
              type="text"
              placeholder="Ne aramıştınız?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="mobile-nav">
            <Link to="/" className="mobile-nav-link">Ana Sayfa</Link>
            <Link to="/products" className="mobile-nav-link">Tüm Ürünler</Link>
            <Link to="/products?category=Elektronik" className="mobile-nav-link">Elektronik</Link>
            <Link to="/products?category=Moda" className="mobile-nav-link">Moda</Link>
            <Link to="/products?category=Ev" className="mobile-nav-link">Ev & Yaşam</Link>
            <Link to="/track-order" className="mobile-nav-link">Sipariş Takip</Link>
          </nav>

          {!isAuthenticated && (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn btn-primary w-100">Giriş Yap</Link>
              <Link to="/register" className="btn btn-secondary w-100">Kayıt Ol</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;