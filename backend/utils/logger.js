const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'sosyete-pazari' },
    transports: [
        // Hata logları ayrı dosyada
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5
        }),
        // Tüm loglar
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});

// Geliştirme ortamında konsola da yaz
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
        )
    }));
}

// Express request logger middleware
logger.requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        if (res.statusCode >= 400) {
            logger.warn('Request failed', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });
    next();
};

module.exports = logger;
