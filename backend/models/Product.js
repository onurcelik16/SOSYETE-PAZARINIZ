const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: String, required: true }, // veya userId
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema); 