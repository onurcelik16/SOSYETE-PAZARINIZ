import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaArrowRight, FaMinus, FaPlus, FaShoppingBag } from 'react-icons/fa';
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

  if (loading) return <div className="cart-loading"><div className="spinner"></div></div>;

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="empty-icon"><FaShoppingBag /></div>
        <h2>Sepetiniz Henüz Boş</h2>
        <p>Hemen alışverişe başlayın ve fırsatları kaçırmayın!</p>
        <Link to="/products" className="btn btn-primary">Alışverişe Başla</Link>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shippingCost = subtotal > 1000 ? 0 : 50; // Örnek kargo kuralı
  const total = subtotal + shippingCost;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Sepetim ({cart.length} Ürün)</h1>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item._id || item.id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={product.image || (product.images && product.images[0]) || 'https://via.placeholder.com/100'}
                    alt={product.title}
                  />
                </div>

                <div className="cart-item-details">
                  <div className="cart-item-info">
                    <Link to={`/product/${product.slug || product._id}`} className="cart-item-title">{product.title}</Link>
                    <div className="cart-item-category">{product.category}</div>
                    <div className="cart-item-price-mobile">
                      {(product.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeItemFromCart(item._id || item.id);
                          } else {
                            updateItemQuantity(item._id || item.id, item.quantity - 1);
                          }
                        }}
                        aria-label="Azalt"
                      >
                        <FaMinus />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateItemQuantity(item._id || item.id, item.quantity + 1)}
                        aria-label="Artır"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <div className="cart-item-price-desktop">
                      <span className="unit-price">{product.price.toFixed(2)} ₺</span>
                      <span className="total-price">{(product.price * item.quantity).toFixed(2)} ₺</span>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeItemFromCart(item._id || item.id)}
                      aria-label="Sil"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/products" className="continue-shopping">
            <FaArrowLeft /> Alışverişe Devam Et
          </Link>
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h3>Sipariş Özeti</h3>

            <div className="summary-row">
              <span>Ara Toplam</span>
              <span>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>

            <div className="summary-row">
              <span>Kargo</span>
              <span>
                {shippingCost === 0 ? <span className="free-shipping">Ücretsiz</span> : `${shippingCost.toFixed(2)} ₺`}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Toplam</span>
              <span>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary checkout-btn-full"
            >
              Sepeti Onayla <FaArrowRight />
            </button>

            {subtotal < 1000 && (
              <div className="shipping-notice">
                {1000 - subtotal} ₺ daha harcayarak <strong>Ücretsiz Kargo</strong> fırsatını yakalayın!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;