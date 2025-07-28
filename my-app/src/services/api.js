import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ürünler
export const getProducts = () => api.get('/api/products');
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const getProductsByCategory = (category) => api.get(`/api/products?category=${category}`);

// Kategoriler
export const getCategories = () => api.get('/categories');

// Kullanıcılar
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (userData) => api.post('/users', userData);

// Sepet
export const getCart = (userId) => api.get(`/api/cart/${userId}`);
export const addToCart = (cartItem) => api.post('/api/cart', cartItem);
export const updateCartItem = (id, cartItem) => api.put(`/api/cart/${id}`, cartItem);
export const removeFromCart = (id) => api.delete(`/api/cart/${id}`);

// Siparişler
export const getOrders = (userId) => api.get(`/api/orders/${userId}`);
export const createOrder = (orderData) => api.post('/api/orders', orderData);
export const getOrderDetail = (orderId) => api.get(`/api/orders/detail/${orderId}`);
export const trackOrder = (trackingNumber) => api.get(`/api/orders/track/${trackingNumber}`);
export const updateOrderStatus = (orderId, statusData) => api.patch(`/api/orders/${orderId}/status`, statusData);
export const getAllOrders = () => api.get('/api/orders/admin/all');

export default api; 