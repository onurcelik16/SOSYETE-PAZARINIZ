const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Tüm kategorileri getir (Herkese açık)
router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (err) {
        next(err);
    }
});

// Tüm kategorileri getir — admin (aktif/pasif hepsi)
router.get('/all', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (err) {
        next(err);
    }
});

// Kategori ekle (SADECE ADMİN)
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { name, icon, order } = req.body;
        if (!name) return res.status(400).json({ message: 'Kategori adı zorunludur' });

        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) return res.status(400).json({ message: 'Bu kategori zaten mevcut' });

        const category = new Category({ name, icon, order: order || 0 });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        next(err);
    }
});

// Kategori güncelle (SADECE ADMİN)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { name, icon, order, isActive } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, icon, order, isActive },
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });
        res.json(category);
    } catch (err) {
        next(err);
    }
});

// Kategori sil (SADECE ADMİN)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });
        res.json({ message: 'Kategori silindi' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
