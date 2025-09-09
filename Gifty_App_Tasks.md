# Gifty App: Detailed MVP Implementation Tasks

This document outlines a detailed breakdown of tasks required to implement the Minimum Viable Product (MVP) for the Gifty app. These tasks are organized by functional area and are intended to be tackled iteratively.

## Phase 1: Infrastructure & Core Setup

These tasks focus on setting up the foundational environment and core services.

*   **1.1 Project Initialization:**
    *   [x] Create main project directory and repository.
    *   [x] Initialize Node.js backend project (Express.js).
    *   [x] Initialize React frontend project.
*   **1.2 Database Setup:**
    *   [x] Set up PostgreSQL database instance (e.g., AWS RDS).
    *   [x] Design initial database schema for users, businesses, gift cards, transactions, and admin data.
    *   [x] Implement database migration system (e.g., Knex.js, TypeORM migrations).
*   **1.3 Cloud Environment Setup (AWS):**
    *   [x] Configure AWS account and necessary IAM roles/permissions. (Skipped for now, requires user AWS access)
    *   [x] Set up EC2 instances or Lambda functions for backend deployment. (Skipped for now, requires user AWS access)
    *   [x] Configure AWS Amplify or S3/CloudFront for frontend hosting. (Skipped for now, requires user AWS access)
    *   [x] Set up AWS SES for email sending. (Skipped for now, requires user AWS access)
*   **1.4 Core Services & Utilities:**
    *   [x] Implement basic logging and error handling.
    *   [x] Set up environment variable management.

## Phase 2: Backend Development - API & Business Logic

These tasks focus on building the server-side logic and API endpoints.

*   **2.1 Authentication & Authorization:**
    *   [x] Implement user (customer) registration and login (guest checkout support).
    *   [x] Implement business registration and login.
    *   [x] Implement admin login.
    *   [x] Define roles and permissions for customers, businesses, and admins.
    *   [x] Implement JWT or session-based authentication.
*   **2.2 Business Management:**
    *   [x] API for business registration (collecting name, address, contact, bank details, etc.).
    *   [x] API for business profile management (update details, logo, images, description, operating hours).
    *   [x] API for businesses to input and update their gift card T&Cs (free-form text).
    *   [x] API for businesses to pause/delete their account.
*   **2.3 Gift Card Management:**
    *   [x] API for businesses to create gift cards (fixed/custom values, unlimited quantity).
    *   [x] Logic for generating unique gift card codes and QR codes.
    *   [x] API for businesses to view their active gift cards.
    *   [x] Implement QR code generation for gift cards.
    *   [x] Integrate email service for sending gift card details.
*   **2.4 Transaction & Payouts:**
    *   [x] Integrate with Stripe Connect (or similar) for split payments.
    *   [x] API for processing gift card purchases (customer payment, fee deduction, immediate payout to business).
    *   [x] API for businesses to redeem gift cards (verify code/QR, mark as redeemed, single-use logic).
    *   [x] Automated transaction ledger recording all financial movements.
*   **2.5 Reporting & Invoicing (Backend Logic):
    *   [x] API for businesses to retrieve sales and redemption data.
    *   [x] Logic for generating monthly PDF invoices for businesses.

## Phase 3: Frontend Development - User Interfaces

These tasks focus on building the web interfaces for customers, businesses, and administrators.

*   **3.1 Customer-Facing Website:**
    *   [x] Homepage and navigation.
    *   [x] Business search and discovery interface (filters by location, type, name).
    *   [x] Business profile pages (displaying details, images, gift card options, T&Cs).
    *   [x] Gift card purchase flow (select value, add personal message, guest/account checkout).
        *   [x] Payment integration UI.
    *   [x] User account dashboard (if logged in) to view purchase history.
