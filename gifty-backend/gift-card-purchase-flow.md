# Gift Card Purchase Flow - Template Product Approach

## Architecture

Instead of creating separate products for each business, we use ONE template product with dynamic customization.

## Implementation Steps

### 1. Create Template Product (Manual - in Wix Dashboard)
- Product Name: "Gift Card"
- Product Type: Physical
- Base Price: $25
- Add custom text field: "Business & Amount Selection" (we'll use this to store the selection)

### 2. Create Custom Gift Card Purchase Page

Instead of using the standard Wix product page, create a custom page where:
- Display all approved businesses (fetched from Supabase)
- Show gift amount options
- When user clicks "Buy", add the template product to cart with custom fields

### 3. Hook Into Order Events

When an order is paid:
- Extract the business ID and amount from order line items
- Generate gift card code
- Store in Supabase
- Send email via existing Edge Function

## Files to Create

1. **Frontend Page** (`gift-card-page.js`) - Custom purchase page
2. **Backend Handler** (`backend/orders.jsw`) - Process orders when paid
3. **Wix HTTP Function** (`http-functions.js`) - Webhook for order events

## Database Schema (Already have this)

```sql
-- gift_cards table
- id
- code (unique)
- business_id
- amount
- recipient_email
- sender_name
- message
- status (active/redeemed)
- created_at
```

## Flow

1. **Purchase**:
   - Customer visits custom page
   - Selects business from dropdown
   - Selects amount
   - Enters recipient email, message
   - Clicks "Buy" → Adds to cart with metadata
   - Completes checkout

2. **Order Paid Event**:
   - Wix fires `onOrderPaid` event
   - Our backend handler:
     - Extracts business_id and amount from order
     - Generates unique gift card code
     - Stores in Supabase
     - Calls email Edge Function
     - Returns success

3. **Redemption** (existing flow):
   - Recipient enters code on business dashboard
   - Business validates and marks as redeemed
