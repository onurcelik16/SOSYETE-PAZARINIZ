
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AddProductPage = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '',
    images: '', // virgülle ayrılmış string
    features: '' // JSON string
  });
  const [message, setMessage] = useState('');

  if (user === null) {
    return <div>Yükleniyor...</div>;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    let imagesArr = form.images
      ? form.images.split(',').map(url => url.trim()).filter(Boolean)
      : [];
    let featuresObj = {};
    try {
      featuresObj = form.features ? JSON.parse(form.features) : {};
    } catch {
      setMessage('Teknik bilgiler alanı geçerli bir JSON olmalı!');
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      price: form.price,
      stock: form.stock,
      category: form.category,
      image: form.image,
      images: imagesArr,
      features: featuresObj
    };
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setMessage('Ürün başarıyla eklendi!');
      setForm({ title: '', description: '', price: '', stock: '', category: '', image: '', images: '', features: '' });
    } else {
      setMessage('Bir hata oluştu.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#23272f', borderRadius: 16, color: '#fff' }}>
      <h2>Ürün Ekle</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input name="title" placeholder="Başlık" value={form.title} onChange={handleChange} required style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="description" placeholder="Açıklama" value={form.description} onChange={handleChange} required style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="price" type="number" placeholder="Fiyat" value={form.price} onChange={handleChange} required style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="stock" type="number" placeholder="Stok" value={form.stock} onChange={handleChange} required style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="category" placeholder="Kategori" value={form.category} onChange={handleChange} required style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="image" placeholder="Ana Resim URL" value={form.image} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <input name="images" placeholder="Diğer Resim URL'leri (virgülle ayır)" value={form.images} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: 'none' }} />
        <textarea name="features" placeholder='Teknik Bilgiler (JSON örn: {"Renk":"Beyaz","Hacim":"200ml"})' value={form.features} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: 'none', minHeight: 60 }} />
        <button type="submit" style={{ padding: 10, borderRadius: 6, background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)', color: '#fff', fontWeight: 700, border: 'none', marginTop: 8 }}>Ekle</button>
      </form>
      {message && <div style={{ marginTop: 16, fontWeight: 600 }}>{message}</div>}
    </div>
  );
};

export default AddProductPage; 