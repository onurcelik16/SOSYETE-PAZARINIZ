const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  profileUpdateValidation,
  changePasswordValidation,
  favoriteValidation,
  mongoIdParam
} = require('../middleware/validate');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Kayıt
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { email, password, name, surname, tcno, gender, birthdate } = req.body;
    // Kullanıcı var mı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email ile zaten bir hesap var.' });
    }
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    // TC Kimlik No'yu hashle (KVKK uyumu)
    const hashedTcno = crypto.createHash('sha256').update(tcno).digest('hex');
    const user = new User({ email, password: hashedPassword, name, surname, tcno: hashedTcno, gender, birthdate });
    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    next(err);
  }
});

// Giriş
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
    }
    // JWT oluştur
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );
    res.json({ token, email: user.email });
  } catch (err) {
    next(err);
  }
});

// Kullanıcı bilgisi (profil)
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    // TC Kimlik No'yu maskele
    const userObj = user.toObject();
    if (userObj.tcno) {
      userObj.tcno = '***********' + userObj.tcno.slice(-2);
    }
    res.json(userObj);
  } catch (err) {
    next(err);
  }
});

// Profil güncelle
router.put('/me', authMiddleware, profileUpdateValidation, async (req, res, next) => {
  try {
    const { name, surname, gender, birthdate } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;
    if (gender) updateData.gender = gender;
    if (birthdate) updateData.birthdate = birthdate;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ message: 'Profil güncellendi', user });
  } catch (err) {
    next(err);
  }
});

// Şifre değiştir
router.put('/change-password', authMiddleware, changePasswordValidation, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mevcut şifre yanlış' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (err) {
    next(err);
  }
});

// Admin - Tüm kullanıcıları listele
router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = search
      ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { surname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      : {};

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetToken -resetTokenExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Admin - Kullanıcı rolü değiştir
router.patch('/admin/users/:id/role', authMiddleware, adminMiddleware, mongoIdParam('id'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol. user veya admin olmalı' });
    }

    // Kendi rolünü değiştiremez
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ message: 'Kendi rolünüzü değiştiremezsiniz' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ message: `Kullanıcı rolü ${role} olarak güncellendi`, user });
  } catch (err) {
    next(err);
  }
});

// Şifremi unuttum
router.post('/forgot-password', forgotPasswordValidation, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'E-posta bulunamadı.' });

    // Token üret
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 1000 * 60 * 60; // 1 saat geçerli
    await user.save();

    // Gmail SMTP ile mail gönder
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `Sosyete Pazarı <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Şifre Sıfırlama - Sosyete Pazarı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Sosyete Pazarı</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Şifre Sıfırlama Talebi</h2>
            <p style="color: #666; line-height: 1.6;">Merhaba <strong>${user.name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Şifremi Sıfırla</a>
            </div>
            <p style="color: #999; font-size: 13px;">Bu bağlantı 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #bbb; font-size: 12px; text-align: center;">© Sosyete Pazarı</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (err) {
    next(err);
  }
});

// Şifre sıfırlama
router.post('/reset-password', resetPasswordValidation, async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// Favori ürün ekle (auth korumalı)
router.post('/favorites/add', authMiddleware, favoriteValidation, async (req, res, next) => {
  try {
    const { userId, productId } = req.body;

    // Kullanıcı sadece kendi favorilerini değiştirebilir
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Sadece kendi favorilerinizi değiştirebilirsiniz' });
    }

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
    next(err);
  }
});

// Favori ürünü çıkar (auth korumalı)
router.post('/favorites/remove', authMiddleware, favoriteValidation, async (req, res, next) => {
  try {
    const { userId, productId } = req.body;

    // Kullanıcı sadece kendi favorilerini değiştirebilir
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Sadece kendi favorilerinizi değiştirebilirsiniz' });
    }

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
    next(err);
  }
});

// Kullanıcının favori ürünlerini getir (auth korumalı)
router.get('/favorites/:userId', authMiddleware, async (req, res, next) => {
  try {
    // Kullanıcı sadece kendi favorilerini görebilir
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Sadece kendi favorilerinizi görüntüleyebilirsiniz' });
    }

    const user = await User.findById(req.params.userId).populate({
      path: 'favorites',
      select: 'title description price images image category stock'
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    next(err);
  }
});

// ============ ADRES YÖNETİMİ ============

// Adresleri listele
router.get('/addresses', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('addresses');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user.addresses || []);
  } catch (err) {
    next(err);
  }
});

// Adres ekle
router.post('/addresses', authMiddleware, async (req, res, next) => {
  try {
    const { label, fullAddress, city, district, zipCode, phone, isDefault } = req.body;
    if (!label || !fullAddress || !city || !phone) {
      return res.status(400).json({ message: 'Etiket, adres, şehir ve telefon zorunludur' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    const makeDefault = user.addresses.length === 0 ? true : !!isDefault;
    user.addresses.push({ label, fullAddress, city, district, zipCode, phone, isDefault: makeDefault });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    next(err);
  }
});

// Adres güncelle
router.put('/addresses/:addressId', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Adres bulunamadı' });

    const { label, fullAddress, city, district, zipCode, phone, isDefault } = req.body;
    if (label) address.label = label;
    if (fullAddress) address.fullAddress = fullAddress;
    if (city) address.city = city;
    if (district !== undefined) address.district = district;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (phone) address.phone = phone;

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
      address.isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    next(err);
  }
});

// Adres sil
router.delete('/addresses/:addressId', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Adres bulunamadı' });

    address.deleteOne();

    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    next(err);
  }
});

module.exports = router;