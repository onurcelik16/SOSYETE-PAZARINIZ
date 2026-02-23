require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Güvenlik: HTTP header koruması
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://*.hepsiburada.net", "https://*.technomarket.bg", "https://*.akinoncloud.com", "https://*.mncdn.com", "https://*.fenerium.com", "https://*.techno.market", "https://*.cdncloudcart.com", "https://*.benetton.com", "https://*.tmgrup.com.tr"],
      "connect-src": ["'self'"]
    },
  } : false
}));

// Gzip sıkıştırma
app.use(compression());

// CORS ayarları
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5000',
  'https://sosyete-pazariniz.vercel.app', // Örnek prod domain
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - genel (dakikada 100 istek)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Auth için özel rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Yapısal request logging
app.use(logger.requestLogger);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  family: 4 // Force IPv4 to avoid some DNS issues
})
  .then(() => logger.info('MongoDB bağlantısı başarılı'))
  .catch((err) => logger.error('MongoDB bağlantı hatası', { error: err.message }));

// Route'lar
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

const productRoutes = require('./routes/product');
app.use('/api/products', productRoutes);

const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

const orderRoutes = require('./routes/order');
app.use('/api/orders', orderRoutes);

const couponRoutes = require('./routes/coupon');
app.use('/api/coupons', couponRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

const categoryRoutes = require('./routes/category');
app.use('/api/categories', categoryRoutes);

const stockAlertRoutes = require('./routes/stockAlert');
app.use('/api/stock-alerts', stockAlertRoutes);

const newsletterRoutes = require('./routes/newsletter');
app.use('/api/newsletter', newsletterRoutes);

// Root route for API verification
app.get('/', (req, res) => {
  res.json({ message: 'Sosyete Pazarı API is running...' });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Statik dosyalar (Sadece index.html varsa servis et - Yerel geliştirme veya Strategy 2 için)
const buildPath = path.join(__dirname, '../my-app/build');
const indexHtmlPath = path.join(buildPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(buildPath));

  // Frontend client-side routing handler (API olmayan tüm istekleri index.html'e yönlendir)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(indexHtmlPath);
    }
  });
} else {
  logger.info('Statik frontend dosyaları bulunamadı, API modunda çalışıyor.');
}

// Global error handler (en sona eklenmeli)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Sunucu ${PORT} portunda çalışıyor`);
});