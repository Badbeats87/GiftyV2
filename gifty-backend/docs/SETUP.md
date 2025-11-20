# Supabase Backend Setup Guide

Complete step-by-step guide to deploy your gift card backend.

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for free (using GitHub is easiest)
3. Click "New Project"
4. Choose organization (or create new one)
5. Fill in project details:
   - **Name:** gifty-backend (or your choice)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Plan:** Free
6. Click "Create new project"
7. Wait 2-3 minutes for project to initialize

## Step 2: Save Your Credentials

Once the project is ready, go to **Project Settings → API**:

1. Copy these values (you'll need them):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGc...` (long string)
   - **service_role key:** `eyJhbGc...` (even longer, keep secret!)

2. Create your `.env` file:
```bash
cd gifty-backend
cp .env.example .env
```

3. Edit `.env` and paste your values

## Step 3: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 4: Link to Your Project

```bash
cd gifty-backend
supabase login
```

This opens a browser - authorize the CLI.

Then link your project:
```bash
supabase link --project-ref your-project-ref
```

Your project ref is the part before `.supabase.co` in your URL.

## Step 5: Create Database Schema

Push the database migrations:

```bash
supabase db push
```

This creates:
- All tables (businesses, gift_cards, customers, etc.)
- Indexes for performance
- Row Level Security policies
- Helper functions
- Sample businesses

Verify in Supabase dashboard:
- Go to **Table Editor**
- You should see: businesses, customers, gift_cards, gift_card_activity, transactions

## Step 6: Configure Environment Variables

In Supabase Dashboard, go to **Project Settings → Edge Functions**:

Add these secrets:

```bash
# Payment
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email (using Resend - free tier: 3,000/month)
RESEND_API_KEY=re_your_key

# App
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
FRONTEND_URL=https://yoursite.wixsite.com/gifty
```

### Getting Resend API Key (Free Email)

1. Go to [resend.com](https://resend.com)
2. Sign up (free - 3,000 emails/month)
3. Create API key
4. Verify your domain (or use their test domain)
5. Copy API key to Supabase secrets

### Getting Stripe Keys (for payments)

1. Go to [stripe.com](https://stripe.com)
2. Sign up / log in
3. Get test keys from **Developers → API keys**
4. Copy to Supabase secrets
5. (Configure webhook later after deploying functions)

## Step 7: Deploy Edge Functions

Deploy all functions:

```bash
supabase functions deploy issue-gift-card
supabase functions deploy validate-gift-card
supabase functions deploy redeem-gift-card
supabase functions deploy payment-webhook
supabase functions deploy send-gift-card-email
```

Or deploy all at once:
```bash
supabase functions deploy
```

Verify in dashboard:
- Go to **Edge Functions**
- All 5 functions should show "Active"

## Step 8: Configure Stripe Webhook

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click "Add endpoint"
3. Enter URL: `https://your-project.supabase.co/functions/v1/payment-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 9: Test the API

Test validation endpoint:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code": "GIFT-TEST-1234"}'
```

You should get a 404 (card not found) - that's good! It means the endpoint works.

## Step 10: Issue a Test Gift Card

First, get a business ID from the database:

1. In Supabase dashboard, go to **Table Editor → businesses**
2. Copy the `id` of any business (UUID)

Then issue a test card:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/issue-gift-card \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "paste-uuid-here",
    "amount": 25,
    "customerEmail": "your-email@example.com",
    "customerName": "Test User"
  }'
```

You should get back gift card codes!

Check:
1. **Table Editor → gift_cards** - new card should appear
2. **Table Editor → gift_card_activity** - activity logged
3. Your email - should receive gift card email

## Step 11: Update Wix Frontend

Follow the [Wix Integration Guide](./WIX_INTEGRATION.md) to connect your Wix site.

## Troubleshooting

### Functions won't deploy
```bash
# Make sure you're logged in
supabase login

# Check link
supabase projects list

# Try deploying one function
supabase functions deploy issue-gift-card --debug
```

### Database migration fails
```bash
# Reset local database (WARNING: deletes data)
supabase db reset

# Or push specific migration
supabase db push
```

### Email not sending
- Verify RESEND_API_KEY in Supabase dashboard
- Check FROM_EMAIL is verified in Resend
- Check Supabase Edge Function logs

### Stripe webhook failing
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook URL in Stripe dashboard
- Review Stripe webhook logs

## Monitoring

### View Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on any function
3. View **Logs** tab

### View Database Activity

```bash
# Real-time logs
supabase db logs
```

### Check Function Metrics

Dashboard → **Edge Functions** → Select function → **Metrics**

Shows:
- Invocations per day
- Errors
- Response times

## Production Checklist

Before going live:

- [ ] Use real Stripe keys (not test mode)
- [ ] Verify domain in Resend
- [ ] Set up database backups (automatic on Supabase)
- [ ] Review RLS policies for security
- [ ] Test all endpoints thoroughly
- [ ] Set up monitoring/alerts
- [ ] Document business onboarding process
- [ ] Create admin dashboard for managing businesses
- [ ] Consider upgrading to Supabase Pro for production ($25/mo)

## Free Tier Limits

**Supabase Free Tier:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- Unlimited Edge Function invocations
- 50,000 monthly active users

**When to upgrade to Pro ($25/mo):**
- Need more than 8 GB database
- Need more than 100 GB bandwidth
- Want daily backups
- Need priority support

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Stripe:**
- Free to use
- 2.9% + $0.30 per transaction

## Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Stripe Docs](https://stripe.com/docs)
- [Resend Docs](https://resend.com/docs)

## Next Steps

1. Read [API Documentation](./API.md)
2. Follow [Wix Integration Guide](./WIX_INTEGRATION.md)
3. Set up your first Stripe product
4. Test full purchase flow
5. Create business partner onboarding
6. Build admin analytics dashboard