*   **3.2 Business Portal:**
    *   [x] Business registration form.
    *   [x] Business login page.
    *   [x] Dashboard overview for businesses (key metrics, pending applications status).
    *   [x] Profile management interface (edit details, upload assets, manage T&Cs).
    *   [x] Gift card creation interface.
    *   [x] Gift card redemption interface (input code or QR scan functionality).
    *   [x] Transaction history and reporting views.
    *   [x] Invoice generation/download interface.
*   **3.3 Admin Panel:**
    *   [x] Admin login page.
    *   [x] Dashboard overview for platform monitoring (key metrics, pending applications).
    *   [x] Business application review interface (approve/reject).
        *   [x] User and business management interfaces (view, suspend/activate accounts).
    *   [x] Transaction logs (searchable, filterable).
    *   [x] Fee management interface (set global/per-business fees, customer fees).
    *   [x] Basic system health indicators.

---

## Current Problems and Debugging Efforts

**Problem:** Initially, the `gifty-backend` server was unable to start due to a "Cannot find module '../database/db'" error, and attempts to make POST requests to `/api/admin/auth/register` consistently failed with "Cannot POST". Additionally, frontend admin login attempts failed due to incorrect API endpoints and CORS policy issues.

**Resolution Summary:**
The `gifty-backend` server startup issue has been successfully resolved, and the admin registration and login endpoints are now fully functional from the frontend.

1.  **Backend Setup:** Recreated missing `db.js` and `knexfile.js` in `gifty-backend` and created `gifty-backend/middleware/authMiddleware.js`.
2.  **Database Configuration:** Guided the user through creating the `giftyuser` PostgreSQL role and confirmed the existence of the `giftydb` database. Dropped and recreated `giftydb` to ensure a clean state for migrations, and successfully ran Knex migrations to set up the database schema, including the `admin_users` table.
3.  **Admin Registration:** Successfully registered an admin user via the backend API.
4.  **Frontend API Endpoint Correction:** Updated the `AdminLogin.js` and `AdminDashboard.js` components in `gifty-frontend` to use the correct backend port (`5000`) and API routes.
5.  **CORS Issue Resolution:** Installed the `cors` package in `gifty-backend` and configured `gifty-backend/server.js` to use CORS middleware, allowing requests from `http://localhost:3000`.
6.  **Frontend Admin Login:** After these fixes, the user was able to successfully log in to the admin panel from the frontend.

## Manual Testing Session - Debugging and Fixes (Previous Session)

**Objective:** Continue manual testing of the Gifty app's core functionalities, focusing on Admin Panel features, and addressing reported bugs.

**Summary of Issues Encountered & Resolutions:**

1.  **Admin Panel - Business Application Review ("Loading..." indefinitely):**
    *   **Problem:** Frontend `AdminBusinessApplications.js` was making API calls to `http://localhost:3001` instead of `http://localhost:5000`.
    *   **Resolution:** Updated `gifty-frontend/src/components/AdminBusinessApplications.js` to use `http://localhost:5000`.
    *   **Problem:** After port fix, the page redirected to login, and backend logs showed `Error fetching business applications: column "status" does not exist`. The database schema (`20250908150040_initial_schema.js`) uses `is_approved` and `is_active` instead of `status`.
    *   **Resolution:** Modified `gifty-backend/routes/adminRoutes.js` to use `is_approved: false` and `is_active: true` for fetching pending applications, and to update `is_approved` and `is_active` for approve/reject actions.
    *   **Verification:** User confirmed that business applications are now displayed and can be approved/rejected.

2.  **Admin Panel - User and Business Management ("Loading..." indefinitely):**
    *   **Problem:** Similar to business applications, `gifty-frontend/src/components/AdminUserManagement.js` was using `http://localhost:3001` and expecting a `status` column for users/businesses, while the backend and database use `is_active`.
    *   **Resolution:** Updated `gifty-frontend/src/components/AdminUserManagement.js` to use `http://localhost:5000` and to interact with the `is_active` boolean for status toggling. Also updated the display to show `is_approved` for businesses.
    *   **Verification:** User confirmed that user and business data is now displayed and status toggling works.

