# Migration Guide: Velo → Supabase

How to replace your existing Wix/Velo backend with Supabase **without changing your frontend or products**.

## What You Have Now (Velo)

```
giftysv/src/backend/
├── events.js                  ← Hooks into wixStores_onOrderPaid
├── gift-card-service.js       ← Core logic (uses wixData)
└── gift-cards.jsw             ← Public API for admin pages

Wix Data Collections:
├── GiftCards                  ← Stores all gift cards
└── GiftCardActivity          ← Activity log
```

## What Changes

✅ **Stays the same:**
- Your Wix website design
- Your product catalog
- Your checkout flow
- The admin pages
- `events.js` (still hooks into wixStores_onOrderPaid)
- `gift-cards.jsw` (same API surface)

🔄 **Gets replaced:**
- `gift-card-service.js` → New version that calls Supabase
- Wix Data Collections → Supabase PostgreSQL database

## Step-by-Step Migration

### 1. Set Up Supabase (if you haven't already)

```bash
cd gifty-backend
supabase db push                    # Create the database
supabase functions deploy           # Deploy Edge Functions
```

### 2. Add Supabase Credentials to Wix

In your Wix site:

1. Go to **Settings → Secrets Manager**
2. Add these secrets:
   ```
   SUPABASE_URL = https://kppdvozuesiycwdacqgf.supabase.co
   SUPABASE_ANON_KEY = your-anon-key-here
   ```
3. Get your anon key from Supabase Dashboard → Project Settings → API

### 3. Map Your Products to Businesses

You need to tell the system which Wix products correspond to which businesses in Supabase.

**Option A: Use Product IDs (easiest)**

1. In Supabase dashboard, go to **Table Editor → businesses**
2. Look at the sample businesses (or add your own)
3. Copy each business's UUID `id`
4. In Wix, for each gift card product, note its product ID
5. The system will automatically use the product name to match businesses

**Option B: Add Custom Fields (more explicit)**

1. In Wix Editor, edit each gift card product
2. Add a custom field called `businessId`
3. Paste the UUID from Supabase
4. Update `wix-supabase-gift-card-service.js` to read this field

### 4. Update Your Wix Backend Code

**Replace** `giftysv/src/backend/gift-card-service.js` with the new version:

1. Open `gifty-backend/wix-supabase-gift-card-service.js`
2. Copy the entire file
3. Replace the contents of `giftysv/src/backend/gift-card-service.js`
4. Push to Wix (or test locally with `wix dev`)

**Keep everything else the same:**
- `events.js` - No changes needed
- `gift-cards.jsw` - No changes needed
- Page code - No changes needed

### 5. Set Up Email

Supabase sends emails automatically. Configure in Supabase:

1. Sign up for Resend.com (free)
2. Get API key
3. In Supabase Dashboard → Project Settings → Edge Functions
4. Add secret:
   ```
   RESEND_API_KEY = re_your_key
   FROM_EMAIL = noreply@yourdomain.com
   ```

### 6. Test It

1. **Local test** (optional):
   ```bash
   cd giftysv
   wix dev
   ```

2. **Make a test purchase** on your Wix site

3. **Check Supabase**:
   - Go to Table Editor → gift_cards
   - Your test card should appear

4. **Check email**:
   - Customer should receive email with code

5. **Test admin page**:
   - Go to your Business Admin page
   - Try looking up the gift card code
   - Try redeeming it

## What Happens Behind the Scenes

### Old Flow (Velo)
```
Order paid
  → events.js
    → gift-card-service.js
      → wixData.insert('GiftCards')
      → triggeredEmails.emailContact()
```

### New Flow (Supabase)
```
Order paid
  → events.js
    → gift-card-service.js
      → fetch(Supabase /issue-gift-card)
        → Supabase creates record
        → Supabase sends email automatically
```

## Rollback Plan

If something goes wrong, you can rollback instantly:

1. In Wix Code, undo the changes to `gift-card-service.js`
2. Or restore from your Git history
3. The old Wix Data Collections still exist, so everything will work

## Business ID Mapping Strategy

Your existing products probably use product names like:
- "Cafe La Ronda Gift Card"
- "Book Nook Gift Card"
- etc.

The new service automatically handles this:

```javascript
// In issueCardsForOrder():
const businessId = lineItem.catalogReference?.id || lineItem.productId;
const businessName = lineItem.name || lineItem.catalogReference?.name;

// Calls Supabase with:
{
  businessId: "wix-product-id-123",  // Wix product ID
  metadata: {
    businessName: "Cafe La Ronda Gift Card"  // Product name
  }
}
```

**You have two options:**

### Option 1: Map in Supabase (Recommended)

Store the Wix product IDs in Supabase:

1. In Supabase, add a column to `businesses` table:
   ```sql
   ALTER TABLE businesses ADD COLUMN wix_product_id TEXT;
   ```

2. Update each business with its Wix product ID:
   ```sql
   UPDATE businesses
   SET wix_product_id = 'wix-product-123'
   WHERE slug = 'cafe-la-ronda';
   ```

3. Modify the Edge Function to look up by `wix_product_id` instead of UUID

### Option 2: Map in Wix Code (Simpler)

Add a mapping object to `gift-card-service.js`:

```javascript
// At the top of the file
const PRODUCT_TO_BUSINESS_MAP = {
  'wix-product-id-1': 'uuid-of-cafe-la-ronda',
  'wix-product-id-2': 'uuid-of-book-nook',
  // ... etc
};

// In issueCardsForOrder():
const businessId = PRODUCT_TO_BUSINESS_MAP[lineItem.productId] || lineItem.productId;
```

## Troubleshooting

### Gift cards not creating after purchase

1. Check Wix logs in the Editor (Console)
2. Check Supabase Edge Function logs (Dashboard → Edge Functions → Logs)
3. Verify secrets are set correctly
4. Test the endpoint directly:

```bash
curl -X POST https://kppdvozuesiycwdacqgf.supabase.co/functions/v1/issue-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "test",
    "amount": 25,
    "customerEmail": "test@example.com",
    "quantity": 1
  }'
```

### Email not sending

1. Check RESEND_API_KEY is set in Supabase
2. Check FROM_EMAIL is verified in Resend
3. Look at Supabase logs for send-gift-card-email function

### Admin page not working

1. The `gift-cards.jsw` file should not need changes
2. It still calls the same functions from `gift-card-service.js`
3. Those functions now call Supabase instead of wixData

## Benefits of Migration

✅ **No more Velo limitations**
- Real PostgreSQL database
- Proper indexes and performance
- SQL queries when you need them

✅ **Better reliability**
- Supabase has 99.9% uptime SLA
- Automatic backups
- Better error handling

✅ **Easier debugging**
- View all cards in Supabase Table Editor
- Real-time logs
- SQL console for custom queries

✅ **Free**
- Supabase free tier is generous
- No Wix data limits
- Better email deliverability

## Next Steps

After migration works:

1. **Remove Wix Data Collections** (optional)
   - You can delete GiftCards and GiftCardActivity collections
   - All data is now in Supabase

2. **Remove Wix email template** (optional)
   - Supabase handles emails now
   - Can delete the triggered email template

3. **Export old data** (if you had cards before)
   - Export from Wix Data Collections
   - Import into Supabase via SQL

4. **Set up monitoring**
   - Watch Supabase Edge Function metrics
   - Set up alerts for failures

## Questions?

Check the detailed docs:
- `docs/API.md` - Full API documentation
- `docs/WIX_INTEGRATION.md` - Wix integration details
- `docs/SETUP.md` - Supabase setup guide
