import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';
import { FaShippingFast, FaShieldAlt, FaHeadset, FaArrowRight, FaLaptop, FaTshirt, FaHome, FaRunning } from 'react-icons/fa';
import { useToast } from '../components/Toast';
import axios from 'axios';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const { success, error } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
        const products = res.data.products || res.data;
        setFeaturedProducts(products);
      } catch (err) {
        console.error('Öne çıkan ürünler yüklenemedi', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    { name: 'Elektronik', icon: <FaLaptop />, color: 'bg-blue-100', link: '/products?category=Elektronik' },
    { name: 'Moda', icon: <FaTshirt />, color: 'bg-pink-100', link: '/products?category=Moda' },
    { name: 'Ev & Yaşam', icon: <FaHome />, color: 'bg-green-100', link: '/products?category=Ev' },
    { name: 'Spor', icon: <FaRunning />, color: 'bg-orange-100', link: '/products?category=Spor' },
  ];

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setSubmitting(true);
    try {
      const response = await axios.post('/api/newsletter/subscribe', { email: newsletterEmail });
      success(response.data.message || 'Bültenimize abone oldunuz!');
      setNewsletterEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="homepage">
      <Helmet>
        <title>Sosyete Pazarı — Online Alışverişin Adresi</title>
        <meta name="description" content="Sosyete Pazarı'nda en kaliteli ürünleri uygun fiyatlarla keşfedin. Elektronik, moda, ev & yaşam ve daha fazlası." />
        <meta name="keywords" content="online alışveriş, sosyete pazarı, elektronik, moda, ev yaşam, uygun fiyat, hızlı kargo" />
        <meta property="og:title" content="Sosyete Pazarı — Online Alışverişin Adresi" />
        <meta property="og:description" content="En kaliteli ürünleri uygun fiyatlarla keşfedin." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge-container">
              <span className="hero-badge">YENİ SEZON 2024</span>
            </div>
            <h1 className="hero-title">
              Stilini <span className="text-highlight">Keşfet</span>,<br />
              Modanı <span className="text-gradient">Yarat</span>
            </h1>
            <p className="hero-desc">
              Sosyete Pazarı'nın küratörlüğünde hazırlanan en özel koleksiyonlar.
              Dilediğin ürünü saniyeler içinde bul, kapına gelsin.
              {user && <span className="welcome-back"> Tekrar hoş geldin, {user.name.split(' ')[0]}!</span>}
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn-premium btn-primary">
                Koleksiyonu İncele <FaArrowRight className="arrow-icon" />
              </Link>
              {!user && (
                <Link to="/register" className="btn-premium btn-outline">
                  Aramıza Katıl
                </Link>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">10k+</span>
                <span className="stat-label">Mutlu Müşteri</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">5k+</span>
                <span className="stat-label">Orijinal Ürün</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-background">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
            <div className="image-wrapper">
              <img
                src="/assets/hero_fashion_premium.png"
                alt="Premium Fashion"
                className="hero-main-img"
              />
              <div className="floating-card card-1">
                <div className="card-icon">✨</div>
                <div className="card-info">
                  <p>Premium Kalite</p>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🚀</div>
                <div className="card-info">
                  <p>Hızlı Teslimat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon icon-blue"><FaShippingFast /></div>
          <h3>Hızlı Kargo</h3>
          <p>Siparişlerin aynı gün kargoda, kapına gelsin.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon icon-green"><FaShieldAlt /></div>
          <h3>Güvenli Ödeme</h3>
          <p>256-bit SSL sertifikası ile %100 güvenli alışveriş.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon icon-purple"><FaHeadset /></div>
          <h3>7/24 Destek</h3>
          <p>Her türlü sorunda müşteri hizmetlerimiz yanında.</p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Kategorileri Keşfet</h2>
          <Link to="/products" className="view-all-link">Tümünü Gör</Link>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link to={cat.link} key={cat.name} className={`category-card ${cat.color}`}>
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Öne Çıkan Ürünler</h2>
          <p>Bu haftanın en çok satan ürünleri</p>
        </div>

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
          </div>
        ) : (
          <div className="products-grid-home">
            {featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter / CTA */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>İndirimleri Kaçırma!</h2>
          <p>Bültenimize abone ol, sürpriz indirimlerden ilk senin haberin olsun.</p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="E-posta adresin..."
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              disabled={submitting}
            />
            <button type="submit" className="btn-premium btn-primary" disabled={submitting}>
              {submitting ? 'Gönderiliyor...' : 'Abone Ol'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;