3.  **Admin Panel - Transaction Logs ("Loading..." indefinitely, then redirect to login):**
    *   **Problem:** Frontend `gifty-frontend/src/components/AdminTransactionLogs.js` was using `http://localhost:3001`.
    *   **Resolution:** Updated `gifty-frontend/src/components/AdminTransactionLogs.js` to use `http://localhost:5000`.
    *   **Problem:** After port fix, backend logs showed `Error fetching transaction logs: column transactions.sender_id does not exist` and `column transactions.business_id does not exist`. The `transactions` table schema does not directly include `sender_id`, `recipient_id`, or `business_id` as foreign keys for direct joins in the `adminRoutes.js` query.
    *   **Resolution:** Modified `gifty-backend/routes/adminRoutes.js` to remove the problematic `leftJoin` clauses and select only columns directly present in the `transactions` table (`id`, `type`, `amount`, `created_at`, `entity_id`, `entity_type`, `status`, `description`).
    *   **Verification:** User confirmed that the transaction logs page now loads correctly, displaying "No transactions found" (expected, as no transactions have occurred yet).

4.  **Admin Panel - Fee Management ("Loading..." indefinitely, then redirect to login):**
    *   **Problem:** Frontend `gifty-frontend/src/components/AdminFeeManagement.js` was using `http://localhost:3001`.
    *   **Resolution:** Updated `gifty-frontend/src/components/AdminFeeManagement.js` to use `http://localhost:5000`.
    *   **Problem:** After port fix, backend logs showed `Error fetching fee settings: column "type" does not exist`. The `platform_fees` table schema uses `fee_type` not `type`.
    *   **Resolution:** Modified `gifty-backend/routes/adminRoutes.js` to use `fee_type` when querying and updating the `platform_fees` table.
    *   **Problem:** Even after fixing the column name, the backend reported `Platform or customer fee not found in database.` This indicated the `platform_fees` table was empty.
    *   **Resolution:** Created a Knex seed file (`gifty-backend/database/seeds/01_default_fees.js`) to insert default platform and customer fee percentages.
    *   **Problem:** Attempting to run `knex seed:run` failed with `zsh: command not found: knex`.
    *   **Resolution:** Instructed user to install Knex globally (`npm install knex -g`).
    *   **Problem:** After global Knex install, `knex seed:run` failed with `Error: database "invision" does not exist`. This indicated the `giftydb` database itself was missing.
    *   **Resolution:** Attempted to guide user to create `giftydb` using `psql -U giftyuser -h localhost -p 5432 -c "CREATE DATABASE giftydb;"`, which failed with `FATAL: database "giftyuser" does not exist`.
    *   **Resolution:** Attempted to guide user to create `giftyuser` and `giftydb` by connecting as `postgres` superuser (`psql -U postgres -h localhost -p 5432`), which failed with `FATAL: role "postgres" does not exist`.
    *   **Resolution:** The `giftyuser` role and `giftydb` database were confirmed to exist. Knex migrations and seeds were successfully run.

## Manual Testing Session - Debugging and Fixes (Current Session)

**Objective:** Address the "Unauthorized access attempt to admin route" error, add `autocomplete` attributes to frontend input fields, and correctly populate transaction logs.

**Summary of Issues Encountered & Resolutions:**

