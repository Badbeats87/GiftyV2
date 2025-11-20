/**
 * Copy this to your Wix backend: backend/events.js
 *
 * This automatically issues gift cards when someone completes a purchase
 */

import wixStores from 'wix-stores-backend';
import { issueGiftCards } from 'backend/supabase-api';

/**
 * Wix automatically calls this when an order is paid
 */
export function wixStores_onOrderPaid(event) {
  const order = event.order;

  console.log('Order paid:', order._id);

  // Check each item in the order
  const giftCardPromises = order.lineItems.map(async (item) => {

    // TODO: You need to identify which products are gift cards
    // Option 1: Check product name
    const isGiftCard = item.productName.toLowerCase().includes('gift card');

    // Option 2: Check a custom field you add to products
    // const isGiftCard = item.customTextFields?.isGiftCard === 'true';

    if (!isGiftCard) {
      return; // Skip non-gift-card items
    }

    // TODO: You need to map products to business IDs
    // You could:
    // 1. Store business ID in product custom field
    // 2. Use a mapping object
    // 3. Store it in product options/variants

    const businessId = getBusinessIdForProduct(item.productId);

    if (!businessId) {
      console.error('No business ID found for product:', item.productId);
      return;
    }

    try {
      // Issue the gift cards via Supabase
      const result = await issueGiftCards({
        businessId: businessId,
        amount: item.price,
        quantity: item.quantity,
        customerEmail: order.buyerInfo.email,
        customerName: `${order.buyerInfo.firstName || ''} ${order.buyerInfo.lastName || ''}`.trim(),
        orderId: order._id
      });

      console.log('Gift cards issued:', result.giftCards.length);

      // Supabase automatically sends the email
      // Cards are now in the database

      return result;

    } catch (error) {
      console.error('Failed to issue gift cards:', error);
      // TODO: Maybe send yourself an admin notification email here
    }
  });

  return Promise.all(giftCardPromises);
}

/**
 * Helper function to map Wix product IDs to Supabase business IDs
 *
 * TODO: Update this mapping with your actual data
 * You'll get business IDs from the Supabase Table Editor
 */
function getBusinessIdForProduct(productId) {
  // Option 1: Hard-coded mapping (simple but manual)
  const productToBusinessMap = {
    'wix-product-id-1': '123e4567-e89b-12d3-a456-426614174000', // Cafe La Ronda
    'wix-product-id-2': '123e4567-e89b-12d3-a456-426614174001', // Book Nook
    // Add more mappings here
  };

  return productToBusinessMap[productId];

  // Option 2: You could also query Supabase to find business by slug/name
  // Or store the business ID in Wix product custom fields
}

/**
 * Example: How to add custom field to Wix product
 *
 * 1. In Wix Editor, go to your product
 * 2. Click "Add Custom Text Field"
 * 3. Add a field called "businessId"
 * 4. Paste the UUID from Supabase
 * 5. Then access it like: item.customTextFields.businessId
 */
