const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use a strong, unique secret in production
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const generateToken = (id, role, email) => {
  try {
    const payload = { id, role, email };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    logger.error(`Error generating JWT for ID ${id}, role ${role}, email ${email}: ${error.message}`);
    throw new Error('Failed to generate token');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error(`Error verifying JWT: ${error.message}`);
    throw new Error('Invalid or expired token');
  }
};

module.exports = { generateToken, verifyToken };
