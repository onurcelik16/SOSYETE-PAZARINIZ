import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from 'react-icons/fa';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { addItemToCart } = useCart();
    const { user } = useAuth();
    const toast = useToast();

    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.warning('Favori eklemek için giriş yapmalısınız');
            return;
        }
        await toggleFavorite(product._id);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItemToCart(product._id, 1);
        toast.success('Ürün sepete eklendi');
    };

    // Yıldız hesaplama (backend'den gelen virtual alanları kullan)
    const rating = product.averageRating || 0;
    const reviewCount = product.numReviews || 0;

    return (
        <Link to={`/product/${product.slug || product._id}`} className="product-card">
            <div className="product-image-container" style={{ position: 'relative', width: '100%', height: '350px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                    src={product.image || (product.images?.[0]) || 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=300&q=80'}
                    alt={product.title}
                    className="product-image"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=300&q=80';
                    }}
                />
                <button
                    className={`favorite-btn ${isFavorite(product._id) ? 'active' : ''}`}
                    onClick={handleFavoriteClick}
                    aria-label="Favorilere ekle"
                >
                    {isFavorite(product._id) ? <FaHeart /> : <FaRegHeart />}
                </button>

                {product.stock <= 0 && (
                    <div className="out-of-stock-badge">Tükendi</div>
                )}
            </div>

            <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-title" title={product.title}>{product.title}</h3>

                <div className="product-rating">
                    <FaStar className="star-icon" />
                    <span>{rating}</span>
                    <span className="review-count">({reviewCount})</span>
                </div>

                <div className="product-bottom">
                    <div className="product-price">
                        {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                    <button
                        className="add-to-cart-btn"
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                    >
                        <FaShoppingCart />
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
