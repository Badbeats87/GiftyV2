-- Users Table (for customers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Businesses Table
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    images_urls TEXT[], -- Array of image URLs
    operating_hours JSONB, -- Store as JSONB for flexibility
    terms_and_conditions TEXT,
    bank_account_details JSONB, -- Store sensitive details encrypted or via tokenized service
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gift Cards Table
CREATE TABLE gift_cards (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    unique_code VARCHAR(255) UNIQUE NOT NULL,
    qr_code_url VARCHAR(255),
    value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL, -- e.g., 'active', 'redeemed', 'expired'
    purchased_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Can be null for guest purchases
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    personal_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table (for purchases and payouts)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- e.g., 'purchase', 'payout', 'platform_fee'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    entity_id INTEGER, -- References user_id, business_id, or gift_card_id depending on type
    entity_type VARCHAR(50), -- 'user', 'business', 'gift_card'
    related_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL, -- For linking fees to purchases
    status VARCHAR(50) DEFAULT 'completed' NOT NULL, -- e.g., 'pending', 'completed', 'failed'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' NOT NULL, -- e.g., 'admin', 'super_admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform Fees Configuration Table
CREATE TABLE platform_fees (
    id SERIAL PRIMARY KEY,
    fee_type VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'global_business_percentage', 'global_customer_percentage'
    percentage DECIMAL(5, 2) NOT NULL, -- e.g., 0.05 for 5%
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business Specific Fees (if different from global)
CREATE TABLE business_fees (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    fee_type VARCHAR(50) NOT NULL, -- e.g., 'business_percentage'
    percentage DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, fee_type)
);
