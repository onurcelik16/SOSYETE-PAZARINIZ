const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Product = require('../models/Product');
 
const router = express.Router();

// Kayıt
router.post('/register', async (req, res) => {
  const { email, password, name, surname, tcno, gender, birthdate } = req.body;
  try {
    // Kullanıcı var mı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email ile zaten bir hesap var.' });
    }
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, surname, tcno, gender, birthdate });
    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Giriş
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Kullanıcı bulunamadı:", email);
      return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
    }
    console.log("DB'deki hash:", user.password);
    console.log("Gönderilen şifre:", password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Karşılaştırma sonucu:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
    }
    // JWT oluştur
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'gizliAnahtar',
      { expiresIn: '2d' }
    );
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Kullanıcı bilgisi (profil)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Şifremi unuttum endpointi
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false, message: 'E-posta bulunamadı.' });

  // Token üret
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 1000 * 60 * 60; // 1 saat geçerli
  await user.save();

  // Mail gönder
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  await transporter.sendMail({
    from: 'Sosyete Pazarı <seninmail@gmail.com>',
    to: user.email,
    subject: 'Şifre Sıfırlama',
    html: `<p>Şifrenizi sıfırlamak için <a href="${resetUrl}">buraya tıklayın</a>.</p>`
  });

  res.json({ success: true, message: 'Şifre sıfırlama bağlantısı gönderildi.' });
});

// Şifre sıfırlama endpointi
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpire: { $gt: Date.now() }
  });
  if (!user) return res.json({ success: false, message: 'Token geçersiz veya süresi dolmuş.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });
});

// Favori ürün ekle
router.post('/favorites/add', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }
    
    // Güncellenmiş favorileri tam bilgilerle getir
    const updatedUser = await User.findById(userId).populate({
      path: 'favorites',
      select: 'title description price images image category stock'
    });
    
    res.json({ message: 'Favorilere eklendi', favorites: updatedUser.favorites || [] });
  } catch (err) {
    res.status(500).json({ message: 'Favori eklenemedi', error: err.message });
  }
});

// Favori ürünü çıkar
router.post('/favorites/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    await user.save();
    
    // Güncellenmiş favorileri tam bilgilerle getir
    const updatedUser = await User.findById(userId).populate({
      path: 'favorites',
      select: 'title description price images image category stock'
    });
    
    res.json({ message: 'Favoriden çıkarıldı', favorites: updatedUser.favorites || [] });
  } catch (err) {
    res.status(500).json({ message: 'Favori çıkarılamadı', error: err.message });
  }
});

// Kullanıcının favori ürünlerini getir
router.get('/favorites/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: 'favorites',
      select: 'title description price images image category stock'
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    res.status(500).json({ message: 'Favoriler alınamadı', error: err.message });
  }
});

module.exports = router; 