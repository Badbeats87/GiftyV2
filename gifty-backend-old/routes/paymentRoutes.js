const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../database/db');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Endpoint to create a Stripe Connect account for a business
router.post('/connect-account', authenticate, authorize(['business']), async (req, res) => {
  const business_id = req.user.id;
  const { country, business_type } = req.body; // e.g., 'US', 'individual' or 'company'

  if (!country || !business_type) {
    return res.status(400).json({ message: 'Country and business type are required.' });
  }

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: req.user.email, // Assuming business email is in the token
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: business_type,
      // Add more account details as needed for KYC/AML
    });

    // Save the Stripe account ID to the business's record in your database
    await db('businesses').where({ id: business_id }).update({
      stripe_account_id: account.id,
      updated_at: db.fn.now()
    });

    logger.info(`Stripe Connect account created for business ${business_id}: ${account.id}`);
    res.status(200).json({ message: 'Stripe Connect account created', accountId: account.id });
  } catch (error) {
    logger.error(`Error creating Stripe Connect account for business ${business_id}: ${error.message}`);
    res.status(500).json({ message: 'Failed to create Stripe Connect account' });
  }
});

// Endpoint to generate an account link for onboarding a business
router.post('/connect-account-link', authenticate, authorize(['business']), async (req, res) => {
  const business_id = req.user.id;

  try {
    const business = await db('businesses').where({ id: business_id }).first();
    if (!business || !business.stripe_account_id) {
      return res.status(400).json({ message: 'Stripe Connect account not found for this business. Please create one first.' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: business.stripe_account_id,
      refresh_url: `${process.env.FRONTEND_URL}/reauth`, // URL to redirect if link expires
      return_url: `${process.env.FRONTEND_URL}/return`, // URL to redirect after onboarding
      type: 'account_onboarding',
    });

    logger.info(`Stripe Connect account link generated for business ${business_id}`);
    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    logger.error(`Error generating Stripe Connect account link for business ${business_id}: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate account link' });
  }
});

// Endpoint to process a gift card purchase
router.post('/purchase-gift-card', authenticate, async (req, res) => {
  const { giftCardId, paymentMethodId, recipientEmail, personalMessage } = req.body;
  const customerId = req.user ? req.user.id : null; // Can be null for guest checkout

  if (!giftCardId || !paymentMethodId || !recipientEmail) {
    logger.warn(`Gift card purchase attempt with missing required fields. Customer ID: ${customerId}`);
    return res.status(400).json({ message: 'Gift card ID, payment method, and recipient email are required.' });
  }

  try {
    const giftCard = await db('gift_cards').where({ id: giftCardId, status: 'active' }).first();
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found or not active.' });
    }

    const business = await db('businesses').where({ id: giftCard.business_id, is_approved: true, is_active: true }).first();
    if (!business || !business.stripe_account_id) {
      logger.warn(`Purchase failed: Business ${giftCard.business_id} not found, not approved, or no Stripe account.`);
      return res.status(400).json({ message: 'Cannot purchase gift card: Business is not active or configured for payments.' });
    }

    // Calculate fees
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || 0);
    const customerFeePercentage = parseFloat(process.env.CUSTOMER_FEE_PERCENTAGE || 0);

    const grossAmount = giftCard.value;
    const customerFee = grossAmount * customerFeePercentage;
    const totalAmountCharged = grossAmount + customerFee;
    const platformFeeFromBusiness = grossAmount * platformFeePercentage;
    const netAmountToBusiness = grossAmount - platformFeeFromBusiness;

    // Create a Payment Intent with transfer_data for split payments
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmountCharged * 100), // Amount in cents
      currency: giftCard.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: 'manual', // Requires explicit confirmation
      confirm: true,
      application_fee_amount: Math.round((customerFee + platformFeeFromBusiness) * 100), // Total fee to platform
      transfer_data: {
        destination: business.stripe_account_id,
        amount: Math.round(netAmountToBusiness * 100), // Amount to transfer to business
      },
      metadata: {
        giftCardId: giftCard.id,
        businessId: business.id,
        customerId: customerId,
        recipientEmail,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      logger.error(`Stripe Payment Intent failed for gift card ${giftCard.id}: ${paymentIntent.status}`);
      return res.status(400).json({ message: 'Payment failed', status: paymentIntent.status });
    }

    // Update gift card status and associate with purchaser
    await db('gift_cards')
      .where({ id: giftCard.id })
      .update({
        status: 'purchased',
        purchased_by_user_id: customerId,
        purchased_at: db.fn.now(),
        personal_message: personalMessage,
        updated_at: db.fn.now()
      });

    // Record transactions
    await db('transactions').insert([
      {
        type: 'purchase',
        amount: totalAmountCharged,
        currency: giftCard.currency,
        entity_id: giftCard.id,
        entity_type: 'gift_card',
        description: `Gift card ${giftCard.unique_code} purchased by customer ${customerId || 'guest'}`,
        status: 'completed',
      },
      {
        type: 'platform_fee_customer',
        amount: customerFee,
        currency: giftCard.currency,
        entity_id: giftCard.id,
        entity_type: 'gift_card',
        related_transaction_id: null, // Link to purchase transaction if possible
        description: `Platform fee from customer for gift card ${giftCard.unique_code}`,
        status: 'completed',
      },
      {
        type: 'platform_fee_business',
        amount: platformFeeFromBusiness,
        currency: giftCard.currency,
        entity_id: giftCard.id,
        entity_type: 'gift_card',
        related_transaction_id: null, // Link to purchase transaction if possible
        description: `Platform fee from business for gift card ${giftCard.unique_code}`,
        status: 'completed',
      },
      {
        type: 'payout',
        amount: netAmountToBusiness,
        currency: giftCard.currency,
        entity_id: business.id,
        entity_type: 'business',
        related_transaction_id: null, // Link to purchase transaction if possible
        description: `Payout to business ${business.name} for gift card ${giftCard.unique_code}`,
        status: 'completed',
      }
    ]);

    logger.info(`Gift card ${giftCard.id} purchased successfully. Payment Intent: ${paymentIntent.id}`);
    res.status(200).json({ message: 'Gift card purchased successfully', paymentIntentId: paymentIntent.id, giftCardUniqueCode: giftCard.unique_code });

  } catch (error) {
    logger.error(`Error processing gift card purchase for gift card ${giftCardId}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error during purchase' });
  }
});

module.exports = router;
