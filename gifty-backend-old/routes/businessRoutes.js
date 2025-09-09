const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Get all businesses (can be public or require authentication)
router.get('/', async (req, res) => {
  try {
    const businesses = await db('businesses').select('id', 'name', 'description', 'logo_url', 'images_urls', 'operating_hours', 'terms_and_conditions');
    res.status(200).json(businesses);
  } catch (error) {
    logger.error(`Error fetching businesses: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single business by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const business = await db('businesses').select('id', 'name', 'description', 'logo_url', 'images_urls', 'operating_hours', 'terms_and_conditions').where({ id }).first();
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.status(200).json(business);
  } catch (error) {
    logger.error(`Error fetching business ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update business profile (requires business authentication and authorization)
router.put('/:id', authenticate, authorize(['business']), async (req, res) => {
  const { id } = req.params;
  const { name, address, contact_phone, contact_email, description, logo_url, images_urls, operating_hours, terms_and_conditions } = req.body;

  // Ensure the authenticated business is updating their own profile
  if (req.user.id !== parseInt(id)) {
    logger.warn(`Unauthorized attempt to update business profile. User ID: ${req.user.id}, Business ID: ${id}`);
    return res.status(403).json({ message: 'Forbidden: You can only update your own business profile' });
  }

  try {
    const updatedBusiness = await db('businesses')
      .where({ id })
      .update({
        name,
        address,
        contact_phone,
        contact_email,
        description,
        logo_url,
        images_urls,
        operating_hours,
        terms_and_conditions,
        updated_at: db.fn.now()
      })
      .returning(['id', 'name', 'email', 'address']);

    if (!updatedBusiness || updatedBusiness.length === 0) {
      return res.status(404).json({ message: 'Business not found or no changes made' });
    }

    logger.info(`Business profile updated: ${name} (ID: ${id})`);
    res.status(200).json({ message: 'Business profile updated successfully', business: updatedBusiness[0] });
  } catch (error) {
    logger.error(`Error updating business profile ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Pause or delete business account (requires business authentication and authorization)
router.put('/:id/status', authenticate, authorize(['business']), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // Expecting a boolean: true for active, false for paused/deleted

  // Ensure the authenticated business is updating their own status
  if (req.user.id !== parseInt(id)) {
    logger.warn(`Unauthorized attempt to change business status. User ID: ${req.user.id}, Business ID: ${id}`);
    return res.status(403).json({ message: 'Forbidden: You can only update your own business status' });
  }

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'Invalid value for is_active. Must be true or false.' });
  }

  try {
    const updatedBusiness = await db('businesses')
      .where({ id })
      .update({
        is_active,
        updated_at: db.fn.now()
      })
      .returning(['id', 'name', 'is_active']);

    if (!updatedBusiness || updatedBusiness.length === 0) {
      return res.status(404).json({ message: 'Business not found or no changes made' });
    }

    logger.info(`Business status updated: ${updatedBusiness[0].name} (ID: ${id}) to ${is_active ? 'active' : 'inactive'}`);
    res.status(200).json({ message: `Business status updated to ${is_active ? 'active' : 'inactive'}`, business: updatedBusiness[0] });
  } catch (error) {
    logger.error(`Error updating business status ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
