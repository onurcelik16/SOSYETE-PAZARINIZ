import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AddProductPage from './pages/AddProductPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FavoritesPage from './pages/FavoritesPage';
import EditProductPage from './pages/EditProductPage';
import { FaInstagram, FaTwitter, FaFacebook } from 'react-icons/fa';
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="main-content" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/add-product" element={<AddProductPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/edit-product/:id" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
        </Routes>
      </main>
      {location.pathname !== "/login" && (
        <footer style={{ width: '100%', background: '#23272f', padding: '32px 0 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 22, marginBottom: 6 }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: 28 }}><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: 28 }}><FaTwitter /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: 28 }}><FaFacebook /></a>
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>Sosyete Pazarı &copy; {new Date().getFullYear()} - Modern Alışverişin Yeni Adı</div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <CartProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </CartProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
