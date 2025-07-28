require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch((err) => console.error('MongoDB bağlantı hatası:', err));

async function updateExistingOrders() {
  try {
    // Takip numarası olmayan siparişleri bul
    const ordersWithoutTracking = await Order.find({ trackingNumber: { $exists: false } });
    
    console.log(`${ordersWithoutTracking.length} adet sipariş güncellenecek...`);
    
    for (const order of ordersWithoutTracking) {
      // Takip numarası oluştur
      const date = new Date(order.createdAt);
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const trackingNumber = `TRK${year}${month}${day}${random}`;
      
      // Durum geçmişi ekle (eğer yoksa)
      if (!order.statusHistory || order.statusHistory.length === 0) {
        order.statusHistory = [{
          status: order.status || 'beklemede',
          date: order.createdAt,
          note: 'Sipariş oluşturuldu'
        }];
      }
      
      // Siparişi güncelle
      order.trackingNumber = trackingNumber;
      await order.save();
      
      console.log(`Sipariş ${order._id} güncellendi - Takip No: ${trackingNumber}`);
    }
    
    console.log('Tüm siparişler başarıyla güncellendi!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

updateExistingOrders(); 