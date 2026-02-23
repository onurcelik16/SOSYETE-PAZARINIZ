import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCoupons, createCoupon, deleteCoupon, toggleCoupon } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaTag, FaTrash, FaToggleOn, FaToggleOff, FaPlus, FaTimes } from 'react-icons/fa';
import './AdminCouponsPage.css';

const AdminCouponsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        code: '', discountType: 'percentage', discountValue: '',
        minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/'); return; }
        fetchCoupons();
    }, [user, navigate]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await getCoupons();
            setCoupons(res.data);
        } catch { toast.error('Kuponlar yüklenemedi'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                code: form.code,
                discountType: form.discountType,
                discountValue: parseFloat(form.discountValue),
                expiresAt: form.expiresAt,
                ...(form.minOrderAmount && { minOrderAmount: parseFloat(form.minOrderAmount) }),
                ...(form.maxDiscount && { maxDiscount: parseFloat(form.maxDiscount) }),
                ...(form.usageLimit && { usageLimit: parseInt(form.usageLimit) })
            };
            await createCoupon(data);
            toast.success('Kupon oluşturuldu!');
            setShowForm(false);
            setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Kupon oluşturulamadı');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Kuponu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteCoupon(id);
            toast.success('Kupon silindi');
            fetchCoupons();
        } catch { toast.error('Kupon silinemedi'); }
    };

    const handleToggle = async (id) => {
        try {
            await toggleCoupon(id);
            toast.success('Kupon durumu güncellendi');
            fetchCoupons();
        } catch { toast.error('Durum güncellenemedi'); }
    };

    if (loading) return <AdminDashboardLayout title="Kuponlar"><div>Yükleniyor...</div></AdminDashboardLayout>;

    return (
        <AdminDashboardLayout title="Kupon Yönetimi" subtitle="İndirim kuponlarını yönetin ve takip edin">
            <div className="admin-coupons-wrapper">

                {/* Header Action */}
                <div className="coupons-action-bar">
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? <><FaTimes /> İptal</> : <><FaPlus /> Yeni Kupon Ekle</>}
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="coupon-form-card">
                        <h3>Yeni Kupon Oluştur</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-row-grid">
                                <div className="input-group">
                                    <label>Kupon Kodu</label>
                                    <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="Örn: YAZ2024" />
                                </div>
                                <div className="input-group">
                                    <label>Son Kullanma Tarihi</label>
                                    <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-row-grid">
                                <div className="input-group">
                                    <label>İndirim Tipi</label>
                                    <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                        <option value="percentage">Yüzde (%)</option>
                                        <option value="fixed">Sabit Tutar (₺)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>İndirim Değeri</label>
                                    <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required min="0.01" step="0.01" />
                                </div>
                            </div>

                            <div className="form-row-grid">
                                <div className="input-group">
                                    <label>Min. Sepet Tutarı (₺)</label>
                                    <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="Opsiyonel" min="0" />
                                </div>
                                <div className="input-group">
                                    <label>Maks. İndirim Tutarı (₺)</label>
                                    <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="Opsiyonel" min="0" />
                                </div>
                                <div className="input-group">
                                    <label>Kullanım Limiti</label>
                                    <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Sınırsız için boş bırakın" min="1" />
                                </div>
                            </div>

                            <div className="form-actions-right">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : 'Kuponu Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Coupons List */}
                <div className="coupons-grid">
                    {coupons.map(c => (
                        <div key={c._id} className={`coupon-card-modern ${!c.isActive ? 'inactive' : ''}`}>
                            <div className="coupon-header">
                                <div className="coupon-code-badge">
                                    <FaTag /> {c.code}
                                </div>
                                <div className="coupon-status-toggle">
                                    <button onClick={() => handleToggle(c._id)} className="toggle-icon-btn" title={c.isActive ? 'Pasife Al' : 'Aktif Et'}>
                                        {c.isActive ? <FaToggleOn className="text-success" /> : <FaToggleOff className="text-muted" />}
                                    </button>
                                </div>
                            </div>

                            <div className="coupon-body">
                                <div className="discount-display">
                                    <span className="value">
                                        {c.discountType === 'percentage' ? `%${c.discountValue}` : `${c.discountValue}₺`}
                                    </span>
                                    <span className="label">İndirim</span>
                                </div>

                                <div className="coupon-meta">
                                    <div className="meta-row">
                                        <span>Min. Sipariş:</span>
                                        <span>{c.minOrderAmount ? `${c.minOrderAmount}₺` : 'Yok'}</span>
                                    </div>
                                    <div className="meta-row">
                                        <span>Kullanım:</span>
                                        <span>{c.usedCount} / {c.usageLimit || '∞'}</span>
                                    </div>
                                    <div className="meta-row">
                                        <span>Bitiş:</span>
                                        <span className={new Date(c.expiresAt) < new Date() ? 'text-danger' : ''}>
                                            {new Date(c.expiresAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="coupon-footer">
                                <button onClick={() => handleDelete(c._id)} className="delete-icon-btn">
                                    <FaTrash /> Sil
                                </button>
                            </div>
                        </div>
                    ))}

                    {coupons.length === 0 && !loading && (
                        <div className="no-coupons text-center text-muted">Henüz hiç kupon oluşturulmamış.</div>
                    )}
                </div>
            </div>
        </AdminDashboardLayout>
    );
};

export default AdminCouponsPage;
