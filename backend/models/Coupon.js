const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // Yüzdelik indirim için max limit
    usageLimit: { type: Number, default: null }, // null = sınırsız
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
