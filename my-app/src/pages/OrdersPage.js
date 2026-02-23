import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserDashboardLayout from '../components/UserDashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getOrders, cancelOrder, getInvoice } from '../services/api';
import { useToast } from '../components/Toast';
import { FaBoxOpen, FaChevronRight, FaCalendarAlt, FaCreditCard, FaMapMarkerAlt, FaSearch, FaFilePdf, FaDownload } from 'react-icons/fa';
import './OrdersPage.css';

const OrdersPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await getOrders(user._id);
      // Sort by date desc
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
      setFilteredOrders(sorted);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [user]);

  // Filter Logic
  useEffect(() => {
    let result = orders;

    // Tab Filter
    if (activeTab === 'active') {
      result = result.filter(o => ['beklemede', 'hazırlanıyor', 'kargoda'].includes(o.status));
    } else if (activeTab === 'completed') {
      result = result.filter(o => o.status === 'teslim edildi');
    } else if (activeTab === 'cancelled') {
      result = result.filter(o => o.status === 'iptal edildi');
    }

    // Search Filter
    if (searchTerm) {
      result = result.filter(o =>
        o._id.includes(searchTerm) ||
        o.products.some(p => p.product.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(result);
  }, [orders, activeTab, searchTerm]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      setCancellingId(orderId);
      await cancelOrder(orderId);
      toast.success('Sipariş başarıyla iptal edildi');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sipariş iptal edilemedi');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadInvoice = async (orderId, trackingNumber) => {
    try {
      const { data } = await getInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura-${trackingNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Fatura indirilemedi');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'beklemede': return <span className="status-badge warning">Beklemede</span>;
      case 'hazırlanıyor': return <span className="status-badge info">Hazırlanıyor</span>;
      case 'kargoda': return <span className="status-badge primary">Kargoda</span>;
      case 'teslim edildi': return <span className="status-badge success">Teslim Edildi</span>;
      case 'iptal edildi': return <span className="status-badge danger">İptal Edildi</span>;
      default: return <span className="status-badge default">{status}</span>;
    }
  };

  if (loading) return <UserDashboardLayout title="Siparişlerim"><div>Yükleniyor...</div></UserDashboardLayout>;

  return (
    <UserDashboardLayout title="Siparişlerim" subtitle="Geçmiş siparişlerinizi görüntüleyin ve takip edin.">
      <div className="orders-wrapper">

        {/* Filter Tabs */}
        <div className="orders-tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Tümü</button>
          <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Devam Edenler</button>
          <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Tamamlananlar</button>
          <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>İptaller</button>
        </div>

        {/* Search */}
        <div className="orders-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Sipariş No veya Ürün Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Order List */}
        {filteredOrders.length > 0 ? (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order._id} className="order-card-modern">
                <div className="order-header">
                  <div className="header-left">
                    <span className="order-date">
                      <FaCalendarAlt /> {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="order-amount">
                      <FaCreditCard /> {order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className="header-right">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-products-preview">
                    {order.products.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="product-thumb">
                        <img
                          src={item.product?.image || (item.product?.images?.[0]) || 'https://via.placeholder.com/50'}
                          alt={item.product?.title}
                          title={item.product?.title}
                        />
                        <span className="thumb-qty">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.products.length > 3 && (
                      <div className="more-products">+{order.products.length - 3}</div>
                    )}
                  </div>

                  <div className="order-details-mini">
                    <div className="detail-row">
                      <FaMapMarkerAlt />
                      <span className="address-text" title={order.address}>{order.address}</span>
                    </div>
                    <div className="order-id">#{order._id.slice(-8).toUpperCase()}</div>
                  </div>
                </div>

                <div className="order-footer">
                  <button
                    className="invoice-btn-text"
                    onClick={() => handleDownloadInvoice(order._id, order.trackingNumber)}
                    style={{ fontSize: '0.85rem', color: '#1d4ed8', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}
                  >
                    <FaFilePdf /> Fatura
                  </button>
                  {order.status === 'beklemede' && (
                    <button
                      className="cancel-btn-text"
                      onClick={() => handleCancel(order._id)}
                      disabled={cancellingId === order._id}
                    >
                      {cancellingId === order._id ? '...' : 'Siparişi İptal Et'}
                    </button>
                  )}
                  <Link to={`/orders/${order._id}`} className="view-details-btn">
                    Detaylar <FaChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders-state">
            <FaBoxOpen className="empty-icon" />
            <p>Sipariş bulunamadı.</p>
            <Link to="/" className="btn btn-primary">Alışverişe Başla</Link>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default OrdersPage;