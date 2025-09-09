const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const db = require('../database/db');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication attempt without a token or invalid format');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach decoded payload to request
    next();
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.id || !req.user.role) {
      logger.warn('Authorization failed: User information missing from token');
      return res.status(401).json({ message: 'Unauthorized: User role not found' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Authorization failed for user ${req.user.id}: Role '${req.user.role}' not in required roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
