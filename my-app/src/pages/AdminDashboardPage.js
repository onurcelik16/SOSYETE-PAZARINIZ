import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import './AdminDashboardPage.css';
import { FaBox, FaShoppingCart, FaUsers, FaTag, FaArrowUp, FaArrowDown, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { getDashboardStats, getStockAlerts } from '../services/api';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Stats ve Alerts'i ayrı ayrı fetch et ki biri hata verirse diğeri çalışsın
      const statsPromise = getDashboardStats()
        .then(res => setStats(res.data))
        .catch(err => console.error('Stats fetch error:', err));

      const alertsPromise = getStockAlerts(10)
        .then(res => setStockAlerts(res.data))
        .catch(err => console.error('Alerts fetch error:', err));

      await Promise.all([statsPromise, alertsPromise]);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (loading) return <AdminDashboardLayout title="Genel Bakış"><div>Yükleniyor...</div></AdminDashboardLayout>;

  return (
    <AdminDashboardLayout title="Genel Bakış" subtitle="Mağaza performans özetiniz">
      <div className="admin-stats-grid">
        <div className="stat-card-modern">
          <div className="stat-header">
            <span className="stat-title">Toplam Sipariş</span>
            <span className="stat-icon-wrapper blue"><FaShoppingCart /></span>
          </div>
          <div className="stat-value">{stats?.totalOrders || 0}</div>
          <div className="stat-footer">
            <span className="trend-text">Tüm zamanlar</span>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-header">
            <span className="stat-title">Toplam Gelir</span>
            <span className="stat-icon-wrapper green"><FaTag /></span>
          </div>
          <div className="stat-value">
            {(stats?.totalRevenue || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </div>
          <div className="stat-footer">
            <span className="trend-text">Tüm zamanlar</span>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-header">
            <span className="stat-title">Kayıtlı Kullanıcı</span>
            <span className="stat-icon-wrapper purple"><FaUsers /></span>
          </div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div className="stat-footer">
            <span className="trend-text">Aktif müşteri sayısı</span>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-header">
            <span className="stat-title">Ürün Stoğu</span>
            <span className="stat-icon-wrapper orange"><FaBox /></span>
          </div>
          <div className="stat-value">{stats?.totalProducts || 0}</div>
          <div className="stat-footer">
            <span className="trend-text">{stats?.lowStockProducts || 0} ürün kritik stokta</span>
          </div>
        </div>
      </div>

      <div className="admin-sections-grid">
        <div className="admin-section-card">
          <h3>Son Siparişler</h3>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>#{order.trackingNumber || order._id.slice(-6).toUpperCase()}</td>
                    <td>{order.user?.name || 'Misafir'}</td>
                    <td>{order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                    <td><span className={`status-badge ${order.status === 'teslim edildi' ? 'success' : order.status === 'iptal edildi' ? 'danger' : 'warning'}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Henüz sipariş yok.</p>
          )}
          <button className="view-all-btn" onClick={() => navigate('/admin/orders')}>Tümünü Gör</button>
        </div>

        <div className="admin-section-card">
          <h3>Hızlı İşlemler</h3>
          <div className="quick-links">
            <button className="btn btn-outline" onClick={() => navigate('/add-product')} style={{ width: '100%', marginBottom: '10px', textAlign: 'left' }}>
              <FaBox style={{ marginRight: '8px' }} /> Yeni Ürün Ekle
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/admin/users')} style={{ width: '100%', marginBottom: '10px', textAlign: 'left' }}>
              <FaUsers style={{ marginRight: '8px' }} /> Kullanıcıları Yönet
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/admin/orders')} style={{ width: '100%', textAlign: 'left' }}>
              <FaShoppingCart style={{ marginRight: '8px' }} /> Siparişleri Yönet
            </button>
          </div>
        </div>
      </div>

      {/* Stok Uyarıları Bölümü */}
      {(stockAlerts?.products?.length > 0 || stockAlerts?.variantAlerts?.length > 0) && (
        <div className="admin-section-card stock-alerts-section" style={{ marginTop: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c' }}>
            <FaExclamationTriangle /> Kritik Stok Uyarıları
          </h3>
          <div className="alerts-list">
            {stockAlerts.products.map(product => (
              <div key={product._id} className="alert-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #fee2e2', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={product.image || 'https://via.placeholder.com/50'} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{product.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kategori: {product.category}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#b91c1c', fontWeight: '700' }}>Stok: {product.stock}</div>
                  <button className="btn-link" onClick={() => navigate(`/admin/edit-product/${product._id}`)} style={{ fontSize: '0.8rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Güncelle</button>
                </div>
              </div>
            ))}
            {stockAlerts.variantAlerts.map(alert => (
              <div key={alert._id} className="alert-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #fee2e2', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={alert.image || 'https://via.placeholder.com/50'} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{alert.title} (Varyantlı)</div>
                    <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                      {alert.lowCombinations.map((c, idx) => (
                        <div key={idx}>
                          {Object.values(c.combination).join(' / ')}: <strong>{c.stock} adet</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="btn-link" onClick={() => navigate(`/admin/edit-product/${alert._id}`)} style={{ fontSize: '0.8rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Varyantları Güncelle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminDashboardPage;