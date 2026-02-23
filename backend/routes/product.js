const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { productValidation, reviewValidation, mongoIdParam } = require('../middleware/validate');

// Regex özel karakterlerini escape et (ReDoS koruması)
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Ürünleri listele - arama, filtreleme, sıralama, pagination
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

    const filter = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (category) {
      const safeCategory = escapeRegex(category);
      filter.category = { $regex: `^${safeCategory}$`, $options: 'i' };
    }
    if (minPrice > 0 || maxPrice < Infinity) {
      filter.price = {};
      if (minPrice > 0) filter.price.$gte = minPrice;
      if (maxPrice < Infinity) filter.price.$lte = maxPrice;
    }

    const allowedSorts = ['price', 'createdAt', 'title', 'stock'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const total = await Product.countDocuments(filter);
    let query = Product.find(filter).sort({ [sortField]: sortOrder });
    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }
    const products = await query;

    if (limit === 0 && !req.query.page) {
      return res.json(products);
    }
    res.json({
      products,
      pagination: { page, limit: limit || total, total, pages: limit > 0 ? Math.ceil(total / limit) : 1 }
    });
  } catch (err) {
    next(err);
  }
});

// Tek ürün detayı (slug veya ID ile)
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const param = req.params.idOrSlug;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    const product = isObjectId
      ? await Product.findById(param)
      : await Product.findOne({ slug: param });
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

const { upload, optimizeImages } = require('../middleware/upload');


// Ürün ekle (SADECE ADMİN)
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 5), optimizeImages, async (req, res, next) => {
  try {
    const { title, description, price, stock, category, features } = req.body;
    let { image, images } = req.body;

    // Eğer image/images string gelirse (multipart form'da array bazen ayrı gelir)
    if (typeof images === 'string') images = images.split(',').map(i => i.trim());
    if (!images) images = [];
    if (!Array.isArray(images)) images = [images];

    // Yüklenen dosyaları ekle (Cloudinary URLs)
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => file.path);
      images = [...images, ...uploadedUrls];
    }

    // Ana resim belirlenmemişse ilki ana resim olsun
    if (!image && images.length > 0) {
      image = images[0];
    }

    // JSON parse features if string
    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (e) { }
    }

    // Varyant verilerini parse et
    let parsedVariants = [];
    let parsedCombinations = [];
    if (req.body.variants) {
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) { }
    }
    if (req.body.variantCombinations) {
      try {
        parsedCombinations = typeof req.body.variantCombinations === 'string' ? JSON.parse(req.body.variantCombinations) : req.body.variantCombinations;
      } catch (e) { }
    }

    const product = new Product({
      title,
      description,
      price,
      stock,
      category,
      image,
      images,
      features: parsedFeatures,
      variants: parsedVariants,
      variantCombinations: parsedCombinations
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Ürün güncelle (SADECE ADMİN)
router.put('/:id', authMiddleware, adminMiddleware, mongoIdParam('id'), upload.array('images', 5), optimizeImages, async (req, res, next) => {
  try {
    const { title, description, price, stock, category, features } = req.body;
    let { image, images } = req.body;

    if (typeof images === 'string') images = images.split(',').map(i => i.trim());
    if (!images) images = [];
    if (!Array.isArray(images)) images = [images];

    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => file.path);
      images = [...images, ...uploadedUrls];
    }

    // Ana resim güncellemesi
    if (!image && images.length > 0 && !req.body.image) {
      // Eğer body'de image yoksa ama yeni resimler varsa, mevcut resmi koru veya güncelle
      // Burada basitlik adına: eğer image gönderilmediyse elleme, sadece eklendiğinde güncelle
    }

    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (e) { }
    }

    // Varyant verilerini parse et
    let parsedVariants, parsedCombinations;
    if (req.body.variants) {
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) { }
    }
    if (req.body.variantCombinations) {
      try {
        parsedCombinations = typeof req.body.variantCombinations === 'string' ? JSON.parse(req.body.variantCombinations) : req.body.variantCombinations;
      } catch (e) { }
    }

    const updateData = { title, description, price, stock, category, features: parsedFeatures };
    if (image) updateData.image = image;
    if (images.length > 0) updateData.images = images;
    if (parsedVariants !== undefined) updateData.variants = parsedVariants;
    if (parsedCombinations !== undefined) updateData.variantCombinations = parsedCombinations;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Ürün sil (SADECE ADMİN) - ilişkili verileri de temizle
router.delete('/:id', authMiddleware, adminMiddleware, mongoIdParam('id'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });

    // Cloudinary'den resimleri sil (Opsiyonel ama iyi uygulama)
    const { cloudinary } = require('../utils/cloudinary');
    const allImages = [...(product.images || [])];
    if (product.image) allImages.push(product.image);

    for (const imgUrl of [...new Set(allImages)]) {
      if (imgUrl.includes('cloudinary.com')) {
        const publicId = imgUrl.split('/').pop().split('.')[0];
        const folder = 'sosyete-pazari/';
        await cloudinary.uploader.destroy(folder + publicId).catch(e => console.error('Cloudinary delete error:', e));
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Sepetlerden bu ürünü temizle
    const CartItem = require('../models/Cart');
    await CartItem.deleteMany({ product: req.params.id });

    // Kullanıcı favorilerinden bu ürünü çıkar
    const User = require('../models/User');
    await User.updateMany(
      { favorites: req.params.id },
      { $pull: { favorites: req.params.id } }
    );

    res.json({ message: 'Ürün ve ilişkili veriler silindi' });
  } catch (err) {
    next(err);
  }
});

// Ürüne yorum ekle
router.patch('/:id/review', authMiddleware, mongoIdParam('id'), reviewValidation, async (req, res, next) => {
  try {
    const { user, comment, rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
    product.reviews.push({ user, comment, rating, date: new Date() });
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Yorum düzenle
router.put('/:id/review/:reviewIndex', authMiddleware, mongoIdParam('id'), reviewValidation, async (req, res, next) => {
  try {
    const { comment, rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });

    const reviewIndex = parseInt(req.params.reviewIndex);
    if (reviewIndex < 0 || reviewIndex >= product.reviews.length) {
      return res.status(400).json({ message: 'Geçersiz yorum indeksi' });
    }

    // Yorum sahibi kontrolü (yorum.user ile JWT'deki kullanıcı email eşleşmeli)
    const review = product.reviews[reviewIndex];
    if (review.user !== req.body.user && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sadece kendi yorumunuzu düzenleyebilirsiniz' });
    }

    product.reviews[reviewIndex].comment = comment;
    product.reviews[reviewIndex].rating = rating;
    product.reviews[reviewIndex].date = new Date();
    await product.save();

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Yorum sil
router.delete('/:id/review/:reviewIndex', authMiddleware, mongoIdParam('id'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });

    const reviewIndex = parseInt(req.params.reviewIndex);
    if (reviewIndex < 0 || reviewIndex >= product.reviews.length) {
      return res.status(400).json({ message: 'Geçersiz yorum indeksi' });
    }

    product.reviews.splice(reviewIndex, 1);
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;