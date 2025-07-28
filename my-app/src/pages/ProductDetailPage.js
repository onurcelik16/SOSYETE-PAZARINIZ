import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItemToCart } = useCart();
  const [cartMessage, setCartMessage] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await response.json();
        setProduct(data);
        setMainImage(data.image || (data.images && data.images[0]) || 'https://via.placeholder.com/300');
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!product) return <div className="error">Ürün bulunamadı.</div>;

  return (
    <div className="product-detail-page" style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px #1976d233' }}>
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Fotoğraf Galerisi */}
        <div style={{ flex: 1 }}>
          <img src={mainImage} alt={product.title} style={{ width: 320, height: 320, objectFit: 'cover', borderRadius: 12, marginBottom: 18 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[product.image, ...(product.images || [])].filter(Boolean).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={product.title + '-' + i}
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: mainImage === img ? '2px solid #1976d2' : '1px solid #ccc', cursor: 'pointer' }}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>
        {/* Ürün Bilgileri */}
        <div style={{ flex: 2 }}>
          <h2>{product.title}</h2>
          <div style={{ color: '#1976d2', fontWeight: 700, fontSize: 22 }}>{product.price} ₺</div>
          <div style={{ color: '#888', fontSize: 15, margin: '8px 0' }}>Stok: {product.stock} {product.stock === 0 && <span style={{ color: '#ff4444', fontWeight: 700, marginLeft: 8 }}>(Tükendi)</span>}</div>
          <div style={{ color: '#888', fontSize: 15 }}>Kategori: {product.category}</div>
          <div style={{ margin: '12px 0', color: '#444' }}>{product.description}</div>
          {/* Admin için Düzenle Butonu */}
          {user && user.role === 'admin' && (
            <button
              onClick={() => navigate(`/edit-product/${product._id}`)}
              style={{ marginBottom: 16, padding: '8px 18px', background: '#ffd700', color: '#23272f', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Düzenle
            </button>
          )}
          {/* Sepete Ekle Butonu */}
          <button
            onClick={async () => {
              await addItemToCart(product._id, 1);
              setCartMessage('Ürün sepete eklendi!');
              setTimeout(() => setCartMessage(''), 2000);
            }}
            style={{ marginTop: 16, padding: '10px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            disabled={product.stock === 0}
          >
            Sepete Ekle
          </button>
          {cartMessage && <div style={{ color: '#1976d2', marginTop: 8, fontWeight: 600 }}>{cartMessage}</div>}
          {/* Teknik Bilgiler */}
          {product.features && Object.keys(product.features).length > 0 && (
            <div style={{ margin: '18px 0' }}>
              <h4>Teknik Bilgiler</h4>
              <table style={{ width: '100%', background: '#f7f7f7', borderRadius: 8 }}>
                <tbody>
                  {Object.entries(product.features).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, padding: 4 }}>{key}</td>
                      <td style={{ padding: 4 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Yorumlar */}
      <div style={{ marginTop: 32 }}>
        <h4>Yorumlar</h4>
        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {product.reviews.map((review, i) => {
              const currentUserName = `${user?.name || ''} ${user?.surname || ''}`.trim();
              const canDelete = user && (user.role === 'admin' || currentUserName === review.user);
              
              return (
                <div key={i} style={{ background: '#f7f7f7', borderRadius: 8, padding: 12, position: 'relative' }}>
                  <div style={{ fontWeight: 600 }}>{review.user}</div>
                  <div style={{ color: '#1976d2', fontWeight: 700 }}>Puan: {review.rating} / 5</div>
                  <div>{review.comment}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{new Date(review.date).toLocaleDateString()}</div>
                  {canDelete && (
                    <button onClick={async () => {
                      const res = await fetch(`http://localhost:5000/api/products/${product._id}/review/${i}`, {
                        method: 'DELETE'
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setProduct(updated);
                        setReviewMessage('Yorum silindi!');
                        setTimeout(() => setReviewMessage(''), 3000);
                      } else {
                        setReviewMessage('Yorum silinirken hata oluştu.');
                      }
                    }} style={{ position: 'absolute', top: 8, right: 8, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
                      Sil
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>Henüz yorum yok.</div>
        )}
        {/* Yorum Ekleme Formu */}
        {user ? (
          <div style={{ marginTop: 32, background: '#f7f7f7', borderRadius: 8, padding: 18 }}>
            <h5>Yorum Ekle</h5>
            <form onSubmit={async e => {
              e.preventDefault();
              setReviewMessage('');
              if (!reviewForm.comment) {
                setReviewMessage('Yorum zorunludur.');
                return;
              }
              
              // Kullanıcı adını farklı şekillerde deneyelim
              const userName = `${user?.name || ''} ${user?.surname || ''}`.trim();
              
              const reviewData = { user: userName, rating: reviewForm.rating, comment: reviewForm.comment };
              
              const res = await fetch(`http://localhost:5000/api/products/${product._id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
              });
              if (res.ok) {
                const updated = await res.json();
                setProduct(updated);
                setReviewForm({ rating: 5, comment: '' });
                setReviewMessage('Yorum eklendi!');
              } else {
                const errorData = await res.json();
                setReviewMessage('Bir hata oluştu: ' + (errorData.message || 'Bilinmeyen hata'));
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Puan:</span>
                {[1,2,3,4,5].map(star => (
                  <span key={star} onClick={() => setReviewForm(f => ({ ...f, rating: star }))} style={{ cursor: 'pointer', fontSize: 20, color: reviewForm.rating >= star ? '#ffd700' : '#ccc' }}>
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: 8, fontWeight: 600 }}>{reviewForm.rating}/5</span>
              </div>
              <textarea name="comment" placeholder="Yorumunuz" value={reviewForm.comment} onChange={e => {
                setReviewForm(f => ({ ...f, comment: e.target.value }));
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minHeight: 40, resize: 'none', overflow: 'hidden' }} />
              <button type="submit" style={{ padding: 8, borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 700, border: 'none', marginTop: 4 }}>Yorumu Gönder</button>
            </form>
            {reviewMessage && <div style={{ marginTop: 8, color: '#1976d2', fontWeight: 600 }}>{reviewMessage}</div>}
          </div>
        ) : (
          <div style={{ marginTop: 32, textAlign: 'center', color: '#666' }}>
            Yorum yapmak için giriş yapın.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage; 