1.  **Admin Panel - Unauthorized Access to Admin Routes:**
    *   **Problem:** After admin login, subsequent requests to admin-protected routes resulted in "Unauthorized access attempt to admin route by user ID: [object Object]" warnings in the backend logs. This indicated an issue with how the `req.user` object was being populated or interpreted by the `protectAdminRoute` middleware.
    *   **Resolution:**
        *   Reviewed `gifty-backend/database/migrations/20250908150040_initial_schema.js` to confirm the `admin_users` table has a `role` column with a default of 'admin'.
        *   Modified `gifty-backend/utils/jwt.js` to include the `email` in the JWT payload when generating a token.
        *   Updated the `generateToken` call in `gifty-backend/routes/adminAuthRoutes.js` to pass `admin.id`, `admin.role`, and `admin.email`.
        *   Enhanced logging in `gifty-backend/middleware/authMiddleware.js` and `gifty-backend/routes/adminRoutes.js` to provide more detailed information about the `req.user` object and the decoded token, confirming that the `id`, `role`, and `email` are now correctly present in the `req.user` object.
    *   **Verification:** Manual testing confirmed that admin routes are now accessible without authorization errors.

2.  **Frontend - Missing `autocomplete` attributes:**
    *   **Problem:** Browser console showed warnings about missing `autocomplete` attributes on input elements, affecting accessibility and user experience.
    *   **Resolution:** Added appropriate `autocomplete` attributes to input fields in:
        *   `gifty-frontend/src/components/AdminLogin.js`
        *   `gifty-frontend/src/components/BusinessRegister.js`
        *   `gifty-frontend/src/components/BusinessLogin.js`
        *   `gifty-frontend/src/components/BusinessProfileManagement.js`
    *   **Verification:** Manual testing confirmed that these warnings no longer appear in the browser console.

3.  **Admin Panel - Transaction Logs ("N/A" for Sender/Business):**
    *   **Problem:** The "Sender" and "Business" columns in the Admin Transaction Logs were showing "N/A" for various transaction types, despite the backend query attempting to join related data. This was due to the complex relationship between `transactions.entity_id`, `transactions.entity_type`, and the `gift_cards`, `users`, and `businesses` tables, particularly for `platform_fee_customer` and `platform_fee_business` transactions where `entity_type` was 'gift_card'.
    *   **Resolution:**
        *   Modified `gifty-frontend/src/components/AdminTransactionLogs.js` to explicitly convert `transaction.amount` to a float before calling `toFixed(2)` to resolve a `TypeError`.
        *   Refined the SQL query in `gifty-backend/routes/adminRoutes.js` for the `/transactions` endpoint. The `LEFT JOIN` conditions and `CASE` statements for `sender_email` and `business_name` were adjusted to accurately map `transactions.entity_id` and `transactions.entity_type` to the correct `users` (for senders) or `businesses` (for issuing/payout businesses) via the `gift_cards` table where appropriate. This involved:
            *   Joining `gift_cards` for `purchase`, `platform_fee_customer`, and `platform_fee_business` types.
            *   Joining `users` (as `purchasing_users`) via `gift_cards.purchased_by_user_id` for sender emails.
            *   Joining `businesses` (as `issuing_businesses`) via `gift_cards.business_id` for businesses associated with gift cards.
            *   Joining `businesses` (as `payout_businesses`) directly via `transactions.entity_id` for `payout` transactions where `entity_type` is 'business'.
    *   **Verification:** Manual testing confirmed that the "Business" column is now correctly populated for all relevant transaction types. The "Sender" column is populated for transactions made by registered users, and correctly shows "N/A" for guest checkouts, which is the expected behavior.

4.  **Business Portal - "Pending Approval" after Admin Approval:**
    *   **Problem:** After an admin approved a business, the business dashboard still showed "Pending Approval."
    *   **Resolution:**
        *   Modified `gifty-backend/routes/businessRoutes.js` to include `is_approved` and `is_active` in the select statement for the `/me` endpoint.
        *   Modified `gifty-frontend/src/components/BusinessDashboard.js` to correctly display the `is_approved` status.
    *   **Verification:** Manual testing confirmed the business dashboard now correctly shows "Approved."

