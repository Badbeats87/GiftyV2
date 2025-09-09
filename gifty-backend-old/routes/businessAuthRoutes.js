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

// Business Login (placeholder for now)
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Business login functionality not yet implemented' });
});

module.exports = router;
