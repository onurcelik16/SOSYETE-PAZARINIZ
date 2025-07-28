import React from 'react';
import { Link } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => (
  <div className="order-success-page">
    <div className="success-icon">🎉</div>
    <h1>Siparişiniz Başarıyla Alındı!</h1>
    <p>Siparişiniz alınmıştır. En kısa sürede kargoya verilecektir.</p>
    <Link to="/" className="go-home-btn">Ana Sayfaya Dön</Link>
  </div>
);

export default OrderSuccessPage; 