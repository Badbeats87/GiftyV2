# GiftyV2 - Project Status

**Last Updated:** November 19, 2025
**Status:** Development Paused (Subscription Issue)

## ✅ Completed Features

### 1. Business Approval Workflow
- **Working:** Automatic Wix product creation when approving businesses
- **Location:** `gifty-backend/supabase/functions/approve-business-application/`
- **Features:**
  - Creates gift card products with 6 variants ($25, $50, $75, $100, $125, $150)
  - Prices include $3 processing fee
  - Products hidden by default for review
  - All variants marked as "In Stock"
  - Uses Wix Catalog V3 API with inventory management

### 2. Admin Dashboard
- **Location:** `admin-dashboard/`
- **Type:** Next.js application (running locally)
- **Features:**
  - Business management interface
  - Approve/reject business applications
  - View all businesses and pending applications
  - Send business invitations

### 3. Supabase Backend
- **Location:** `gifty-backend/supabase/`
- **Deployed Functions (9):**
  1. `approve-business-application` - Creates Wix products ✅
  2. `delete-business` - Removes businesses
  3. `issue-gift-card` - Issues new gift cards
  4. `payment-webhook` - Handles payment processing
  5. `redeem-gift-card` - Redeems gift cards
  6. `revoke-business-invite` - Cancels invitations
  7. `send-business-invite` - Sends business invites
  8. `send-gift-card-email` - Sends gift card emails
  9. `validate-gift-card` - Validates gift cards

### 4. Database
- **Migrations:** 4 migration files in `gifty-backend/supabase/migrations/`
- **Schema:**
  - businesses
  - business_applications
  - business_invites
  - gift_cards (and related tables)

## 📁 Repository Structure

```
GiftyV2/
├── .archive/20251119_222719/    # 28 archived test/debug files (revertible)
│   ├── wix-test-files/           # 15 test product creation files
│   ├── old-examples/             # 7 example files
│   └── debug-files/              # 6 debug files
│
├── admin-dashboard/              # Next.js Admin Dashboard
│   ├── app/
│   │   ├── businesses/           # Business management
│   │   ├── owner/[businessId]/   # Business owner dashboard
│   │   └── register/[token]/     # Registration pages
│   ├── lib/supabase.ts
│   └── package.json
│
├── gifty-backend/                # Supabase Backend
│   ├── supabase/
│   │   ├── functions/            # 9 Edge Functions
│   │   ├── migrations/           # 4 DB migrations
│   │   └── config.toml
│   ├── docs/                     # Documentation
│   │   ├── API.md
│   │   ├── SETUP.md
│   │   └── WIX_INTEGRATION.md
│   ├── README.md
│   ├── QUICKSTART.md
│   └── package.json
│
└── giftysv/                      # Wix Site Project
    ├── src/
    │   ├── backend/
    │   ├── pages/
    │   └── public/
    └── wix.config.json
```

## 🔑 Important Configuration

### Environment Variables Required:
- `WIX_API_TOKEN` - Wix API authentication token
- `WIX_SITE_ID` - Wix site identifier
- `WIX_ACCOUNT_ID` - Wix account identifier
- `WIX_INSTANCE_ID` - Wix instance identifier (optional)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

See `gifty-backend/.env.example` for template.

## 🚧 Known Issues

1. **Wix Editor 500 Error**
   - **Cause:** Subscription issue with site owner
   - **Impact:** Cannot access Wix Editor
   - **Status:** Waiting for resolution
   - **Note:** This is NOT related to code changes

2. **Git Repository**
   - Has untracked files (normal for development)
   - No commits pushed yet
   - giftysv marked as submodule

## 📝 Recent Work (Nov 19, 2025)

### Wix Product Creation Fix
- Fixed Wix API v3 integration for product creation
- Changed from `/stores/v3/products` to `/stores/v3/products-with-inventory`
- Corrected product options structure:
  - Used `optionRenderType: 'TEXT_CHOICES'`
  - Used `choicesSettings.choices` with `choiceType: 'CHOICE_TEXT'`
  - Used `inventoryItem: { inStock: true }` for variants
- Products now created with proper variants and inventory

### Repository Cleanup
- Archived 28 test/debug files to `.archive/20251119_222719/`
- Removed duplicate directories
- All changes are revertible
- Active code verified and intact

## 🎯 Next Steps (When Development Resumes)

1. **Resolve Wix Subscription Issue**
   - Contact Wix support
   - Restore access to Wix Editor

2. **Testing Checklist:**
   - [ ] Start admin dashboard: `cd admin-dashboard && npm run dev`
   - [ ] Test business approval flow
   - [ ] Verify Wix product creation
   - [ ] Check all 9 Supabase functions are deployed
   - [ ] Test gift card purchase flow

3. **Potential Improvements:**
   - Add automated testing
   - Set up CI/CD pipeline
   - Add product descriptions/images to Wix products
   - Implement error monitoring

## 📞 Support

- **Supabase Dashboard:** https://supabase.com/dashboard/project/kppdvozuesiycwdacqgf
- **Supabase Functions:** https://supabase.com/dashboard/project/kppdvozuesiycwdacqgf/functions
- **Wix API Documentation:** https://dev.wix.com/docs/api-reference

## 💾 Restore Archived Files

If needed, archived files can be restored:
```bash
cp -R .archive/20251119_222719/wix-test-files/* gifty-backend/
cp -R .archive/20251119_222719/old-examples/* gifty-backend/
cp -R .archive/20251119_222719/debug-files/* ./
```

---

**Repository Status: READY FOR DEVELOPMENT RESUME** ✅
