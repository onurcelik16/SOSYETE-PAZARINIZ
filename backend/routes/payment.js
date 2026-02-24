const express = require('express');
const router = express.Router();
const Iyzipay = require('iyzipay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CartItem = require('../models/Cart');
const PendingPayment = require('../models/PendingPayment');
const { sendOrderConfirmation } = require('../utils/email');
const logger = require('../utils/logger');

// iyzico konfigürasyon
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL
});

// iyzico Tanımlama Logu (Debug için)
const maskedIyziKey = process.env.IYZICO_API_KEY ? (process.env.IYZICO_API_KEY.substring(0, 8) + '...') : 'Eksik';
console.log(`Sunucu: iyzico başlatıldı. URL: ${process.env.IYZICO_BASE_URL}, Key: ${maskedIyziKey}`);

// Opsiyonel auth middleware — token varsa kullanıcıyı ata, yoksa misafir
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch { }
    }
    next();
};

// POST /api/payment/init — Checkout Form başlat
router.post('/init', optionalAuth, async (req, res) => {
    try {
        const { buyer, products, address, phone, couponCode, total, userId, guestName, guestEmail } = req.body;

        if (!buyer || !products || !address || !total) {
            return res.status(400).json({ message: 'Eksik bilgi: buyer, products, address, total zorunlu' });
        }

        // Kullanıcı bilgisi
        const isAuth = !!(req.user?.userId || userId);
        const actualUserId = req.user?.userId || userId;
        let userDoc = null;
        if (isAuth && actualUserId) {
            userDoc = await User.findById(actualUserId);
        }

        const buyerName = buyer.name || userDoc?.name || guestName?.split(' ')[0] || 'Müşteri';
        const buyerSurname = buyer.surname || userDoc?.surname || guestName?.split(' ').slice(1).join(' ') || 'Müşteri';
        const buyerEmail = buyer.email || userDoc?.email || guestEmail || 'guest@example.com';
        const buyerPhone = buyer.phone || phone || '+905555555555';

        // Ürün detayları — basketItems
        const basketItems = [];
        const orderProducts = [];
        let subtotal = 0;

        for (const item of products) {
            const productId = item.id || item.product;
            const prod = await Product.findById(productId);
            if (!prod) return res.status(400).json({ message: `Ürün bulunamadı: ${productId}` });

            const itemPriceTotal = (item.price || prod.price) * (item.quantity || 1);
            subtotal += itemPriceTotal;

            orderProducts.push({
                product: prod._id,
                quantity: item.quantity || 1,
                price: item.price || prod.price,
                selectedVariant: item.selectedVariant || undefined
            });

            basketItems.push({
                id: prod._id.toString(),
                name: prod.title.substring(0, 50),
                category1: prod.category || 'Genel',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: itemPriceTotal.toFixed(2) // Geçici fiyat, sonra normalize edeceğiz
            });
        }

        // Kargo ücretini hesapla ve ekle
        const shippingPrice = subtotal > 1000 ? 0 : 50;
        if (shippingPrice > 0) {
            basketItems.push({
                id: 'shipping',
                name: 'Kargo Ücreti',
                category1: 'Lojistik',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: shippingPrice.toFixed(2)
            });
        }

        // İndirim Oranı Hesaplama (Eğer kupon varsa veya total farklıysa)
        // Iyzico kuralı: sum(basketItems.price) == paidPrice
        const expectedTotal = subtotal + shippingPrice;
        const discountRatio = total / expectedTotal;

        // Fiyatları normalize et (indirimli fiyatlar Iyzico'ya 'price' olarak gitmeli ki sum tutsun)
        let basketSum = 0;
        basketItems.forEach((item, index) => {
            const originalPrice = parseFloat(item.price);
            let finalPrice = originalPrice * discountRatio;

            // Son item'da yuvarlama farkını kapat
            if (index === basketItems.length - 1) {
                finalPrice = total - basketSum;
            }

            const formattedPrice = finalPrice.toFixed(2);
            item.price = formattedPrice;
            basketSum += parseFloat(formattedPrice);
        });

        const conversationId = `conv_${Date.now()}`;

        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId,
            price: total.toFixed(2),
            paidPrice: total.toFixed(2),
            currency: Iyzipay.CURRENCY.TRY,
            basketId: `basket_${Date.now()}`,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: `${req.protocol}://${req.get('host')}/api/payment/callback`,
            enabledInstallments: [1, 2, 3, 6],
            buyer: {
                id: actualUserId || `guest_${Date.now()}`,
                name: buyerName,
                surname: buyerSurname,
                gsmNumber: buyerPhone.startsWith('+') ? buyerPhone : `+90${buyerPhone.replace(/\D/g, '')}`,
                email: buyerEmail,
                identityNumber: '11111111111',
                registrationAddress: address,
                city: 'Istanbul',
                country: 'Turkey',
                ip: req.ip || buyer.ip || '127.0.0.1'
            },
            shippingAddress: {
                contactName: `${buyerName} ${buyerSurname}`,
                city: 'Istanbul',
                country: 'Turkey',
                address: address
            },
            billingAddress: {
                contactName: `${buyerName} ${buyerSurname}`,
                city: 'Istanbul',
                country: 'Turkey',
                address: address
            },
            basketItems
        };

        iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
            if (err) {
                logger.error('iyzico init hatası', { error: err.message });
                return res.status(500).json({ message: 'Ödeme başlatılamadı', error: err.message });
            }

            if (result.status !== 'success') {
                logger.error('iyzico result hatası', { result });
                return res.status(400).json({ message: result.errorMessage || 'Ödeme başlatılamadı', detail: result });
            }

            // Token'ı ve sipariş bilgilerini DB'ye kaydet
            await PendingPayment.create({
                token: result.token,
                type: 'payment',
                userId: actualUserId,
                guestName,
                guestEmail,
                products: orderProducts,
                total,
                address,
                phone,
                couponCode
            });

            res.json({
                status: 'success',
                token: result.token,
                checkoutFormContent: result.checkoutFormContent,
                paymentPageUrl: result.paymentPageUrl
            });
        });
    } catch (err) {
        logger.error('Payment init error', { error: err.message });
        res.status(500).json({ message: 'Sunucu hatası', error: err.message });
    }
});

