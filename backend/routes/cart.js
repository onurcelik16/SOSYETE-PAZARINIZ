const express = require('express');
const router = express.Router();
const CartItem = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// GET /api/cart/:userId - Kullanıcının sepetini getir
router.get('/:userId', async (req, res) => {
  try {
    const cartItems = await CartItem.find({ user: req.params.userId }).populate('product');
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: 'Sepet alınamadı', error: err.message });
  }
});

// POST /api/cart - Sepete ürün ekle
router.post('/', async (req, res) => {
  try {
    const { user, product, quantity } = req.body;
    // Aynı ürün zaten sepette varsa miktarı artır
    let cartItem = await CartItem.findOne({ user, product });
    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
      return res.json(cartItem);
    }
    // Yeni ürün ekle
    cartItem = new CartItem({ user, product, quantity });
    await cartItem.save();
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ message: 'Sepete eklenemedi', error: err.message });
  }
});

// PUT /api/cart/:cartItemId - Sepet ürün miktarını güncelle
router.put('/:cartItemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await CartItem.findByIdAndUpdate(
      req.params.cartItemId,
      { quantity },
      { new: true }
    );
    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ message: 'Sepet güncellenemedi', error: err.message });
  }
});

// DELETE /api/cart/:cartItemId - Sepetten ürün sil
router.delete('/:cartItemId', async (req, res) => {
  try {
    await CartItem.findByIdAndDelete(req.params.cartItemId);
    res.json({ message: 'Ürün sepetten silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sepetten silinemedi', error: err.message });
  }
});

module.exports = router; 