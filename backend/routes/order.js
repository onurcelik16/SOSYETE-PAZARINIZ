const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { sendOrderConfirmation, sendStatusUpdate } = require('../utils/email');
const { orderValidation, orderStatusValidation, mongoIdParam } = require('../middleware/validate');
const PDFDocument = require('pdfkit');

// Varyant stok kontrolü yardımcı
const checkAndDeductStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Ürün bulunamadı.`);

    if (item.selectedVariant && product.variantCombinations?.length > 0) {
      const variantObj = item.selectedVariant instanceof Map ? Object.fromEntries(item.selectedVariant) : item.selectedVariant;
      const combo = product.variantCombinations.find(c => {
        const cObj = c.combination instanceof Map ? Object.fromEntries(c.combination) : c.combination;
        return Object.keys(variantObj).every(k => cObj[k] === variantObj[k]);
      });
      if (!combo || combo.stock < item.quantity) {
        throw new Error(`${product.title} için yeterli stok yok!`);
      }
      combo.stock -= item.quantity;
      await product.save();
    } else {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!result) throw new Error(`${product.title} için yeterli stok yok!`);
    }
  }
};

// Misafir sipariş oluştur (auth GEREKMEZ)
router.post('/guest', async (req, res, next) => {
  try {
    const { guestName, guestEmail, products, total, address, phone, couponCode } = req.body;

    if (!guestName || !guestEmail || !products || !address || !phone) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur (isim, email, ürünler, adres, telefon)' });
    }

    // Stok kontrolü ve düşme (varyant destekli)
    try {
      await checkAndDeductStock(products);
    } catch (stockErr) {
      return res.status(400).json({ message: stockErr.message });
    }

    const order = new Order({ guestName, guestEmail, products, total, address, phone });
    await order.save();

    // Kupon kullanımını artır
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase(), isActive: true },
        { $inc: { usedCount: 1 } }
      );
    }

    // Sipariş onay e-postası gönder
    const productDetails = [];
    for (const item of products) {
      const prod = await Product.findById(item.product);
      productDetails.push({ title: prod?.title || 'Ürün', quantity: item.quantity, price: item.price });
    }
    await sendOrderConfirmation(guestEmail, guestName, order, productDetails);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Sipariş oluştur (auth korumalı)
router.post('/', authMiddleware, orderValidation, async (req, res, next) => {
  try {
    const { user, products, total, address, phone, couponCode } = req.body;

    if (req.user.userId !== user) {
      return res.status(403).json({ message: 'Sadece kendi adınıza sipariş verebilirsiniz' });
    }

    // Stok kontrolü ve düşme (varyant destekli)
    try {
      await checkAndDeductStock(products);
    } catch (stockErr) {
      return res.status(400).json({ message: stockErr.message });
    }

    const order = new Order({ user, products, total, address, phone, couponCode });
    await order.save();
    await CartItem.deleteMany({ user });

    // Kupon kullanımını artır
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase(), isActive: true },
        { $inc: { usedCount: 1 } }
      );
    }

    // Sipariş onay e-postası gönder
    const userDoc = await User.findById(user);
    if (userDoc?.email) {
      const productDetails = [];
      for (const item of products) {
        const prod = await Product.findById(item.product);
        productDetails.push({ title: prod?.title || 'Ürün', quantity: item.quantity, price: item.price });
      }
      await sendOrderConfirmation(userDoc.email, userDoc.name, order, productDetails);
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Admin: Tüm siparişleri getir
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('products.product')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Sipariş detayını getir
router.get('/detail/:orderId', authMiddleware, mongoIdParam('orderId'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('products.product')
      .populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });

    if (req.user.userId !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu siparişi görüntüleme yetkiniz yok' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Takip numarası ile sipariş ara
router.get('/track/:trackingNumber', authMiddleware, async (req, res, next) => {
  try {
    const order = await Order.findOne({ trackingNumber: req.params.trackingNumber })
      .populate('products.product')
      .populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });

    if (req.user.userId !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu siparişi görüntüleme yetkiniz yok' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Sipariş iptal (kullanıcı - sadece 'beklemede' durumundakiler)
router.patch('/:orderId/cancel', authMiddleware, mongoIdParam('orderId'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });

    // Sadece kendi siparişini iptal edebilir
    if (req.user.userId !== order.user.toString()) {
      return res.status(403).json({ message: 'Sadece kendi siparişinizi iptal edebilirsiniz' });
    }

    // Sadece beklemede durumundaki siparişler iptal edilebilir
    if (order.status !== 'beklemede') {
      return res.status(400).json({
        message: 'Sadece "beklemede" durumundaki siparişler iptal edilebilir'
      });
    }

    // Stok geri yükle
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.status = 'iptal edildi';
    order.statusHistory.push({
      status: 'iptal edildi',
      date: new Date(),
      note: 'Kullanıcı tarafından iptal edildi'
    });
    await order.save();

    // İptal e-postası gönder
    const cancelUser = await User.findById(order.user);
    const cancelEmail = cancelUser?.email || order.guestEmail;
    const cancelName = cancelUser?.name || order.guestName;
    if (cancelEmail) {
      await sendStatusUpdate(cancelEmail, cancelName, order, 'iptal edildi', 'Kullanıcı tarafından iptal edildi');
    }

    res.json({ message: 'Sipariş başarıyla iptal edildi', order });
  } catch (err) {
    next(err);
  }
});

// Admin: Sipariş durumunu güncelle
router.patch('/:orderId/status', authMiddleware, adminMiddleware, mongoIdParam('orderId'), orderStatusValidation, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });

    // İptal edilince stok geri yükle
    if (status === 'iptal edildi' && order.status !== 'iptal edildi') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.statusHistory.push({
      status,
      date: new Date(),
      note: note || `${status} durumuna güncellendi`
    });
    order.status = status;
    await order.save();

    // Durum değişikliği e-postası gönder
    const statusUser = await User.findById(order.user);
    const statusEmail = statusUser?.email || order.guestEmail;
    const statusName = statusUser?.name || order.guestName;
    if (statusEmail) {
      await sendStatusUpdate(statusEmail, statusName, order, status, note);
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Kullanıcının siparişlerini getir (en sona!)
router.get('/:userId', authMiddleware, mongoIdParam('userId'), async (req, res, next) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Sadece kendi siparişlerinizi görüntüleyebilirsiniz' });
    }

    const orders = await Order.find({ user: req.params.userId }).populate('products.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// PDF Fatura oluştur
router.get('/:orderId/invoice', authMiddleware, mongoIdParam('orderId'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('products.product')
      .populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı' });

    // Yetki kontrolü: sahip veya admin
    const isOwner = order.user && req.user.userId === order.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu faturayı görüntüleme yetkiniz yok' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fatura-${order.trackingNumber}.pdf`);
    doc.pipe(res);

    // Başlık
    doc.fontSize(24).text('SOSYETE PAZARI', { align: 'center' });
    doc.fontSize(10).text('E-Ticaret Platformu', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('FATURA', { align: 'center' });
    doc.moveDown();

    // Sipariş bilgileri
    doc.fontSize(10);
    doc.text(`Fatura No: ${order.trackingNumber}`);
    doc.text(`Tarih: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}`);
    doc.text(`Durum: ${order.status}`);
    if (order.user) {
      doc.text(`Müşteri: ${order.user.name}`);
      doc.text(`E-posta: ${order.user.email}`);
    } else if (order.guestName) {
      doc.text(`Müşteri: ${order.guestName}`);
      if (order.guestEmail) doc.text(`E-posta: ${order.guestEmail}`);
    }
    doc.text(`Adres: ${order.address}`);
    doc.text(`Telefon: ${order.phone}`);
    doc.moveDown();

    // Tablo başlığı
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('#', 50, tableTop, { width: 30 });
    doc.text('Urun', 80, tableTop, { width: 230 });
    doc.text('Adet', 310, tableTop, { width: 50, align: 'center' });
    doc.text('Birim Fiyat', 360, tableTop, { width: 90, align: 'right' });
    doc.text('Toplam', 450, tableTop, { width: 90, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    // Ürün satırları
    doc.font('Helvetica').fontSize(9);
    let y = tableTop + 25;

    order.products.forEach((item, index) => {
      const title = item.product?.title || 'Urun';
      const lineTotal = item.price * item.quantity;

      doc.text(`${index + 1}`, 50, y, { width: 30 });
      doc.text(title, 80, y, { width: 230 });
      doc.text(`${item.quantity}`, 310, y, { width: 50, align: 'center' });
      doc.text(`${item.price.toFixed(2)} TL`, 360, y, { width: 90, align: 'right' });
      doc.text(`${lineTotal.toFixed(2)} TL`, 450, y, { width: 90, align: 'right' });
      y += 20;
    });

    // Çizgi
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    // Toplamlar
    const subtotal = order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const kdv = subtotal * 0.20;
    const shipping = order.total - subtotal > 0 ? order.total - subtotal : 0;

    doc.font('Helvetica').fontSize(10);
    doc.text(`Ara Toplam: ${subtotal.toFixed(2)} TL`, 360, y, { width: 180, align: 'right' });
    y += 18;
    doc.text(`KDV (%20): ${kdv.toFixed(2)} TL`, 360, y, { width: 180, align: 'right' });
    y += 18;
    if (shipping > 0) {
      doc.text(`Kargo: ${shipping.toFixed(2)} TL`, 360, y, { width: 180, align: 'right' });
      y += 18;
    }
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOPLAM: ${order.total.toFixed(2)} TL`, 360, y, { width: 180, align: 'right' });

    // Alt bilgi
    doc.fontSize(8).font('Helvetica');
    doc.text('Bu belge elektronik ortamda olusturulmustur.', 50, 750, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;