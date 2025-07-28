import React, { useState } from 'react';
import './LoginRegisterPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      } else {
        setMessage(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      setMessage('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lrp-container">
      <div className="lrp-card">
        <h2 className="lrp-title">Şifremi Unuttum</h2>
        <form className="lrp-form" onSubmit={handleSubmit}>
          <div className="lrp-field">
            <input
              type="email"
              className="lrp-input"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="lrp-btn-main" disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
          </button>
        </form>
        {message && <div className="lrp-message">{message}</div>}
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 