/**
 * DROP-IN REPLACEMENT for giftysv/src/backend/gift-card-service.js
 *
 * This replaces all Wix Data calls with Supabase API calls.
 * Same function signatures, same behavior - just uses Supabase instead of Wix Data.
 *
 * SETUP:
 * 1. Replace your existing src/backend/gift-card-service.js with this file
 * 2. Add SUPABASE_URL and SUPABASE_ANON_KEY to Wix Secrets Manager
 * 3. Remove the Wix Data Collections (GiftCards, GiftCardActivity) - not needed anymore
 * 4. Keep everything else the same
 */

import { fetch } from 'wix-fetch';
import { orders as storeOrders } from 'wix-stores-backend';
import { getSecret } from 'wix-secrets-backend';
import { triggeredEmails, contacts } from 'wix-crm-backend';

// Load Supabase credentials from Wix Secrets
let SUPABASE_URL, SUPABASE_ANON_KEY;

async function getSupabaseConfig() {
  if (!SUPABASE_URL) {
    SUPABASE_URL = await getSecret('SUPABASE_URL');
  }
  if (!SUPABASE_ANON_KEY) {
    SUPABASE_ANON_KEY = await getSecret('SUPABASE_ANON_KEY');
  }
  return { SUPABASE_URL, SUPABASE_ANON_KEY };
}

// Product to Business mapping - maps Wix product IDs to Supabase business UUIDs
const SUPABASE_BUSINESS_IDS = {
  pasquale: 'cc6708e2-ff81-4ca9-a329-2287313970b4',
  losNaranjos: '35acdb65-2cba-4ee8-8fe1-baf73ae07ae5',
  ilBuongustaio: 'f825bb6e-433e-41b5-9d77-9987d67ae979'
};

const PRODUCT_TO_BUSINESS_MAP = {
  // Pasquale
  'Product_95c8f784-799c-4f33-b820-17b726a65296': SUPABASE_BUSINESS_IDS.pasquale,
  '99684dfe-d36a-4869-858a-dba67af9b993': SUPABASE_BUSINESS_IDS.pasquale,

  // Los Naranjos Town Houses
  'Product_1515c6dc-51be-487d-b83c-73fb3639e7d6': SUPABASE_BUSINESS_IDS.losNaranjos,
  'fedfcb20-1ad2-405b-950b-e65112bb6222': SUPABASE_BUSINESS_IDS.losNaranjos,

  // Il Buongustaio
  'Product_6e9cc3cb-037d-4842-81c9-95ddb3ed6211': SUPABASE_BUSINESS_IDS.ilBuongustaio,
  'b9f385ae-ba54-40d4-aeff-4c0335b2166a': SUPABASE_BUSINESS_IDS.ilBuongustaio
};

function getBusinessIdForProduct(wixProductId) {
  return PRODUCT_TO_BUSINESS_MAP[wixProductId] || wixProductId;
}

/**
 * Handles the Wix Stores onOrderPaid event - SAME AS BEFORE
 */
export async function handleOrderPaid(event) {
  const normalizedEvent = normalizeEventPayload(event);
  const order = await resolveOrder(normalizedEvent);
  if (!order) {
    console.warn('handleOrderPaid called without an order payload', normalizedEvent);
    return;
  }

  const alreadyIssued = await hasExistingGiftCards(order._id);
  if (alreadyIssued) {
    console.warn(`Gift cards already exist for order ${order._id}; skipping.`);
    return;
  }

  const issuedCards = await issueCardsForOrder(order);
  if (!issuedCards.length) {
    console.warn(`No gift cards created for order ${order._id}`);
    return;
  }

  console.log(`✅ Issued ${issuedCards.length} gift cards for order ${order._id}`);

  // Send gift card email via Wix Triggered Emails
  const buyerEmail = order.buyerInfo?.email || order.billingInfo?.email;
  const buyerName = buildBuyerName(order.buyerInfo);

  if (buyerEmail && issuedCards.length > 0) {
    await sendGiftCardEmail(issuedCards, buyerEmail, buyerName);
  } else {
    console.warn('📧 No buyer email found or no cards issued, skipping email');
  }
}

// All the normalize functions stay exactly the same
function normalizeEventPayload(event) {
  if (!event) return null;
  if (typeof event === 'string') {
    try {
      return JSON.parse(event);
    } catch (error) {
      console.error('Failed to parse order event payload', { event, error: error?.message || error });
      return null;
    }
  }
  return event;
}

