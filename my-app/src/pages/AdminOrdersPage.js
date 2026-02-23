import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaSearch, FaEye, FaCheck, FaTruck, FaBox, FaTimes, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Filter Logic
  useEffect(() => {
    let result = orders;

    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(o =>
        o._id.toLowerCase().includes(lowerTerm) ||
        o.trackingNumber?.toLowerCase().includes(lowerTerm) ||
        o.user?.name?.toLowerCase().includes(lowerTerm) ||
        o.user?.email?.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      // Sort by newest first
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
      setFilteredOrders(sorted);
    } catch (err) {
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Sipariş durumunu "${newStatus}" olarak değiştirmek istiyor musunuz?`)) return;

    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, { status: newStatus });

      // Optimistic update
      const updatedOrders = orders.map(o =>
        o._id === orderId ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);

      toast.success('Sipariş durumu güncellendi');
    } catch (err) {
      toast.error('Guncelleme başarısız');
      fetchOrders(); // Revert on error
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = [
    { value: 'beklemede', label: 'Beklemede', color: '#f59e0b', icon: <FaFilter /> },
    { value: 'hazırlanıyor', label: 'Hazırlanıyor', color: '#3b82f6', icon: <FaBox /> },
    { value: 'kargoda', label: 'Kargoda', color: '#8b5cf6', icon: <FaTruck /> },
    { value: 'teslim edildi', label: 'Teslim Edildi', color: '#10b981', icon: <FaCheck /> },
    { value: 'iptal edildi', label: 'İptal Edildi', color: '#ef4444', icon: <FaTimes /> },
  ];

  const getStatusBadge = (status) => {
    const option = statusOptions.find(o => o.value === status) || { label: status, color: '#6b7280' };
    return (
      <span className="status-badge-modern" style={{ backgroundColor: option.color + '20', color: option.color }}>
        {option.label}
      </span>
    );
  };

  if (loading && orders.length === 0) return <AdminDashboardLayout title="Siparişler"><div>Yükleniyor...</div></AdminDashboardLayout>;

  return (
    <AdminDashboardLayout title="Sipariş Yönetimi" subtitle="Gelen siparişleri takip edin ve yönetin">
      <div className="admin-orders-wrapper">

        {/* Statistics Cards (Optional - could be added here) */}

        {/* Filters & Search */}
        <div className="orders-toolbar">
          <div className="status-tabs">
            <button
              className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Tümü
            </button>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                className={`tab-btn ${statusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="search-box-orders">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Sipariş No, Müşteri Adı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Müşteri</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>Hızlı İşlem</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id}>
                  <td>
                    <span className="order-id">#{order.trackingNumber || order._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">{order.user?.name || 'Misafir'}</span>
                      <span className="customer-email">{order.user?.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <FaCalendarAlt className="text-light" />
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="amount-cell">
                    {order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                  <td>
                    <div className="quick-actions">
                      <div className="status-select-wrapper">
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          disabled={updatingId === order._id}
                          style={{
                            color: getStatusBadge(order.status).props.style.color,
                            borderColor: getStatusBadge(order.status).props.style.color
                          }}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-view-detail"
                      onClick={() => navigate(`/orders/${order._id}`)} // Or open a modal
                    >
                      <FaEye /> İncele
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="no-data-message">
              Sipariş bulunamadı.
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminOrdersPage;