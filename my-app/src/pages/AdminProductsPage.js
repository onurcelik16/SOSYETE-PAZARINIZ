import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaBoxOpen } from 'react-icons/fa';
import './AdminProductsPage.css';

const AdminProductsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchProducts();
    }, [user, navigate]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await getProducts({}); // Fetch all products
            setProducts(Array.isArray(res.data) ? res.data : (res.data.products || []));
        } catch {
            toast.error('Ürünler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
        setDeleteLoading(id);
        try {
            await deleteProduct(id);
            toast.success('Ürün silindi');
            setProducts(products.filter(p => p._id !== id));
        } catch {
            toast.error('Ürün silinemedi');
        } finally {
            setDeleteLoading(null);
        }
    };

    const filteredProducts = (products || []).filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <AdminDashboardLayout title="Ürünler"><div>Yükleniyor...</div></AdminDashboardLayout>;

    return (
        <AdminDashboardLayout title="Ürün Yönetimi" subtitle="Kataloğunuzdaki ürünleri yönetin">
            <div className="admin-products-wrapper">
                {/* Actions */}
                <div className="products-actions-bar">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Ürün Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/add-product')}>
                        <FaPlus /> Yeni Ürün Ekle
                    </button>
                </div>

                {/* Products Table */}
                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Kategori</th>
                                <th>Fiyat</th>
                                <th>Stok</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product._id}>
                                    <td>
                                        <div className="product-cell">
                                            <img
                                                src={product.image || product.images?.[0] || 'https://via.placeholder.com/40'}
                                                alt={product.title}
                                                className="product-thumb-small"
                                            />
                                            <div className="product-info">
                                                <span className="product-title" title={product.title}>{product.title}</span>
                                                <span className="product-id">#{product._id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="category-badge">{product.category}</span></td>
                                    <td className="price-cell">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                    <td>{product.stock > 0 ? product.stock : <span className="text-danger">Tükendi</span>}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="icon-btn edit"
                                                onClick={() => navigate(`/edit-product/${product._id}`)}
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                onClick={() => handleDelete(product._id)}
                                                disabled={deleteLoading === product._id}
                                                title="Sil"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="no-products-state">
                            <FaBoxOpen /> Ürün bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </AdminDashboardLayout>
    );
};

export default AdminProductsPage;
