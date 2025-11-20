# Wix Frontend Integration Guide

This guide shows you how to integrate your Wix website with the Supabase backend.

## Prerequisites

1. Supabase project created and configured
2. Environment variables set in Supabase dashboard
3. Edge Functions deployed
4. Your Supabase project URL and anon key

## Setup Steps

### 1. Store Supabase Credentials in Wix Secrets

In your Wix site:

1. Go to **Settings → Secrets Manager**
2. Add these secrets:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key

### 2. Create Backend API Module

Create a new backend file: `backend/supabase-api.jsw`

```javascript
import { fetch } from 'wix-fetch';

const SUPABASE_URL = 'YOUR_PROJECT_URL'; // Or load from secrets
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Or load from secrets

/**
 * Issue gift cards for a purchase
 */
export async function issueGiftCards(purchaseData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/issue-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(purchaseData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to issue gift cards');
  }

  return await response.json();
}

/**
 * Validate a gift card code
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
    throw new Error(error.error || 'Failed to validate gift card');
  }

  return await response.json();
}

/**
 * Redeem a gift card
 */
export async function redeemGiftCard(code, redemptionData = {}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/redeem-gift-card`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      ...redemptionData
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to redeem gift card');
  }

  return await response.json();
}

/**
 * Get all active businesses
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
```

### 3. Update Order Processing

Modify `backend/events.js` to call Supabase instead of Wix collections:

```javascript
import wixStores from 'wix-stores-backend';
import { issueGiftCards } from 'backend/supabase-api';

export function wixStores_onOrderPaid(event) {
  const order = event.order;

  // Process each line item
  const giftCardPromises = order.lineItems.map(async (item) => {
    // Check if this is a gift card product
    if (item.productName && item.productName.includes('Gift Card')) {

      // Extract business ID from product metadata or custom field
      const businessId = item.customTextFields?.businessId ||
                        item.productId; // You'll need to map this

      // Issue gift cards via Supabase
      try {
        const result = await issueGiftCards({
          businessId: businessId,
          amount: item.price,
          quantity: item.quantity,
          customerEmail: order.buyerInfo.email,
          customerName: `${order.buyerInfo.firstName} ${order.buyerInfo.lastName}`,
          orderId: order._id,
          lineItemId: item._id,
          source: 'wix_stores',
          metadata: {
            productId: item.productId,
            productName: item.productName
          }
        });

        console.log('Gift cards issued:', result);

        // Email is automatically sent by the backend
        return result;

      } catch (error) {
        console.error('Failed to issue gift cards:', error);
        // You might want to send an admin notification here
      }
    }
  });

  return Promise.all(giftCardPromises);
}
```

### 4. Customer Gift Card Lookup Page

Create a page for customers to check their gift cards.

**Page elements:**
- `#codeInput` - Text input for gift card code
- `#validateButton` - Button to validate
- `#resultBox` - Box to show results
- `#cardDetails` - Text elements for card info

**Page Code:**
```javascript
import { validateGiftCard } from 'backend/supabase-api';

$w.onReady(function () {
  $w('#validateButton').onClick(() => validateCard());
  $w('#codeInput').onKeyPress((event) => {
    if (event.key === 'Enter') {
      validateCard();
    }
  });

  $w('#resultBox').hide();
});

async function validateCard() {
  const code = $w('#codeInput').value.trim();

  if (!code) {
    $w('#resultBox').show();
    $w('#cardDetails').text = 'Please enter a gift card code';
    return;
  }

  try {
    $w('#validateButton').disable();
    $w('#validateButton').label = 'Checking...';

    const result = await validateGiftCard(code);

    if (result.valid) {
      const card = result.giftCard;

      $w('#cardDetails').html = `
        <h3>✓ Valid Gift Card</h3>
        <p><strong>Business:</strong> ${card.business.name}</p>
        <p><strong>Amount:</strong> $${card.amount.toFixed(2)} ${card.currency}</p>
        <p><strong>Balance:</strong> $${card.remainingBalance.toFixed(2)}</p>
        <p><strong>Status:</strong> ${card.status}</p>
        <p><strong>Expires:</strong> ${new Date(card.expiresAt).toLocaleDateString()}</p>
        ${card.business.description ? `<p>${card.business.description}</p>` : ''}
      `;

      $w('#resultBox').show();
    } else {
      $w('#cardDetails').text = 'Invalid or expired gift card';
      $w('#resultBox').show();
    }

  } catch (error) {
    console.error('Validation error:', error);
    $w('#cardDetails').text = `Error: ${error.message}`;
    $w('#resultBox').show();
  } finally {
    $w('#validateButton').enable();
    $w('#validateButton').label = 'Validate';
  }
}
```

### 5. Business Admin Redemption Page

Create an admin page (restricted to site owners) for redeeming gift cards.

**Page elements:**
- `#codeInput` - Text input
- `#lookupButton` - Button
- `#cardInfoBox` - Box showing card details
- `#redeemButton` - Button to redeem
- `#locationInput` - Text input for redemption location
- `#notesInput` - Text area for notes

**Page Code:**
```javascript
import { validateGiftCard, redeemGiftCard } from 'backend/supabase-api';

let currentCard = null;

$w.onReady(function () {
  $w('#lookupButton').onClick(() => lookupCard());
  $w('#redeemButton').onClick(() => redeemCard());
  $w('#cardInfoBox').hide();
});

async function lookupCard() {
  const code = $w('#codeInput').value.trim();

  if (!code) return;

  try {
    $w('#lookupButton').disable();
    const result = await validateGiftCard(code);

    if (result.valid) {
      currentCard = result.giftCard;

      // Display card info
      $w('#businessName').text = currentCard.business.name;
      $w('#cardAmount').text = `$${currentCard.amount.toFixed(2)}`;
      $w('#cardBalance').text = `$${currentCard.remainingBalance.toFixed(2)}`;
      $w('#cardStatus').text = currentCard.status;

      $w('#cardInfoBox').show();

      // Enable/disable redeem based on status
      if (currentCard.isRedeemed) {
        $w('#redeemButton').disable();
        $w('#redeemButton').label = 'Already Redeemed';
      } else {
        $w('#redeemButton').enable();
        $w('#redeemButton').label = 'Redeem Card';
      }
    } else {
      $w('#cardInfoBox').hide();
      // Show error message
    }
  } catch (error) {
    console.error('Lookup error:', error);
  } finally {
    $w('#lookupButton').enable();
  }
}

async function redeemCard() {
  if (!currentCard) return;

  const location = $w('#locationInput').value;
  const notes = $w('#notesInput').value;

  try {
    $w('#redeemButton').disable();

    const result = await redeemGiftCard(currentCard.code, {
      redeemedBy: location,
      redemptionNotes: notes
    });

    if (result.success) {
      // Show success message
      $w('#statusText').text = `Successfully redeemed $${result.redemption.redeemedAmount}`;

      // Refresh card info
      await lookupCard();
    }
  } catch (error) {
    console.error('Redemption error:', error);
    $w('#statusText').text = `Error: ${error.message}`;
  } finally {
    $w('#redeemButton').enable();
  }
}
```

### 6. Display Businesses on Product Page

Show available businesses dynamically:

```javascript
import { getBusinesses } from 'backend/supabase-api';

$w.onReady(async function () {
  try {
    const businesses = await getBusinesses();

    // Populate a repeater or dropdown
    $w('#businessesRepeater').data = businesses;

    $w('#businessesRepeater').onItemReady(($item, itemData) => {
      $item('#businessName').text = itemData.name;
      $item('#businessDescription').text = itemData.description;
      if (itemData.logo_url) {
        $item('#businessLogo').src = itemData.logo_url;
      }
    });
  } catch (error) {
    console.error('Failed to load businesses:', error);
  }
});
```

## Testing Checklist

- [ ] Customer can purchase gift card from Wix store
- [ ] Gift cards are issued in Supabase after payment
- [ ] Customer receives email with gift card codes
- [ ] Customer can validate gift card on lookup page
- [ ] Admin can redeem gift cards on admin page
- [ ] Activity log records all operations
- [ ] Expired cards are rejected
- [ ] Already redeemed cards cannot be redeemed again

## Troubleshooting

**Gift cards not issuing after purchase:**
- Check that `wixStores_onOrderPaid` event is firing
- Verify Supabase credentials are correct
- Check browser/backend logs for errors

**Email not sending:**
- Verify `RESEND_API_KEY` is set in Supabase
- Check spam folder
- Review Edge Function logs in Supabase dashboard

**Validation failing:**
- Ensure code is entered exactly (case-insensitive)
- Check RLS policies allow public reads on gift_cards table
- Verify card exists in database

## Next Steps

1. Set up Stripe checkout integration
2. Configure email templates
3. Add business partner portal
4. Implement analytics dashboard
5. Set up backup and monitoring
