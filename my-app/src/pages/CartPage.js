import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  MdDeleteOutline,
  MdArrowBack,
  MdRemove,
  MdAdd,
  MdLockPerson,
  MdVerifiedUser,
  MdLocalShipping,
  MdOutlineShoppingBag
} from 'react-icons/md';
import './CartPage.css';

const CartPage = () => {
  const {
    cart,
    updateItemQuantity,
    removeItemFromCart,
    getCartTotal,
    loading
  } = useCart();

  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  if (loading) return <div className="cart-loading"><div className="spinner"></div></div>;

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="empty-icon"><MdOutlineShoppingBag /></div>
        <h2>Sepetiniz Henüz Boş</h2>
        <p>Hemen alışverişe başlayın ve fırsatları kaçırmayın!</p>
        <Link to="/products" className="btn-continue-shopping">Alışverişe Başla</Link>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping logic
  const total = subtotal + shippingCost - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELC10') {
      setDiscount(250);
    } else {
      setDiscount(0);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Alışveriş <span>Sepeti</span></h1>
        <p>Seçtikleriniz sizin için burada bekliyor.</p>
      </div>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          {cart.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item._id || item.id} className="cart-item group">
                <div className="cart-item-image-wrapper">
                  <img
                    src={product.image || (product.images && product.images[0]) || 'https://via.placeholder.com/150'}
                    alt={product.title}
                    className="cart-item-image"
                  />
                  {product.tag && (
                    <div className="cart-item-tag">{product.tag}</div>
                  )}
                </div>

                <div className="cart-item-details">
                  <div className="cart-item-info-top">
                    <div className="cart-item-title-row">
                      <Link to={`/product/${product.slug || product._id}`} className="cart-item-title">
                        {product.title}
                      </Link>
                      <button
                        className="btn-remove"
                        onClick={() => removeItemFromCart(item._id || item.id)}
                        aria-label="Sil"
                      >
                        <MdDeleteOutline />
                      </button>
                    </div>
                    <p className="cart-item-variant">
                      {product.category} {product.size ? `/ ${product.size}` : ''}
                    </p>
                  </div>

                  <div className="cart-item-info-bottom">
                    <div className="quantity-controls">
                      <button
                        className="btn-qty"
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeItemFromCart(item._id || item.id);
                          } else {
                            updateItemQuantity(item._id || item.id, item.quantity - 1);
                          }
                        }}
                        aria-label="Azalt"
                      >
                        <MdRemove />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="btn-qty"
                        onClick={() => updateItemQuantity(item._id || item.id, item.quantity + 1)}
                        aria-label="Artır"
                      >
                        <MdAdd />
                      </button>
                    </div>

                    <span className="cart-item-price">
                      {(product.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="cart-footer-actions">
            <Link to="/products" className="btn-back">
              <MdArrowBack />
              Alışverişe Devam Et
            </Link>
          </div>
        </div>

        {/* Summary Sidebar */}
        <aside className="cart-summary-aside">
          <div className="summary-card">
            <h2>Sipariş Özeti</h2>

            <div className="summary-details">
              <div className="summary-row">
                <span>Ara Toplam</span>
                <span className="summary-val">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              <div className="summary-row">
                <span>Kargo</span>
                <span className="summary-val shipping-free">
                  {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`}
                </span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>İndirim ({couponCode})</span>
                  <span className="summary-val">-{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-row-total">
                <span className="total-label">Toplam</span>
                <div className="total-right">
                  <span className="total-price">{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                  <span className="tax-included">KDV DAHİLDİR</span>
                </div>
              </div>
            </div>

            <div className="checkout-action">
              <button
                onClick={() => navigate('/checkout')}
                className="btn-checkout"
              >
                Ödemeye Geç
              </button>
            </div>

            <div className="trust-badges">
              <div className="trust-badge">
                <MdLockPerson className="badge-icon" />
                <span>SSL SECURE</span>
              </div>
              <div className="trust-badge">
                <MdVerifiedUser className="badge-icon" />
                <span>GARANTİLİ</span>
              </div>
              <div className="trust-badge">
                <MdLocalShipping className="badge-icon" />
                <span>HIZLI TESLİMAT</span>
              </div>
            </div>
          </div>

          <div className="promo-code-section">
            <input
              type="text"
              placeholder="İndirim Kodu"
              className="promo-input"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button className="btn-apply-promo" onClick={handleApplyCoupon}>Uygula</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
