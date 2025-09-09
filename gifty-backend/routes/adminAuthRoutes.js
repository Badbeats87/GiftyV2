const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/jwt'); // Assuming a jwt utility exists

// Admin Registration (for initial setup, should be highly secured)
// Temporarily removing authentication middleware for debugging
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    logger.warn('Admin registration attempt with missing credentials');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [adminId] = await db('admin_users').insert({
      email,
      password_hash: hashedPassword,
      role: role || 'admin', // Default to 'admin' if not specified
    }).returning('id');

    logger.info(`Admin registered successfully: ${email} (ID: ${adminId})`);
    res.status(201).json({ message: 'Admin registered successfully', adminId });
  } catch (error) {
    if (error.code === '23505') { // Unique violation error code for PostgreSQL
      logger.warn(`Admin registration failed: Email already exists - ${email}`);
      return res.status(409).json({ message: 'Email already exists' });
    }
    logger.error(`Error during admin registration: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Admin login attempt with missing credentials');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const admin = await db('admin_users').where({ email }).first();

    if (!admin) {
      logger.warn(`Admin login failed: Invalid credentials for email - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      logger.warn(`Admin login failed: Invalid credentials for email - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(admin.id, admin.role, admin.email);

    logger.info(`Admin logged in successfully: ${email}`);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    logger.error(`Error during admin login: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
