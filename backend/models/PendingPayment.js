const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['payment', 'result'], default: 'payment' },
    buyer: {
        name: { type: String },
        surname: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String }
    },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        category: String,
        price: Number,
        quantity: Number,
        selectedVariant: { type: Map, of: String, default: null }
    }],
    total: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestName: { type: String },
    guestEmail: { type: String },
    address: { type: String },
    phone: { type: String },
    couponCode: { type: String },
    // result tipi için
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    trackingNumber: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 1800 } // TTL: 30 dakika sonra otomatik sil
});

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
