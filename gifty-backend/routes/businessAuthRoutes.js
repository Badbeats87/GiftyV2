const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const logger = require('../utils/logger');

// Business Registration
router.post('/register', async (req, res) => {
  const { name, email, password, address, contact_phone, contact_email, description } = req.body;

  if (!name || !email || !password || !address) {
    logger.warn('Business registration attempt with missing required fields');
    return res.status(400).json({ message: 'Name, email, password, and address are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [businessId] = await db('businesses').insert({
      name,
      email,
      password_hash: hashedPassword,
      address,
      contact_phone,
      contact_email,
      description,
      // logo_url, images_urls, operating_hours, terms_and_conditions, bank_account_details will be managed post-registration
    }).returning('id');

    logger.info(`Business registered successfully: ${name} (ID: ${businessId})`);
    res.status(201).json({ message: 'Business registered successfully, awaiting admin approval', businessId });
  } catch (error) {
    if (error.code === '23505') { // Unique violation error code for PostgreSQL
      logger.warn(`Business registration failed: Email already exists - ${email}`);
      return res.status(409).json({ message: 'Email already exists' });
    }
    logger.error(`Error during business registration: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/jwt'); // Assuming you have a jwt utility

// Business Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Business login attempt with missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const business = await db('businesses').where({ email }).first();

    if (!business) {
      logger.warn(`Business login failed: Business not found - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, business.password_hash);

    if (!isMatch) {
      logger.warn(`Business login failed: Incorrect password for ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!business.is_approved) {
      logger.warn(`Business login failed: Business not yet approved - ${email}`);
      return res.status(403).json({ message: 'Your business application is awaiting admin approval.' });
    }

    if (!business.is_active) {
      logger.warn(`Business login failed: Business account inactive - ${email}`);
      return res.status(403).json({ message: 'Your business account is inactive. Please contact support.' });
    }

    const token = generateToken(business.id, 'business'); // Use your JWT utility to generate a token
    logger.info(`Business logged in successfully: ${business.name} (ID: ${business.id})`);
    res.status(200).json({ message: 'Logged in successfully', token, business: { id: business.id, name: business.name, email: business.email } });
  } catch (error) {
    logger.error(`Error during business login: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