async function resolveOrder(event) {
  if (!event) return null;

  if (event.lineItems && event._id) {
    return normalizeOrder(event);
  }

  const inlineOrder = event.order || event.payload?.order;
  if (inlineOrder && inlineOrder._id) {
    return normalizeOrder(inlineOrder);
  }

  const orderId = inlineOrder?._id || event.orderId || event._id;
  if (!orderId) return null;

  if (storeOrders && typeof storeOrders.getOrder === 'function') {
    try {
      const order = await storeOrders.getOrder(orderId);
      return normalizeOrder(order);
    } catch (error) {
      console.error('Failed to fetch order details from storeOrders.getOrder', {
        orderId,
        error: error?.message || error
      });
    }
  }

  console.warn('Unable to resolve order payload', { event });
  return null;
}

function normalizeOrder(order) {
  if (!order) return null;

  const lineItems = order.lineItems || order.lineItemsV2 || [];
  if (Array.isArray(lineItems)) {
    order.lineItems = lineItems.map((lineItem) => ({
      _id: lineItem._id || lineItem.id || lineItem.lineItemId,
      id: lineItem.id || lineItem._id,
      name: lineItem.name || lineItem.translatedName,
      quantity: lineItem.quantity,
      priceData: lineItem.priceData || {
        price: lineItem.price,
        totalPrice: lineItem.totalPrice
      },
      catalogReference: lineItem.catalogReference || {
        id: lineItem.productId,
        name: lineItem.name
      },
      ...lineItem
    }));
  }

  return order;
}

/**
 * CREATE MANUAL GIFT CARD - Now calls Supabase
 */
export async function createManualGiftCard({
  businessName,
  businessId,
  amount,
  currency = 'USD',
  customerEmail,
  customerName,
  notes,
  sendEmail = true
}) {
  if (!businessName || !amount || !customerEmail) {
    throw new Error('businessName, amount, and customerEmail are required');
  }

  const sanitizedAmount = Number(amount);
  if (Number.isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const config = await getSupabaseConfig();

  // Call Supabase issue-gift-card endpoint
  const response = await fetch(`${config.SUPABASE_URL}/functions/v1/issue-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessId: businessId || businessName, // Use name as fallback
      amount: sanitizedAmount,
      currency,
      quantity: 1,
      customerEmail,
      customerName,
      source: 'manual',
      metadata: { notes }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create gift card');
  }

  const data = await response.json();
  const card = data.giftCards[0];

  // Convert Supabase format to Wix format for compatibility
  return {
    _id: card.id,
    code: card.code,
    businessName: card.businessName || businessName,
    businessId: businessId,
    amount: card.amount,
    currency: card.currency,
    status: 'issued',
    customerEmail,
    customerName,
    orderId: null,
    lineItemId: null,
    source: 'manual',
    issuedAt: new Date(card.expiresAt), // Use current time
    notes
  };
}

/**
 * FIND GIFT CARD BY CODE - Now queries Supabase
 */
export async function findGiftCardByCode(code) {
  const normalizedCode = normalizeGiftCardCode(code);
  if (!normalizedCode) return null;

  const config = await getSupabaseConfig();

  // Call Supabase validate endpoint
  const response = await fetch(`${config.SUPABASE_URL}/functions/v1/validate-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code: normalizedCode })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data.valid) return null;

  const card = data.giftCard;

  // Convert Supabase format to Wix format
  return {
    _id: card.id,
    code: card.code,
    businessName: card.business?.name || 'Unknown',
    businessId: card.business?.id,
    amount: card.amount,
    currency: card.currency,
    status: card.status,
    customerEmail: card.customer?.email,
    customerName: card.customer?.name,
    orderId: card.order_id,
    lineItemId: card.line_item_id,
    source: card.purchase_source,
    issuedAt: card.issuedAt ? new Date(card.issuedAt) : null,
    sentAt: card.sentAt ? new Date(card.sentAt) : null,
    redeemedAt: card.redeemedAt ? new Date(card.redeemedAt) : null,
    redeemedBy: card.redeemedBy,
    redemptionNotes: card.redemptionNotes,
    notes: card.notes
  };
}

/**
 * REDEEM GIFT CARD - Now calls Supabase
 */