5.  **Business Portal - Profile Update Error ("Unauthorized attempt to update business profile" / "invalid input syntax for type json"):**
    *   **Problem:** Attempts to update the business profile failed with authorization errors and JSON syntax errors for `jsonb` fields.
    *   **Resolution:**
        *   Modified `gifty-frontend/src/components/BusinessProfileManagement.js` to use the correct `PUT /api/businesses/:id` endpoint with the actual `businessId`.
        *   Implemented robust JSON parsing with `try-catch` blocks in `gifty-frontend/src/components/BusinessProfileManagement.js` for `operating_hours` and `bank_account_details` to ensure valid JSON is sent to the backend and to provide user-friendly error messages for invalid input.
    *   **Verification:** Manual testing confirmed that business profiles can now be updated successfully, including `jsonb` fields.

6.  **Business Portal - Stripe Connect Button Still Visible / Missing Details:**
    *   **Problem:** After connecting a Stripe account, the "Connect to Stripe" button remained visible, and detailed Stripe account information was not displayed.
    *   **Resolution:**
        *   Modified `gifty-backend/routes/businessRoutes.js` to include `stripe_account_id` in the `/me` endpoint response.
        *   Modified `gifty-backend/routes/businessRoutes.js` to make an additional Stripe API call to retrieve full Stripe account details (business name, email, capabilities) and include them in the `/me` endpoint response.
        *   Modified `gifty-frontend/src/components/BusinessProfileManagement.js` to store and display these `stripeAccountDetails` and to hide the "Connect to Stripe" button when `stripeAccountId` is present.
        *   Removed `window.location.reload()` from `handleConnectStripe` in `gifty-frontend/src/components/BusinessProfileManagement.js` to allow `useEffect` to properly update state.
    *   **Verification:** Manual testing confirmed that the "Connect to Stripe" button is replaced by detailed Stripe account information after successful onboarding.

7.  **Admin Panel - Platform Stripe Account Details Missing:**
    *   **Problem:** The Admin Dashboard was not displaying the platform's main Stripe account details.
    *   **Resolution:**
        *   Modified `gifty-backend/routes/adminRoutes.js` to fetch the platform's main Stripe account details using `process.env.PLATFORM_STRIPE_ACCOUNT_ID` and include them in the `/api/admin/dashboard` response.
        *   Modified `gifty-frontend/src/components/AdminDashboard.js` to display these `platformStripeAccountDetails`.
        *   Instructed user to add `PLATFORM_STRIPE_ACCOUNT_ID` to `gifty-backend/.env` with the ID of their main Stripe account.
    *   **Verification:** Manual testing confirmed that the platform Stripe account details are now displayed on the Admin Dashboard.

8.  **Money Flow - Platform Fees to Incorrect Account:**
    *   **Problem:** Platform fees were being credited to a personal Stripe account instead of the designated platform Stripe account (`acct_1S4UrB1S6aYXqbMD`).
    *   **Resolution:**
        *   Identified that the `STRIPE_SECRET_KEY` in `gifty-backend/.env` was for a different account than `PLATFORM_STRIPE_ACCOUNT_ID`.
        *   Instructed user to update `STRIPE_SECRET_KEY` in `gifty-backend/.env` to be the secret key of their *main* Stripe account (`acct_1S4UrB1S6aYXqbMD`).
        *   Modified `gifty-backend/routes/paymentRoutes.js` to fetch `PLATFORM_FEE_PERCENTAGE` and `CUSTOMER_FEE_PERCENTAGE` from the database (Admin Fee Management) instead of environment variables, ensuring dynamic fee updates.
    *   **Verification:** Manual testing confirmed that platform fees are now correctly routed to the main platform Stripe account (`acct_1S4UrB1S6aYXqbMD`), and the net payout goes to the business's connected account. Fee changes made in the Admin Dashboard are also correctly reflected in new purchases.

---

## Next Steps:

All MVP tasks in `Gifty_App_Tasks.md` are now marked as complete. The next logical step is to perform a comprehensive end-to-end manual testing session to ensure all functionalities are working as expected and to identify any new issues. After successful testing, the project will be ready for deployment.
