const multer = require('multer');
const { storage } = require('../utils/cloudinary');

// Dosya filtresi (Sadece resimler)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir! (jpeg, jpg, png, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Cloudinary zaten optimizasyon yaptığı için extra middleware'e gerek kalmadı
// Ancak eski route'ların bozulmaması için boş bir optimizeImages middleware'i/pass-through bırakıyoruz
const optimizeImages = (req, res, next) => next();

module.exports = { upload, optimizeImages };
