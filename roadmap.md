# GiftyV2 Project Roadmap (Cost-Optimized - Granular Tasks)

This roadmap details the development of GiftyV2, breaking down each phase into the smallest possible actionable tasks, with a strong emphasis on minimizing upfront financial costs.

### Phase 1: Foundation & Core MVP

This phase focuses on establishing the foundational infrastructure and implementing the minimum viable product features, leveraging free-tier and open-source options.

#### 1.1 Infrastructure Setup (Zero Upfront Cost Focus)
*   **1.1.1 Cloud Environment Setup:**
    *   1.1.1.1 Select Cloud Provider with generous Free Tiers (e.g., AWS Free Tier, Google Cloud Free Tier, Heroku Free Tier, Vercel for frontend hosting).
        *   1.1.1.1.1 Research and compare free-tier offerings of major cloud providers.
        *   1.1.1.1.2 Document chosen provider and rationale.
        *   1.1.1.1.3 Create an account with the selected cloud provider.
    *   1.1.1.2 Configure basic cloud services within free tier limits (e.g., AWS EC2 Free Tier for a small VM, AWS Lambda for serverless functions, Google Cloud Run).
        *   1.1.1.2.1 Set up a Virtual Private Cloud (VPC) or equivalent network isolation.
        *   1.1.1.2.2 Define subnets for different application components.
        *   1.1.1.2.3 Configure security groups/firewall rules to restrict access.
        *   1.1.1.2.4 Provision a small compute instance (e.g., EC2 t2.micro) or set up initial serverless functions.
    *   1.1.1.3 Set up CI/CD pipelines using free services (e.g., GitHub Actions, GitLab CI/CD Free Tier).
        *   1.1.1.3.1 Choose a CI/CD service (e.g., GitHub Actions).
        *   1.1.1.3.2 Create a repository for the project.
        *   1.1.1.3.3 Configure a basic pipeline to build and deploy a "Hello World" application.
*   **1.1.2 Database Setup:**
    *   1.1.2.1 Choose open-source relational database (PostgreSQL/MySQL).
        *   1.1.2.1.1 Research and select a suitable open-source RDBMS.
    *   1.1.2.2 Provision database instance using free-tier managed services (e.g., AWS RDS Free Tier, Supabase Free Tier, Heroku Postgres Hobby Dev) or self-host on a free-tier VM.
        *   1.1.2.2.1 Provision a managed database instance within free-tier limits.
        *   1.1.2.2.2 Configure database access credentials and network security.
    *   1.1.2.3 Design initial database schema (users, businesses, gift cards, transactions).
        *   1.1.2.3.1 Define tables for `users`, `businesses`, `gift_cards`, `transactions`.
        *   1.1.2.3.2 Specify columns, data types, and relationships.
        *   1.1.2.3.3 Create ERD (Entity-Relationship Diagram).
    *   1.1.2.4 Implement database migrations.
        *   1.1.2.4.1 Select a database migration tool (e.g., Flyway, Liquibase, or ORM-specific migrations).
        *   1.1.2.4.2 Write initial migration scripts for the schema.
        *   1.1.2.4.3 Run migrations on the provisioned database.
*   **1.1.3 Core Backend Services Setup:**
    *   1.1.3.1 Initialize API Gateway (e.g., AWS API Gateway Free Tier, or built into serverless frameworks).
        *   1.1.3.1.1 Set up an API Gateway endpoint.
        *   1.1.3.1.2 Configure basic routing for initial API endpoints.
    *   1.1.3.2 Set up basic microservice architecture using serverless functions (e.g., AWS Lambda, Google Cloud Functions) or a single free-tier VM instance.
        *   1.1.3.2.1 Choose a backend framework/language (e.g., Node.js with Express, Python with Flask).
        *   1.1.3.2.2 Create a basic "health check" endpoint.
        *   1.1.3.2.3 Deploy the initial backend service.
    *   1.1.3.3 Implement logging and monitoring tools using free-tier options (e.g., CloudWatch Free Tier, basic console logging).
        *   1.1.3.3.1 Configure application logging to standard output.
        *   1.1.3.3.2 Set up basic monitoring for service availability.

