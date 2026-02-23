const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Düşük stoklu ürünleri listele (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const threshold = parseInt(req.query.threshold) || 5;

        // Varyantı olmayan düşük stoklu ürünler
        const lowStockProducts = await Product.find({
            stock: { $lte: threshold },
            $or: [
                { variants: { $exists: false } },
                { variants: { $size: 0 } }
            ]
        })
            .select('title slug stock category image price')
            .sort({ stock: 1 })
            .lean();

        // Varyantlı ürünlerde düşük stoklu kombinasyonlar
        const variantProducts = await Product.find({
            'variants.0': { $exists: true },
            'variantCombinations.stock': { $lte: threshold }
        })
            .select('title slug stock category image price variants variantCombinations')
            .lean();

        const variantAlerts = variantProducts.map(product => {
            const lowCombinations = product.variantCombinations.filter(c => c.stock <= threshold);
            return {
                _id: product._id,
                title: product.title,
                slug: product.slug,
                category: product.category,
                image: product.image,
                price: product.price,
                lowCombinations: lowCombinations.map(c => ({
                    combination: c.combination instanceof Map ? Object.fromEntries(c.combination) : c.combination,
                    stock: c.stock,
                    sku: c.sku
                }))
            };
        });

        res.json({
            threshold,
            totalAlerts: lowStockProducts.length + variantAlerts.length,
            products: lowStockProducts,
            variantAlerts
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
