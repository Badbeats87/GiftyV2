/**
 * Copy this to a Wix page for customers to check their gift cards
 *
 * Page name: "Check Gift Card" or similar
 *
 * Required page elements:
 * - #codeInput (Text Input)
 * - #checkButton (Button)
 * - #resultBox (Box)
 * - #cardInfo (Text - for displaying card details)
 */

import { validateGiftCard } from 'backend/supabase-api';

$w.onReady(function () {
  // Initially hide the results
  $w('#resultBox').hide();

  // Check card when button clicked
  $w('#checkButton').onClick(() => checkCard());

  // Also check when user presses Enter
  $w('#codeInput').onKeyPress((event) => {
    if (event.key === 'Enter') {
      checkCard();
    }
  });
});

async function checkCard() {
  const code = $w('#codeInput').value.trim();

  if (!code) {
    showError('Please enter a gift card code');
    return;
  }

  try {
    // Disable button while checking
    $w('#checkButton').disable();
    $w('#checkButton').label = 'Checking...';

    // Call Supabase backend
    const result = await validateGiftCard(code);

    if (result.valid) {
      // Valid card - show details
      const card = result.giftCard;

      $w('#cardInfo').html = `
        <h3 style="color: green;">✓ Valid Gift Card</h3>
        <div style="background: #f0f0f0; padding: 20px; margin: 10px 0; border-radius: 8px;">
          <p style="font-size: 24px; font-weight: bold;">${card.code}</p>
        </div>
        <p><strong>Business:</strong> ${card.business.name}</p>
        <p><strong>Value:</strong> $${card.amount.toFixed(2)}</p>
        <p><strong>Balance:</strong> $${card.remainingBalance.toFixed(2)}</p>
        <p><strong>Expires:</strong> ${new Date(card.expiresAt).toLocaleDateString()}</p>
        ${card.business.description ? `<p style="color: #666;">${card.business.description}</p>` : ''}
      `;

      $w('#resultBox').show();

    } else {
      // Invalid card
      showError(result.error || 'Invalid or expired gift card');
    }

  } catch (error) {
    console.error('Error validating gift card:', error);
    showError('Error checking gift card. Please try again.');

  } finally {
    // Re-enable button
    $w('#checkButton').enable();
    $w('#checkButton').label = 'Check Card';
  }
}

function showError(message) {
  $w('#cardInfo').html = `<p style="color: red;">${message}</p>`;
  $w('#resultBox').show();
}
