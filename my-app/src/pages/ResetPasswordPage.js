import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setMessage(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      setMessage('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div style={{ color: '#d32f2f', textAlign: 'center', marginTop: 60, fontWeight: 600, fontSize: 20 }}>Geçersiz bağlantı.</div>;
  }

  return (
    <div className="auth-root dark-bg-auth login-bg-img" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-content-blur" style={{ width: 370 }}>
        <h2 className="auth-title" style={{ color: '#fff', fontWeight: 800, fontSize: 28, marginBottom: 18, letterSpacing: 1 }}>Yeni Şifre Belirle</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <input
            type="password"
            placeholder="Yeni şifreniz"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ border: 'none', outline: 'none', background: '#353945', color: '#fff', borderRadius: 10, padding: '12px 14px', fontSize: 16 }}
          />
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', marginTop: 6, letterSpacing: 1 }}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
          </button>
        </form>
        {message && <div className="auth-bottom-text" style={{ color: '#fff', fontWeight: 600, marginTop: 18 }}>{message}</div>}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 