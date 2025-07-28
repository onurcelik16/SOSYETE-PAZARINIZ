const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/Cart');
const Product = require('../models/Product');

// Sipariş oluştur
router.post('/', async (req, res) => {
  try {
    const { user, products, total, address, phone } = req.body;
    // Stok kontrolü ve stoktan düşme
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: 'Ürün bulunamadı.' });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `${product.title} için yeterli stok yok!` });
      }
    }
    // Stoktan düş
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }
    const order = new Order({ user, products, total, address, phone });
    await order.save();
    // Siparişten sonra kullanıcının sepetini temizle
    await CartItem.deleteMany({ user });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sipariş oluşturulamadı', error: err.message });
  }
});

// Admin: Tüm siparişleri getir
router.get('/admin/all', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('products.product')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Siparişler alınamadı', error: err.message });
  }
});

// Sipariş detayını getir
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('products.product')
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sipariş detayı alınamadı', error: err.message });
  }
});

// Takip numarası ile sipariş ara
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ trackingNumber: req.params.trackingNumber })
      .populate('products.product')
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sipariş aranamadı', error: err.message });
  }
});

// Admin: Sipariş durumunu güncelle
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }
    
    // Durum geçmişine ekle
    order.statusHistory.push({
      status: status,
      date: new Date(),
      note: note || `${status} durumuna güncellendi`
    });
    
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sipariş durumu güncellenemedi', error: err.message });
  }
});

// Kullanıcının siparişlerini getir (en sona taşındı)
router.get('/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).populate('products.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Siparişler alınamadı', error: err.message });
  }
});

module.exports = router; 