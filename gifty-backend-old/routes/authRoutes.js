const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const logger = require('../utils/logger');

// User Registration
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('User registration attempt with missing credentials');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({
      email,
      password_hash: hashedPassword,
    }).returning('id');

    logger.info(`User registered successfully: ${email} (ID: ${userId})`);
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    if (error.code === '23505') { // Unique violation error code for PostgreSQL
      logger.warn(`User registration failed: Email already exists - ${email}`);
      return res.status(409).json({ message: 'Email already exists' });
    }
    logger.error(`Error during user registration: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('User login attempt with missing credentials');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db('users').where({ email }).first();
    if (!user) {
      logger.warn(`User login failed: User not found - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn(`User login failed: Invalid password for user - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: 'user' });
    logger.info(`User logged in successfully: ${email}`);
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    logger.error(`Error during user login: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
