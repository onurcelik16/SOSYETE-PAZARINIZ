const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = new mongoose.Schema({
  label: { type: String, required: true },         // "Ev", "İş" vb.
  fullAddress: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
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
  addresses: [AddressSchema], // Kayıtlı adresler
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);