import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addProduct } from '../services/api';
import { useToast } from '../components/Toast';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import './AdminProductForm.css';

const AddProductPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    features: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [featuresList, setFeaturesList] = useState([{ key: '', value: '' }]);

  // Varyant state
  const [variants, setVariants] = useState([]); // [{ name: 'Renk', options: ['Kırmızı', 'Mavi'] }]
  const [combinations, setCombinations] = useState([]); // [{ combination: {...}, stock: 0, priceModifier: 0, sku: '' }]

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...featuresList];
    newFeatures[index][field] = value;
    setFeaturesList(newFeatures);
  };

  const addFeature = () => {
    setFeaturesList([...featuresList, { key: '', value: '' }]);
  };

  const removeFeature = (index) => {
    const newFeatures = featuresList.filter((_, i) => i !== index);
    setFeaturesList(newFeatures);
  };

  // === Varyant Yönetimi ===
  const addVariant = () => {
    setVariants([...variants, { name: '', options: [''] }]);
  };

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    regenerateCombinations(newVariants);
  };

  const updateVariantName = (index, name) => {
    const newVariants = [...variants];
    newVariants[index].name = name;
    setVariants(newVariants);
    regenerateCombinations(newVariants);
  };

  const addVariantOption = (variantIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.push('');
    setVariants(newVariants);
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options = newVariants[variantIndex].options.filter((_, i) => i !== optionIndex);
    setVariants(newVariants);
    regenerateCombinations(newVariants);
  };

  const updateVariantOption = (variantIndex, optionIndex, value) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options[optionIndex] = value;
    setVariants(newVariants);
    regenerateCombinations(newVariants);
  };

  // Tüm varyant kombinasyonlarını oluştur
  const regenerateCombinations = (variantList) => {
    const validVariants = variantList.filter(v => v.name && v.options.some(o => o));
    if (validVariants.length === 0) {
      setCombinations([]);
      return;
    }

    const validOptions = validVariants.map(v => ({
      name: v.name,
      options: v.options.filter(o => o.trim())
    }));

    // Kartezyen çarpım
    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) =>
        acc.flatMap(a => curr.options.map(o => ({ ...a, [curr.name]: o }))),
        [{}]
      );
    };

    const combos = cartesian(validOptions);
    setCombinations(combos.map(combo => ({
      combination: combo,
      stock: 0,
      priceModifier: 0,
      sku: ''
    })));
  };

  const updateCombination = (index, field, value) => {
    const newCombos = [...combinations];
    newCombos[index][field] = field === 'sku' ? value : Number(value);
    setCombinations(newCombos);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    // Convert featuresList to object
    const featuresObj = {};
    featuresList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        featuresObj[item.key.trim()] = item.value.trim();
      }
    });

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('stock', form.stock);
    formData.append('category', form.category);
    formData.append('features', JSON.stringify(featuresObj));

    // Varyant verileri
    if (variants.length > 0) {
      const validVariants = variants.filter(v => v.name && v.options.some(o => o.trim()));
      formData.append('variants', JSON.stringify(validVariants));
      formData.append('variantCombinations', JSON.stringify(combinations));
    }

    // Append files
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      await addProduct(formData);
      toast.success('Ürün başarıyla eklendi');
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ürün eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDashboardLayout title="Yeni Ürün Ekle" subtitle="Kataloğa yeni bir ürün ekleyin">
      <div className="admin-form-container">
        <button className="btn-back-link" onClick={() => navigate('/admin/products')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <FaArrowLeft /> Ürünlere Dön
        </button>

        <form onSubmit={handleSubmit} className="admin-form-card">
          <div className="form-section-title">Temel Bilgiler</div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Ürün Başlığı</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="Örn: Klasik Deri Ceket" />
            </div>
          </div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Ürün Açıklaması</label>
              <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Ürün özelliklerini detaylıca açıklayın..." />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Fiyat (₺)</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Stok Adedi {variants.length > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.8em' }}>(varyant kullanılıyorsa aşağıdan ayarlayın)</span>}</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Kategori</label>
              <input name="category" value={form.category} onChange={handleChange} required placeholder="Örn: Giyim" />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: '2rem' }}>Görseller</div>

          <div className="form-full-width">
            <div className="input-group">
              <label>Ürün Fotoğrafları (Bilgisayardan Seç)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <span className="form-hint">Birden fazla resim seçebilirsiniz. İlk seçilen ana resim olacaktır.</span>
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
                  <input
                    className="variant-name-input"
                    placeholder="Varyant Adı (Örn: Renk, Beden)"
                    value={variant.name}
                    onChange={(e) => updateVariantName(vi, e.target.value)}
                  />
                  <button type="button" className="btn-icon-danger" onClick={() => removeVariant(vi)}>
                    <FaTrash />
                  </button>
                </div>
                <div className="variant-options">
                  {variant.options.map((opt, oi) => (
                    <div key={oi} className="variant-option-row">
                      <input
                        placeholder={`Seçenek ${oi + 1}`}
                        value={opt}
                        onChange={(e) => updateVariantOption(vi, oi, e.target.value)}
                      />
                      <button type="button" className="btn-icon-sm" onClick={() => removeVariantOption(vi, oi)}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add-option" onClick={() => addVariantOption(vi)}>
                    <FaPlus /> Seçenek Ekle
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" onClick={addVariant} style={{ width: 'fit-content' }}>
              <FaPlus /> Yeni Varyant Tipi Ekle
            </button>
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
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={combo.stock}
                            onChange={(e) => updateCombination(ci, 'stock', e.target.value)}
                            className="combo-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={combo.priceModifier}
                            onChange={(e) => updateCombination(ci, 'priceModifier', e.target.value)}
                            className="combo-input"
                            placeholder="+0"
                          />
                        </td>
                        <td>
                          <input
                            value={combo.sku}
                            onChange={(e) => updateCombination(ci, 'sku', e.target.value)}
                            className="combo-input"
                            placeholder="SKU"
                          />
                        </td>
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
                  <input
                    placeholder="Özellik Adı (Örn: Renk)"
                    value={feature.key}
                    onChange={(e) => handleFeatureChange(index, 'key', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    placeholder="Değer (Örn: Kırmızı)"
                    value={feature.value}
                    onChange={(e) => handleFeatureChange(index, 'value', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', width: '30px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="btn btn-secondary"
                style={{ width: 'fit-content', marginTop: '5px' }}
              >
                + Yeni Özellik Ekle
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/products')}>İptal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FaSave /> {loading ? 'Ekleniyor...' : 'Ürünü Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

export default AddProductPage;