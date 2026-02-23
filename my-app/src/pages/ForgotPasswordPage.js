import React, { useState } from 'react';
import { forgotPassword } from '../services/api';
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
      const response = await forgotPassword(email);
      const data = response.data;
      if (data.success) {
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      } else {
        setMessage(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Bir hata oluştu.');
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