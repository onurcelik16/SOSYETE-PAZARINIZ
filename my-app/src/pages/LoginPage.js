import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import './LoginRegisterPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await loginUser({ email, password });
      const data = response.data;
      if (data.token) {
        const user = await login(data.token);
        setMessage('Giriş başarılı!');
        if (user && user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setMessage(data.message || 'Giriş başarısız!');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Giriş başarısız!');
    } finally {
      setLoading(false);
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
          <button type="submit" className="lrp-btn-main" disabled={loading}>
            {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
          </button>
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
