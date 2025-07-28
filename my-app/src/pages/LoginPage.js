import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import './LoginRegisterPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setMessage('Giriş başarılı!');
      navigate('/products');
      window.location.reload();
    } else {
      setMessage(data.message || 'Giriş başarısız!');
    }
  };

  return (
    <div className="lrp-container">
      <div className="lrp-card">
        <div className="lrp-avatar">
          <FaUser size={54} />
        </div>
        <h2 className="lrp-title">Giriş Yap</h2>
        <form className="lrp-form" onSubmit={handleLogin}>
          <div className="lrp-field">
            <FaUser className="lrp-icon" />
            <input
              type="email"
              className="lrp-input"
              placeholder="E-posta"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="lrp-field">
            <FaLock className="lrp-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="lrp-input"
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="lrp-show" onClick={() => setShowPassword(s => !s)}>
              {showPassword ? 'GİZLE' : 'GÖSTER'}
            </span>
          </div>
          <button type="submit" className="lrp-btn-main">GİRİŞ YAP</button>
        </form>
        <div className="lrp-bottom-text">
          <Link to="/forgot-password">Şifremi Unuttum?</Link>
        </div>
        {message && <div className="lrp-message">{message}</div>}
        <div className="lrp-switch">
          Hesabın yok mu? <Link to="/register">Üye Ol</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
