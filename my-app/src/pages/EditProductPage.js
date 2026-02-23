import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, updateProduct } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import './AdminProductForm.css';

const EditProductPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '', category: '', features: ''
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [deletedImageUrls, setDeletedImageUrls] = useState([]);
  const [featuresList, setFeaturesList] = useState([{ key: '', value: '' }]);

  // Varyant state
  const [variants, setVariants] = useState([]);
  const [combinations, setCombinations] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, navigate]);

  const fetchProduct = async () => {
    try {
      const res = await getProduct(id);
      const data = res.data;

      const allImgs = [data.image, ...(data.images || [])].filter(Boolean);
      setExistingImages([...new Set(allImgs)]);

      let initialFeatures = [{ key: '', value: '' }];
      if (data.features && Object.keys(data.features).length > 0) {
        initialFeatures = Object.entries(data.features).map(([key, value]) => ({ key, value }));
      }
      setFeaturesList(initialFeatures);

      // Varyantları yükle
      if (data.variants && data.variants.length > 0) {
        setVariants(data.variants);
      }
      if (data.variantCombinations && data.variantCombinations.length > 0) {
        setCombinations(data.variantCombinations.map(c => ({
          combination: c.combination instanceof Map ? Object.fromEntries(c.combination) : (c.combination || {}),
          stock: c.stock || 0,
          priceModifier: c.priceModifier || 0,
          sku: c.sku || ''
        })));
      }

      setForm({ ...data });
    } catch {
      toast.error('Ürün bilgileri alınamadı');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = e => setNewFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeExistingImage = (url) => { setExistingImages(p => p.filter(i => i !== url)); setDeletedImageUrls(p => [...p, url]); };
  const removeNewFile = (index) => setNewFiles(p => p.filter((_, i) => i !== index));
  const handleFeatureChange = (i, f, v) => { const n = [...featuresList]; n[i][f] = v; setFeaturesList(n); };
  const addFeature = () => setFeaturesList([...featuresList, { key: '', value: '' }]);
  const removeFeature = (i) => setFeaturesList(featuresList.filter((_, idx) => idx !== i));

  // === Varyant Yönetimi ===
  const addVariant = () => setVariants([...variants, { name: '', options: [''] }]);
  const removeVariant = (i) => { const nv = variants.filter((_, idx) => idx !== i); setVariants(nv); regenerateCombinations(nv); };
  const updateVariantName = (i, name) => { const nv = [...variants]; nv[i].name = name; setVariants(nv); regenerateCombinations(nv); };
  const addVariantOption = (vi) => { const nv = [...variants]; nv[vi].options.push(''); setVariants(nv); };
  const removeVariantOption = (vi, oi) => { const nv = [...variants]; nv[vi].options = nv[vi].options.filter((_, i) => i !== oi); setVariants(nv); regenerateCombinations(nv); };
  const updateVariantOption = (vi, oi, val) => { const nv = [...variants]; nv[vi].options[oi] = val; setVariants(nv); regenerateCombinations(nv); };

  const regenerateCombinations = (variantList) => {
    const valid = variantList.filter(v => v.name && v.options.some(o => o));
    if (valid.length === 0) { setCombinations([]); return; }
    const opts = valid.map(v => ({ name: v.name, options: v.options.filter(o => o.trim()) }));
    const cartesian = (arrays) => arrays.reduce((acc, curr) => acc.flatMap(a => curr.options.map(o => ({ ...a, [curr.name]: o }))), [{}]);
    const combos = cartesian(opts);
    // Mevcut kombinasyonlardan stok/fiyat bilgisini koru
    setCombinations(combos.map(combo => {
      const existing = combinations.find(c => {
        const cObj = c.combination || {};
        return Object.keys(combo).every(k => cObj[k] === combo[k]) && Object.keys(cObj).length === Object.keys(combo).length;
      });
      return existing ? { ...existing, combination: combo } : { combination: combo, stock: 0, priceModifier: 0, sku: '' };
    }));
  };

  const updateCombination = (i, field, value) => {
    const nc = [...combinations]; nc[i][field] = field === 'sku' ? value : Number(value); setCombinations(nc);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    const featuresObj = {};
    featuresList.forEach(item => {
      if (item.key.trim() && item.value.trim()) featuresObj[item.key.trim()] = item.value.trim();
    });

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('stock', form.stock);
    formData.append('category', form.category);
    formData.append('features', JSON.stringify(featuresObj));

    existingImages.forEach(url => formData.append('images', url));
    if (existingImages.length > 0) formData.append('image', existingImages[0]);
    else if (newFiles.length > 0) formData.append('image', '');

    newFiles.forEach(file => formData.append('images', file));

    // Varyant verileri
    const validVariants = variants.filter(v => v.name && v.options.some(o => o.trim()));
    formData.append('variants', JSON.stringify(validVariants));
    formData.append('variantCombinations', JSON.stringify(combinations));

    try {
      await updateProduct(id, formData);
      toast.success('Ürün başarıyla güncellendi');
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminDashboardLayout title="Düzenle"><div>Yükleniyor...</div></AdminDashboardLayout>;

  return (
    <AdminDashboardLayout title="Ürün Düzenle" subtitle={`#${id.slice(-6)} nolu ürünü düzenliyorsunuz`}>
      <div className="admin-form-container">
        <button className="btn-back-link" onClick={() => navigate('/admin/products')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <FaArrowLeft /> Ürünlere Dön
        </button>

        <form onSubmit={handleSubmit} className="admin-form-card">
          <div className="form-section-title">Temel Bilgiler</div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Ürün Başlığı</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Ürün Açıklaması</label>
              <textarea name="description" value={form.description} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Fiyat (₺)</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Stok Adedi {variants.length > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.8em' }}>(varyant kullanılıyorsa aşağıdan)</span>}</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Kategori</label>
              <input name="category" value={form.category} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: '2rem' }}>Görseller</div>

          <div className="form-full-width">
            {existingImages.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                {existingImages.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={url} alt={`Existing ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeExistingImage(url)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>X</button>
                    {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center' }}>Ana Resim</span>}
                  </div>
                ))}
              </div>
            )}

            {newFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                {newFiles.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', border: '2px dashed #4f46e5', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={URL.createObjectURL(file)} alt={`New ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeNewFile(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>X</button>
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#4f46e5', color: 'white', fontSize: '10px', textAlign: 'center' }}>Yeni</span>
                  </div>
                ))}
              </div>
            )}

            <div className="input-group">
              <label>Yeni Görsel Ekle</label>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />
              <span className="form-hint">Mevcut görsellere ek olarak yeni dosyalar seçebilirsiniz.</span>
            </div>
          </div>

          {/* === VARYANT BÖLÜMÜ === */}
          <div className="form-section-title" style={{ marginTop: '2rem' }}>
            Varyantlar
            <span style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 400, marginLeft: '0.5rem' }}>(Opsiyonel)</span>
          </div>

          <div className="form-full-width">
            {variants.map((variant, vi) => (
              <div key={vi} className="variant-block">
                <div className="variant-header">
                  <input className="variant-name-input" placeholder="Varyant Adı (Örn: Renk, Beden)" value={variant.name} onChange={(e) => updateVariantName(vi, e.target.value)} />
                  <button type="button" className="btn-icon-danger" onClick={() => removeVariant(vi)}><FaTrash /></button>
                </div>
                <div className="variant-options">
                  {variant.options.map((opt, oi) => (
                    <div key={oi} className="variant-option-row">
                      <input placeholder={`Seçenek ${oi + 1}`} value={opt} onChange={(e) => updateVariantOption(vi, oi, e.target.value)} />
                      <button type="button" className="btn-icon-sm" onClick={() => removeVariantOption(vi, oi)}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add-option" onClick={() => addVariantOption(vi)}><FaPlus /> Seçenek Ekle</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addVariant} style={{ width: 'fit-content' }}><FaPlus /> Yeni Varyant Tipi Ekle</button>
          </div>

          {/* Kombinasyon Tablosu */}
          {combinations.length > 0 && (
            <div className="form-full-width" style={{ marginTop: '1rem' }}>
              <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>Varyant Kombinasyonları ({combinations.length} adet)</label>
              <div className="combinations-table-wrapper">
                <table className="combinations-table">
                  <thead>
                    <tr>
                      {variants.filter(v => v.name).map(v => <th key={v.name}>{v.name}</th>)}
                      <th>Stok</th>
                      <th>Fiyat Farkı (₺)</th>
                      <th>SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinations.map((combo, ci) => (
                      <tr key={ci}>
                        {Object.values(combo.combination).map((val, vi) => (
                          <td key={vi}><span className="combo-value">{val}</span></td>
                        ))}
                        <td><input type="number" min="0" value={combo.stock} onChange={(e) => updateCombination(ci, 'stock', e.target.value)} className="combo-input" /></td>
                        <td><input type="number" step="0.01" value={combo.priceModifier} onChange={(e) => updateCombination(ci, 'priceModifier', e.target.value)} className="combo-input" placeholder="+0" /></td>
                        <td><input value={combo.sku} onChange={(e) => updateCombination(ci, 'sku', e.target.value)} className="combo-input" placeholder="SKU" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-section-title" style={{ marginTop: '2rem' }}>Detaylar</div>

          <div className="form-full-width">
            <label>Teknik Özellikler</label>
            <div className="features-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {featuresList.map((feature, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input placeholder="Özellik Adı" value={feature.key} onChange={(e) => handleFeatureChange(index, 'key', e.target.value)} style={{ flex: 1 }} />
                  <input placeholder="Değer" value={feature.value} onChange={(e) => handleFeatureChange(index, 'value', e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => removeFeature(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', width: '30px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
                </div>
              ))}
              <button type="button" onClick={addFeature} className="btn btn-secondary" style={{ width: 'fit-content', marginTop: '5px' }}>+ Yeni Özellik Ekle</button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/products')}>İptal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <FaSave /> {submitting ? 'Kaydediliyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

export default EditProductPage;