#### 1.2 Basic User Management
*   **1.2.1 User Authentication & Authorization:**
    *   1.2.1.1 Implement user registration (Buyer, Business, Admin).
        *   1.2.1.1.1 Design registration API endpoint.
        *   1.2.1.1.2 Implement data validation for registration inputs.
        *   1.2.1.1.3 Store user data in the database with role assignment.
    *   1.2.1.2 Develop login/logout functionality.
        *   1.2.1.2.1 Design login API endpoint.
        *   1.2.1.2.2 Implement session management or token generation on successful login.
        *   1.2.1.2.3 Implement logout API endpoint to invalidate sessions/tokens.
    *   1.2.1.3 Integrate secure password hashing (e.g., bcrypt).
        *   1.2.1.3.1 Implement bcrypt for hashing user passwords before storage.
        *   1.2.1.3.2 Implement password comparison during login.
    *   1.2.1.4 Implement JWT for API security.
        *   1.2.1.4.1 Generate JWTs upon successful login.
        *   1.2.1.4.2 Implement middleware/interceptors to validate JWTs on protected routes.
*   **1.2.2 User Profile Management:**
    *   1.2.2.1 Allow users to view/edit basic profile information.
        *   1.2.2.1.1 Create API endpoints for fetching and updating user profiles.
        *   1.2.2.1.2 Develop basic UI for users to access and modify their profile.
    *   1.2.2.2 Implement password reset functionality.
        *   1.2.2.2.1 Implement "forgot password" API to send reset links (via email service).
        *   1.2.2.2.2 Implement "reset password" API to update password with new one.

#### 1.3 Manual Business Validation
*   **1.3.1 Business Registration:**
    *   1.3.1.1 Develop business registration form (name, description, contact, location).
        *   1.3.1.1.1 Design frontend form for business details.
        *   1.3.1.1.2 Implement client-side validation for form inputs.
    *   1.3.1.2 Implement backend endpoint for business submission.
        *   1.3.1.2.1 Create API endpoint to receive business registration data.
        *   1.3.1.2.2 Store business data in the database with a "pending" status.
*   **1.3.2 Admin Review Interface:**
    *   1.3.2.1 Create basic admin dashboard for viewing pending businesses (can be a simple web page or a command-line tool initially).
        *   1.3.2.1.1 Develop a protected admin route/page to list businesses.
        *   1.3.2.1.2 Display business details for review.
    *   1.3.2.2 Implement functionality for admin to approve/reject businesses manually.
        *   1.3.2.2.1 Create API endpoints for admin to change business status (approve/reject).
        *   1.3.2.2.2 Add UI buttons/controls for admin actions.

#### 1.4 Core Gift Card Functionality
*   **1.4.1 Gift Card Creation (Admin/Business):**
    *   1.4.1.1 Develop API for creating gift card templates (value, expiry, terms).
        *   1.4.1.1.1 Design API endpoint for creating gift card templates.
        *   1.4.1.1.2 Store template details (e.g., fixed value, percentage discount, expiry rules) in the database.
    *   1.4.1.2 Implement basic UI for businesses to define gift card offerings.
        *   1.4.1.2.1 Create a business dashboard section for managing gift card offerings.
        *   1.4.1.2.2 Allow businesses to select from templates or define simple gift card values.
*   **1.4.2 Gift Card Generation:**
    *   1.4.2.1 Implement logic for generating unique gift card codes upon purchase.
        *   1.4.2.1.1 Develop a service to generate unique alphanumeric codes.
        *   1.4.2.1.2 Ensure uniqueness check before assigning.
    *   1.4.2.2 Store gift card details in the database (code, value, status, associated business).
        *   1.4.2.2.1 Create `gift_cards` table with fields for `code`, `value`, `status`, `business_id`, `buyer_id`, `purchase_date`, `expiry_date`.

#### 1.5 Single Payment Gateway Integration (Transaction-Based Cost)
*   **1.5.1 Payment Processor Selection:**
    *   1.5.1.1 Choose an international payment gateway with no upfront fees and transaction-based pricing (e.g., Stripe, PayPal).
        *   1.5.1.1.1 Research and select a payment gateway.
        *   1.5.1.1.2 Create a developer account with the chosen gateway.
    *   1.5.2 Integration for Buyer Purchases:
        *   1.5.2.1 Implement payment initiation flow on the buyer frontend.
            *   1.5.2.1.1 Integrate payment gateway's client-side SDK/library.
            *   1.5.2.1.2 Create a checkout page to collect payment information.
        *   1.5.2.2 Integrate payment gateway API for processing transactions.
            *   1.5.2.2.1 Create a backend API endpoint to handle payment requests.
            *   1.5.2.2.2 Call payment gateway's server-side API to process charges.
        *   1.5.2.3 Handle payment success/failure callbacks.
            *   1.5.2.3.1 Implement webhook endpoints to receive payment status updates.
            *   1.5.2.3.2 Update transaction and gift card status based on payment outcome.

