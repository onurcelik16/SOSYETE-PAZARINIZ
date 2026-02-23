const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Dashboard İstatistikleri
router.get('/stats', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

        // Toplam Gelir Hesaplama
        const orders = await Order.find();
        const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);

        // Son Siparişler
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email');

        // Aylık satış verisi (son 6 ay için örnek - geliştirilebilir)
        // Şimdilik basit istatistikler dönüyoruz

        res.json({
            totalOrders,
            totalUsers,
            totalProducts,
            lowStockProducts,
            totalRevenue,
            recentOrders
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
