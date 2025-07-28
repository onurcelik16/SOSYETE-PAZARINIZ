import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/api';

const CheckoutPage = () => {
  const { cart, getCartTotal, loadCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    address: '',
    phone: '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // Sipariş ürünlerini hazırla
      const orderProducts = cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      }));
      const orderData = {
        user: user._id,
        products: orderProducts,
        total: getCartTotal(),
        address: form.address,
        phone: form.phone,
        paymentMethod: form.paymentMethod,
        cardNumber: form.paymentMethod === 'credit_card' ? form.cardNumber : undefined,
        cardName: form.paymentMethod === 'credit_card' ? form.cardName : undefined,
        cardExpiry: form.paymentMethod === 'credit_card' ? form.cardExpiry : undefined,
        cardCvv: form.paymentMethod === 'credit_card' ? form.cardCvv : undefined
      };
      await createOrder(orderData);
      setMessage('Sipariş başarıyla oluşturuldu!');
      await loadCart(); // Sepeti temizle
    } catch (err) {
      setMessage('Sipariş oluşturulurken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px #1976d233' }}>
      <h2>Sipariş Oluştur</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Ad" required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
          <input name="surname" value={form.surname} onChange={handleChange} placeholder="Soyad" required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
        <input name="address" value={form.address} onChange={handleChange} placeholder="Adres" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefon" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <div>
          <label style={{ fontWeight: 600 }}>Ödeme Yöntemi:</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} style={{ marginLeft: 12, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
            <option value="credit_card">Kredi Kartı</option>
            <option value="cash_on_delivery">Kapıda Ödeme</option>
          </select>
        </div>
        {form.paymentMethod === 'credit_card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
            <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="Kart Numarası" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} maxLength={19} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input name="cardExpiry" value={form.cardExpiry} onChange={handleChange} placeholder="AA/YY" required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} maxLength={5} />
              <input name="cardCvv" value={form.cardCvv} onChange={handleChange} placeholder="CVV" required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} maxLength={4} />
            </div>
            <input name="cardName" value={form.cardName} onChange={handleChange} placeholder="Kart Üzerindeki İsim" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
          </div>
        )}
        <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', marginTop: 8 }}>{loading ? 'Sipariş Oluşturuluyor...' : 'Siparişi Onayla'}</button>
      </form>
      <h3>Sepet Özeti</h3>
      <table style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Ürün</th>
            <th style={{ padding: 8 }}>Adet</th>
            <th style={{ padding: 8 }}>Fiyat</th>
            <th style={{ padding: 8 }}>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => (
            <tr key={item._id}>
              <td style={{ padding: 8 }}>{item.product?.title}</td>
              <td style={{ padding: 8 }}>{item.quantity}</td>
              <td style={{ padding: 8 }}>{item.product?.price} ₺</td>
              <td style={{ padding: 8 }}>{item.product ? item.product.price * item.quantity : 0} ₺</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 20 }}>Toplam: {getCartTotal()} ₺</div>
      {message && <div style={{ marginTop: 24, color: '#1976d2', fontWeight: 600 }}>{message}</div>}
    </div>
  );
};

export default CheckoutPage; 