const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  selectedVariant: { type: Map, of: String, default: null }, // { "Renk": "Kırmızı", "Beden": "M" }
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CartItem', cartItemSchema); 