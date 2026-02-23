import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProduct, addReview, deleteReview } from '../services/api';
import { useToast } from '../components/Toast';
import { FaStar, FaShoppingCart, FaTruck, FaShieldAlt, FaUndo, FaTrash, FaChevronLeft, FaChevronRight, FaTimes, FaSearchPlus } from 'react-icons/fa';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItemToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Hover Zoom
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const imageWrapperRef = React.useRef(null);
  const ZOOM_LEVEL = 2.5;
  const LENS_SIZE = 150;

  // Review Form
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [activeTab, setActiveTab] = useState('description');

  // Varyant seçimi
  const [selectedVariant, setSelectedVariant] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(slug);
        setProduct(response.data);
        setMainImage(response.data.image || (response.data.images && response.data.images[0]) || 'https://via.placeholder.com/600');
      } catch (error) {
        toast.error('Ürün yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, toast]);

  const handleAddToCart = () => {
    // Varyant zorunluluk kontrolü
    if (product.variants?.length > 0 && Object.keys(selectedVariant).length !== product.variants.length) {
      toast.warning('Lütfen tüm varyantları seçin');
      return;
    }
    const variantToSend = Object.keys(selectedVariant).length > 0 ? selectedVariant : null;
    addItemToCart(product._id, 1, variantToSend);
    toast.success('Ürün sepete eklendi!');
  };

  // Seçili kombinasyona göre fiyat ve stok hesapla
  const getSelectedCombo = () => {
    if (!product?.variantCombinations?.length || Object.keys(selectedVariant).length === 0) return null;
    return product.variantCombinations.find(c => {
      const cObj = c.combination instanceof Map ? Object.fromEntries(c.combination) : (c.combination || {});
      return Object.keys(selectedVariant).every(k => cObj[k] === selectedVariant[k]);
    });
  };

  const selectedCombo = product ? getSelectedCombo() : null;
  const displayPrice = product ? (product.price + (selectedCombo?.priceModifier || 0)) : 0;
  const displayStock = product?.variants?.length > 0
    ? (selectedCombo ? selectedCombo.stock : (product.variantCombinations?.reduce((sum, c) => sum + (c.stock || 0), 0) ?? 0))
    : (product?.stock ?? 0);
  const allVariantsSelected = product?.variants?.length > 0 ? Object.keys(selectedVariant).length === product.variants.length : true;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment) return toast.warning('Yorum yazmalısınız');

    try {
      const userName = user ? `${user.name} ${user.surname}` : 'Misafir';
      const reviewData = { user: userName, rating: reviewForm.rating, comment: reviewForm.comment };
      const res = await addReview(product._id, reviewData);
      setProduct(res.data);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Yorumunuz eklendi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Yorum eklenemedi');
    }
  };

  const handleDeleteReview = async (index) => {
    if (!window.confirm('Bu yorumu silmek istiyor musunuz?')) return;
    try {
      const res = await deleteReview(product._id, index);
      setProduct(res.data);
      toast.success('Yorum silindi');
    } catch (err) {
      toast.error('Yorum silinemedi');
    }
  };

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % imagesRef.current.length);
    if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + imagesRef.current.length) % imagesRef.current.length);
  }, [lightboxOpen]);

  const imagesRef = React.useRef([]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lightbox açıkken scroll engelle
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!product) return <div className="error-container">Ürün bulunamadı</div>;

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const images = [...new Set(allImages)];
  imagesRef.current = images;
  const rating = product.rating || 0;

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Hover Zoom handlers
  const handleMouseMove = (e) => {
    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percX = (x / rect.width) * 100;
    const percY = (y / rect.height) * 100;
    setZoomPos({ x: percX, y: percY });
    setLensPos({
      x: Math.max(0, Math.min(x - LENS_SIZE / 2, rect.width - LENS_SIZE)),
      y: Math.max(0, Math.min(y - LENS_SIZE / 2, rect.height - LENS_SIZE))
    });
  };

  const handleMouseEnter = () => setZoomActive(true);
  const handleMouseLeave = () => setZoomActive(false);

  return (
    <div className="product-page">
      {product && (
        <Helmet>
          <title>{product.title} — {product.price.toFixed(2)} ₺ | Sosyete Pazarı</title>
          <meta name="description" content={product.description?.substring(0, 160) || `${product.title} ürününü Sosyete Pazarı'nda keşfedin.`} />
          <meta name="keywords" content={`${product.title}, ${product.category}, sosyete pazarı, online alışveriş`} />
          <meta property="og:title" content={`${product.title} — ${product.price.toFixed(2)} ₺`} />
          <meta property="og:description" content={product.description?.substring(0, 160)} />
          <meta property="og:image" content={mainImage} />
          <meta property="og:type" content="product" />
        </Helmet>
      )}
      <div className="product-page-container">
        {/* Gallery Section */}
        <div className="product-gallery">
          <div
            className="main-image-wrapper"
            ref={imageWrapperRef}
            onClick={() => openLightbox(images.indexOf(mainImage))}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={mainImage}
              alt={product.title}
              className="main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%20viewBox%3D%220%200%20600%20600%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22600%22%20height%3D%22600%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EResim%20Yok%3C%2Ftext%3E%3C%2Fsvg%3E';
              }}
            />
            {/* Zoom Lens */}
            {zoomActive && (
              <div
                className="zoom-lens"
                style={{
                  left: lensPos.x,
                  top: lensPos.y,
                  width: LENS_SIZE,
                  height: LENS_SIZE
                }}
              />
            )}
            <div className="zoom-hint"><FaSearchPlus /> Büyütmek için tıkla</div>
          </div>

          {/* Zoom Preview Panel - görselin sağında */}
          {zoomActive && (
            <div className="zoom-preview-panel">
              <div
                className="zoom-preview-image"
                style={{
                  backgroundImage: `url(${mainImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: `${ZOOM_LEVEL * 100}%`
                }}
              />
            </div>
          )}
          {images.length > 1 && (
            <div className="thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.title} - ${idx}`}
                  className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="product-info-section">
          <span className="product-category-badge">{product.category}</span>
          <h1 className="product-title-large">{product.title}</h1>

          <div className="product-meta">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < Math.round(rating) ? 'star filled' : 'star'} />
              ))}
              <span className="rating-text">({product.numReviews || 0} Değerlendirme)</span>
            </div>
            <div className="stock-status">
              {displayStock > 0 ? (
                <span className="text-success">Stokta Var ({displayStock})</span>
              ) : (
                <span className="text-danger">Tükendi</span>
              )}
            </div>
          </div>

          <div className="product-price-large">
            {displayPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            {selectedCombo && selectedCombo.priceModifier !== 0 && (
              <span style={{ fontSize: '0.6em', color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                (Ana fiyat: {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)
              </span>
            )}
          </div>

          <p className="product-short-desc">{product.description}</p>

          {/* Varyant Seçici */}
          {product.variants && product.variants.length > 0 && (
            <div className="variant-selector">
              {product.variants.map((variant) => (
                <div key={variant.name} className="variant-group">
                  <label className="variant-label">
                    {variant.name}: <strong>{selectedVariant[variant.name] || 'Seçiniz'}</strong>
                  </label>
                  <div className="variant-options-list">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`variant-option-btn ${selectedVariant[variant.name] === option ? 'selected' : ''}`}
                        onClick={() => setSelectedVariant(prev => ({ ...prev, [variant.name]: option }))}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="product-actions">
            <button
              className="btn btn-primary add-cart-large"
              onClick={handleAddToCart}
              disabled={displayStock <= 0 || !allVariantsSelected}
            >
              <FaShoppingCart /> {!allVariantsSelected ? 'Varyant Seçin' : displayStock > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
            </button>

            {user?.role === 'admin' && (
              <button className="btn btn-secondary" onClick={() => navigate(`/edit-product/${product._id}`)}>
                Düzenle
              </button>
            )}
          </div>

          <div className="product-promises">
            <div className="promise-item">
              <FaTruck /> <span>Hızlı Kargo</span>
            </div>
            <div className="promise-item">
              <FaShieldAlt /> <span>Güvenli Ödeme</span>
            </div>
            <div className="promise-item">
              <FaUndo /> <span>Kolay İade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="product-tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Ürün Açıklaması
          </button>
          <button
            className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Özellikler
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Yorumlar ({product.reviews?.length || 0})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="description-content">
              <p>{product.description}</p>
              {/* Fake rich content */}
              <p>Bu ürün en kaliteli malzemelerden üretilmiştir ve uzun ömürlü kullanım sunar. Sosyete Pazarı güvencesiyle kapınıza kadar gelir.</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="specs-content">
              {product.features && Object.keys(product.features).length > 0 ? (
                <table className="specs-table">
                  <tbody>
                    {Object.entries(product.features).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">Bu ürün için teknik özellik girilmemiş.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-content">
              <div className="reviews-list">
                {product.reviews?.length > 0 ? (
                  product.reviews.map((review, i) => (
                    <div key={i} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <div className="reviewer-avatar">{review.user.charAt(0)}</div>
                          <div>
                            <div className="reviewer-name">{review.user}</div>
                            <div className="review-date">{new Date(review.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="review-rating">
                          {[...Array(5)].map((_, idx) => (
                            <FaStar key={idx} className={idx < review.rating ? 'star filled' : 'star'} />
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{review.comment}</p>
                      {user && (user.role === 'admin' || user.name + ' ' + user.surname === review.user) && (
                        <button className="delete-review-btn" onClick={() => handleDeleteReview(i)}>
                          <FaTrash /> Sil
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-reviews">Henüz yorum yapılmamış. İlk yorumu sen yap!</div>
                )}
              </div>

              {user ? (
                <form className="add-review-form" onSubmit={handleSubmitReview}>
                  <h4>Değerlendir</h4>
                  <div className="rating-select">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar
                        key={star}
                        className={`star-select ${reviewForm.rating >= star ? 'filled' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      />
                    ))}
                  </div>
                  <textarea
                    placeholder="Deneyimini paylaş..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  ></textarea>
                  <button type="submit" className="btn btn-primary">Yorum Yap</button>
                </form>
              ) : (
                <div className="login-to-review">
                  Yorum yapmak için <a href="/login">giriş yapın</a>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="mobile-sticky-bar">
        <div className="sticky-price">
          {product.price.toLocaleString('tr-TR')} ₺
        </div>
        <button
          className="btn btn-primary sticky-btn"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          Sepete Ekle
        </button>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}><FaTimes /></button>

          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
          >
            <FaChevronLeft />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightboxIndex]} alt={`${product.title} - ${lightboxIndex + 1}`} className="lightbox-image" />
            <div className="lightbox-counter">{lightboxIndex + 1} / {images.length}</div>
          </div>

          <button
            className="lightbox-nav lightbox-next"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
          >
            <FaChevronRight />
          </button>

          {images.length > 1 && (
            <div className="lightbox-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  className={`lightbox-thumb ${idx === lightboxIndex ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;