// POST /api/payment/callback — iyzico callback
router.post('/callback', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail`);

        // Ödeme sonucunu sorgula
        iyzipay.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            token
        }, async (err, result) => {
            if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                await PendingPayment.deleteOne({ token });
                return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail`);
            }

            const paymentData = await PendingPayment.findOne({ token, type: 'payment' });
            if (!paymentData) {
                return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail&reason=expired`);
            }

            try {
                // Stok kontrolü ve düşme
                for (const item of paymentData.products) {
                    const product = await Product.findById(item.product);
                    if (!product) {
                        return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail&reason=stock`);
                    }

                    if (item.selectedVariant && product.variantCombinations?.length > 0) {
                        const combo = product.variantCombinations.find(c => {
                            const comboObj = c.combination instanceof Map ? Object.fromEntries(c.combination) : c.combination;
                            return Object.keys(item.selectedVariant).every(k => comboObj[k] === item.selectedVariant[k]);
                        });
                        if (!combo || combo.stock < item.quantity) {
                            return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail&reason=stock`);
                        }
                        combo.stock -= item.quantity;
                        await product.save();
                    } else {
                        const updated = await Product.findOneAndUpdate(
                            { _id: item.product, stock: { $gte: item.quantity } },
                            { $inc: { stock: -item.quantity } },
                            { new: true }
                        );
                        if (!updated) {
                            return res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail&reason=stock`);
                        }
                    }
                }

                // Sipariş oluştur
                const orderData = {
                    products: paymentData.products,
                    total: paymentData.total,
                    address: paymentData.address,
                    phone: paymentData.phone,
                    status: 'hazırlanıyor'
                };

                if (paymentData.isGuest) {
                    orderData.guestName = paymentData.guestName;
                    orderData.guestEmail = paymentData.guestEmail;
                } else {
                    orderData.user = paymentData.userId;
                }

                const order = new Order(orderData);
                await order.save();

                // Sepeti temizle (sadece giriş yapmış kullanıcı)
                if (!paymentData.isGuest && paymentData.userId) {
                    await CartItem.deleteMany({ user: paymentData.userId });
                }

                // Kupon
                if (paymentData.couponCode) {
                    const Coupon = require('../models/Coupon');
                    await Coupon.findOneAndUpdate(
                        { code: paymentData.couponCode.toUpperCase(), isActive: true },
                        { $inc: { usedCount: 1 } }
                    );
                }

                // E-posta
                let emailTo = paymentData.guestEmail;
                let emailName = paymentData.guestName;
                if (!paymentData.isGuest && paymentData.userId) {
                    const userDoc = await User.findById(paymentData.userId);
                    emailTo = userDoc?.email;
                    emailName = userDoc?.name;
                }

                if (emailTo) {
                    const productDetails = [];
                    for (const item of paymentData.products) {
                        const prod = await Product.findById(item.product);
                        productDetails.push({ title: prod?.title || 'Ürün', quantity: item.quantity, price: item.price });
                    }
                    try {
                        await sendOrderConfirmation(emailTo, emailName || 'Müşteri', order, productDetails);
                    } catch (emailErr) {
                        console.error('E-posta gönderilemedi:', emailErr);
                    }
                }

                await PendingPayment.deleteOne({ token, type: 'payment' });

                // Ödeme sonucu kaydını DB'ye yaz
                await PendingPayment.create({
                    token: `result_${token}`,
                    type: 'result',
                    status: 'success',
                    orderId: order._id,
                    trackingNumber: order.trackingNumber
                });

                res.redirect(`${process.env.CORS_ORIGIN}/order-success?orderId=${order._id}&tracking=${order.trackingNumber}`);
            } catch (orderErr) {
                logger.error('Sipariş oluşturma hatası', { error: orderErr.message });
                res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail&reason=order`);
            }
        });
    } catch (err) {
        logger.error('Callback hatası', { error: err.message });
        res.redirect(`${process.env.CORS_ORIGIN}/checkout?payment=fail`);
    }
});

// İşlenmekte olan tokenları takip et (race condition önlemi)
const processingTokens = new Set();

// GET /api/payment/result/:token — Ödeme sonucunu sorgula + sipariş oluştur
router.get('/result/:token', optionalAuth, async (req, res) => {
    try {
        const token = req.params.token;

        // Zaten işlenmiş mi kontrol et
        const cached = await PendingPayment.findOne({ token: `result_${token}`, type: 'result' });
        if (cached) {
            return res.json({ status: cached.status, orderId: cached.orderId, trackingNumber: cached.trackingNumber });
        }

        // Şu anda işleniyor mu? (race condition önlemi)
        if (processingTokens.has(token)) {
            return res.json({ status: 'pending' });
        }

        // Bekleyen ödeme verisi var mı?
        const paymentData = await PendingPayment.findOne({ token, type: 'payment' });

        // İyzico'dan sorgula
        iyzipay.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            token
        }, async (err, result) => {
            if (err) return res.status(500).json({ message: 'Sorgulama hatası' });

            if (result.paymentStatus === 'SUCCESS') {
                // Eğer sipariş henüz oluşturulmadıysa oluştur
                if (paymentData) {
                    // Lock ekle — aynı token için tekrar işleme girmesin
                    processingTokens.add(token);
                    await PendingPayment.deleteOne({ token, type: 'payment' });
                    try {
                        // Stok kontrolü ve düşme
                        for (const item of paymentData.products) {
                            const product = await Product.findById(item.product);
                            if (!product) continue;

                            if (item.selectedVariant && product.variantCombinations?.length > 0) {
                                const combo = product.variantCombinations.find(c => {
                                    const comboObj = c.combination instanceof Map ? Object.fromEntries(c.combination) : c.combination;
                                    return Object.keys(item.selectedVariant).every(k => comboObj[k] === item.selectedVariant[k]);
                                });
                                if (combo && combo.stock >= item.quantity) {
                                    combo.stock -= item.quantity;
                                    await product.save();
                                }
                            } else {
                                await Product.findOneAndUpdate(
                                    { _id: item.product, stock: { $gte: item.quantity } },
                                    { $inc: { stock: -item.quantity } }
                                );
                            }
                        }

                        // Sipariş oluştur
                        const orderData = {
                            products: paymentData.products,
                            total: paymentData.total,
                            address: paymentData.address,
                            phone: paymentData.phone,
                            status: 'hazırlanıyor'
                        };

                        if (paymentData.isGuest) {
                            orderData.guestName = paymentData.guestName;
                            orderData.guestEmail = paymentData.guestEmail;
                        } else {
                            orderData.user = paymentData.userId;
                        }

                        const order = new Order(orderData);
                        await order.save();

                        // Sepeti temizle
                        if (!paymentData.isGuest && paymentData.userId) {
                            await CartItem.deleteMany({ user: paymentData.userId });
                        }

                        // Kupon
                        if (paymentData.couponCode) {
                            const Coupon = require('../models/Coupon');
                            await Coupon.findOneAndUpdate(
                                { code: paymentData.couponCode.toUpperCase(), isActive: true },
                                { $inc: { usedCount: 1 } }
                            );
                        }

                        // Sonucu kaydet
                        await PendingPayment.create({
                            token: `result_${token}`,
                            type: 'result',
                            status: 'success',
                            orderId: order._id,
                            trackingNumber: order.trackingNumber
                        });
                        processingTokens.delete(token);

                        // E-posta (arka planda)
                        let emailTo = paymentData.guestEmail;
                        let emailName = paymentData.guestName;
                        if (!paymentData.isGuest && paymentData.userId) {
                            const userDoc = await User.findById(paymentData.userId);
                            emailTo = userDoc?.email;
                            emailName = userDoc?.name;
                        }
                        if (emailTo) {
                            const productDetails = [];
                            for (const item of paymentData.products) {
                                const prod = await Product.findById(item.product);
                                productDetails.push({ title: prod?.title || 'Ürün', quantity: item.quantity, price: item.price });
                            }
                            sendOrderConfirmation(emailTo, emailName || 'Müşteri', order, productDetails).catch(e => logger.error('E-posta hatası', { error: e.message }));
                        }

                        return res.json({ status: 'success', orderId: order._id, trackingNumber: order.trackingNumber });
                    } catch (orderErr) {
                        logger.error('Sipariş oluşturma hatası', { error: orderErr.message });
                        processingTokens.delete(token);
                        return res.json({ status: 'failed', error: 'Sipariş oluşturulamadı' });
                    }
                }

                // Sipariş zaten oluşturulmuş ama cache'de yok
                return res.json({ status: 'success' });
            } else if (result.paymentStatus === 'FAILURE') {
                await PendingPayment.deleteOne({ token });
                return res.json({ status: 'failed' });
            } else {
                return res.json({ status: 'pending' });
            }
        });
    } catch (err) {
        logger.error('Result sorgu hatası', { error: err.message });
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;