#### 1.6 Basic Purchase & Redemption
*   **1.6.1 Buyer Purchase Flow:**
    *   1.6.1.1 Develop storefront UI for browsing/selecting gift cards.
        *   1.6.1.1.1 Create a public-facing page to list available businesses and their gift cards.
        *   1.6.1.1.2 Implement basic filtering/sorting for gift cards.
    *   1.6.1.2 Implement checkout process.
        *   1.6.1.2.1 Create a shopping cart or direct purchase flow.
        *   1.6.1.2.2 Integrate with the payment initiation flow (1.5.2.1).
    *   1.6.1.3 Display purchased gift cards in buyer's account.
        *   1.6.1.3.1 Create a "My Gift Cards" section in the buyer's profile.
        *   1.6.1.3.2 List active and redeemed gift cards with their details.
*   **1.6.2 In-Person Redemption (Business):**
    *   1.6.2.1 Create simple business UI for entering gift card codes.
        *   1.6.2.1.1 Develop a protected business dashboard section for gift card redemption.
        *   1.6.2.1.2 Provide an input field for gift card codes.
    *   1.6.2.2 Implement backend API for validating and redeeming gift cards.
        *   1.6.2.2.1 Create an API endpoint to receive a gift card code for redemption.
        *   1.6.2.2.2 Validate the code's existence, status (active), and associated business.
    *   1.6.2.3 Update gift card status to "redeemed" in the database.
        *   1.6.2.3.1 Mark the gift card as redeemed and record redemption date/time.

#### 1.7 Initial Commission Logic
*   **1.7.1 Commission Calculation:**
    *   1.7.1.1 Define a fixed commission rate.
        *   1.7.1.1.1 Store a global commission rate in configuration or database.
    *   1.7.1.2 Implement logic to calculate commission on each purchase.
        *   1.7.1.2.1 During the payment processing callback, calculate commission based on gift card value.
*   **1.7.2 Basic Transaction Recording:**
    *   1.7.2.1 Record gross amount, commission, and net amount for each transaction.
        *   1.7.2.1.1 Update the `transactions` table with detailed financial breakdown.

#### 1.8 Basic Admin Dashboard
*   **1.8.1 Overview:**
    *   1.8.1.1 Display total users, businesses, and gift card sales.
        *   1.8.1.1.1 Implement API endpoints to fetch aggregate data.
        *   1.8.1.1.2 Display key metrics on the admin dashboard.
*   **1.8.2 Business Listing:**
    *   1.8.2.1 List all registered businesses with their status.
        *   1.8.2.1.1 Implement API endpoint to fetch all business data.
        *   1.8.2.1.2 Display a table of businesses with their current status.
*   **1.8.3 Transaction Log:**
    *   1.8.3.1 View a basic log of all gift card purchases.
        *   1.8.3.1.1 Implement API endpoint to fetch transaction history.
        *   1.8.3.1.2 Display a paginated list of transactions on the admin dashboard.

### Phase 2: Enhanced Features & Automation

This phase focuses on improving user experience, automating processes, and expanding core functionalities, still prioritizing cost-effective solutions.

#### 2.1 Automated Admin Validation
*   **2.1.1 Business Profile Enrichment:**
    *   2.1.1.1 Add fields for business verification documents (e.g., business license upload to free-tier object storage like AWS S3 Free Tier).
        *   2.1.1.1.1 Modify business registration form to include file upload.
        *   2.1.1.1.2 Implement backend logic to store uploaded files in object storage.
        *   2.1.1.1.3 Store file references (URLs) in the database.
*   **2.1.2 Automated Verification Logic:**
    *   2.1.2.1 Implement basic automated checks (e.g., regex for business ID formats). Avoid costly OCR or third-party APIs unless absolutely necessary and within free limits.
        *   2.1.2.1.1 Develop backend validation rules for specific document fields (e.g., tax ID format).
    *   2.1.2.2 Develop simple rules engine for automated approval/rejection based on basic criteria.
        *   2.1.2.2.1 Implement a function that applies a set of rules to business data.
        *   2.1.2.2.2 Automatically update business status if all rules pass.
