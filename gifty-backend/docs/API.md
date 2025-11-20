# Gift Card API Documentation

Base URL: `https://your-project.supabase.co/functions/v1`

All requests require the `Authorization` header with your Supabase anon key:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## Endpoints

### 1. Issue Gift Card

Create new gift card(s) for a purchase.

**Endpoint:** `POST /issue-gift-card`

**Request Body:**
```json
{
  "businessId": "uuid",
  "amount": 50.00,
  "currency": "USD",
  "quantity": 2,
  "customerEmail": "customer@example.com",
  "customerName": "Jane Doe",
  "orderId": "order_123",
  "lineItemId": "item_456",
  "source": "stripe",
  "expiresInDays": 365,
  "metadata": {
    "customField": "value"
  }
}
```

**Required Fields:**
- `businessId` - UUID of the business
- `amount` - Gift card value (number)
- `customerEmail` - Customer's email address

**Optional Fields:**
- `currency` - ISO currency code (default: "USD")
- `quantity` - Number of cards to generate (default: 1)
- `customerName` - Customer's full name
- `orderId` - External order identifier
- `lineItemId` - Specific product line item
- `source` - Purchase source (default: "manual")
- `expiresInDays` - Days until expiration (default: 365)
- `metadata` - Additional custom data

**Response (201):**
```json
{
  "success": true,
  "giftCards": [
    {
      "id": "uuid",
      "code": "GIFT-A1B2-C3D4",
      "amount": 50.00,
      "currency": "USD",
      "businessName": "Cafe La Ronda",
      "expiresAt": "2026-01-18T12:00:00Z"
    }
  ],
  "customer": {
    "id": "uuid",
    "email": "customer@example.com",
    "name": "Jane Doe"
  }
}
```

**Errors:**
- `400` - Missing required fields
- `404` - Business not found
- `500` - Server error

---

### 2. Validate Gift Card

Check if a gift card is valid and retrieve its details.

**Endpoint:** `POST /validate-gift-card`

**Request Body:**
```json
{
  "code": "GIFT-A1B2-C3D4"
}
```

**Response (200):**
```json
{
  "valid": true,
  "giftCard": {
    "id": "uuid",
    "code": "GIFT-A1B2-C3D4",
    "amount": 50.00,
    "remainingBalance": 50.00,
    "currency": "USD",
    "status": "issued",
    "issuedAt": "2025-01-18T12:00:00Z",
    "expiresAt": "2026-01-18T12:00:00Z",
    "redeemedAt": null,
    "business": {
      "id": "uuid",
      "name": "Cafe La Ronda",
      "slug": "cafe-la-ronda",
      "description": "Cozy coffee shop",
      "logo_url": "https://..."
    },
    "isExpired": false,
    "isRedeemed": false
  }
}
```

**Invalid Card Response (404):**
```json
{
  "valid": false,
  "error": "Gift card not found"
}
```

**Errors:**
- `400` - Missing code
- `404` - Card not found

---

### 3. Redeem Gift Card

Mark a gift card as redeemed (full or partial).

**Endpoint:** `POST /redeem-gift-card`

**Request Body:**
```json
{
  "code": "GIFT-A1B2-C3D4",
  "redeemedBy": "Cafe La Ronda - Main St",
  "redemptionNotes": "Used for coffee and pastry",
  "partialAmount": 25.00
}
```

**Required Fields:**
- `code` - Gift card code

**Optional Fields:**
- `redeemedBy` - Who/where it was redeemed
- `redemptionNotes` - Additional notes
- `partialAmount` - Partial redemption amount (if not provided, redeems full balance)

**Response (200):**
```json
{
  "success": true,
  "redemption": {
    "code": "GIFT-A1B2-C3D4",
    "redeemedAmount": 25.00,
    "remainingBalance": 25.00,
    "fullyRedeemed": false,
    "business": "Cafe La Ronda",
    "redeemedAt": "2025-01-18T14:30:00Z"
  }
}
```

**Errors:**
- `400` - Missing code, card expired, or already fully redeemed
- `404` - Card not found
- `500` - Server error

---

### 4. Payment Webhook

Handle payment provider webhooks (Stripe).

**Endpoint:** `POST /payment-webhook`

**Headers:**
```
stripe-signature: t=timestamp,v1=signature
```

This endpoint is called automatically by Stripe. Configure it in your Stripe dashboard:
```
https://your-project.supabase.co/functions/v1/payment-webhook
```

**Events Handled:**
- `checkout.session.completed` - Issues gift cards and sends email
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Logs failed payment

**Required Metadata in Stripe Checkout Session:**
```json
{
  "businessId": "uuid-of-business",
  "amount": "50.00",
  "quantity": "2"
}
```

---

### 5. Send Gift Card Email

Send gift card codes to customer via email.

**Endpoint:** `POST /send-gift-card-email`

**Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "Jane Doe",
  "orderId": "order_123",
  "giftCards": [
    {
      "code": "GIFT-A1B2-C3D4",
      "amount": 50.00,
      "currency": "USD",
      "businessName": "Cafe La Ronda",
      "expiresAt": "2026-01-18T12:00:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "emailId": "resend-email-id",
  "sentTo": "customer@example.com",
  "cardCount": 1
}
```

**Errors:**
- `400` - Missing required fields
- `500` - Email service not configured or send failed

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Description of what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `404` - Resource not found
- `500` - Internal server error

---

## Database Direct Access

You can also query the database directly using the Supabase client (requires proper RLS policies):

### Get All Businesses
```javascript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('is_active', true);
```

### Get Customer's Gift Cards
```javascript
const { data, error } = await supabase
  .from('gift_cards')
  .select(`
    *,
    business:businesses(name, slug),
    activity:gift_card_activity(*)
  `)
  .eq('customer_id', customerId)
  .order('created_at', { ascending: false });
```

### Get Gift Card Activity Log
```javascript
const { data, error } = await supabase
  .from('gift_card_activity')
  .select('*')
  .eq('code', 'GIFT-A1B2-C3D4')
  .order('created_at', { ascending: false });
```

---

## Rate Limits

Supabase free tier includes:
- Unlimited Edge Function invocations
- 2 requests per second per function (soft limit)
- 1GB egress bandwidth per month

For production, consider upgrading to Pro tier for higher limits.

---

## Testing

Use these curl commands to test endpoints locally or in production:

### Test Issue
```bash
curl -X POST https://your-project.supabase.co/functions/v1/issue-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "uuid",
    "amount": 50,
    "customerEmail": "test@example.com"
  }'
```

### Test Validate
```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code": "GIFT-A1B2-C3D4"}'
```

### Test Redeem
```bash
curl -X POST https://your-project.supabase.co/functions/v1/redeem-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GIFT-A1B2-C3D4",
    "redeemedBy": "Test Location"
  }'
```
