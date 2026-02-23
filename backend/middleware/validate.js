const { body, param, validationResult } = require('express-validator');

/**
 * Validation sonuçlarını kontrol eden middleware
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Doğrulama hatası',
            errors: errors.array().map(e => e.msg)
        });
    }
    next();
};

// ============ AUTH VALIDATION ============

const registerValidation = [
    body('email')
        .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır')
        .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir'),
    body('name')
        .trim()
        .notEmpty().withMessage('Ad alanı zorunludur')
        .isLength({ max: 50 }).withMessage('Ad en fazla 50 karakter olabilir')
        .escape(),
    body('surname')
        .trim()
        .notEmpty().withMessage('Soyad alanı zorunludur')
        .isLength({ max: 50 }).withMessage('Soyad en fazla 50 karakter olabilir')
        .escape(),
    body('tcno')
        .trim()
        .notEmpty().withMessage('TC Kimlik No zorunludur')
        .isLength({ min: 11, max: 11 }).withMessage('TC Kimlik No 11 haneli olmalıdır')
        .isNumeric().withMessage('TC Kimlik No sadece rakam içermelidir'),
    body('gender')
        .optional()
        .isIn(['Erkek', 'Kadın', 'Diğer']).withMessage('Geçersiz cinsiyet değeri'),
    body('birthdate')
        .optional()
        .isISO8601().withMessage('Geçerli bir tarih giriniz'),
    handleValidation
];

const loginValidation = [
    body('email')
        .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Şifre alanı zorunludur'),
    handleValidation
];

const forgotPasswordValidation = [
    body('email')
        .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
        .normalizeEmail(),
    handleValidation
];

const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Token zorunludur'),
    body('password')
        .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır')
        .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir'),
    handleValidation
];

const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Ad alanı boş olamaz')
        .isLength({ max: 50 }).withMessage('Ad en fazla 50 karakter olabilir')
        .escape(),
    body('surname')
        .optional()
        .trim()
        .notEmpty().withMessage('Soyad alanı boş olamaz')
        .isLength({ max: 50 }).withMessage('Soyad en fazla 50 karakter olabilir')
        .escape(),
    body('gender')
        .optional()
        .isIn(['Erkek', 'Kadın', 'Diğer']).withMessage('Geçersiz cinsiyet değeri'),
    body('birthdate')
        .optional()
        .isISO8601().withMessage('Geçerli bir tarih giriniz'),
    handleValidation
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Mevcut şifre zorunludur'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır')
        .matches(/[A-Z]/).withMessage('Yeni şifre en az bir büyük harf içermelidir'),
    handleValidation
];

// ============ PRODUCT VALIDATION ============

const productValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Ürün adı zorunludur')
        .isLength({ max: 200 }).withMessage('Ürün adı en fazla 200 karakter olabilir')
        .escape(),
    body('description')
        .trim()
        .notEmpty().withMessage('Açıklama zorunludur')
        .isLength({ max: 2000 }).withMessage('Açıklama en fazla 2000 karakter olabilir'),
    body('price')
        .isFloat({ min: 0.01 }).withMessage('Fiyat 0\'dan büyük olmalıdır'),
    body('stock')
        .isInt({ min: 0 }).withMessage('Stok 0 veya daha büyük bir sayı olmalıdır'),
    body('category')
        .trim()
        .notEmpty().withMessage('Kategori zorunludur')
        .escape(),
    body('image')
        .optional()
        .isURL().withMessage('Geçerli bir resim URL\'si giriniz'),
    body('images')
        .optional()
        .isArray().withMessage('Resimler bir dizi olmalıdır'),
    body('images.*')
        .optional()
        .isURL().withMessage('Her resim geçerli bir URL olmalıdır'),
    handleValidation
];

const reviewValidation = [
    body('user')
        .trim()
        .notEmpty().withMessage('Kullanıcı adı zorunludur')
        .escape(),
    body('comment')
        .trim()
        .notEmpty().withMessage('Yorum zorunludur')
        .isLength({ max: 1000 }).withMessage('Yorum en fazla 1000 karakter olabilir'),
    body('rating')
        .isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasında olmalıdır'),
    handleValidation
];

// ============ CART VALIDATION ============

const cartValidation = [
    body('user')
        .notEmpty().withMessage('Kullanıcı ID zorunludur')
        .isMongoId().withMessage('Geçersiz kullanıcı ID'),
    body('product')
        .notEmpty().withMessage('Ürün ID zorunludur')
        .isMongoId().withMessage('Geçersiz ürün ID'),
    body('quantity')
        .isInt({ min: 1 }).withMessage('Miktar en az 1 olmalıdır'),
    handleValidation
];

const cartUpdateValidation = [
    body('quantity')
        .isInt({ min: 1 }).withMessage('Miktar en az 1 olmalıdır'),
    handleValidation
];

// ============ ORDER VALIDATION ============

const orderValidation = [
    body('user')
        .notEmpty().withMessage('Kullanıcı ID zorunludur')
        .isMongoId().withMessage('Geçersiz kullanıcı ID'),
    body('products')
        .isArray({ min: 1 }).withMessage('En az bir ürün olmalıdır'),
    body('products.*.product')
        .isMongoId().withMessage('Geçersiz ürün ID'),
    body('products.*.quantity')
        .isInt({ min: 1 }).withMessage('Miktar en az 1 olmalıdır'),
    body('products.*.price')
        .isFloat({ min: 0 }).withMessage('Fiyat geçersiz'),
    body('total')
        .isFloat({ min: 0 }).withMessage('Toplam tutar geçersiz'),
    body('address')
        .trim()
        .notEmpty().withMessage('Adres zorunludur')
        .isLength({ max: 500 }).withMessage('Adres en fazla 500 karakter olabilir'),
    body('phone')
        .trim()
        .notEmpty().withMessage('Telefon zorunludur')
        .matches(/^[0-9+\-() ]{10,15}$/).withMessage('Geçerli bir telefon numarası giriniz'),
    handleValidation
];

const orderStatusValidation = [
    body('status')
        .isIn(['beklemede', 'hazırlanıyor', 'kargoda', 'teslim edildi', 'iptal edildi'])
        .withMessage('Geçersiz sipariş durumu'),
    body('note')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Not en fazla 500 karakter olabilir'),
    handleValidation
];

// ============ FAVORITES VALIDATION ============

const favoriteValidation = [
    body('userId')
        .notEmpty().withMessage('Kullanıcı ID zorunludur')
        .isMongoId().withMessage('Geçersiz kullanıcı ID'),
    body('productId')
        .notEmpty().withMessage('Ürün ID zorunludur')
        .isMongoId().withMessage('Geçersiz ürün ID'),
    handleValidation
];

// ============ PARAM VALIDATION ============

const mongoIdParam = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage('Geçersiz ID formatı'),
    handleValidation
];

module.exports = {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    profileUpdateValidation,
    changePasswordValidation,
    productValidation,
    reviewValidation,
    cartValidation,
    cartUpdateValidation,
    orderValidation,
    orderStatusValidation,
    favoriteValidation,
    mongoIdParam,
    handleValidation
};
