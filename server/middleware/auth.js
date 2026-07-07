const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

// Legacy admin check
function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN || 'admin123';
  const provided =
    req.headers['x-admin-token'] ||
    (req.headers['authorization'] || '').replace('Bearer ', '');

  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing admin token.' });
  }
  next();
}

module.exports = { authenticateToken, requireRole, requireAdmin, JWT_SECRET };
