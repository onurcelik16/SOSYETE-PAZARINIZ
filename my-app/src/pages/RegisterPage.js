import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaTransgender, FaBirthdayCake } from 'react-icons/fa';
import './LoginRegisterPage.css';

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    tcno: '',
    gender: '',
    birthdate: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(data.message || 'Kayıt tamamlandı!');
  };

  return (
    <div className="lrp-container">
      <div className="lrp-card">
        <div className="lrp-avatar">
          <FaUser size={54} />
        </div>
        <h2 className="lrp-title">Üye Ol</h2>
        <form className="lrp-form" onSubmit={handleRegister}>
          <div className="lrp-field">
            <FaUser className="lrp-icon" />
            <input type="text" placeholder="Ad" value={form.name} onChange={handleChange} name="name" required className="lrp-input" />
          </div>
          <div className="lrp-field">
            <FaUser className="lrp-icon" />
            <input type="text" placeholder="Soyad" value={form.surname} onChange={handleChange} name="surname" required className="lrp-input" />
          </div>
          <div className="lrp-field">
            <FaIdCard className="lrp-icon" />
            <input type="text" placeholder="TC No" value={form.tcno} onChange={handleChange} name="tcno" required className="lrp-input" maxLength={11} />
          </div>
          <div className="lrp-field">
            <FaTransgender className="lrp-icon" />
            <select name="gender" value={form.gender} onChange={handleChange} required className="lrp-input lrp-select">
              <option value="" disabled>Cinsiyet Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <div className="lrp-field">
            <FaBirthdayCake className="lrp-icon" />
            <input type="date" placeholder="Doğum Tarihi" value={form.birthdate} onChange={handleChange} name="birthdate" required className="lrp-input" />
          </div>
          <div className="lrp-field">
            <FaEnvelope className="lrp-icon" />
            <input type="email" placeholder="E-posta" value={form.email} onChange={handleChange} name="email" required className="lrp-input" pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" />
          </div>
          <div className="lrp-field">
            <FaLock className="lrp-icon" />
            <input type={showPassword ? 'text' : 'password'} placeholder="Şifre" value={form.password} onChange={handleChange} name="password" required className="lrp-input" pattern="^(?=.*[A-Z]).{8,}$" title="Şifre en az 8 karakter ve en az bir büyük harf içermelidir." />
            <span className="lrp-show" onClick={() => setShowPassword(s => !s)}>{showPassword ? 'GİZLE' : 'GÖSTER'}</span>
          </div>
          <button type="submit" className="lrp-btn-main">ÜYE OL</button>
        </form>
        {message && <div className="lrp-message">{message}</div>}
        <div className="lrp-switch">
          Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 