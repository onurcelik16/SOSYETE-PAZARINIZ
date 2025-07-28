import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../services/api';
import './OrdersPage.css';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const res = await getOrders(user._id);
        setOrders(res.data);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

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

  if (loading) return <div className="loading">Siparişler yükleniyor...</div>;
  if (!orders.length) return <div className="no-orders">Henüz siparişiniz yok.</div>;

  return (
    <div className="orders-container">
      <h2>Siparişlerim</h2>
      {orders.map(order => (
        <div key={order._id} className="order-card">
          <div className="order-header">
            <div className="order-info">
              <div className="order-date">
                <b>Tarih:</b> {new Date(order.createdAt).toLocaleDateString('tr-TR')}
              </div>
              <div className="order-total">
                <b>Toplam:</b> ₺{order.total.toFixed(2)}
              </div>
              {order.trackingNumber && (
                <div className="tracking-number">
                  <b>Takip No:</b> {order.trackingNumber}
                </div>
              )}
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
            <div><b>Adres:</b> {order.address}</div>
            <div><b>Telefon:</b> {order.phone}</div>
            {order.paymentMethod && (
              <div>
                <b>Ödeme Yöntemi:</b> {order.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Kapıda Ödeme'}
              </div>
            )}
          </div>
          
          <div className="order-products">
            <b>Ürünler:</b>
            <ul>
              {order.products.map((item, i) => (
                <li key={i}>
                  {item.product?.title} x {item.quantity} (₺{item.price.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
          
          <div className="order-actions">
            <Link to={`/orders/${order._id}`} className="detail-link">
              Detayları Görüntüle
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersPage; 