# Gifty App: Concept Document (MVP)

## 1. The Big Idea (Target Audience)

The Gifty app is designed for people living abroad who want to send meaningful experiences, like meals at restaurants or stays at hotels, to their relatives back home. In the future, we might expand to other types of experiences.

## 2. What the App Will Do (Key Features)

The app will have three main types of users: Businesses (restaurants, hotels), Customers (people buying gift cards), and Administrators (who manage the platform).

### For Businesses (Restaurants, Hotels):

*   **Easy Sign-Up & Profile:** Businesses can easily register and create a profile, providing details like their name, address, contact info, bank details for payments, logo, pictures, and a description. They can also set their operating hours and specific rules for their gift cards.
*   **Gift Card Creation:** Businesses can create gift cards with fixed values (e.g., $25, $50, $100) or custom amounts. For now, they can't customize the look of the cards, but that's a future idea. They can offer an unlimited number of gift cards and can pause or delete their account if needed.
*   **Gift Card Rules (T&Cs):** Each business will write their own specific rules for their gift cards (like expiry dates or special conditions). These rules will be clearly shown to customers before they buy and to the person receiving the gift card.
*   **Tracking Sales & Use:** Businesses will have a dashboard to see all the gift cards purchased for their establishment. Each gift card will have a unique code and a QR code. When a gift card is used, the business will scan the QR code (or enter the code) to mark it as redeemed. Gift cards must be used all at once; no partial redemptions for now.
*   **Getting Paid & Reports:** Businesses will receive their money immediately after a gift card is purchased, with the platform's fee already taken out. They'll have a reporting dashboard showing total sales, how many cards were sold and used, and trends over time. They can also download monthly invoices in PDF format for their records.

### For Customers (Purchasers Abroad):

*   **Finding Businesses:** Customers can easily search for restaurants and hotels by location, type, or name. They can also browse through categories. Each business will have a profile page with details, pictures, and their gift card options.
*   **Simple Buying Process:** Customers can buy gift cards using many different payment methods. The gift card will be sent directly to the recipient via email, including a unique code and a QR code for easy use. Customers can also add a personal message to their gift.
*   **Great Experience for Recipients:** The person receiving the gift card will get a nice-looking email with the business's branding, the gift card value, the unique code, a QR code, and the personal message. Clear instructions on how to use the gift card will also be included.
*   **Optional Accounts:** Customers can buy gift cards as a guest, or they can create an account to keep track of their past purchases.

### For Administrators (Platform Managers):

*   **Manual Business Approval:** The admin will manually review and approve or reject new business applications. They'll see all the business's registration details and communicate decisions via automated emails. Approved businesses then get access to their tools.
*   **Platform Oversight:** The admin will have a dashboard to monitor the entire platform, seeing total sales, active businesses, registered customers, and gift card activity. They can also view detailed transaction logs and manage (e.g., suspend) user and business accounts.
*   **No Direct Dispute Handling (for now):** For the initial version, customers and businesses will resolve any issues directly with each other.
*   **Fee Management:** The admin can set a percentage-based fee that the platform takes. This fee can be applied globally to all businesses or customized for individual businesses. A separate fee can also be applied to the customer at the time of purchase.
*   **Automated Payouts:** The system will use a special payment service to automatically deduct the platform's fee and send the rest of the money directly to the business immediately after a purchase. The admin will have reports to track all fees collected and ensure payouts are correct.

## 3. How We'll Build It (Technology Stack)

We'll use modern and reliable technologies:

*   **Frontend (What users see):** React (a popular JavaScript tool for building interactive websites).
*   **Backend (The app's "brain"):** Node.js with Express.js (JavaScript-based, efficient for handling requests).
*   **Database (Where data is stored):** PostgreSQL (a robust and reliable database, great for financial data).
*   **Cloud Hosting:** AWS (Amazon Web Services – a leading cloud provider for hosting and scaling the app).

## 4. How the App Makes Money (Monetization Model)

The app's main way of making money will be through the percentage-based fees collected from both businesses and customers, as described in the "Fee Management" section. Other ways to make money might be explored in the future.

## 5. Keeping Things Legal & Secure (Compliance/Legal)

We'll focus on key areas to ensure the app is safe and compliant:

*   **Secure Payments:** We'll use a trusted payment service (like Stripe Connect) that handles sensitive credit card information securely, reducing our responsibility for complex payment security rules.
*   **Data Privacy:** We'll follow good practices for protecting user and business data, including a clear privacy policy, getting consent for data use, and keeping data secure.
*   **Clear Gift Card Rules:** We'll make sure that businesses' gift card rules are always clearly shown to customers and recipients.
*   **Basic Business Checks:** To prevent fraud, we'll do basic checks to verify businesses when they register, like confirming their identity and bank account details.

## 6. Ready for Growth (Scalability)

The app will be built to grow with your success:

*   **Designed for Growth:** The initial design will handle a good number of users and transactions, and the technology chosen allows us to easily add more capacity (servers, database power) as the app becomes more popular.
*   **Cloud Benefits:** Using AWS means that much of the technical scaling is handled automatically by Amazon, making it easier for us to manage.
*   **Future Expansion:** While we'll start in specific regions, the architecture will be set up to expand to new countries and regions in the future.
*   **Performance Monitoring:** We'll constantly monitor the app's performance to ensure it runs smoothly and to identify any areas that need improvement as it grows.