*   **2.1.3 Admin Override:**
    *   2.1.3.1 Allow admins to manually override automated decisions.
        *   2.1.3.1.1 Add an explicit "Override" option in the admin review interface.
        *   2.1.3.1.2 Log all manual override actions.

#### 2.2 Advanced Gift Card Management
*   **2.2.1 Gift Card Customization:**
    *   2.2.1.1 Allow businesses to upload custom images/designs for gift cards (stored in free-tier object storage).
        *   2.2.1.1.1 Extend gift card creation UI with image upload functionality.
        *   2.2.1.1.2 Store images in object storage and link to gift card templates.
    *   2.2.1.2 Implement dynamic QR code generation (using open-source libraries).
        *   2.2.1.2.1 Integrate an open-source QR code generation library into the backend.
        *   2.2.1.2.2 Generate QR codes for each unique gift card code.
        *   2.2.1.2.3 Display QR codes on purchased gift cards in buyer's account.
*   **2.2.3 Gift Card Tracking:**
    *   2.2.3.1 Implement detailed tracking of gift card lifecycle (purchased, redeemed, expired).
        *   2.2.3.1.1 Add status transitions and timestamps to the `gift_cards` table.
        *   2.2.3.1.2 Develop a scheduled job to check for expired gift cards and update their status.
*   **2.2.3 Partial Redemption:**
    *   2.2.3.1 Implement logic for partial gift card redemption and remaining balance tracking.
        *   2.2.3.1.1 Modify `gift_cards` table to include `current_balance` field.
        *   2.2.3.1.2 Update redemption API to allow specifying an amount to redeem.
        *   2.2.3.1.3 Deduct redeemed amount from `current_balance` and record partial redemption.

#### 2.3 Refined Commission System
*   **2.3.1 Tiered Commission Rates:**
    *   2.3.1.1 Allow admin to configure different commission rates based on business type, volume, etc.
        *   2.3.1.1.1 Create an admin UI for managing commission rules.
        *   2.3.1.1.2 Implement backend logic to apply dynamic commission rates based on business attributes or sales volume.
*   **2.3.2 Commission Reporting:**
    *   2.3.2.1 Generate detailed reports on commissions earned by the platform.
        *   2.3.2.1.1 Develop API endpoints for fetching aggregated commission data.
        *   2.3.2.1.2 Create a dedicated section in the admin dashboard for commission reports.

#### 2.4 Automated Payout System (Transaction-Based Cost)
*   **2.4.1 Business Bank Account Integration:**
    *   2.4.1.1 Securely collect and store business bank account details (encrypted).
        *   2.4.1.1.1 Create a secure form for businesses to enter bank details.
        *   2.4.1.1.2 Implement encryption for sensitive bank account data at rest.
    *   2.4.1.2 Implement basic verification for bank accounts.
        *   2.4.1.2.1 Integrate with a micro-deposit verification service (if free/low cost) or manual verification.
*   **2.4.2 Payout Scheduling:**
    *   2.4.2.1 Develop system for scheduled payouts to businesses (e.g., weekly/monthly) using cron jobs on a free-tier VM or serverless scheduled events.
        *   2.4.2.1.1 Configure a scheduled task to trigger payout processing.
        *   2.4.2.1.2 Define payout frequency and thresholds.
*   **2.4.3 Payout Processing:**
    *   2.4.3.1 Integrate with local banking APIs or international payout services that offer transaction-based pricing (e.g., Stripe Connect, PayPal Payouts).
        *   2.4.3.1.1 Research and select a payout service.
        *   2.4.3.1.2 Implement backend logic to initiate payouts via the chosen service's API.
    *   2.4.3.2 Implement reconciliation process for payouts.
        *   2.4.3.2.1 Track payout status and reconcile with internal records.
        *   2.4.3.2.2 Handle failed payouts and retry mechanisms.

#### 2.5 Improved Buyer Experience
*   **2.5.1 Enhanced Search & Filtering:**
    *   2.5.1.1 Implement advanced search capabilities (by category, location, price range) using database queries.
        *   2.5.1.1.1 Add search bar and filter options to the storefront UI.
        *   2.5.1.1.2 Optimize database queries for efficient search.
    *   2.5.1.2 Add filtering and sorting options for gift cards.
        *   2.5.1.2.1 Implement UI controls for sorting by price, popularity, etc.
