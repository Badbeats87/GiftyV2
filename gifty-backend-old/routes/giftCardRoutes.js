const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { generateUniqueCode } = require('../utils/helpers'); // Assuming a helper for unique code generation

// Create a new gift card (requires business authentication)
router.post('/', authenticate, authorize(['business']), async (req, res) => {
  const { value, currency, expires_at } = req.body;
  const business_id = req.user.id; // Assuming req.user.id is the business ID from the token

  if (!value || !currency) {
    logger.warn(`Business ${business_id} attempted to create gift card with missing value or currency`);
    return res.status(400).json({ message: 'Value and currency are required for gift card creation' });
  }

  try {
    const unique_code = generateUniqueCode(); // Helper function to generate a unique code
    // In a real app, you'd also generate a QR code URL here

    const [giftCardId] = await db('gift_cards').insert({
      business_id,
      unique_code,
      value,
      currency,
      expires_at: expires_at || null, // Optional expiry date
    }).returning('id');

    logger.info(`Gift card created by business ${business_id}: ID ${giftCardId}, Value ${value} ${currency}`);
    res.status(201).json({ message: 'Gift card created successfully', giftCardId, unique_code });
  } catch (error) {
    logger.error(`Error creating gift card for business ${business_id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all gift cards for a specific business (requires business authentication)
router.get('/business/:businessId', authenticate, authorize(['business']), async (req, res) => {
  const { businessId } = req.params;

  // Ensure the authenticated business is viewing their own gift cards
  if (req.user.id !== parseInt(businessId)) {
    logger.warn(`Unauthorized attempt to view gift cards. User ID: ${req.user.id}, Business ID: ${businessId}`);
    return res.status(403).json({ message: 'Forbidden: You can only view your own business\'s gift cards' });
  }

  try {
    const giftCards = await db('gift_cards').where({ business_id: businessId }).select('*');
    res.status(200).json(giftCards);
  } catch (error) {
    logger.error(`Error fetching gift cards for business ${businessId}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single gift card by ID (requires authentication - user/business/admin)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const giftCard = await db('gift_cards').where({ id }).first();
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }

    // Authorization check:
    // - Admin can view any gift card
    // - Business can view their own gift cards
    // - User can view gift cards they purchased
    if (userRole === 'admin' ||
        (userRole === 'business' && giftCard.business_id === userId) ||
        (userRole === 'user' && giftCard.purchased_by_user_id === userId)) {
      res.status(200).json(giftCard);
    } else {
      logger.warn(`Unauthorized access to gift card ${id}. User ID: ${userId}, Role: ${userRole}`);
      res.status(403).json({ message: 'Forbidden: Insufficient permissions to view this gift card' });
    }
  } catch (error) {
    logger.error(`Error fetching gift card ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Redeem a gift card (requires business authentication)
router.post('/:uniqueCode/redeem', authenticate, authorize(['business']), async (req, res) => {
  const { uniqueCode } = req.params;
  const business_id = req.user.id; // Authenticated business ID

  try {
    const giftCard = await db('gift_cards').where({ unique_code: uniqueCode }).first();

    if (!giftCard) {
      logger.warn(`Redemption attempt for non-existent gift card: ${uniqueCode}`);
      return res.status(404).json({ message: 'Gift card not found' });
    }

    if (giftCard.business_id !== business_id) {
      logger.warn(`Unauthorized redemption attempt. Business ID: ${business_id}, Gift Card Business ID: ${giftCard.business_id}`);
      return res.status(403).json({ message: 'Forbidden: This gift card does not belong to your business' });
    }

    if (giftCard.status === 'redeemed') {
      logger.warn(`Redemption attempt for already redeemed gift card: ${uniqueCode}`);
      return res.status(400).json({ message: 'Gift card already redeemed' });
    }

    if (giftCard.status === 'expired' || (giftCard.expires_at && new Date(giftCard.expires_at) < new Date())) {
      logger.warn(`Redemption attempt for expired gift card: ${uniqueCode}`);
      return res.status(400).json({ message: 'Gift card has expired' });
    }

    // Mark as redeemed
    const [updatedGiftCard] = await db('gift_cards')
      .where({ id: giftCard.id })
      .update({ status: 'redeemed', redeemed_at: db.fn.now(), updated_at: db.fn.now() })
      .returning('*');

    // Record transaction for redemption
    await db('transactions').insert({
      type: 'redemption',
      amount: updatedGiftCard.value,
      currency: updatedGiftCard.currency,
      entity_id: updatedGiftCard.id,
      entity_type: 'gift_card',
      description: `Gift card ${uniqueCode} redeemed by business ${business_id}`,
    });

    logger.info(`Gift card ${uniqueCode} redeemed successfully by business ${business_id}`);
    res.status(200).json({ message: 'Gift card redeemed successfully', giftCard: updatedGiftCard });
  } catch (error) {
    logger.error(`Error redeeming gift card ${uniqueCode}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
