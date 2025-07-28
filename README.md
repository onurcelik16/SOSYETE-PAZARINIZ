# 🛍️ SOSYETE PAZARINIZ - Modern E-Ticaret Platformu

Modern ve kullanıcı dostu e-ticaret platformu. React.js frontend ve Node.js backend ile geliştirilmiştir.

## ✨ Özellikler

### 👤 Kullanıcı Özellikleri
- **Kayıt ve Giriş:** Güvenli kullanıcı kimlik doğrulama
- **Ürün Görüntüleme:** Kategorilere göre ürün listesi
- **Ürün Detayları:** Detaylı ürün bilgileri ve görselleri
- **Sepet Yönetimi:** Ürün ekleme, çıkarma ve miktar güncelleme
- **Favoriler:** Beğenilen ürünleri kaydetme
- **Sipariş Takibi:** Sipariş durumu ve geçmişi
- **Profil Yönetimi:** Kullanıcı bilgileri ve adres yönetimi

### 🛒 Alışveriş Özellikleri
- **Güvenli Ödeme:** Stripe entegrasyonu
- **Sipariş Onayı:** Email ile sipariş bildirimi
- **Kargo Takibi:** Sipariş durumu takibi
- **Filtreleme:** Fiyat, kategori ve marka filtreleme

### 👨‍💼 Admin Paneli
- **Ürün Yönetimi:** Ürün ekleme, düzenleme, silme
- **Sipariş Yönetimi:** Sipariş durumu güncelleme
- **Kullanıcı Yönetimi:** Kullanıcı listesi ve detayları
- **Dashboard:** Satış istatistikleri ve grafikler

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- MongoDB Atlas hesabı

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/onurcelik16/SOSYETE-PAZARINIZ.git
cd SOSYETE-PAZARINIZ
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```

### 3. Environment Variables
`backend/.env` dosyası oluşturun:
```env
MONGO_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/shop
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
JWT_SECRET=your-jwt-secret
```

### 4. Frontend Kurulumu
```bash
cd ../my-app
npm install
```

## 🏃‍♂️ Çalıştırma

### Backend'i Başlatın
```bash
cd backend
npm start
```
Backend http://localhost:5000 adresinde çalışacak

### Frontend'i Başlatın
```bash
cd my-app
npm start
```
Frontend http://localhost:3000 adresinde çalışacak

## 🛠️ Teknolojiler

### Frontend
- **React.js** - Kullanıcı arayüzü
- **React Router** - Sayfa yönlendirme
- **Context API** - State yönetimi
- **Axios** - HTTP istekleri
- **React Icons** - İkonlar
- **CSS3** - Stil ve animasyonlar

### Backend
- **Node.js** - Sunucu tarafı
- **Express.js** - Web framework
- **MongoDB** - Veritabanı
- **Mongoose** - ODM
- **JWT** - Kimlik doğrulama
- **Nodemailer** - Email gönderimi
- **Multer** - Dosya yükleme

### Veritabanı Modelleri
- **User** - Kullanıcı bilgileri
- **Product** - Ürün bilgileri
- **Cart** - Sepet yönetimi
- **Order** - Sipariş bilgileri

## 📁 Proje Yapısı

```
SOSYETE-PAZARINIZ/
├── backend/
│   ├── models/          # MongoDB modelleri
│   ├── routes/          # API endpoint'leri
│   ├── middleware/      # Kimlik doğrulama
│   └── index.js         # Ana sunucu dosyası
├── my-app/
│   ├── src/
│   │   ├── components/  # React bileşenleri
│   │   ├── pages/       # Sayfa bileşenleri
│   │   ├── context/     # Context API
│   │   └── services/    # API servisleri
│   └── public/          # Statik dosyalar
└── README.md
```

## 🔐 Güvenlik

- **JWT Token** - Güvenli kimlik doğrulama
- **Password Hashing** - Şifre güvenliği
- **Input Validation** - Veri doğrulama
- **CORS** - Cross-origin güvenliği
- **Environment Variables** - Hassas bilgi koruması

## 📱 Responsive Tasarım

- **Mobile First** yaklaşımı
- **Bootstrap** grid sistemi
- **CSS Media Queries** ile uyumluluk
- **Touch-friendly** arayüz

## 🎨 UI/UX Özellikleri

- **Modern Tasarım** - Temiz ve şık arayüz
- **Dark/Light Mode** - Tema seçenekleri
- **Smooth Animations** - Yumuşak geçişler
- **Loading States** - Yükleme göstergeleri
- **Error Handling** - Hata yönetimi

## 📧 İletişim

- **Email:** [celikonur10@example.com]
- **GitHub:** [https://github.com/onurcelik16]
- **LinkedIn:** [https://www.linkedin.com/in/onur-%C3%A7elik-772832303/]

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 🙏 Teşekkürler


**SOSYETE PAZARINIZ** - Modern alışverişin yeni adresi! 🛍️✨ 