export async function redeemGiftCardByCode(code, { redeemedBy, redemptionNotes } = {}) {
  const record = await findGiftCardByCode(code);
  if (!record) {
    throw new Error('Gift card not found');
  }

  if (record.status === 'redeemed') {
    throw new Error('Gift card already redeemed');
  }

  const config = await getSupabaseConfig();

  // Call Supabase redeem endpoint
  const response = await fetch(`${config.SUPABASE_URL}/functions/v1/redeem-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      redeemedBy: redeemedBy || 'admin',
      redemptionNotes
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to redeem gift card');
  }

  // Fetch updated record
  return await findGiftCardByCode(code);
}

/**
 * GET ACTIVITY - Queries Supabase activity log
 */
export async function getGiftCardActivityByCode(code, { limit = 25 } = {}) {
  const normalizedCode = normalizeGiftCardCode(code);
  if (!normalizedCode) return [];

  const config = await getSupabaseConfig();

  try {
    // Query Supabase REST API directly
    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/gift_card_activity?code=eq.${normalizedCode}&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          'apikey': config.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return [];

    const activities = await response.json();

    // Convert to Wix format
    return activities.map(activity => ({
      _id: activity.id,
      code: activity.code,
      type: activity.type,
      message: activity.message,
      metadata: activity.metadata,
      createdAt: new Date(activity.created_at)
    }));

  } catch (error) {
    console.error('Failed to fetch gift card activity', { code: normalizedCode, error });
    return [];
  }
}

export async function recordGiftCardActivityEntry({ code, type, message, metadata }) {
  // Activity is automatically logged by Supabase Edge Functions
  // This function is kept for compatibility but doesn't need to do anything
  console.log('Activity logged by Supabase:', { code, type, message });
  return null;
}

/**
 * CHECK IF ORDER ALREADY HAS GIFT CARDS - Queries Supabase
 */
async function hasExistingGiftCards(orderId) {
  if (!orderId) return false;

  const config = await getSupabaseConfig();

  try {
    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/gift_cards?order_id=eq.${orderId}&select=id&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          'apikey': config.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return false;

    const cards = await response.json();
    return cards.length > 0;

  } catch (error) {
    console.error('Error checking existing gift cards', error);
    return false;
  }
}

/**
 * ISSUE CARDS FOR ORDER - Now calls Supabase for each line item
 */
async function issueCardsForOrder(order) {
  const lineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
  if (!lineItems.length) return [];

  const buyerEmail = order.buyerInfo?.email || order.billingInfo?.email;
  const buyerName = buildBuyerName(order.buyerInfo);

  const config = await getSupabaseConfig();
  const issued = [];

  // Process each line item
  for (const lineItem of lineItems) {
    const unitCount = Math.max(1, Number(lineItem.quantity) || 1);
    const businessName = lineItem.name || lineItem.catalogReference?.name;
    const wixProductId = lineItem.catalogReference?.id || lineItem.productId;
    const businessId = getBusinessIdForProduct(wixProductId);
    const currency =
      lineItem.priceData?.price?.currency ||
      lineItem.priceData?.totalPrice?.currency ||
      order.currency ||
      'USD';
    const unitAmount = resolveUnitAmount(lineItem);

    // Log what we're about to send
    const requestPayload = {
      businessId: businessId || businessName,
      amount: unitAmount,
      currency,
      quantity: unitCount,
      customerEmail: buyerEmail,
      customerName: buyerName,
      orderId: order._id,
      lineItemId: lineItem._id || lineItem.id,
      source: 'wix_stores',
      metadata: {
        businessName,
        productId: businessId
      }
    };
    console.log('📤 Sending to Supabase:', JSON.stringify(requestPayload, null, 2));

    // Call Supabase to issue all cards for this line item at once
    const response = await fetch(`${config.SUPABASE_URL}/functions/v1/issue-gift-card`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    console.log('📥 Supabase Response Status:', response.status);

    if (response.ok) {
      const data = await response.json();

      // Log debug info to see if email is being sent
      if (data.debug) {
        console.log('📧 Supabase Email Debug Info:', data.debug);
      }

      // Convert to Wix format
      const cards = data.giftCards.map(card => ({
        _id: card.id,
        code: card.code,
        businessName: card.businessName || businessName,
        businessId,
        amount: card.amount,
        currency: card.currency,
        customerEmail: buyerEmail,
        customerName: buyerName,
        orderId: order._id,
        lineItemId: lineItem._id || lineItem.id,
        source: 'order',
        issuedAt: new Date()
      }));
      issued.push(...cards);
    } else {
      console.error('❌ ===== SUPABASE ERROR ===== ');
      console.error('❌ Status Code:', response.status);
      try {
        const errorText = await response.text();
        console.error('❌ Error Response:', errorText);
      } catch (e) {
        console.error('❌ Could not read error response:', e);
      }
      console.error('❌ Request Details:', {
        url: `${config.SUPABASE_URL}/functions/v1/issue-gift-card`,
        businessId,
        lineItemId: lineItem._id || lineItem.id,
        amount: unitAmount
      });
    }
  }

  return issued;
}

// All helper functions stay the same
function resolveUnitAmount(lineItem) {
  const optionAmount = extractGiftAmount(lineItem);
  if (optionAmount !== null) return optionAmount;

  const total = extractPriceValue(lineItem.priceData?.totalPrice);
  const qty = Math.max(1, Number(lineItem.quantity) || 1);
  if (typeof total === 'number' && !Number.isNaN(total)) {
    return Number((total / qty).toFixed(2));
  }

  const price = extractPriceValue(lineItem.priceData?.price);
  if (typeof price === 'number' && !Number.isNaN(price)) {
    return Number(price.toFixed(2));
  }

  return 0;
}

function extractGiftAmount(lineItem) {
  const options = Array.isArray(lineItem.options) ? lineItem.options : [];
  for (const option of options) {
    const optionName = (option.option || option.name || '').toLowerCase();
    if (!optionName.includes('gift') || !optionName.includes('amount')) {
      continue;
    }

    const selection = option.selection || option.value || option.label;
    if (!selection) continue;

    const numeric = Number(selection.toString().replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(numeric) && numeric > 0) {
      return Number(numeric.toFixed(2));
    }
  }

  return null;
}

function extractPriceValue(value) {
  if (typeof value === 'number') return value;

  if (value && typeof value === 'object') {
    if (typeof value.amount === 'number') return value.amount;
    if (typeof value.value === 'number') return value.value;
  }

  return null;
}

function buildBuyerName(buyerInfo = {}) {
  const parts = [buyerInfo.firstName, buyerInfo.lastName].filter(Boolean);
  return parts.join(' ').trim();
}

function generateGiftCardCode(businessName) {
  // Not used anymore - Supabase generates codes
  // Kept for compatibility
  const prefix = (businessName || 'GIF')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X');
  const random = Math.random().toString(36).toUpperCase().slice(-6);
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${timestamp}${random}`;
}

function normalizeGiftCardCode(code) {
  if (!code && code !== 0) return '';

  const alphanumeric = code
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!alphanumeric) return '';

  if (alphanumeric.length > 4) {
    return `${alphanumeric.slice(0, 4)}-${alphanumeric.slice(4)}`;
  }

  return alphanumeric;
}

