require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch((err) => console.error('MongoDB bağlantı hatası:', err));

async function updateUsersWithFavorites() {
  try {
    // Favorites alanı olmayan kullanıcıları bul
    const usersWithoutFavorites = await User.find({ favorites: { $exists: false } });
    
    console.log(`${usersWithoutFavorites.length} adet kullanıcı güncellenecek...`);
    
    for (const user of usersWithoutFavorites) {
      // Favorites alanını ekle
      user.favorites = [];
      await user.save();
      
      console.log(`Kullanıcı ${user.email} güncellendi - Favorites alanı eklendi`);
    }
    
    console.log('Tüm kullanıcılar başarıyla güncellendi!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

updateUsersWithFavorites(); 