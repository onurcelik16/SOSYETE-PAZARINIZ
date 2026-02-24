const https = require('https');

// Brevo API üzerinden e-posta gönderen yardımcı fonksiyon
const sendViaBrevoAPI = (data) => {
  return new Promise((resolve, reject) => {
    // Önce BREVO_API_KEY, yoksa diğerlerine bak
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!apiKey) {
      console.error('❌ HATA: Brevo API Key bulunamadı! (BREVO_API_KEY, SMTP_PASS veya EMAIL_PASS eksik)');
      return reject(new Error('Brevo API Key eksik!'));
    }

    // Güvenlik için key'in ilk ve son karakterlerini loglayalım
    const maskedKey = apiKey.length > 8 ? (apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4)) : '***';
    console.log(`Sunucu: Brevo API anahtarı kullanılıyor: ${maskedKey}`);

    const postData = JSON.stringify({
      sender: {
        name: "Sosyete Pazarı",
        email: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER
      },
      to: [{ email: data.to }],
      subject: data.subject,
      htmlContent: data.html
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ E-posta başarıyla gönderildi (API): ${data.to}`);
          resolve(true);
        } else {
          console.error(`❌ Brevo API Hatası (${res.statusCode}):`, responseBody);
          reject(new Error(`Brevo API Hatası: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Bağlantı Hatası: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

// E-posta header/footer şablonu
const emailWrapper = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Sosyete Pazarı</h1>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
      ${content}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 12px; text-align: center;">© Sosyete Pazarı — Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
`;

// Sipariş onay e-postası
const sendOrderConfirmation = async (to, name, order, products) => {
  try {
    const productRows = products.map(p =>
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${p.title}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: right;">${(p.price * p.quantity).toFixed(2)} ₺</td>
      </tr>`
    ).join('');

    const html = emailWrapper(`
      <h2 style="color: #333; margin-top: 0;">Siparişiniz Alındı! 🎉</h2>
      <p style="color: #666;">Merhaba <strong>${name}</strong>,</p>
      <p style="color: #666;">Siparişiniz başarıyla oluşturuldu. Detaylar aşağıdadır:</p>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Takip No:</strong> ${order.trackingNumber}</p>
        <p style="margin: 4px 0;"><strong>Toplam:</strong> ${order.total.toFixed(2)} ₺</p>
        <p style="margin: 4px 0;"><strong>Adres:</strong> ${order.address}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Ürün</th>
            <th style="padding: 10px; text-align: center;">Adet</th>
            <th style="padding: 10px; text-align: right;">Fiyat</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>

      <p style="color: #999; font-size: 13px;">Siparişinizi takip etmek için takip numaranızı kullanabilirsiniz.</p>
    `);

    await sendViaBrevoAPI({ to, subject: `Sipariş Onayı - #${order.trackingNumber}`, html });
  } catch (err) {
    console.error('Sipariş onay e-postası gönderilemedi:', err.message);
  }
};

// Sipariş durumu değişiklik e-postası
const sendStatusUpdate = async (to, name, order, newStatus, note) => {
  try {
    const statusColors = {
      'beklemede': '#f59e0b',
      'onaylandı': '#3b82f6',
      'hazırlanıyor': '#8b5cf6',
      'kargoya verildi': '#06b6d4',
      'teslim edildi': '#10b981',
      'iptal edildi': '#ef4444'
    };

    const statusEmojis = {
      'beklemede': '⏳',
      'onaylandı': '✅',
      'hazırlanıyor': '📦',
      'kargoya verildi': '🚚',
      'teslim edildi': '🎉',
      'iptal edildi': '❌'
    };

    const color = statusColors[newStatus] || '#6b7280';
    const emoji = statusEmojis[newStatus] || '📋';

    const html = emailWrapper(`
      <h2 style="color: #333; margin-top: 0;">Sipariş Durumu Güncellendi ${emoji}</h2>
      <p style="color: #666;">Merhaba <strong>${name}</strong>,</p>
      <p style="color: #666;"><strong>#${order.trackingNumber}</strong> numaralı siparişinizin durumu güncellendi:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 12px 32px; background: ${color}; color: white; border-radius: 8px; font-size: 18px; font-weight: 700; text-transform: uppercase;">
          ${emoji} ${newStatus}
        </span>
      </div>

      ${note ? `<p style="color: #666; background: #f9fafb; padding: 12px; border-radius: 8px;"><strong>Not:</strong> ${note}</p>` : ''}

      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Takip No:</strong> ${order.trackingNumber}</p>
        <p style="margin: 4px 0;"><strong>Toplam:</strong> ${order.total.toFixed(2)} ₺</p>
      </div>

      <p style="color: #999; font-size: 13px;">Sipariş takibi için takip numaranızı kullanabilirsiniz.</p>
    `);

    await sendViaBrevoAPI({ to, subject: `Sipariş Durumu: ${newStatus} - #${order.trackingNumber}`, html });
  } catch (err) {
    console.error('Durum güncelleme e-postası gönderilemedi:', err.message);
  }
};

// Şifre sıfırlama e-postası
const sendPasswordReset = async (to, name, token) => {
  try {
    const fUrl = process.env.FRONTEND_URL;
    const cUrl = process.env.CORS_ORIGIN;
    const frontendUrl = fUrl || cUrl || 'http://localhost:3000';

    console.log(`Sunucu: Şifre sıfırlama linki hazırlanıyor. FRONTEND_URL: ${fUrl || 'Eksik'}, CORS_ORIGIN: ${cUrl || 'Eksik'}, Secilen: ${frontendUrl}`);

    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = emailWrapper(`
      <h2 style="color: #333; margin-top: 0;">Şifre Sıfırlama Talebi</h2>
      <p style="color: #666; line-height: 1.6;">Merhaba <strong>${name}</strong>,</p>
      <p style="color: #666; line-height: 1.6;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Şifremi Sıfırla</a>
      </div>
      <p style="color: #999; font-size: 13px;">Bu bağlantı 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
    `);

    console.log(`Reset maili API üzerinden gönderiliyor: ${to}...`);
    return await sendViaBrevoAPI({ to, subject: 'Şifre Sıfırlama - Sosyete Pazarı', html });
  } catch (err) {
    console.error('❌ Şifre sıfırlama API Hatası:', err.message);
    return false;
  }
};

module.exports = { sendOrderConfirmation, sendStatusUpdate, sendPasswordReset };
