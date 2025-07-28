const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Ürünleri listele
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Tek ürün detayı
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
  res.json(product);
});

// Ürün ekle (admin)
router.post('/', async (req, res) => {
  const { title, description, price, stock, category, image, images, features } = req.body;
  const product = new Product({ title, description, price, stock, category, image, images, features });
  await product.save();
  res.status(201).json(product);
});

// Ürün güncelle (admin)
router.put('/:id', async (req, res) => {
  const { title, description, price, stock, category, image, images, features } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { title, description, price, stock, category, image, images, features },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
  res.json(product);
});

// Ürün sil (admin)
router.delete('/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
  res.json({ message: 'Ürün silindi' });
});

// Ürüne yorum ekle
router.patch('/:id/review', async (req, res) => {
  const { user, comment, rating } = req.body;
  if (!user || !comment || !rating) {
    return res.status(400).json({ message: 'Kullanıcı, yorum ve puan gereklidir.' });
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
  product.reviews.push({ user, comment, rating, date: new Date() });
  await product.save();
  res.json(product);
});

// Yorum sil
router.delete('/:id/review/:reviewIndex', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
  
  const reviewIndex = parseInt(req.params.reviewIndex);
  if (reviewIndex < 0 || reviewIndex >= product.reviews.length) {
    return res.status(400).json({ message: 'Geçersiz yorum indeksi' });
  }
  
  product.reviews.splice(reviewIndex, 1);
  await product.save();
  res.json(product);
});

module.exports = router; 