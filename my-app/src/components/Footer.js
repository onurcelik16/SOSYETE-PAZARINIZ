import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-col brand-col">
                        <div className="footer-logo">
                            <span className="logo-icon">🛍️</span>
                            <span className="logo-text">Sosyete<span className="logo-accent">Pazarı</span></span>
                        </div>
                        <p className="footer-desc">
                            En kaliteli ürünleri en uygun fiyatlarla bulabileceğiniz modern alışveriş platformu.
                            Güvenli ödeme ve hızlı kargo garantisiyle.
                        </p>
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook /></a>
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><FaTwitter /></a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h3>Hızlı Erişim</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Ana Sayfa</Link></li>
                            <li><Link to="/products">Tüm Ürünler</Link></li>
                            <li><Link to="/cart">Sepetim</Link></li>
                            <li><Link to="/orders">Siparişlerim</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div className="footer-col">
                        <h3>Kategoriler</h3>
                        <ul className="footer-links">
                            <li><Link to="/products?category=Elektronik">Elektronik</Link></li>
                            <li><Link to="/products?category=Moda">Moda & Giyim</Link></li>
                            <li><Link to="/products?category=Ev">Ev & Yaşam</Link></li>
                            <li><Link to="/products?category=Spor">Spor & Outdoor</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-col">
                        <h3>İletişim</h3>
                        <ul className="contact-list">
                            <li>
                                <FaMapMarkerAlt />
                                <span>İstanbul, Türkiye</span>
                            </li>
                            <li>
                                <FaPhone />
                                <span>+90 (212) 123 45 67</span>
                            </li>
                            <li>
                                <FaEnvelope />
                                <span>destek@sosyetepazari.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Sosyete Pazarı. Tüm hakları saklıdır.</p>
                    <div className="footer-legal">
                        <Link to="/privacy">Gizlilik Politikası</Link>
                        <Link to="/terms">Kullanım Koşulları</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
