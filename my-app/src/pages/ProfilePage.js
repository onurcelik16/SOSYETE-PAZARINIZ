import React, { useState, useEffect } from 'react';
import UserDashboardLayout from '../components/UserDashboardLayout';
import { getMe, updateProfile, changePassword, getAddresses, addAddress, updateAddress, deleteAddress } from '../services/api';
import { useToast } from '../components/Toast';
import { FaUserEdit, FaLock, FaSave, FaTimes, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', gender: '', birthdate: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '', fullAddress: '', city: '', district: '', zipCode: '', phone: '', isDefault: false
  });

  useEffect(() => {
    fetchUser();
    fetchAddresses();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
      setForm({
        name: response.data.name || '',
        surname: response.data.surname || '',
        gender: response.data.gender || '',
        birthdate: response.data.birthdate ? response.data.birthdate.slice(0, 10) : '',
        phone: response.data.phone || ''
      });
    } catch {
      toast.error('Profil bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await getAddresses();
      setAddresses(res.data);
    } catch {
      // silently fail — user might not have addresses
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await updateProfile(form);
      setUser(response.data.user);
      setIsEditing(false);
      toast.success('Profil başarıyla güncellendi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.warning('Yeni şifreler eşleşmiyor');
    }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Şifre başarıyla değiştirildi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setSaving(false);
    }
  };

  // Address handlers
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editAddressId) {
        const res = await updateAddress(editAddressId, addressForm);
        setAddresses(res.data);
        toast.success('Adres güncellendi');
      } else {
        const res = await addAddress(addressForm);
        setAddresses(res.data);
        toast.success('Adres eklendi');
      }
      resetAddressForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adres kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (addr) => {
    setEditAddressId(addr._id);
    setAddressForm({
      label: addr.label,
      fullAddress: addr.fullAddress,
      city: addr.city,
      district: addr.district || '',
      zipCode: addr.zipCode || '',
      phone: addr.phone,
      isDefault: addr.isDefault
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await deleteAddress(id);
      setAddresses(res.data);
      toast.success('Adres silindi');
    } catch {
      toast.error('Adres silinemedi');
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      const res = await updateAddress(addr._id, { isDefault: true });
      setAddresses(res.data);
      toast.success('Varsayılan adres güncellendi');
    } catch {
      toast.error('Varsayılan adres güncellenemedi');
    }
  };

  const resetAddressForm = () => {
    setShowAddressForm(false);
    setEditAddressId(null);
    setAddressForm({ label: '', fullAddress: '', city: '', district: '', zipCode: '', phone: '', isDefault: false });
  };

  if (loading) return <UserDashboardLayout title="Profilim"><div>Yükleniyor...</div></UserDashboardLayout>;
  if (!user) return <UserDashboardLayout title="Profilim"><div>Profil bilgileri yüklenemedi. Lütfen tekrar giriş yapın.</div></UserDashboardLayout>;

  return (
    <UserDashboardLayout title="Kişisel Bilgilerim" subtitle="Hesap bilgilerinizi buradan yönetebilirsiniz.">
      <div className="profile-wrapper">

        {/* View Mode */}
        {!isEditing ? (
          <div className="profile-view">
            <div className="info-grid">
              <div className="info-card">
                <label>Ad Soyad</label>
                <p>{user.name} {user.surname}</p>
              </div>
              <div className="info-card">
                <label>E-posta</label>
                <p>{user.email}</p>
              </div>
              <div className="info-card">
                <label>Telefon</label>
                <p>{user.phone || '-'}</p>
              </div>
              <div className="info-card">
                <label>Cinsiyet</label>
                <p>{user.gender || '-'}</p>
              </div>
              <div className="info-card">
                <label>Doğum Tarihi</label>
                <p>{user.birthdate ? new Date(user.birthdate).toLocaleDateString('tr-TR') : '-'}</p>
              </div>
              <div className="info-card">
                <label>Kayıt Tarihi</label>
                <p>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            <div className="profile-actions-row">
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                <FaUserEdit /> Bilgileri Düzenle
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
                <FaLock /> Şifre Değiştir
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form className="profile-edit-form" onSubmit={handleProfileUpdate}>
            <div className="form-grid-edit">
              <div className="input-group">
                <label>Ad</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Soyad</label>
                <input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Telefon</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Cinsiyet</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Seçiniz</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="input-group">
                <label>Doğum Tarihi</label>
                <input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} />
              </div>
            </div>

            <div className="edit-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FaSave /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                <FaTimes /> İptal
              </button>
            </div>
          </form>
        )}

        {/* ============ ADRES YÖNETİMİ ============ */}
        <div className="addresses-section">
          <div className="section-header">
            <h3><FaMapMarkerAlt /> Kayıtlı Adreslerim</h3>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => showAddressForm ? resetAddressForm() : setShowAddressForm(true)}
            >
              {showAddressForm ? <><FaTimes /> İptal</> : <><FaPlus /> Yeni Adres</>}
            </button>
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <div className="address-form-card">
              <h4>{editAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h4>
              <form onSubmit={handleAddressSubmit}>
                <div className="form-grid-edit">
                  <div className="input-group">
                    <label>Etiket *</label>
                    <input
                      value={addressForm.label}
                      onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                      required
                      placeholder="Örn: Ev, İş"
                    />
                  </div>
                  <div className="input-group">
                    <label>Şehir *</label>
                    <input
                      value={addressForm.city}
                      onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                      placeholder="Örn: İstanbul"
                    />
                  </div>
                  <div className="input-group">
                    <label>İlçe</label>
                    <input
                      value={addressForm.district}
                      onChange={e => setAddressForm({ ...addressForm, district: e.target.value })}
                      placeholder="Örn: Kadıköy"
                    />
                  </div>
                  <div className="input-group">
                    <label>Posta Kodu</label>
                    <input
                      value={addressForm.zipCode}
                      onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      placeholder="Örn: 34710"
                    />
                  </div>
                  <div className="input-group">
                    <label>Telefon *</label>
                    <input
                      value={addressForm.phone}
                      onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                      placeholder="Örn: 05xx xxx xx xx"
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '0.5rem' }}>
                  <label>Tam Adres *</label>
                  <textarea
                    value={addressForm.fullAddress}
                    onChange={e => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                    required
                    placeholder="Sokak, mahalle, bina no, daire no..."
                    rows={3}
                  />
                </div>
                <div className="address-form-footer">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    />
                    Varsayılan adres olarak ayarla
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Kaydediliyor...' : editAddressId ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards */}
          <div className="addresses-grid">
            {addresses.map(addr => (
              <div key={addr._id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                <div className="address-card-header">
                  <span className="address-label">
                    <FaMapMarkerAlt /> {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="default-badge"><FaStar /> Varsayılan</span>
                  )}
                </div>
                <div className="address-card-body">
                  <p className="address-text">{addr.fullAddress}</p>
                  <p className="address-detail">{addr.district ? `${addr.district}, ` : ''}{addr.city} {addr.zipCode}</p>
                  <p className="address-phone">📞 {addr.phone}</p>
                </div>
                <div className="address-card-actions">
                  {!addr.isDefault && (
                    <button className="btn-link" onClick={() => handleSetDefault(addr)}>
                      <FaStar /> Varsayılan Yap
                    </button>
                  )}
                  <button className="btn-link" onClick={() => handleEditAddress(addr)}>
                    <FaEdit /> Düzenle
                  </button>
                  <button className="btn-link danger" onClick={() => handleDeleteAddress(addr._id)}>
                    <FaTrash /> Sil
                  </button>
                </div>
              </div>
            ))}

            {addresses.length === 0 && (
              <div className="no-addresses">
                <FaMapMarkerAlt size={28} />
                <p>Henüz kayıtlı adresiniz yok.</p>
              </div>
            )}
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Şifre Değiştir</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="input-group">
                  <label>Mevcut Şifre</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Yeni Şifre</label>
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} />
                </div>
                <div className="input-group">
                  <label>Yeni Şifre (Tekrar)</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={8} />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>Şifreyi Güncelle</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>İptal</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </UserDashboardLayout>
  );
};

export default ProfilePage;