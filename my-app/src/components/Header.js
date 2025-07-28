import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import './Header.css';
import { FaUserCircle } from 'react-icons/fa';

const Header = () => {
  const { getCartItemCount } = useCart();
  const { getFavoritesCount } = useFavorites();
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.user-menu') && !e.target.closest('.user-icon')) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="Sosyete Pazarı Logo" className="header-logo-img" />
            <span className="header-logo-text">Sosyete Pazarı</span>
          </Link>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link">Ana Sayfa</Link>
          <Link to="/products" className="nav-link">Ürünler</Link>
          <Link to="/cart" className="nav-link">Sepet</Link>
          <Link to="/favorites" className="nav-link">Favoriler</Link>
          <Link to="/orders" className="nav-link">Siparişlerim</Link>
          <Link to="/track-order" className="nav-link">Sipariş Takip</Link>
          {isAuthenticated ? (
            null
          ) : (
            <Link className="nav-link" to="/login">Giriş Yap</Link>
          )}
        </nav>
        <div className="cart-icon" style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
          <Link to="/cart" className="cart-link" style={{ display: 'flex', alignItems: 'center' }}>
            🛒 <span className="cart-count">{getCartItemCount()}</span>
          </Link>
          <span className="user-icon" style={{ cursor: 'pointer', fontSize: 32, display: 'flex', alignItems: 'center' }} onClick={handleUserIconClick}>
            <FaUserCircle />
          </span>
          {showUserMenu && isAuthenticated && (
            <div className="user-menu" style={{ position: 'absolute', top: 54, right: -10, background: '#fff', boxShadow: '0 2px 16px #1976d233', borderRadius: 12, padding: 20, zIndex: 100, minWidth: 170, width: 200, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <button onClick={handleProfileClick} style={{ display: 'block', width: '100%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', marginBottom: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>Profilim</button>
              {user?.role === 'admin' && (
                <button onClick={() => { setShowUserMenu(false); navigate('/admin'); }} style={{ display: 'block', width: '100%', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', marginBottom: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>Admin Panel</button>
              )}
              <button onClick={handleLogout} style={{ display: 'block', width: '100%', background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 500, cursor: 'pointer', fontSize: 15 }}>Çıkış Yap</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 