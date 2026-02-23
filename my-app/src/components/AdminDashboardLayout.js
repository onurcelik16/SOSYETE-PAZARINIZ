import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaBox, FaShoppingCart, FaUsers, FaTag, FaChartLine, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './AdminDashboardLayout.css';
import { useState } from 'react';

const AdminDashboardLayout = ({ children, title, subtitle }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: <FaChartLine /> },
        { path: '/admin/orders', label: 'Siparişler', icon: <FaShoppingCart /> },
        { path: '/admin/products', label: 'Ürünler', icon: <FaBox /> },
        { path: '/admin/categories', label: 'Kategoriler', icon: <FaTag /> },
        { path: '/admin/users', label: 'Kullanıcılar', icon: <FaUsers /> },
        { path: '/admin/coupons', label: 'Kuponlar', icon: <FaTag /> },
    ];

    return (
        <div className="admin-layout">
            {/* Mobile Header */}
            <div className="admin-mobile-header">
                <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <span className="admin-brand">Admin Panel</span>
            </div>

            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <h2>Admin Panel</h2>
                    <p>{user?.name}</p>
                </div>

                <nav className="admin-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}

                    <div className="nav-divider"></div>

                    <Link to="/" className="admin-nav-item">
                        <span className="nav-icon"><FaHome /></span>
                        Mağazaya Dön
                    </Link>

                    <button onClick={handleLogout} className="admin-nav-item logout">
                        <span className="nav-icon"><FaSignOutAlt /></span>
                        Çıkış
                    </button>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <main className="admin-content">
                <header className="admin-page-header">
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p className="subtitle">{subtitle}</p>}
                    </div>
                    <div className="admin-actions">
                        {/* Action buttons can be injected here via props if needed, or children */}
                    </div>
                </header>

                <div className="admin-page-body">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardLayout;
