import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatalarında logout yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Ürünler
export const getProducts = (params) => api.get('/api/products', { params });
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const addProduct = (productData) => {
  const isFormData = productData instanceof FormData;
  return api.post('/api/products', productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
};
export const updateProduct = (id, productData) => {
  const isFormData = productData instanceof FormData;
  return api.put(`/api/products/${id}`, productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
};
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// Sepet
export const getCart = (userId) => api.get(`/api/cart/${userId}`);
export const addToCart = (cartItem) => api.post('/api/cart', cartItem);
export const updateCartItem = (id, cartItem) => api.put(`/api/cart/${id}`, cartItem);
export const removeFromCart = (id) => api.delete(`/api/cart/${id}`);

// Siparişler
export const getOrders = (userId) => api.get(`/api/orders/${userId}`);
export const createOrder = (orderData) => api.post('/api/orders', orderData);
export const createGuestOrder = (orderData) => api.post('/api/orders/guest', orderData);
export const getOrderDetail = (orderId) => api.get(`/api/orders/detail/${orderId}`);
export const trackOrder = (trackingNumber) => api.get(`/api/orders/track/${trackingNumber}`);
export const updateOrderStatus = (orderId, statusData) => api.patch(`/api/orders/${orderId}/status`, statusData);
export const cancelOrder = (orderId) => api.patch(`/api/orders/${orderId}/cancel`);
export const getAllOrders = () => api.get('/api/orders/admin/all');

// Auth
export const loginUser = (credentials) => api.post('/api/auth/login', credentials);
export const registerUser = (userData) => api.post('/api/auth/register', userData);
export const getMe = () => api.get('/api/auth/me');
export const updateProfile = (data) => api.put('/api/auth/me', data);
export const changePassword = (data) => api.put('/api/auth/change-password', data);
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/api/auth/reset-password', data);

// Admin - Kullanıcı Yönetimi
export const getUsers = (params) => api.get('/api/auth/admin/users', { params });
export const updateUserRole = (userId, role) => api.patch(`/api/auth/admin/users/${userId}/role`, { role });
export const getDashboardStats = () => api.get('/api/admin/stats');

// Favoriler
export const getFavorites = (userId) => api.get(`/api/auth/favorites/${userId}`);
export const addFavorite = (userId, productId) => api.post('/api/auth/favorites/add', { userId, productId });
export const removeFavorite = (userId, productId) => api.post('/api/auth/favorites/remove', { userId, productId });

// Ürün Yorum
export const addReview = (productId, reviewData) => api.patch(`/api/products/${productId}/review`, reviewData);
export const editReview = (productId, reviewIndex, reviewData) => api.put(`/api/products/${productId}/review/${reviewIndex}`, reviewData);
export const deleteReview = (productId, reviewIndex) => api.delete(`/api/products/${productId}/review/${reviewIndex}`);

// Kuponlar
export const validateCoupon = (code, orderTotal) => api.post('/api/coupons/validate', { code, orderTotal });
export const getCoupons = () => api.get('/api/coupons');
export const createCoupon = (couponData) => api.post('/api/coupons', couponData);
export const deleteCoupon = (id) => api.delete(`/api/coupons/${id}`);
export const toggleCoupon = (id) => api.patch(`/api/coupons/${id}/toggle`);

// Ödeme (iyzico)
export const initPayment = (paymentData) => api.post('/api/payment/init', paymentData);
export const getPaymentResult = (token) => api.get(`/api/payment/result/${token}`);

// Kategoriler
export const getCategories = () => api.get('/api/categories');
export const getAllCategories = () => api.get('/api/categories/all');
export const createCategory = (data) => api.post('/api/categories', data);
export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

// Adres Yönetimi
export const getAddresses = () => api.get('/api/auth/addresses');
export const addAddress = (data) => api.post('/api/auth/addresses', data);
export const updateAddress = (id, data) => api.put(`/api/auth/addresses/${id}`, data);
export const deleteAddress = (id) => api.delete(`/api/auth/addresses/${id}`);

// Stok Uyarıları
export const getStockAlerts = (threshold) => api.get('/api/stock-alerts', { params: { threshold } });

// Faturalar
export const getInvoice = (orderId) => api.get(`/api/orders/${orderId}/invoice`, { responseType: 'blob' });

export default api;