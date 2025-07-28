import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetail } from '../services/api';
import './OrderDetailPage.css';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetail(orderId);
        console.log('Sipariş detayı:', response.data);
        console.log('Ürünler:', response.data.products);
        setOrder(response.data);
      } catch (err) {
        setError('Sipariş detayı yüklenemedi');
        console.error('Sipariş detayı hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-container">
        <div className="error">
          <h2>Hata</h2>
          <p>{error || 'Sipariş bulunamadı'}</p>
          <Link to="/orders" className="back-link">Siparişlerime Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <h1 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#333', margin: '0' }}>Sipariş Detayı</h1>
        <Link to="/orders" className="back-link">← Siparişlerime Dön</Link>
      </div>

      <div className="order-info-grid">
        {/* Sipariş Bilgileri */}
        <div className="order-info-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Sipariş Bilgileri</h3>
          <div className="info-item">
            <span className="label">Takip Numarası:</span>
            <span className="value tracking-number">{order.trackingNumber}</span>
          </div>
          <div className="info-item">
            <span className="label">Sipariş Tarihi:</span>
            <span className="value">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
          </div>
          <div className="info-item">
            <span className="label">Toplam Tutar:</span>
            <span className="value total-price">₺{order.total.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="label">Durum:</span>
            <span 
              className="value status-badge"
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        {/* Teslimat Bilgileri */}
        <div className="order-info-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Teslimat Bilgileri</h3>
          <div className="info-item">
            <span className="label">Adres:</span>
            <span className="value">{order.address}</span>
          </div>
          <div className="info-item">
            <span className="label">Telefon:</span>
            <span className="value">{order.phone}</span>
          </div>
        </div>
      </div>

      {/* Ürünler */}
      <div className="order-products">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Sipariş Edilen Ürünler</h3>
        <div className="products-list">
          {order.products.map((item, index) => (
            <div key={index} className="product-item" style={{ padding: '8px', marginBottom: '8px', borderRadius: '6px' }}>
              <div className="product-info">
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>{item.product.title}</h4>
                <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#007bff' }}>₺{item.price.toFixed(2)}</p>
                <p style={{ fontSize: '0.8rem', margin: '2px 0', color: '#666' }}>Adet: {item.quantity}</p>
                <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#28a745', fontWeight: '600' }}>Toplam: ₺{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Durum Geçmişi */}
      <div className="status-history">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Sipariş Durumu Geçmişi</h3>
        <div className="timeline">
          {order.statusHistory.map((history, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker" style={{ backgroundColor: getStatusColor(history.status) }}></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-status" style={{ color: getStatusColor(history.status) }}>
                    {getStatusText(history.status)}
                  </span>
                  <span className="timeline-date">
                    {new Date(history.date).toLocaleDateString('tr-TR')} - {new Date(history.date).toLocaleTimeString('tr-TR')}
                  </span>
                </div>
                {history.note && <p className="timeline-note">{history.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 