/**
 * Send gift card email via Wix Triggered Emails
 */
async function sendGiftCardEmail(giftCards, customerEmail, customerName) {
  if (!giftCards || giftCards.length === 0) {
    console.error('No gift cards to send');
    return;
  }

  const firstCard = giftCards[0];
  const businessName = firstCard.businessName || 'our business';

  try {
    // Look up contact by email to get their UUID
    console.log(`📧 Looking up contact by email: ${customerEmail}`);
    const queryResult = await contacts.queryContacts()
      .eq('primaryInfo.email', customerEmail)
      .find();

    let contactId;
    if (queryResult.items.length > 0) {
      // Contact exists, use their ID
      contactId = queryResult.items[0]._id;
      console.log(`✅ Found existing contact: ${contactId}`);
    } else {
      // Contact doesn't exist, create one
      console.log(`📝 Creating new contact for ${customerEmail}`);
      const newContact = await contacts.createContact({
        primaryInfo: {
          email: customerEmail,
          name: customerName
        }
      });
      contactId = newContact._id;
      console.log(`✅ Created new contact: ${contactId}`);
    }

    // Build simple text variables for Wix email template
    const purchaseMessage = giftCards.length > 1
      ? `${giftCards.length} gift cards`
      : 'a gift card';

    // Format gift cards as simple text
    const giftCardDetails = giftCards.map((card, index) => {
      const expiryDate = card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'Never';
      const cardNumber = giftCards.length > 1 ? `Gift Card ${index + 1}:\n` : '';
      return `${cardNumber}Code: ${card.code}\nAmount: $${card.amount} ${card.currency}\nExpires: ${expiryDate}`;
    }).join('\n\n');

    // Send via Wix triggered email using contact UUID
    await triggeredEmails.emailContact('V2jqQ2V', contactId, {
      variables: {
        customerName: customerName || 'Customer',
        businessName: businessName,
        purchaseMessage: purchaseMessage,
        giftCardDetails: giftCardDetails
      }
    });

    console.log(`✅ Gift card email sent to ${customerEmail} (contact: ${contactId})`);
  } catch (emailError) {
    console.error(`❌ Failed to send gift card email:`, emailError);
    // Don't fail the whole process if email fails
  }
}
