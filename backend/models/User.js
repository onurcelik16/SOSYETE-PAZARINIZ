const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },         // Ad
  surname: { type: String, required: true },      // Soyad
  tcno: { type: String, required: true },         // TC Kimlik No
  gender: { type: String },                       // Cinsiyet (opsiyonel)
  birthdate: { type: Date }, // Doğum tarihi (opsiyonel)
  role: { type: String, default: 'user' }, // 'user' veya 'admin'
  resetToken: String,
  resetTokenExpire: Date,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Favori ürünler
  createdAt: { type: Date, default: Date.now }
});

// pre('save') hook'unu kaldırıyorum

module.exports = mongoose.model('User', UserSchema); 