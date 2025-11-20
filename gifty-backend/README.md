# Gifty Backend - Supabase

A free, scalable backend for the multi-business gift card platform. Replaces Wix/Velo backend while keeping the Wix frontend.

## Features

- Multi-business gift card issuance and management
- Gift card validation and redemption
- Payment webhook integration (Stripe, PayPal, etc.)
- Email notifications for card delivery
- Admin dashboard APIs
- Activity logging and audit trails
- Business partner management

## Tech Stack

- **Supabase** - Backend platform (PostgreSQL + Edge Functions)
- **PostgreSQL** - Database for gift cards, businesses, transactions
- **Deno** - Runtime for Edge Functions
- **TypeScript** - Type-safe function development

## Project Structure

```
gifty-backend/
├── supabase/
│   ├── functions/          # Edge Functions (serverless API endpoints)
│   │   ├── issue-gift-card/
│   │   ├── validate-gift-card/
│   │   ├── redeem-gift-card/
│   │   ├── payment-webhook/
│   │   └── send-gift-card-email/
│   ├── migrations/         # Database schema versions
│   └── seed/              # Sample data for development
├── scripts/               # Utility scripts
└── docs/                 # API documentation
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create a new project
3. Note your project URL and anon key (found in Project Settings → API)

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_KEY` - Service role key (keep secret!)

### 4. Link to Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

### 5. Run Database Migrations

```bash
supabase db push
```

### 6. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy issue-gift-card
supabase functions deploy validate-gift-card
supabase functions deploy redeem-gift-card
```

## API Endpoints

All endpoints are accessible at: `https://your-project.supabase.co/functions/v1/`

### Issue Gift Card
```
POST /issue-gift-card
```
Generate new gift card codes for a purchase.

### Validate Gift Card
```
POST /validate-gift-card
```
Check if a gift card is valid and unused.

### Redeem Gift Card
```
POST /redeem-gift-card
```
Mark a gift card as redeemed.

### Payment Webhook
```
POST /payment-webhook
```
Handle payment notifications from Stripe/PayPal.

See `docs/API.md` for detailed endpoint documentation.

## Database Schema

- **gift_cards** - Individual gift card records
- **businesses** - Partner businesses accepting cards
- **transactions** - Purchase and redemption history
- **gift_card_activity** - Audit log for all card operations
- **customers** - Customer information

See `supabase/migrations/` for full schema.

## Integrating with Wix Frontend

Your Wix site will make standard HTTP requests to the Supabase Edge Functions:

```javascript
// In your Wix frontend code
const response = await fetch('https://your-project.supabase.co/functions/v1/validate-gift-card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ code: 'GIFT-1234' })
});

const data = await response.json();
```

## Free Tier Limits

Supabase free tier includes:
- 50,000 monthly active users
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- Unlimited Edge Function invocations

Perfect for getting started and early growth!

## Development

### Local Development

```bash
# Start Supabase locally
supabase start

# Run a function locally
supabase functions serve issue-gift-card
```

### Testing Functions

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/issue-gift-card' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"businessId": "123", "amount": 50, "quantity": 1}'
```

## Next Steps

1. Set up payment provider (Stripe/PayPal) webhooks
2. Configure email service (Resend, SendGrid, or built-in SMTP)
3. Update Wix frontend to call these endpoints
4. Set up environment variables in Supabase dashboard
5. Enable RLS (Row Level Security) policies for production

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
