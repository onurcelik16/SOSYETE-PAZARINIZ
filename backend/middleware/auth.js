const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token gerekli' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token formatı geçersiz' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.' });
    }
    return res.status(401).json({ message: 'Geçersiz token' });
  }
}

module.exports = authMiddleware;