import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaSearch, FaUserShield, FaUser, FaEllipsisV } from 'react-icons/fa';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, navigate, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsers({ page, limit: 15, search });
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch {
            toast.error('Kullanıcılar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleRoleToggle = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            setUpdatingId(userId);
            await updateUserRole(userId, newRole);
            toast.success(`Kullanıcı rolü ${newRole} olarak güncellendi`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Rol güncellenemedi');
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading && users.length === 0) {
        return <AdminDashboardLayout title="Kullanıcılar"><div>Yükleniyor...</div></AdminDashboardLayout>;
    }

    return (
        <AdminDashboardLayout title="Kullanıcı Yönetimi" subtitle="Sistemdeki tüm kayıtlı kullanıcıları yönetin">
            <div className="admin-table-container">
                {/* Search Bar */}
                <div className="table-actions">
                    <form className="admin-search-box" onSubmit={handleSearch}>
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Ad, soyad veya e-posta ile ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>

                {/* Users Table */}
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Kullanıcı</th>
                                <th>Rol</th>
                                <th>E-posta</th>
                                <th>Kayıt Tarihi</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-xs">{u.name?.charAt(0)}</div>
                                            <div className="user-details">
                                                <span className="user-name">{u.name} {u.surname}</span>
                                                <span className="user-id">#{u._id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                                            {u.role === 'admin' ? <><FaUserShield /> Admin</> : <><FaUser /> Kullanıcı</>}
                                        </span>
                                    </td>
                                    <td className="text-secondary">{u.email}</td>
                                    <td className="text-secondary">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                                    <td>
                                        {u._id !== user._id && (
                                            <button
                                                className="action-btn text"
                                                onClick={() => handleRoleToggle(u._id, u.role)}
                                                disabled={updatingId === u._id}
                                            >
                                                {updatingId === u._id ? '...' : (u.role === 'admin' ? 'Yetkiyi Al' : 'Admin Yap')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="admin-pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="page-btn">Önceki</button>
                        <span className="page-info">Sayfa {page} / {pagination.pages} ({pagination.total} kayıt)</span>
                        <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="page-btn">Sonraki</button>
                    </div>
                )}
            </div>
        </AdminDashboardLayout>
    );
};

export default AdminUsersPage;
