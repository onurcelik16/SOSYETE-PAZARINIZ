import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, createGuestOrder, validateCoupon, initPayment, getPaymentResult, getAddresses } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { FaCreditCard, FaMoneyBillWave, FaTruck, FaMapMarkerAlt, FaPhone, FaUser, FaTicketAlt, FaCheckCircle, FaTrash, FaShieldAlt, FaEnvelope, FaStar } from 'react-icons/fa';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, getCartTotal, loadCart, clearGuestCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: '',
    address: '',
    phone: '',
    paymentMethod: 'cash_on_delivery'
  });

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Kayıtlı adresleri yükle
  useEffect(() => {
    if (user) {
      const fetchAddresses = async () => {
        try {
          const res = await getAddresses();
          setSavedAddresses(res.data || []);
          // Varsayılan adresi otomatik seç
          const defaultAddr = res.data.find(a => a.isDefault);
          if (defaultAddr) {
            selectAddress(defaultAddr);
          }
        } catch {
          // silently fail
        }
      };
      fetchAddresses();
    }
  }, [user]);

  const selectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setForm(f => ({
      ...f,
      address: addr.fullAddress,
      phone: addr.phone
    }));
  };

  // Form handling
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    // Manuel değişiklik yapılırsa address seçimini kaldır
    if (e.target.name === 'address' || e.target.name === 'phone') {
      setSelectedAddressId(null);
    }
  };

  // Coupon Logic
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await validateCoupon(couponCode, getCartTotal());
      setCouponApplied(res.data);
      toast.success(`Kupon uygulandı! ${res.data.discount.toFixed(2)} ₺ indirim`);
    } catch (err) {
      setCouponApplied(null);
      toast.error(err.response?.data?.message || 'Geçersiz kupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    toast.info('Kupon kaldırıldı');
  };

  const getFinalTotal = () => {
    let total = getCartTotal();
    const shipping = total > 1000 ? 0 : 50;
    if (couponApplied) {
      return Math.max(0, couponApplied.newTotal + shipping);
    }
    return total + shipping;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const shipping = getCartTotal() > 1000 ? 0 : 50;
      const orderProducts = cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        selectedVariant: item.selectedVariant || undefined
      }));

      // iyzico ile kredi kartı ödemesi
      if (form.paymentMethod === 'credit_card') {
        const paymentData = {
          buyer: {
            name: form.name,
            surname: form.surname,
            email: user?.email || form.email,
            phone: form.phone,
            address: form.address,
            ip: '85.34.78.112'
          },
          products: cart.map(item => ({
            id: item.product._id,
            name: item.product.title,
            category: item.product.category || 'Genel',
            price: item.product.price,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant || undefined
          })),
          total: getFinalTotal(),
          userId: user?._id || null,
          guestName: !user ? `${form.name} ${form.surname}` : undefined,
          guestEmail: !user ? form.email : undefined,
          address: form.address,
          phone: form.phone,
          couponCode: couponApplied ? couponApplied.code : undefined
        };

        const res = await initPayment(paymentData);
        const { paymentPageUrl, token } = res.data;

        // iyzico ödeme sayfasını yeni pencerede aç
        const paymentWindow = window.open(paymentPageUrl, '_blank', 'width=600,height=700');

        // Ödeme sonucunu kontrol et
        const checkPayment = setInterval(async () => {
          try {
            const result = await getPaymentResult(token);
            if (result.data.status === 'success') {
              clearInterval(checkPayment);
              if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
              if (user) {
                await loadCart();
                toast.success('Ödemeniz alındı, siparişiniz oluşturuldu!');
                navigate('/orders');
              } else {
                clearGuestCart();
                toast.success('Ödemeniz alındı! Siparişiniz oluşturuldu.');
                navigate('/track-order');
              }
              setLoading(false);
            } else if (result.data.status === 'failed') {
              clearInterval(checkPayment);
              if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
              toast.error('Ödeme başarısız oldu. Lütfen tekrar deneyin.');
              setLoading(false);
            }
          } catch {
            // Henüz sonuç yok, beklemeye devam
          }
        }, 3000);

        // 5 dakika sonra kontrolü durdur
        setTimeout(() => {
          clearInterval(checkPayment);
          setLoading(false);
        }, 300000);

        return;
      }

      // Kapıda ödeme
      if (user) {
        const orderData = {
          user: user._id,
          products: orderProducts,
          total: getFinalTotal(),
          address: form.address,
          phone: form.phone,
          couponCode: couponApplied ? couponApplied.code : undefined
        };

        await createOrder(orderData);
        await loadCart();
        toast.success('Siparişiniz başarıyla oluşturuldu!');
        navigate('/orders');
      } else {
        if (!form.email) {
          toast.warning('E-posta adresinizi girmelisiniz');
          setLoading(false);
          return;
        }

        const orderData = {
          guestName: `${form.name} ${form.surname}`,
          guestEmail: form.email,
          products: orderProducts,
          total: getFinalTotal(),
          address: form.address,
          phone: form.phone,
          couponCode: couponApplied ? couponApplied.code : undefined
        };

        const res = await createGuestOrder(orderData);
        clearGuestCart();
        toast.success(`Siparişiniz oluşturuldu! Takip No: ${res.data.trackingNumber}`);
        navigate(`/track-order`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Sipariş oluşturulamadı';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) return <div className="checkout-empty">Sepetiniz boş</div>;

  const subtotal = getCartTotal();
  const shipping = subtotal > 1000 ? 0 : 50;

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Ödeme ve Teslimat</h1>
        {!user && (
          <div className="guest-checkout-notice">
            <span>🛒 Misafir olarak alışveriş yapıyorsunuz.</span>
            <a href="/login">Giriş yap</a> veya devam ederek sipariş verebilirsiniz.
          </div>
        )}
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        {/* Left Column: Forms */}
        <div className="checkout-left">
          {/* Saved Addresses */}
          {user && savedAddresses.length > 0 && (
            <section className="checkout-section">
              <h2 className="section-title"><FaMapMarkerAlt /> Kayıtlı Adreslerim</h2>
              <div className="saved-addresses-grid">
                {savedAddresses.map(addr => (
                  <div
                    key={addr._id}
                    className={`saved-address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}
                    onClick={() => selectAddress(addr)}
                  >
                    <div className="saved-addr-top">
                      <span className="saved-addr-label">
                        <FaMapMarkerAlt /> {addr.label}
                      </span>
                      {addr.isDefault && <span className="saved-addr-default"><FaStar /> Varsayılan</span>}
                    </div>
                    <p className="saved-addr-text">{addr.fullAddress}</p>
                    <p className="saved-addr-detail">
                      {addr.district ? `${addr.district}, ` : ''}{addr.city}
                    </p>
                    <p className="saved-addr-phone">📞 {addr.phone}</p>
                    {selectedAddressId === addr._id && (
                      <div className="saved-addr-check"><FaCheckCircle /></div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Address Section */}
          <section className="checkout-section">
            <h2 className="section-title">
              <FaMapMarkerAlt /> {user && savedAddresses.length > 0 ? 'Veya Manuel Girin' : 'Teslimat Bilgileri'}
            </h2>
            <div className="form-grid">
              <div className="input-group">
                <label>Ad</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Adınız" />
                </div>
              </div>
              <div className="input-group">
                <label>Soyad</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input name="surname" value={form.surname} onChange={handleChange} required placeholder="Soyadınız" />
                </div>
              </div>

              {/* Misafir kullanıcılar için E-posta alanı */}
              {!user && (
                <div className="input-group full-width">
                  <label>E-posta <span className="required-star">*</span></label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="ornek@email.com (sipariş onayı gönderilecek)"
                    />
                  </div>
                </div>
              )}

              <div className="input-group full-width">
                <label>Telefon</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input name="phone" value={form.phone} onChange={handleChange} required placeholder="0555 555 55 55" />
                </div>
              </div>
              <div className="input-group full-width">
                <label>Adres</label>
                <div className="input-wrapper">
                  <FaMapMarkerAlt className="input-icon" />
                  <textarea name="address" value={form.address} onChange={handleChange} required placeholder="Açık adresiniz..." rows="3" />
                </div>
              </div>
            </div>
          </section>

          {/* Payment Section */}
          <section className="checkout-section">
            <h2 className="section-title"><FaCreditCard /> Ödeme Yöntemi</h2>
            <div className="payment-options">
              <label className={`payment-option ${form.paymentMethod === 'credit_card' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  checked={form.paymentMethod === 'credit_card'}
                  onChange={handleChange}
                />
                <div className="payment-content">
                  <FaCreditCard className="payment-icon" />
                  <span>Kredi Kartı (iyzico)</span>
                  <span className="payment-badge active">Aktif</span>
                </div>
              </label>

              <label className={`payment-option ${form.paymentMethod === 'cash_on_delivery' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={form.paymentMethod === 'cash_on_delivery'}
                  onChange={handleChange}
                />
                <div className="payment-content">
                  <FaMoneyBillWave className="payment-icon" />
                  <span>Kapıda Ödeme</span>
                  <span className="payment-badge active">Aktif</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Summary */}
        <div className="checkout-right">
          <div className="order-summary-card">
            <h3>Sipariş Özeti</h3>

            <div className="checkout-items-list">
              {cart.map(item => (
                <div key={item._id} className="checkout-item">
                  <span className="checkout-item-qty">{item.quantity}x</span>
                  <span className="checkout-item-name">{item.product.title}</span>
                  <span className="checkout-item-price">{(item.product.price * item.quantity).toFixed(2)} ₺</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            {/* Coupon Code */}
            <div className="coupon-section">
              {!couponApplied ? (
                <div className="coupon-form">
                  <div className="input-wrapper">
                    <FaTicketAlt className="input-icon" />
                    <input
                      placeholder="Kupon Kodu"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}>
                    {couponLoading ? '...' : 'Uygula'}
                  </button>
                </div>
              ) : (
                <div className="coupon-applied-box">
                  <div className="coupon-info">
                    <FaCheckCircle className="text-success" />
                    <strong>{couponApplied.code}</strong> uygulandı
                  </div>
                  <button type="button" onClick={removeCoupon} className="remove-coupon-btn"><FaTrash /></button>
                </div>
              )}
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span>Ara Toplam</span>
                <span>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
              </div>
              <div className="summary-row">
                <span>Kargo</span>
                <span>{shipping === 0 ? <span className="text-success">Ücretsiz</span> : `${shipping.toFixed(2)} ₺`}</span>
              </div>
              {couponApplied && (
                <div className="summary-row discount">
                  <span>İndirim</span>
                  <span>-{couponApplied.discount.toFixed(2)} ₺</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Toplam</span>
                <span>{getFinalTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary place-order-btn" disabled={loading}>
              {loading ? 'İşleniyor...' : `Siparişi Tamamla (${getFinalTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`}
            </button>

            <div className="secure-checkout-notice">
              <FaShieldAlt /> %100 Güvenli Ödeme
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;