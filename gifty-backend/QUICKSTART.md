# Quick Start Guide

Get your gift card backend up and running in 15 minutes.

## What You're Building

A complete backend for selling multi-business gift cards:
- Customers buy gift cards on your Wix site
- Cards are issued automatically via Supabase
- Customers get emailed their codes
- Businesses can redeem cards
- Full audit trail of all transactions

## Prerequisites

- Wix website (with your girlfriend's design)
- Email address
- 15 minutes

## Let's Go!

### 1. Create Free Supabase Account (2 min)

1. Visit [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "Start your project"
3. Sign up with GitHub (fastest)
4. Create new project:
   - Name: `gifty-backend`
   - Password: (generate strong one)
   - Region: (closest to you)
   - Plan: Free
5. Wait ~2 minutes while it sets up

### 2. Save Your Keys (1 min)

Once ready, click **Project Settings** (gear icon) → **API**:

Copy these somewhere safe:
```
Project URL: https://xxxxx.supabase.co
Anon Key: eyJhbGc...
Service Key: eyJhbGc... (keep secret!)
```

### 3. Set Up Database (3 min)

Install the Supabase CLI (pick one):

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# or download the latest release binary if you can't use Homebrew
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz \
  | tar -xz -C /usr/local/bin supabase
```

Navigate to this folder and link:
```bash
cd gifty-backend
supabase login
supabase link --project-ref xxxxx
```
(The `xxxxx` is from your Project URL)

Create the database:
```bash
supabase db push
```

This creates all tables and adds sample businesses.

### 4. Get Free Email Service (3 min)

1. Go to [resend.com](https://resend.com)
2. Sign up (free - 3,000 emails/month)
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### 5. Configure Secrets (2 min)

In Supabase dashboard, go to **Project Settings** → **Edge Functions**

Add these environment variables:
```
RESEND_API_KEY = re_your_key_here
FROM_EMAIL = noreply@yourdomain.com
FRONTEND_URL = https://yoursite.wixsite.com/gifty
```

(You can use Resend's test domain for FROM_EMAIL initially)

### 6. Deploy Functions (3 min)

```bash
supabase functions deploy
```

This deploys all 5 API endpoints.

### 7. Test It! (1 min)

Go to **Table Editor** → **businesses** in Supabase dashboard.

Copy any business `id` (the UUID).

Test creating a gift card:
```bash
curl -X POST https://YOUR_PROJECT_URL/functions/v1/issue-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "paste-business-id-here",
    "amount": 25,
    "customerEmail": "your-email@example.com",
    "customerName": "Test User"
  }'
```

Replace:
- `YOUR_PROJECT_URL` - Your Supabase URL
- `YOUR_ANON_KEY` - Your anon key
- `paste-business-id-here` - The UUID you copied

You should get back a gift card code AND receive an email!

## ✅ You're Done!

Your backend is live. Now you can:

1. **Connect Wix** - Follow [docs/WIX_INTEGRATION.md](./docs/WIX_INTEGRATION.md)
2. **Add Stripe** - Set up payments (optional, see [docs/SETUP.md](./docs/SETUP.md))
3. **Add Businesses** - Go to Table Editor → businesses and add your partners

## What You Get

**API Endpoints:**
- `POST /issue-gift-card` - Create cards
- `POST /validate-gift-card` - Check if valid
- `POST /redeem-gift-card` - Mark as redeemed
- `POST /payment-webhook` - Handle Stripe payments
- `POST /send-gift-card-email` - Email cards to customers

**Database Tables:**
- `businesses` - Partner businesses
- `gift_cards` - All issued cards
- `customers` - Customer records
- `gift_card_activity` - Full audit log
- `transactions` - Financial records

**Features:**
- Automatic unique code generation
- Email delivery
- Expiration tracking
- Partial redemptions
- Activity logging
- Payment webhook handling

## Next Steps

### For Wix Integration
Read [docs/WIX_INTEGRATION.md](./docs/WIX_INTEGRATION.md) - shows exactly how to:
- Connect Wix to Supabase
- Process orders
- Let customers check cards
- Let businesses redeem cards

### For Stripe Payments
1. Sign up at [stripe.com](https://stripe.com)
2. Get test API keys
3. Add to Supabase secrets
4. Configure webhook (details in docs/SETUP.md)

### For Production
1. Use real Stripe keys (not test mode)
2. Verify your domain in Resend
3. Test the full purchase flow
4. Set up monitoring

## Free Forever?

**Yes!** The free tiers are very generous:

- **Supabase:** 500MB DB, 2GB bandwidth, unlimited API calls
- **Resend:** 3,000 emails/month
- **Stripe:** Free (just 2.9% + $0.30 per sale)

Good for thousands of gift cards per month.

## Help

- **API Docs:** [docs/API.md](./docs/API.md)
- **Full Setup:** [docs/SETUP.md](./docs/SETUP.md)
- **Wix Guide:** [docs/WIX_INTEGRATION.md](./docs/WIX_INTEGRATION.md)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

## Stuck?

Common issues:

**"Permission denied" when deploying:**
```bash
supabase login
supabase link --project-ref xxxxx
```

**Functions not working:**
- Check you set environment variables in Supabase dashboard
- View logs in Edge Functions tab

**Email not sending:**
- Verify RESEND_API_KEY is set
- Check spam folder
- Use Resend test domain initially

---

**You now have a professional, scalable backend - completely free!** 🎉

Much better than Wix/Velo, right? 😉
