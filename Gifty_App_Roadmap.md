# Gifty App: Product Roadmap

This document outlines the planned development phases for the Gifty app, starting with the Minimum Viable Product (MVP) and progressing to future enhancements and strategic growth.

## Phase 1: Minimum Viable Product (MVP) - Core Launch

The focus of the MVP is to build the essential features required for a successful initial launch, ensuring a solid foundation for future growth.

### Key Objectives:
*   Establish core functionality for businesses, customers, and administrators.
*   Validate the core concept with the target audience.
*   Ensure secure and reliable transaction processing.

### Features to be Developed:

#### For Businesses:
*   **Business Registration & Profile Management:**
    *   Secure sign-up process.
    *   Ability to create and manage business profiles (name, address, contact, bank details, logo, images, description, operating hours).
    *   Ability to define business-specific gift card terms and conditions (free-form text).
    *   Option to pause or delete account.
*   **Gift Card Creation & Management:**
    *   Create gift cards with fixed or custom values.
    *   Unlimited gift card availability.
*   **Order & Redemption Tracking:**
    *   Unique code and QR code generation for each gift card.
    *   Business portal for scanning QR codes or manually entering codes to mark gift cards as redeemed.
    *   Single-use redemption (no partial redemption).
    *   Transaction history view for all gift cards.
*   **Payouts & Reporting:**
    *   Immediate payouts to businesses (net of platform fees).
    *   Reporting dashboard with key metrics (total sales, cards sold/redeemed, trends).
    *   Monthly PDF invoice generation.

#### For Customers:
*   **Business Discovery & Search:**
    *   [x] Search by location/city, business type, and name.
    *   [ ] Browsing by categories.
    *   [x] View comprehensive business profiles (description, images, location, contact, gift card options, T&Cs).
*   **Gift Card Purchase Flow:**
    *   [x] Support for multiple international payment methods (simulated).
    *   [ ] Email delivery of gift cards with unique code, QR code, and personal message.
*   **Recipient Experience:**
    *   [ ] Visually appealing digital gift card email with business branding, value, code, QR, and personal message.
    *   [ ] Clear redemption instructions.
*   **User Accounts:**
    *   [ ] Guest checkout option.
    *   [x] Optional account creation with purchase history (dashboard created).

#### For Administrators:
*   **Manual Business Approval:**
    *   Dashboard to review new business applications.
    *   Manual approval/rejection actions.
    *   Automated email communication for approval/rejection.
*   **Platform Monitoring:**
    *   Dashboard with key platform metrics (total sales, active users/businesses, pending applications).
    *   Searchable transaction logs.
    *   Tools to view and manage (suspend/activate) user and business accounts.
    *   Basic system health indicators.
*   **Fee Management:**
    *   Ability to set global or per-business percentage-based fees.
    *   Ability to set a separate percentage-based fee for customers.
    *   Tracking of collected fees.
*   **Automated Payout Reconciliation:**
    *   Integration with split-payment gateway (e.g., Stripe Connect) for automatic fee deduction and direct business payouts.
    *   Automated transaction ledger and reconciliation reports.

### Technology Stack (MVP):
*   **Frontend:** React
*   **Backend:** Node.js with Express.js
*   **Database:** PostgreSQL
*   **Cloud Hosting:** AWS (Amazon Web Services)

### Integrations (MVP):
*   **Payment Gateway:** Stripe Connect (for split payments).
*   **Email Service:** AWS Simple Email Service (SES).

### Compliance & Legal (MVP Focus):
*   Leverage payment gateway for PCI DSS compliance.
*   Implement strong data privacy principles (Privacy Policy, consent, data security).
*   Ensure clear display of business-specific T&Cs.
*   Basic business verification (KYC/AML light) during registration.

## Phase 2: Post-MVP Enhancements - Expanding Value

After a successful MVP launch and gathering initial user feedback, this phase will introduce features to enhance user experience and platform capabilities.

### Key Objectives:
*   Improve user engagement and retention.
*   Offer more customization and flexibility.
*   Streamline operations.

### Potential Features:

#### For Businesses:
*   **Gift Card Customization:**
    *   Ability to upload custom branding/images for gift cards.
    *   Templates for gift card design.
*   **Advanced Reporting:**
    *   More detailed analytics and data visualizations.
    *   Integration with accounting software (e.g., QuickBooks, Xero).
*   **Marketing Tools:**
    *   Promotional features for businesses to highlight their gift cards.

#### For Customers:
*   **Advanced Search & Discovery:**
    *   User reviews and ratings for businesses.
    *   Enhanced filtering options (e.g., price range).
*   **Recipient Management:**
    *   Ability to save recipient details for future purchases.
*   **Wishlist/Favorites:**
    *   Option to save favorite businesses or gift cards.
*   **Scheduled Delivery:**
    *   Option to schedule gift card email delivery for a future date.

#### For Administrators:
*   **Standardized T&Cs:**
    *   Platform-provided standard terms that businesses can adopt or modify.
*   **Enhanced Dispute Resolution:**
    *   On-platform reporting mechanism for issues.
    *   Case management system for tracking disputes.
    *   Admin tools for investigation and potential refund/reversal capabilities.
*   **Advanced Monitoring:**
    *   More detailed system performance and error logging.

### Potential Integrations:
*   **SMS Service:** Twilio (for SMS gift card delivery).
*   **Marketing/Analytics Platforms:** Google Analytics, Mixpanel, CRM systems.
*   **Identity Providers:** Google Sign-In, Facebook Login.

## Phase 3: Growth & Expansion - Strategic Vision

This long-term phase focuses on scaling the platform significantly, expanding market reach, and introducing innovative features.

### Key Objectives:
*   Achieve broader geographic reach.
*   Diversify revenue streams.
*   Introduce advanced features for competitive advantage.

### Potential Features:

#### Platform-wide:
*   **New Categories:** Expand beyond restaurants and hotels to other experience-based categories.
*   **Multi-currency Support:** Handle transactions in various currencies.
*   **Localization:** Support multiple languages for the platform interface.
*   **Mobile Applications:** Native iOS and Android apps for customers and/or businesses.

#### For Businesses:
*   **Subscription Tiers:** Offer premium features for businesses (e.g., advanced analytics, dedicated support, enhanced visibility) through subscription models.
*   **API Access:** Allow businesses to integrate their own systems with Gifty.

#### For Customers:
*   **Digital Wallet Integration:** Allow recipients to add gift cards to Apple Wallet or Google Pay.
*   **Referral Programs:** Incentivize users to refer new customers.

### Strategic Considerations:
*   **Global Expansion:** Detailed legal and compliance review for new target countries/regions.
*   **Advanced KYC/AML:** More rigorous verification processes as transaction volumes and regulatory scrutiny increase.
*   **AI/ML for Personalization:** Use data to offer personalized recommendations for gift cards.
*   **Partnerships:** Explore strategic partnerships with other platforms or service providers.

---

This roadmap provides a clear direction for the Gifty app's development, allowing us to prioritize effectively while keeping the long-term vision in sight.
