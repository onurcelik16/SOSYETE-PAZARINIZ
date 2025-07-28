import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    // Admin kontrolü
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      setOrders(response.data);
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, note) => {
    try {
      setUpdatingOrder(orderId);
      await updateOrderStatus(orderId, { status: newStatus, note });
      
      // Siparişleri yeniden yükle
      await fetchOrders();
      
      alert('Sipariş durumu başarıyla güncellendi!');
    } catch (err) {
      alert('Durum güncellenirken hata oluştu!');
      console.error('Durum güncelleme hatası:', err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'beklemede': return '#ff9800';
      case 'hazırlanıyor': return '#2196f3';
      case 'kargoda': return '#9c27b0';
      case 'teslim edildi': return '#4caf50';
      case 'iptal edildi': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'beklemede': return 'Beklemede';
      case 'hazırlanıyor': return 'Hazırlanıyor';
      case 'kargoda': return 'Kargoda';
      case 'teslim edildi': return 'Teslim Edildi';
      case 'iptal edildi': return 'İptal Edildi';
      default: return status;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-error">Bu sayfaya erişim yetkiniz yok.</div>;
  }

  if (loading) {
    return <div className="loading">Siparişler yükleniyor...</div>;
  }

  return (
    <div className="admin-orders-container">
      <div className="admin-header">
        <h1>Admin - Sipariş Yönetimi</h1>
        <p>Toplam {orders.length} sipariş</p>
      </div>

      <div className="orders-grid">
        {orders.map(order => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Sipariş #{order.trackingNumber}</h3>
                <p className="order-date">
                  {new Date(order.createdAt).toLocaleDateString('tr-TR')} - {new Date(order.createdAt).toLocaleTimeString('tr-TR')}
                </p>
                <p className="customer-info">
                  <strong>Müşteri:</strong> {order.user?.name || 'Bilinmeyen'} ({order.user?.email || 'Email yok'})
                </p>
                <p className="order-total">
                  <strong>Toplam:</strong> ₺{order.total.toFixed(2)}
                </p>
              </div>
              <div className="order-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            <div className="order-details">
              <div className="detail-item">
                <strong>Adres:</strong> {order.address}
              </div>
              <div className="detail-item">
                <strong>Telefon:</strong> {order.phone}
              </div>
            </div>

            <div className="order-products">
              <h4>Ürünler:</h4>
              <ul>
                {order.products.map((item, index) => (
                  <li key={index}>
                    {item.product?.title} x {item.quantity} (₺{item.price.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>

            <div className="status-update-section">
              <h4>Durum Güncelle</h4>
              <div className="status-controls">
                <select 
                  className="status-select"
                  defaultValue={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    const note = prompt('Durum güncellemesi için not ekleyin (opsiyonel):');
                    if (newStatus !== order.status) {
                      handleStatusUpdate(order._id, newStatus, note);
                    }
                  }}
                  disabled={updatingOrder === order._id}
                >
                  <option value="beklemede">Beklemede</option>
                  <option value="hazırlanıyor">Hazırlanıyor</option>
                  <option value="kargoda">Kargoda</option>
                  <option value="teslim edildi">Teslim Edildi</option>
                  <option value="iptal edildi">İptal Edildi</option>
                </select>
                
                {updatingOrder === order._id && (
                  <span className="updating-indicator">Güncelleniyor...</span>
                )}
              </div>
            </div>

            <div className="status-history">
              <h4>Durum Geçmişi</h4>
              <div className="history-timeline">
                {order.statusHistory?.map((history, index) => (
                  <div key={index} className="history-item">
                    <div className="history-marker" style={{ backgroundColor: getStatusColor(history.status) }}></div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-status" style={{ color: getStatusColor(history.status) }}>
                          {getStatusText(history.status)}
                        </span>
                        <span className="history-date">
                          {new Date(history.date).toLocaleDateString('tr-TR')} - {new Date(history.date).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      {history.note && <p className="history-note">{history.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="no-orders">
          Henüz sipariş bulunmuyor.
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage; 