*   **2.5.2 Wishlist/Favorites:**
    *   2.5.2.1 Allow buyers to save favorite businesses or gift cards.
        *   2.5.2.1.1 Create a `wishlist` table to store user-favorite items.
        *   2.5.2.1.2 Add "Add to Wishlist" button on storefront.
*   **2.5.3 Review & Rating System:**
    *   2.5.3.1 Implement functionality for buyers to leave reviews and ratings for businesses.
        *   2.5.3.1.1 Create `reviews` table with fields for `rating`, `comment`, `buyer_id`, `business_id`.
        *   2.5.3.1.2 Develop UI for submitting and displaying reviews.
        *   2.5.3.1.3 Implement average rating calculation for businesses.

#### 2.6 Expanded Notifications
*   **2.6.1 Email Notifications:**
    *   2.6.1.1 Implement email service using free-tier providers (e.g., AWS SES Free Tier, SendGrid Free Tier).
        *   2.6.1.1.1 Integrate with an email sending API.
        *   2.6.1.1.2 Create email templates for various events (purchase, redemption, payout).
    *   2.6.1.2 Develop in-app notification system for all user roles.
        *   2.6.1.2.1 Create a `notifications` table.
        *   2.6.1.2.2 Implement a notification center UI for each user type.
        *   2.6.1.2.3 Develop backend logic to generate and deliver notifications.

#### 2.7 Basic Reporting
*   **2.7.1 Sales Reports:**
    *   2.7.1.1 Generate reports on gift card sales by business, date, and value.
        *   2.7.1.1.1 Develop API endpoints for various sales report queries.
        *   2.7.1.1.2 Create UI components to display sales data in tables/charts.
*   **2.7.2 User Activity Reports:**
    *   2.7.2.1 Track user registration and activity trends.
        *   2.7.2.1.1 Log user sign-ups, logins, and key actions.
        *   2.7.2.1.2 Develop API endpoints to query user activity.
*   **2.7.3 Financial Summaries:**
    *   2.7.3.1 Provide summary reports for platform revenue and business payouts.
        *   2.7.3.1.1 Aggregate financial data from transactions and payouts.
        *   2.7.3.1.2 Display high-level financial summaries on admin dashboard.

### Phase 3: Scaling & Optimization

This phase focuses on enhancing performance, security, and scalability, while carefully managing costs.

#### 3.1 Performance Optimization
*   **3.1.1 Caching Layer:**
    *   3.1.1.1 Integrate Redis or similar for caching frequently accessed data (e.g., storefront listings) using a free-tier instance or self-hosted on a free-tier VM.
        *   3.1.1.1.1 Provision a Redis instance (free-tier or self-hosted).
        *   3.1.1.1.2 Implement caching logic for API responses (e.g., business listings, gift card details).
*   **3.1.2 Database Optimization:**
    *   3.1.2.1 Indexing, query optimization. Database sharding strategies would be considered only if free-tier options are exhausted and traffic warrants it.
        *   3.1.2.1.1 Analyze slow queries and add appropriate database indexes.
        *   3.1.2.1.2 Refactor complex queries for better performance.
*   **3.1.3 Frontend Performance:**
    *   3.1.3.1 Implement code splitting, lazy loading, and image optimization.
        *   3.1.3.1.1 Configure frontend build tools for code splitting.
        *   3.1.3.1.2 Implement lazy loading for images and components.
        *   3.1.3.1.3 Optimize image assets for web delivery.

#### 3.2 Security Enhancements
*   **3.2.1 Penetration Testing:**
    *   3.2.1.1 Utilize open-source security tools and manual testing.
        *   3.2.1.1.1 Conduct regular vulnerability scans using tools like OWASP ZAP.
        *   3.2.1.1.2 Perform manual penetration testing on critical flows.
*   **3.2.2 Data Encryption:**
    *   3.2.2.1 Ensure all sensitive data (PII, payment info) is encrypted at rest and in transit (standard practice for cloud providers).
        *   3.2.2.1.1 Verify database encryption at rest is enabled.
        *   3.2.2.1.2 Ensure all API communication uses HTTPS/TLS.
*   **3.2.3 DDoS Protection:**
    *   3.2.3.1 Leverage basic protections offered by cloud providers (e.g., AWS Shield Standard) and CDN free tiers (e.g., Cloudflare Free).
        *   3.2.3.1.1 Configure basic DDoS protection services.
        *   3.2.3.1.2 Implement rate limiting on API endpoints.
