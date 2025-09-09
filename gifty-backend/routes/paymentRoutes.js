const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../database/db');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { generateQRCode } = require('../utils/qrCodeGenerator');
const { sendEmail } = require('../utils/emailService');

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

    // Explicitly update capabilities to active for testing purposes
    await stripe.accounts.update(
      account.id,
      {
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      }
    );

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
const { generateUniqueCode } = require('../utils/helpers'); // Assuming a helper for unique code generation

// Endpoint to process a gift card purchase
router.post('/purchase-gift-card', async (req, res) => {
  const { value, currency, businessId, paymentMethodId, recipientEmail, personalMessage, expires_at } = req.body;
  const customerId = req.user ? req.user.id : null; // Can be null for guest checkout

  if (!value || !currency || !businessId || !paymentMethodId || !recipientEmail) {
    logger.warn(`Gift card purchase attempt with missing required fields. Customer ID: ${customerId}`);
    return res.status(400).json({ message: 'Value, currency, business ID, payment method, and recipient email are required.' });
  }

  // Ensure value is a number
  const giftCardValue = parseFloat(value);
  if (isNaN(giftCardValue) || giftCardValue <= 0) {
    logger.warn(`Gift card purchase attempt with invalid value: ${value}. Customer ID: ${customerId}`);
    return res.status(400).json({ message: 'Invalid gift card value provided.' });
  }

  try {
    const business = await db('businesses').where({ id: businessId, is_approved: true, is_active: true }).first();
    if (!business || !business.stripe_account_id) {
      logger.warn(`Purchase failed: Business ${businessId} not found, not approved, or no Stripe account.`);
      return res.status(400).json({ message: 'Cannot purchase gift card: Business is not active or configured for payments.' });
    }

    // Retrieve Stripe account to check capabilities
    const stripeAccount = await stripe.accounts.retrieve(business.stripe_account_id);
    if (!stripeAccount.capabilities || !stripeAccount.capabilities.transfers || stripeAccount.capabilities.transfers !== 'active') {
      logger.warn(`Purchase failed: Business ${businessId} Stripe account capabilities not active for transfers.`);
      return res.status(400).json({ message: 'Cannot purchase gift card: Business Stripe account is not configured for transfers.' });
    }

    // Generate a new gift card
    const unique_code = generateUniqueCode();
    const insertedGiftCards = await db('gift_cards').insert({
      business_id: businessId,
      unique_code,
      value: giftCardValue, // Use the parsed float value
      currency,
      status: 'pending', // Set to pending until payment is successful
      expires_at: expires_at || null,
      personal_message: personalMessage,
    }).returning('id');
    const giftCardId = insertedGiftCards[0].id;

    const giftCard = await db('gift_cards').where({ id: giftCardId }).first();

    // Calculate fees
    const feeSettings = await db('platform_fees').select('fee_type', 'percentage');
    const platformFeeSetting = feeSettings.find(fee => fee.fee_type === 'platform');
    const customerFeeSetting = feeSettings.find(fee => fee.fee_type === 'customer');

    const platformFeePercentage = parseFloat(platformFeeSetting?.percentage || 0) / 100; // Convert to decimal
    const customerFeePercentage = parseFloat(customerFeeSetting?.percentage || 0) / 100; // Convert to decimal

    const grossAmount = parseFloat(giftCard.value); // Ensure it's a float
    const customerFee = grossAmount * customerFeePercentage;
    const totalAmountCharged = grossAmount + customerFee;
    const platformFeeFromBusiness = grossAmount * platformFeePercentage;
    const netAmountToBusiness = grossAmount - platformFeeFromBusiness;

    logger.info(`Purchase details - Value: ${value}, Parsed Value: ${giftCardValue}, Gross Amount: ${grossAmount}, Customer Fee: ${customerFee}, Platform Fee: ${platformFeeFromBusiness}, Total Charged: ${totalAmountCharged}, Net to Business: ${netAmountToBusiness}`);

    // Create a Payment Intent with transfer_data for split payments
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmountCharged * 100), // Amount in cents
      currency: giftCard.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: 'manual', // Requires explicit confirmation
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/purchase-success`, // URL to redirect after payment completion
      application_fee_amount: Math.round((customerFee + platformFeeFromBusiness) * 100), // Total fee to platform
      transfer_data: {
        destination: business.stripe_account_id,
      },
      on_behalf_of: business.stripe_account_id, // Required for destination charges with US connected accounts
      metadata: {
        giftCardId: giftCard.id,
        businessId: business.id,
        customerId: customerId,
        recipientEmail,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      logger.error(`Stripe Payment Intent failed for gift card ${giftCard.id}: ${paymentIntent.status}`);
      // If payment fails, mark the generated gift card as failed or delete it
      await db('gift_cards').where({ id: giftCard.id }).update({ status: 'failed', updated_at: db.fn.now() });
      return res.status(400).json({ message: 'Payment failed', status: paymentIntent.status });
    }

    // Update gift card status and associate with purchaser
    await db('gift_cards')
      .where({ id: giftCard.id })
      .update({
        status: 'purchased',
        purchased_by_user_id: customerId,
        purchased_at: db.fn.now(),
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

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(giftCard.unique_code);

    // Send email to recipient
    const emailHtml = `
      <h1>Your Gifty Gift Card!</h1>
      <p>Congratulations! You've received a gift card from ${business.name}.</p>
      <p>Value: ${giftCard.value} ${giftCard.currency}</p>
      <p>Unique Code: <strong>${giftCard.unique_code}</strong></p>
      ${personalMessage ? `<p>Personal Message: ${personalMessage}</p>` : ''}
      ${giftCard.expires_at ? `<p>Expires On: ${new Date(giftCard.expires_at).toLocaleDateString()}</p>` : ''}
      <p>Redeem this gift card at ${business.name}.</p>
      <p>Scan the QR code below to redeem:</p>
      <img src="${qrCodeDataUrl}" alt="QR Code" />
      <p>Terms and Conditions: ${business.terms_and_conditions || 'No specific terms and conditions provided.'}</p>
      <p>Thank you for using Gifty!</p>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `Your Gifty Gift Card from ${business.name}`,
      html: emailHtml,
      text: `You've received a gift card from ${business.name} worth ${giftCard.value} ${giftCard.currency}. Your unique code is ${giftCard.unique_code}.`
    });

    res.status(200).json({ message: 'Gift card purchased successfully', paymentIntentId: paymentIntent.id, giftCardUniqueCode: giftCard.unique_code });

  } catch (error) {
    logger.error(`Error processing gift card purchase: ${error.message}`);
    res.status(500).json({ message: 'Internal server error during purchase' });
  }
});

module.exports = router;
