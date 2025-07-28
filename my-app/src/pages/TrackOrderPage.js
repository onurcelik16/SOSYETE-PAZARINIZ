import React, { useState } from 'react';
import { trackOrder } from '../services/api';
import { Link } from 'react-router-dom';
import './TrackOrderPage.css';

const TrackOrderPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Lütfen takip numarasını girin');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await trackOrder(trackingNumber.trim());
      setOrder(response.data);
    } catch (err) {
      setError('Sipariş bulunamadı. Takip numarasını kontrol edin.');
    } finally {
      setLoading(false);
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

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h1>Sipariş Takip</h1>
        <p>Takip numaranızı girerek siparişinizin durumunu öğrenebilirsiniz</p>
      </div>

      <div className="track-form-container">
        <form onSubmit={handleTrackOrder} className="track-form">
          <div className="form-group">
            <label htmlFor="trackingNumber">Takip Numarası</label>
            <input
              type="text"
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Örn: TRK2412012345"
              className="tracking-input"
              disabled={loading}
            />
          </div>
          <button type="submit" className="track-button" disabled={loading}>
            {loading ? 'Aranıyor...' : 'Sipariş Ara'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {order && (
        <div className="order-result">
          <div className="order-summary">
            <h3>Sipariş Bulundu</h3>
            <div className="order-info-grid">
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
          </div>

          <div className="order-products">
            <h4>Sipariş Edilen Ürünler</h4>
            <div className="products-list">
              {order.products.map((item, index) => (
                <div key={index} className="product-item">
                  <div className="product-image">
                    <img 
                      src={item.product.images[0] || '/logo.png'} 
                      alt={item.product.title}
                      onError={(e) => {
                        e.target.src = '/logo.png';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h5>{item.product.title}</h5>
                    <p>Adet: {item.quantity}</p>
                    <p>Fiyat: ₺{item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="status-history">
            <h4>Sipariş Durumu Geçmişi</h4>
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

          <div className="order-actions">
            <Link to="/" className="home-link">Ana Sayfaya Dön</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage; 