*   **3.2.4 Role-Based Access Control (RBAC):**
    *   3.2.4.1 Refine RBAC for all microservices and UI components.
        *   3.2.4.1.1 Conduct a comprehensive review of access permissions for all user roles.
        *   3.2.4.1.2 Implement granular permissions for specific actions and resources.

#### 3.3 Scalability Improvements
*   **3.3.1 Container Orchestration:**
    *   3.3.1.1 Initially, focus on scaling individual serverless functions or horizontally scaling a single VM. Kubernetes would be a later consideration if traffic demands it and budget allows, or if a free/very low-cost managed Kubernetes option becomes available.
        *   3.3.1.1.1 If using serverless, ensure functions are stateless and optimized for cold starts.
        *   3.3.1.1.2 If using VM, configure multiple instances behind a load balancer.
*   **3.3.2 Load Balancing:**
    *   3.3.2.1 Configure basic load balancing for high availability and traffic distribution (often included in free-tier serverless or VM setups).
        *   3.3.2.1.1 Set up a load balancer for backend services.
        *   3.3.2.1.2 Distribute incoming traffic across multiple instances.
*   **3.3.3 Auto-Scaling:**
    *   3.3.3.1 Set up auto-scaling policies for serverless functions (inherent) or a free-tier VM instance.
        *   3.3.3.1.1 Configure auto-scaling groups for VM instances based on CPU/memory usage.
        *   3.3.3.1.2 Monitor and adjust scaling policies as needed.

#### 3.4 Optional Business Redemption Mobile App
*   **3.4.1 Mobile App Development:**
    *   3.4.1.1 Design and develop cross-platform mobile app (e.g., React Native, Flutter) to minimize development costs.
        *   3.4.1.1.1 Choose a cross-platform framework.
        *   3.4.1.1.2 Design mobile UI/UX for business redemption.
        *   3.4.1.1.3 Implement secure login and gift card redemption (QR code scanning).
    *   **4.4.1.2 Implement secure login and gift card redemption (QR code scanning).**
        *   3.4.1.1.4 Integrate QR code scanner library.
        *   3.4.1.1.5 Connect to existing backend redemption API.
*   **3.4.2 App Store Deployment:**
    *   **4.4.2.1 Prepare and deploy app to Apple App Store (requires developer fee) and Google Play Store (requires one-time developer fee). *Note: These are unavoidable fees for app store distribution, but are not "upfront" development costs.***
        *   3.4.2.1.1 Register for Apple Developer Program and Google Play Console.
        *   3.4.2.1.2 Prepare app store listings (screenshots, descriptions).
        *   3.4.2.1.3 Submit app for review and deployment.

#### 3.5 Marketing/SEO Features
*   **3.5.1 SEO Optimization:**
    *   3.5.1.1 Implement SEO best practices for storefront (meta tags, sitemaps, structured data).
        *   3.5.1.1.1 Add meta titles, descriptions, and keywords.
        *   3.5.1.1.2 Generate and submit sitemaps to search engines.
        *   3.5.1.1.3 Implement structured data (Schema.org) for businesses and gift cards.
*   **3.5.2 Social Media Integration:**
    *   3.5.2.1 Allow sharing of businesses/gift cards on social media.
        *   3.5.2.1.1 Add social sharing buttons to business and gift card pages.
        *   3.5.2.1.2 Implement Open Graph tags for rich social previews.
*   **3.5.3 Referral Program:**
    *   3.5.3.1 Implement a basic referral program for buyers and businesses.
        *   3.5.3.1.1 Generate unique referral codes for users.
        *   3.5.3.1.2 Track referrals and apply rewards (e.g., discounts, bonus credit).

#### 3.6 Advanced Reporting
*   **3.6.1 Customizable Dashboards:**
    *   3.6.1.1 Provide customizable dashboards for admins and businesses using open-source charting libraries.
        *   3.6.1.1.1 Integrate a charting library (e.g., Chart.js, Recharts).
        *   3.6.1.1.2 Allow users to select metrics and time ranges for their dashboards.
*   **3.6.2 Data Analytics Integration:**
    *   3.6.2.1 Integrate with free-tier analytics tools (e.g., Google Analytics).
        *   3.6.2.1.1 Set up Google Analytics tracking on the frontend.
        *   3.6.2.1.2 Define custom events for key user actions.
