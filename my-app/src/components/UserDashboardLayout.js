import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaBoxOpen, FaSignOutAlt, FaHome } from 'react-icons/fa';
import './UserDashboardLayout.css';

const UserDashboardLayout = ({ children, title, subtitle }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/profile', label: 'Profilim', icon: <FaUser /> },
        { path: '/orders', label: 'Siparişlerim', icon: <FaBoxOpen /> },
    ];

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="user-profile-summary">
                    <div className="user-avatar-small">
                        {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                    </div>
                    <div className="user-info-small">
                        <span className="user-name">{user?.name} {user?.surname}</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                </div>

                <nav className="dashboard-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                    <Link to="/" className="nav-item">
                        <span className="nav-icon"><FaHome /></span>
                        Ana Sayfa
                    </Link>
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <span className="nav-icon"><FaSignOutAlt /></span>
                        Çıkış Yap
                    </button>
                </nav>
            </aside>

            <main className="dashboard-content">
                <header className="content-header">
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </header>
                <div className="content-body">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default UserDashboardLayout;
