import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './components/Toast';
import { HelmetProvider } from 'react-helmet-async';
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

// Lazy-loaded pages (Code Splitting)
const HomePage = lazy(() => import("./pages/HomePage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));

// Loading fallback
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid var(--primary, #6366f1)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/add-product" element={<AdminRoute><AddProductPage /></AdminRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<AdminRoute><EditProductPage /></AdminRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <ToastProvider>
            <CartProvider>
              <FavoritesProvider>
                <AppContent />
              </FavoritesProvider>
            </CartProvider>
          </ToastProvider>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