*   **3.6.3 Export Functionality:**
    *   3.6.3.1 Allow exporting reports in various formats (CSV, PDF).
        *   3.6.3.1.1 Implement backend logic to generate CSV/PDF reports.
        *   3.6.3.1.2 Add export buttons to reporting interfaces.

#### 3.7 Multi-Currency Support
*   **3.7.1 Currency Conversion:**
    *   3.7.1.1 Implement real-time currency conversion using free public APIs.
        *   3.7.1.1.1 Integrate with a free currency exchange rate API.
        *   3.7.1.1.2 Display prices in buyer's local currency with conversion.
*   **3.7.2 Multi-Currency Payouts:**
    *   3.7.2.1 Support payouts to businesses in their local currency through payment gateways that handle this (transaction-based cost).
        *   3.7.2.1.1 Configure payout service to handle multiple currencies.
        *   3.7.2.1.2 Ensure accurate conversion and transfer of funds.

### Phase 4: Future Enhancements (Post-Launch)

These features are planned for implementation after the successful launch of the core platform, and can be prioritized based on revenue generation.

#### 4.1 Gift Card Gifting
*   **4.1.1 Gifting Flow:**
    *   4.1.1.1 Allow buyers to purchase gift cards and send them directly to another recipient.
        *   4.1.1.1.1 Add "Gift to a friend" option during checkout.
        *   4.1.1.1.2 Collect recipient's email and name.
    *   4.1.1.2 Enable recipients to add personalized messages to gifted cards.
        *   4.1.1.2.1 Provide a text field for personalized messages during gifting.
        *   4.1.1.2.2 Include message in the gift card delivery email.

#### 4.2 Loyalty Programs
*   **4.2.1 Buyer Loyalty:**
    *   4.2.1.1 Implement a points-based loyalty program for frequent buyers.
        *   4.2.1.1.1 Create a `loyalty_points` table for users.
        *   4.2.1.1.2 Award points for purchases and other activities.
        *   4.2.1.1.3 Allow points redemption for discounts or exclusive gift cards.
*   **4.2.2 Business Loyalty:**
    *   4.2.2.1 Offer incentives for businesses with high sales volume or positive reviews.
        *   4.2.2.1.1 Define tiers or rewards for high-performing businesses.
        *   4.2.2.1.2 Implement logic to track business performance and apply incentives.

#### 4.3 Business API Integration
*   **4.3.1 Public API for Businesses:**
    *   4.3.1.1 Develop a secure API for businesses to integrate GiftyV2 into their own systems (e.g., for automated gift card redemption).
        *   4.3.1.1.1 Design API endpoints for business-specific operations (e.g., redemption, sales data).
        *   4.3.1.1.2 Implement API key management for secure access.
*   **4.3.2 Webhooks:**
    *   4.3.2.1 Implement webhooks for businesses to receive real-time notifications of gift card purchases/redemptions.
        *   4.3.2.1.1 Allow businesses to register webhook URLs.
        *   4.3.2.1.2 Send event notifications to registered webhooks.

#### 4.4 AI Recommendations
*   **4.4.1 Personalized Recommendations:**
    *   4.4.1.1 Implement AI/ML models to suggest gift cards to buyers based on their browsing history and preferences (using free-tier ML services or open-source libraries).
        *   4.4.1.1.1 Collect user interaction data (views, purchases).
        *   4.4.1.1.2 Develop a simple recommendation engine (e.g., collaborative filtering).
        *   4.4.1.1.3 Integrate recommendations into the storefront.
*   **4.4.2 Business Matching:**
    *   4.4.2.1 Use AI to recommend relevant businesses to buyers.
        *   4.4.2.1.1 Extend recommendation engine to suggest businesses.

#### 4.5 Further Local Payment/Language Support
*   **4.5.1 Local Payment Methods:**
    *   4.5.1.1 Integrate with additional local payment gateways specific to El Salvador (transaction-based cost).
        *   4.5.1.1.1 Research popular local payment methods in El Salvador.
        *   4.5.1.1.2 Integrate with selected local payment providers.
*   **4.5.2 Multi-Language Support:**
    *   4.5.2.1 Implement i18n for the platform to support multiple languages.
        *   4.5.2.1.1 Extract all UI text into language resource files.
        *   4.5.2.1.2 Implement language switching functionality.
        *   4.5.2.1.3 Translate content into target languages.
