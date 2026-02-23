const express = require('express');
const router = express.Router();
const CartItem = require('../models/Cart');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const { cartValidation, cartUpdateValidation, mongoIdParam } = require('../middleware/validate');

// Varyant stok kontrolü yardımcı fonksiyonu
const getVariantStock = (product, selectedVariant) => {
  if (!selectedVariant || !product.variantCombinations || product.variantCombinations.length === 0) {
    return product.stock;
  }
  // selectedVariant Map ise Object'e çevir
  const variantObj = selectedVariant instanceof Map ? Object.fromEntries(selectedVariant) : selectedVariant;
  const combo = product.variantCombinations.find(c => {
    const comboObj = c.combination instanceof Map ? Object.fromEntries(c.combination) : c.combination;
    return Object.keys(variantObj).every(k => comboObj[k] === variantObj[k]);
  });
  return combo ? combo.stock : 0;
};

// Varyant eşleşme kontrolü
const variantsMatch = (v1, v2) => {
  if (!v1 && !v2) return true;
  if (!v1 || !v2) return false;
  const obj1 = v1 instanceof Map ? Object.fromEntries(v1) : v1;
  const obj2 = v2 instanceof Map ? Object.fromEntries(v2) : v2;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(k => obj1[k] === obj2[k]);
};

// GET /api/cart/:userId
router.get('/:userId', authMiddleware, mongoIdParam('userId'), async (req, res, next) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Sadece kendi sepetinizi görüntüleyebilirsiniz' });
    }
    const cartItems = await CartItem.find({ user: req.params.userId }).populate('product');
    res.json(cartItems);
  } catch (err) {
    next(err);
  }
});

// POST /api/cart
router.post('/', authMiddleware, cartValidation, async (req, res, next) => {
  try {
    const { user, product, quantity, selectedVariant } = req.body;

    if (req.user.userId !== user) {
      return res.status(403).json({ message: 'Sadece kendi sepetinize ürün ekleyebilirsiniz' });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Varyant varsa varyant stoğunu kontrol et
    const availableStock = getVariantStock(productDoc, selectedVariant);
    if (availableStock < quantity) {
      return res.status(400).json({ message: 'Yeterli stok yok' });
    }

    // Aynı ürün + aynı varyant sepette varsa miktarı artır
    const existingItems = await CartItem.find({ user, product });
    const cartItem = existingItems.find(item => variantsMatch(item.selectedVariant, selectedVariant));

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      if (availableStock < newQuantity) {
        return res.status(400).json({ message: 'Yeterli stok yok' });
      }
      cartItem.quantity = newQuantity;
      await cartItem.save();
      return res.json(cartItem);
    }

    // Yeni ürün ekle
    const newItem = new CartItem({ user, product, quantity, selectedVariant: selectedVariant || undefined });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/:cartItemId
router.put('/:cartItemId', authMiddleware, mongoIdParam('cartItemId'), cartUpdateValidation, async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const existingItem = await CartItem.findById(req.params.cartItemId);
    if (!existingItem) {
      return res.status(404).json({ message: 'Sepet öğesi bulunamadı' });
    }

    if (req.user.userId !== existingItem.user.toString()) {
      return res.status(403).json({ message: 'Sadece kendi sepetinizi güncelleyebilirsiniz' });
    }

    // Varyant stoğu kontrolü
    const product = await Product.findById(existingItem.product);
    const availableStock = getVariantStock(product, existingItem.selectedVariant);
    if (availableStock < quantity) {
      return res.status(400).json({ message: 'Yeterli stok yok' });
    }

    const cartItem = await CartItem.findByIdAndUpdate(
      req.params.cartItemId,
      { quantity },
      { new: true }
    );
    res.json(cartItem);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/:cartItemId
router.delete('/:cartItemId', authMiddleware, mongoIdParam('cartItemId'), async (req, res, next) => {
  try {
    const existingItem = await CartItem.findById(req.params.cartItemId);
    if (!existingItem) {
      return res.status(404).json({ message: 'Sepet öğesi bulunamadı' });
    }

    if (req.user.userId !== existingItem.user.toString()) {
      return res.status(403).json({ message: 'Sadece kendi sepetinizden ürün silebilirsiniz' });
    }

    await CartItem.findByIdAndDelete(req.params.cartItemId);
    res.json({ message: 'Ürün sepetten silindi' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;