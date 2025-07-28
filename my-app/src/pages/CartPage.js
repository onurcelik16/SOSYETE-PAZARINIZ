import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const {
    cart,
    products,
    updateItemQuantity,
    removeItemFromCart,
    getProductById,
    getCartTotal,
    loading
  } = useCart();

  const navigate = useNavigate();

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Sepet yükleniyor...</div>;

  if (!cart || cart.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: 40, color: '#888', fontSize: 20 }}>Sepetiniz boş.</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px #1976d233' }}>
      <h2>Sepetim</h2>
      <table style={{ width: '100%', marginTop: 24, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Ürün</th>
            <th style={{ padding: 8 }}>Fiyat</th>
            <th style={{ padding: 8 }}>Adet</th>
            <th style={{ padding: 8 }}>Toplam</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => {
            const product = item.product; // getProductById yerine doğrudan item.product
            if (!product) return null;
            return (
              <tr key={item._id || item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={product.image || (product.images && product.images[0]) || 'https://via.placeholder.com/60'} alt={product.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  <span>{product.title}</span>
                </td>
                <td style={{ padding: 8, fontWeight: 600 }}>{product.price} ₺</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => updateItemQuantity(item._id || item.id, Math.max(1, item.quantity - 1))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#f7f7f7', cursor: 'pointer', marginRight: 4 }}>-</button>
                  <span style={{ minWidth: 24, display: 'inline-block', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateItemQuantity(item._id || item.id, item.quantity + 1)} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#f7f7f7', cursor: 'pointer', marginLeft: 4 }}>+</button>
                </td>
                <td style={{ padding: 8, fontWeight: 600 }}>{product.price * item.quantity} ₺</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => removeItemFromCart(item._id || item.id)} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Sil</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: 24, fontSize: 20, fontWeight: 700 }}>
        Toplam: {getCartTotal()} ₺
      </div>
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <button
          onClick={() => navigate('/checkout')}
          style={{ padding: '12px 32px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
        >
          Sipariş Ver
        </button>
      </div>
    </div>
  );
};

export default CartPage; 