const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  trackingNumber: { type: String, unique: true },
  status: { 
    type: String, 
    enum: ['beklemede', 'hazırlanıyor', 'kargoda', 'teslim edildi', 'iptal edildi'],
    default: 'beklemede' 
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      date: { type: Date, default: Date.now },
      note: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Takip numarası oluşturma middleware
orderSchema.pre('save', async function(next) {
  if (!this.trackingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.trackingNumber = `TRK${year}${month}${day}${random}`;
  }
  
  // İlk durum geçmişini ekle
  if (this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: 'Sipariş oluşturuldu'
    });
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema); 