/**
 * Global hata yakalama middleware'i
 * Tüm route'lardan fırlatılan hataları yakalar ve standart formatta döner
 */
function errorHandler(err, req, res, next) {
    console.error('Hata:', err.stack || err.message);

    // Mongoose validation hatası
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: 'Doğrulama hatası',
            errors: messages
        });
    }

    // Mongoose CastError (geçersiz ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Geçersiz ID formatı'
        });
    }

    // Mongoose duplicate key hatası
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            message: `Bu ${field} zaten kullanılmaktadır`
        });
    }

    // JWT hataları
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Geçersiz token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token süresi dolmuş' });
    }

    // Genel hata
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the error
    const logger = require('../utils/logger');
    logger.error('Unhandled Error', {
        message: err.message,
        stack: isProduction ? null : err.stack,
        path: req.path
    });

    res.status(statusCode).json({
        message: isProduction ? (statusCode === 500 ? 'Sunucu hatası' : err.message) : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
}

module.exports = errorHandler;
