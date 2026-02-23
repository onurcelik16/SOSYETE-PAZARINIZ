const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { body } = require('express-validator');
const { handleValidation, mongoIdParam } = require('../middleware/validate');

// Kupon doğrula (auth korumalı)
router.post('/validate', authMiddleware, [
    body('code').trim().notEmpty().withMessage('Kupon kodu zorunludur'),
    body('orderTotal').isFloat({ min: 0 }).withMessage('Sipariş tutarı geçersiz'),
    handleValidation
], async (req, res, next) => {
    try {
        const { code, orderTotal } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Geçersiz kupon kodu' });
        }

        if (coupon.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Bu kuponun süresi dolmuş' });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Bu kupon kullanım limitine ulaşmış' });
        }

        if (orderTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                message: `Bu kupon en az ${coupon.minOrderAmount} TL siparişlerde geçerlidir`
            });
        }

        // İndirim hesapla
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        // İndirim toplam tutarı geçemez
        if (discount > orderTotal) discount = orderTotal;

        res.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discount: Math.round(discount * 100) / 100,
            newTotal: Math.round((orderTotal - discount) * 100) / 100
        });
    } catch (err) {
        next(err);
    }
});

// Kupon kullan (sipariş sonrası çağrılır)
router.post('/use', authMiddleware, [
    body('code').trim().notEmpty().withMessage('Kupon kodu zorunludur'),
    handleValidation
], async (req, res, next) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOneAndUpdate(
            { code: code.toUpperCase(), isActive: true },
            { $inc: { usedCount: 1 } },
            { new: true }
        );
        if (!coupon) return res.status(404).json({ message: 'Kupon bulunamadı' });
        res.json({ message: 'Kupon kullanıldı' });
    } catch (err) {
        next(err);
    }
});

// Admin: Kupon oluştur
router.post('/', authMiddleware, adminMiddleware, [
    body('code').trim().notEmpty().withMessage('Kupon kodu zorunludur')
        .isLength({ min: 3, max: 20 }).withMessage('Kupon kodu 3-20 karakter olmalıdır'),
    body('discountType').isIn(['percentage', 'fixed']).withMessage('İndirim tipi percentage veya fixed olmalı'),
    body('discountValue').isFloat({ min: 0.01 }).withMessage('İndirim değeri 0 dan büyük olmalı'),
    body('minOrderAmount').optional().isFloat({ min: 0 }),
    body('maxDiscount').optional().isFloat({ min: 0 }),
    body('usageLimit').optional().isInt({ min: 1 }),
    body('expiresAt').isISO8601().withMessage('Geçerli bir tarih giriniz'),
    handleValidation
], async (req, res, next) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Bu kupon kodu zaten mevcut' });

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            expiresAt
        });
        await coupon.save();
        res.status(201).json(coupon);
    } catch (err) {
        next(err);
    }
});

// Admin: Kuponları listele
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        next(err);
    }
});

// Admin: Kupon sil
router.delete('/:id', authMiddleware, adminMiddleware, mongoIdParam('id'), async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Kupon bulunamadı' });
        res.json({ message: 'Kupon silindi' });
    } catch (err) {
        next(err);
    }
});

// Admin: Kupon aktif/pasif
router.patch('/:id/toggle', authMiddleware, adminMiddleware, mongoIdParam('id'), async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Kupon bulunamadı' });
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json(coupon);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
