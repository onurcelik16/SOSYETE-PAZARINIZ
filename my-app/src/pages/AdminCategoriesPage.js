import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaPlus, FaTimes, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaArrowUp, FaArrowDown, FaTag } from 'react-icons/fa';
import './AdminCategoriesPage.css';

const AdminCategoriesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', icon: '', order: 0 });

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/'); return; }
        fetchCategories();
    }, [user, navigate]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await getAllCategories();
            setCategories(res.data);
        } catch { toast.error('Kategoriler yüklenemedi'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await updateCategory(editId, form);
                toast.success('Kategori güncellendi!');
            } else {
                await createCategory(form);
                toast.success('Kategori oluşturuldu!');
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'İşlem başarısız');
        } finally { setSaving(false); }
    };

    const handleEdit = (cat) => {
        setEditId(cat._id);
        setForm({ name: cat.name, icon: cat.icon || '', order: cat.order || 0 });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteCategory(id);
            toast.success('Kategori silindi');
            fetchCategories();
        } catch { toast.error('Kategori silinemedi'); }
    };

    const handleToggle = async (cat) => {
        try {
            await updateCategory(cat._id, { ...cat, isActive: !cat.isActive });
            toast.success(`Kategori ${cat.isActive ? 'pasife alındı' : 'aktif edildi'}`);
            fetchCategories();
        } catch { toast.error('Durum güncellenemedi'); }
    };

    const handleReorder = async (cat, direction) => {
        const newOrder = direction === 'up' ? cat.order - 1 : cat.order + 1;
        try {
            await updateCategory(cat._id, { order: newOrder });
            fetchCategories();
        } catch { toast.error('Sıralama güncellenemedi'); }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditId(null);
        setForm({ name: '', icon: '', order: 0 });
    };

    if (loading) return <AdminDashboardLayout title="Kategoriler"><div>Yükleniyor...</div></AdminDashboardLayout>;

    return (
        <AdminDashboardLayout title="Kategori Yönetimi" subtitle="Ürün kategorilerini ekleyin, düzenleyin ve yönetin">
            <div className="admin-categories-wrapper">

                {/* Header Action */}
                <div className="categories-action-bar">
                    <span className="cat-count">{categories.length} kategori</span>
                    <button className="btn btn-primary" onClick={() => showForm ? resetForm() : setShowForm(true)}>
                        {showForm ? <><FaTimes /> İptal</> : <><FaPlus /> Yeni Kategori</>}
                    </button>
                </div>

                {/* Create / Edit Form */}
                {showForm && (
                    <div className="category-form-card">
                        <h3>{editId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row-grid">
                                <div className="input-group">
                                    <label>Kategori Adı *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        placeholder="Örn: Elektronik"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>İkon (Emoji)</label>
                                    <input
                                        type="text"
                                        value={form.icon}
                                        onChange={e => setForm({ ...form, icon: e.target.value })}
                                        placeholder="Örn: 📱 veya 👕"
                                        maxLength={4}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Sıralama</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="form-actions-right">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : editId ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories List */}
                <div className="categories-list">
                    {categories.map((cat, index) => (
                        <div key={cat._id} className={`category-row ${!cat.isActive ? 'inactive' : ''}`}>
                            <div className="cat-left">
                                <span className="cat-icon">{cat.icon || <FaTag />}</span>
                                <div className="cat-info">
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-slug">/{cat.slug}</span>
                                </div>
                            </div>

                            <div className="cat-right">
                                <span className={`cat-status-badge ${cat.isActive ? 'active' : 'passive'}`}>
                                    {cat.isActive ? 'Aktif' : 'Pasif'}
                                </span>

                                <div className="cat-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleReorder(cat, 'up')}
                                        disabled={index === 0}
                                        title="Yukarı Taşı"
                                    >
                                        <FaArrowUp />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleReorder(cat, 'down')}
                                        disabled={index === categories.length - 1}
                                        title="Aşağı Taşı"
                                    >
                                        <FaArrowDown />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleToggle(cat)}
                                        title={cat.isActive ? 'Pasife Al' : 'Aktif Et'}
                                    >
                                        {cat.isActive ? <FaToggleOn className="text-success" /> : <FaToggleOff className="text-muted" />}
                                    </button>
                                    <button className="icon-btn" onClick={() => handleEdit(cat)} title="Düzenle">
                                        <FaEdit />
                                    </button>
                                    <button className="icon-btn danger" onClick={() => handleDelete(cat._id)} title="Sil">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {categories.length === 0 && !loading && (
                        <div className="no-categories">
                            <FaTag size={32} />
                            <h3>Henüz kategori yok</h3>
                            <p>Yukarıdaki butona tıklayarak ilk kategorinizi oluşturun.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminDashboardLayout>
    );
};

export default AdminCategoriesPage;
