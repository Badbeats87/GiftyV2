/**
 * Copy this file to your Wix backend folder: backend/supabase-api.jsw
 *
 * This connects your Wix storefront to your Supabase backend
 */

import { fetch } from 'wix-fetch';

// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://kppdvozuesiycwdacqgf.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get this from Supabase dashboard

/**
 * Call this when a customer buys a gift card
 * Returns the generated gift card codes
 */
export async function issueGiftCards(options) {
  const {
    businessId,      // Which business this card is for
    amount,          // Dollar amount
    quantity = 1,    // How many cards
    customerEmail,   // Customer's email
    customerName,    // Customer's name
    orderId          // Wix order ID
  } = options;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/issue-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessId,
      amount,
      quantity,
      customerEmail,
      customerName,
      orderId,
      source: 'wix_stores'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to issue gift cards');
  }

  const data = await response.json();

  // data.giftCards = [{ code: 'GIFT-A1B2-C3D4', amount: 50, ... }]
  // Email is automatically sent by Supabase

  return data;
}

/**
 * Check if a gift card code is valid
 */
export async function validateGiftCard(code) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    const error = await response.json();
    return { valid: false, error: error.error };
  }

  return await response.json();
}

/**
 * Redeem a gift card (mark as used)
 */
export async function redeemGiftCard(code, options = {}) {
  const { redeemedBy, redemptionNotes } = options;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/redeem-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      redeemedBy,
      redemptionNotes
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to redeem gift card');
  }

  return await response.json();
}

/**
 * Get list of all active businesses
 * (for displaying on your product page)
 */
export async function getBusinesses() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/businesses?is_active=eq.true&select=*`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }

  return await response.json();
}
