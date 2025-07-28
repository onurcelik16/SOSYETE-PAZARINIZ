import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div className="sw-homepage-root banner-bg" style={{ backgroundImage: "url('/banner.png')" }}>
      <div className="sw-banner-content antrasit-bg">
        <h1 className="sw-title antrasit-text">Sosyete Pazarı</h1>
        <p className="sw-desc antrasit-text">En kaliteli ürünleri en uygun fiyatlarla bulabileceğiniz modern alışveriş platformuna hoş geldiniz.</p>
        {isAuthenticated && user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, fontWeight: 700, fontSize: 18, color: '#fff' }}>
            <span style={{ fontSize: 28, display: 'flex', alignItems: 'center' }}>👤</span>
            Hoşgeldin {user.name} {user.surname}
          </div>
        )}
      </div>
      <div className="sw-action-row sw-action-row-big">
        {!isAuthenticated && <Link to="/login" className="sw-main-btn antrasit-btn">Giriş Yap</Link>}
        {!isAuthenticated && <Link to="/register" className="sw-main-btn antrasit-btn">Üye Ol</Link>}
        <Link to="/products" className="sw-main-btn antrasit-btn">Alışveriş Yap</Link>
      </div>
    </div>
  );
};

export default HomePage; 