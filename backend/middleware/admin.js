const User = require('../models/User');

/**
 * Admin yetkilendirme middleware'i
 * Bu middleware auth middleware'den SONRA kullanılmalı
 * Kullanıcının role'ünün 'admin' olup olmadığını kontrol eder
 */
async function adminMiddleware(req, res, next) {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
        }
        req.userDoc = user; // Tam kullanıcı bilgisini request'e ekle
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Yetkilendirme hatası', error: err.message });
    }
}

module.exports = adminMiddleware;
