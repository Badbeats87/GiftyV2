# GiftyV2 - Multi-Tenant Gift Card Platform

A comprehensive gift card platform that enables businesses to create, sell, and manage digital gift cards through an integrated Wix storefront with Supabase backend.

## Architecture

```
GiftyV2/
├── admin-dashboard/     # Next.js admin interface
├── gifty-backend/       # Supabase backend & edge functions
└── giftysv/            # Wix Velo frontend (submodule)
```

## Components

### Admin Dashboard (Next.js 16.0.3)
- Business application approval/rejection
- Automated Wix product creation on approval
- Business owner dashboard
- Registration token system
- **Start**: `cd admin-dashboard && npm run dev`

### Backend (Supabase)
**9 Edge Functions:**
- `approve-business-application` - Creates Wix products with variants
- `delete-business` - Business removal
- `issue-gift-card` - Gift card creation
- `payment-webhook` - Payment processing
- `redeem-gift-card` - Gift card redemption
- `revoke-business-invite` - Cancel invitations
- `send-business-invite` - Business invitations
- `send-gift-card-email` - Email notifications
- `validate-gift-card` - Card validation

**Database:** 4 migrations with business, applications, invites, and gift card schemas

### Frontend (Wix Velo)
Customer-facing gift card storefront with purchase flow integration.

## Features

- Automatic Wix product creation with 6 variants ($25, $50, $75, $100, $125, $150)
- $3 processing fee built into pricing
- Business approval workflow
- Gift card lifecycle management
- Email notifications
- Wix Stores API v3 integration

## Quick Start

1. **Install dependencies:**
   ```bash
   cd admin-dashboard && npm install
   cd ../gifty-backend && npm install
   cd ../giftysv && npm install
   ```

2. **Configure environment variables:**
   - Copy `gifty-backend/.env.example` to `gifty-backend/.env`
   - Set Wix API credentials (token, site ID, account ID)
   - Set Supabase credentials (URL, service role key)

3. **Start admin dashboard:**
   ```bash
   cd admin-dashboard
   npm run dev
   ```

4. **Deploy Supabase functions:**
   ```bash
   cd gifty-backend
   supabase functions deploy
   ```

5. **Start Wix development:**
   ```bash
   cd giftysv
   wix dev
   ```

## Documentation

- [STATUS.md](STATUS.md) - Current project status and recent work
- [gifty-backend/README.md](gifty-backend/README.md) - Backend setup guide
- [gifty-backend/QUICKSTART.md](gifty-backend/QUICKSTART.md) - Quick start guide
- [gifty-backend/docs/](gifty-backend/docs/) - API docs, setup, Wix integration

## Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/kppdvozuesiycwdacqgf)
- [Wix API Docs](https://dev.wix.com/docs/api-reference)

## Archive

The previous AWS Lambda-based architecture is preserved in the `archive-lambda-version` branch.

## License

Private - All Rights Reserved
