import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './LoginRegisterPage.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await resetPassword({ token, password });
      const data = response.data;
      if (data.success) {
        setMessage('Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setMessage(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        setMessage(errors.join(', '));
      } else {
        setMessage(err.response?.data?.message || 'Bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="lrp-container">
        <div className="lrp-card">
          <div className="lrp-message" style={{ color: '#d32f2f' }}>Geçersiz bağlantı.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lrp-container">
      <div className="lrp-card">
        <h2 className="lrp-title">Yeni Şifre Belirle</h2>
        <form className="lrp-form" onSubmit={handleSubmit}>
          <div className="lrp-field">
            <input
              type="password"
              className="lrp-input"
              placeholder="Yeni şifreniz (en az 8 karakter, 1 büyük harf)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="lrp-btn-main" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
          </button>
        </form>
        {message && <div className="lrp-message">{message}</div>}
      </div>
    </div>
  );
};

export default ResetPasswordPage;