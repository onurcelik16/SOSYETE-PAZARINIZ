import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboardPage.css';
import { FaBox, FaShoppingCart, FaUsers, FaChartBar } from 'react-icons/fa';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Admin kontrolü
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return <div className="admin-error">Bu sayfaya erişim yetkiniz yok.</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Hoş geldiniz, {user.name}!</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>Siparişler</h3>
            <p>Tüm siparişleri yönetin</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>Ürünler</h3>
            <p>Ürün ekleme ve düzenleme</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Kullanıcılar</h3>
            <p>Kullanıcı yönetimi</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>Raporlar</h3>
            <p>Satış ve analiz raporları</p>
          </div>
        </div>
      </div>

      <div className="admin-menu">
        <h2>Hızlı İşlemler</h2>
        <div className="menu-grid">
          <Link to="/admin/orders" className="menu-card">
            <div className="menu-icon">
              <FaShoppingCart />
            </div>
            <div className="menu-content">
              <h3>Sipariş Yönetimi</h3>
              <p>Siparişleri görüntüle, durumlarını güncelle</p>
              <span className="menu-action">Yönet →</span>
            </div>
          </Link>

          <Link to="/add-product" className="menu-card">
            <div className="menu-icon">
              <FaBox />
            </div>
            <div className="menu-content">
              <h3>Yeni Ürün Ekle</h3>
              <p>Yeni ürün ekle ve katalogu genişlet</p>
              <span className="menu-action">Ekle →</span>
            </div>
          </Link>

          <Link to="/products" className="menu-card">
            <div className="menu-icon">
              <FaBox />
            </div>
            <div className="menu-content">
              <h3>Ürünleri Düzenle</h3>
              <p>Mevcut ürünleri düzenle ve güncelle</p>
              <span className="menu-action">Düzenle →</span>
            </div>
          </Link>

          <div className="menu-card coming-soon">
            <div className="menu-icon">
              <FaUsers />
            </div>
            <div className="menu-content">
              <h3>Kullanıcı Yönetimi</h3>
              <p>Kullanıcı hesaplarını yönet</p>
              <span className="menu-action">Yakında</span>
            </div>
          </div>

          <div className="menu-card coming-soon">
            <div className="menu-icon">
              <FaChartBar />
            </div>
            <div className="menu-content">
              <h3>Raporlar</h3>
              <p>Satış ve performans raporları</p>
              <span className="menu-action">Yakında</span>
            </div>
          </div>

          <Link to="/" className="menu-card">
            <div className="menu-icon">
              <FaBox />
            </div>
            <div className="menu-content">
              <h3>Mağazaya Dön</h3>
              <p>Müşteri görünümüne geç</p>
              <span className="menu-action">Git →</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="admin-info">
        <h3>Son Aktiviteler</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">Şimdi</span>
            <span className="activity-text">Admin paneline giriş yapıldı</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">Bugün</span>
            <span className="activity-text">Sipariş takip sistemi aktif edildi</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">Dün</span>
            <span className="activity-text">Yeni ürünler eklendi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 