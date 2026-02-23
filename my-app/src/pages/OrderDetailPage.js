import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetail } from '../services/api';
import './OrderDetailPage.css';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaPhone, FaArrowLeft, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';

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
        setOrder(response.data);
      } catch (err) {
        setError('Sipariş detayı yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'beklemede': return <FaBox />;
      case 'hazırlanıyor': return <FaBox />;
      case 'kargoda': return <FaTruck />;
      case 'teslim edildi': return <FaCheckCircle />;
      case 'iptal edildi': return <FaTimesCircle />;
      default: return <FaBox />;
    }
  };

  if (loading) return <div className="order-page-loading"><div className="spinner"></div></div>;

  if (error || !order) return (
    <div className="order-error-container">
      <div className="error-card">
        <h2>Sipariş Bulunamadı</h2>
        <p>{error || 'İstediğiniz siparişe ulaşılamadı.'}</p>
        <Link to="/orders" className="btn btn-primary">Siparişlerime Dön</Link>
      </div>
    </div>
  );

  return (
    <div className="order-detail-page">
      <div className="order-header">
        <Link to="/orders" className="back-btn"><FaArrowLeft /> Geri</Link>
        <div className="header-title">
          <h1>Sipariş #{order.trackingNumber || order._id.slice(-6).toUpperCase()}</h1>
          <span className={`status-badge-lg ${order.status.replace(' ', '-')}`}>
            {getStatusIcon(order.status)} {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="order-content-grid">
        {/* Sol Kolon: Ürünler ve Durum */}
        <div className="main-col">
          {/* Ürün Listesi */}
          <div className="card product-list-card">
            <h3>Sipariş İçeriği</h3>
            <div className="product-list">
              {order.products.map((item, index) => (
                <div key={index} className="order-product-item">
                  <div className="p-img">
                    <img src={item.product.image || (item.product.images?.[0]) || 'https://via.placeholder.com/100'} alt={item.product.title} />
                  </div>
                  <div className="p-details">
                    <h4>{item.product.title}</h4>
                    <span className="p-meta">Adet: {item.quantity}</span>
                  </div>
                  <div className="p-price">
                    {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </div>
                </div>
              ))}
            </div>
            <div className="order-summary-footer">
              <div className="summary-row total">
                <span>Toplam Tutar</span>
                <span>{order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card timeline-card">
            <h3>Sipariş Geçmişi</h3>
            <div className="timeline-vertical">
              {order.statusHistory.slice().reverse().map((history, index) => (
                <div key={index} className={`timeline-step ${index === 0 ? 'current' : ''}`}>
                  <div className="step-marker"></div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-status">{history.status}</span>
                      <span className="step-date">
                        {new Date(history.date).toLocaleDateString('tr-TR')} {new Date(history.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {history.note && <p className="step-note">{history.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Bilgiler */}
        <div className="side-col">
          <div className="card info-card">
            <h3>Teslimat Bilgileri</h3>
            <div className="info-group">
              <div className="info-icon"><FaMapMarkerAlt /></div>
              <div className="info-text">
                <label>Teslimat Adresi</label>
                <p>{order.address}</p>
              </div>
            </div>
            <div className="info-group">
              <div className="info-icon"><FaPhone /></div>
              <div className="info-text">
                <label>Telefon</label>
                <p>{order.phone}</p>
              </div>
            </div>
          </div>

          <div className="card info-card">
            <h3>Ödeme Detayları</h3>
            <div className="info-group">
              <div className="info-icon"><FaCreditCard /></div>
              <div className="info-text">
                <label>Ödeme Yöntemi</label>
                <p>Kredi Kartı / Banka Kartı</p>
              </div>
            </div>
            <div className="info-group">
              <div className="info-icon"><FaCalendarAlt /></div>
              <div className="info-text">
                <label>Sipariş Tarihi</label>
                <p>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;