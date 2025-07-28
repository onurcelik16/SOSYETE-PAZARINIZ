import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaEnvelope, FaIdCard, FaTransgender, FaBirthdayCake } from 'react-icons/fa';
import './ProfilePage.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Giriş yapmalısınız.');
      return;
    }
    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) setError(data.message);
        else setUser(data);
      });
  }, []);

  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return <div className="profile-loading">Yükleniyor...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <FaUserCircle size={96} />
        </div>
        <h2 className="profile-title">Profil Bilgilerim</h2>
        <div className="profile-info-list">
          <div className="profile-info-item">
            <FaIdCard className="profile-info-icon" /> <b>Ad Soyad:</b> <span>{user.name} {user.surname}</span>
          </div>
          <div className="profile-info-item">
            <FaIdCard className="profile-info-icon" /> <b>TC No:</b> <span>{user.tcno}</span>
          </div>
          <div className="profile-info-item">
            <FaTransgender className="profile-info-icon" /> <b>Cinsiyet:</b> <span>{user.gender}</span>
          </div>
          <div className="profile-info-item">
            <FaBirthdayCake className="profile-info-icon" /> <b>Doğum Tarihi:</b> <span>{user.birthdate ? user.birthdate.substring(0,10) : ''}</span>
          </div>
          <div className="profile-info-item">
            <FaEnvelope className="profile-info-icon" /> <b>E-posta:</b> <span>{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 