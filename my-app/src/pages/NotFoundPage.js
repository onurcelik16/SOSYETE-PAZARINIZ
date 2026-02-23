import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <div className="notfound-code">404</div>
                <h1 className="notfound-title">Sayfa Bulunamadı</h1>
                <p className="notfound-desc">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>
                <div className="notfound-actions">
                    <Link to="/" className="notfound-btn notfound-btn-primary">Ana Sayfaya Dön</Link>
                    <Link to="/products" className="notfound-btn notfound-btn-secondary">Ürünlere Göz At</Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
