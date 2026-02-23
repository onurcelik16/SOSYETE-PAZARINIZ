const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: String, required: true }, // veya userId
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true },      // "Renk", "Beden", "Kapasite"
  options: [{ type: String, required: true }]   // ["Kırmızı", "Mavi", "Yeşil"]
}, { _id: false });

const VariantCombinationSchema = new mongoose.Schema({
  combination: { type: Map, of: String, required: true },  // { "Renk": "Kırmızı", "Beden": "M" }
  stock: { type: Number, required: true, default: 0, min: 0 },
  priceModifier: { type: Number, default: 0 },  // +50, -10, 0 (ana fiyata eklenir)
  sku: { type: String, default: '' }
}, { _id: true });

// Türkçe karakter slug dönüştürücü
function generateSlug(text) {
  const turkishMap = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
  };
  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  category: { type: String, required: true },
  image: { type: String }, // Ana görsel (eski)
  images: [{ type: String }], // Çoklu fotoğraf
  features: { type: Object }, // Teknik bilgiler (özellikler)
  reviews: [ReviewSchema], // Yorumlar
  variants: [VariantSchema], // Dinamik varyant tipleri
  variantCombinations: [VariantCombinationSchema], // Her kombinasyonun stok/fiyatı
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Slug otomatik oluştur
ProductSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = generateSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    const Product = this.constructor;

    // Çakışma kontrolü
    while (true) {
      const existing = await Product.findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

// Varyantlı ürün mü?
ProductSchema.virtual('hasVariants').get(function () {
  return this.variants && this.variants.length > 0;
});

// Toplam varyant stoğu
ProductSchema.virtual('totalVariantStock').get(function () {
  if (!this.variantCombinations || this.variantCombinations.length === 0) return 0;
  return this.variantCombinations.reduce((sum, c) => sum + c.stock, 0);
});

// Ortalama puan (Virtual)
ProductSchema.virtual('averageRating').get(function () {
  if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

// Yorum sayısı (Virtual)
ProductSchema.virtual('numReviews').get(function () {
  return this.reviews ? this.reviews.length : 0;
});

// Text index: Hızlı arama için
ProductSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', ProductSchema);