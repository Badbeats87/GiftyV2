-- Create businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gift_cards table
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Card details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  remaining_balance DECIMAL(10, 2),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'issued', -- issued, active, redeemed, expired, cancelled

  -- Purchase information
  order_id TEXT,
  line_item_id TEXT,
  purchase_source TEXT, -- order, manual, promotion

  -- Redemption information
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT,
  redemption_notes TEXT,

  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gift_card_activity table (audit log)
CREATE TABLE gift_card_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE,
  code TEXT NOT NULL,

  type TEXT NOT NULL, -- issued, sent, validated, redeemed, refunded, cancelled
  message TEXT NOT NULL,

  -- Optional metadata
  metadata JSONB,
  performed_by TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  type TEXT NOT NULL, -- purchase, redemption, refund, adjustment
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment information
  payment_provider TEXT, -- stripe, paypal, manual
  payment_id TEXT,
  payment_status TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_customer_id ON gift_cards(customer_id);
CREATE INDEX idx_gift_cards_business_id ON gift_cards(business_id);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);
CREATE INDEX idx_gift_cards_order_id ON gift_cards(order_id);

CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_activity_gift_card_id ON gift_card_activity(gift_card_id);
CREATE INDEX idx_activity_code ON gift_card_activity(code);
CREATE INDEX idx_activity_created_at ON gift_card_activity(created_at);

CREATE INDEX idx_transactions_gift_card_id ON transactions(gift_card_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code format: GIFT-XXXX-XXXX
    code := 'GIFT-' ||
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

    -- Check if code already exists
    SELECT COUNT(*) > 0 INTO exists FROM gift_cards WHERE gift_cards.code = code;

    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_gift_card_activity(
  p_gift_card_id UUID,
  p_code TEXT,
  p_type TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_performed_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO gift_card_activity (
    gift_card_id,
    code,
    type,
    message,
    metadata,
    performed_by
  ) VALUES (
    p_gift_card_id,
    p_code,
    p_type,
    p_message,
    p_metadata,
    p_performed_by
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (these are basic - adjust based on your auth requirements)

-- Businesses: Public read, admin write
CREATE POLICY "Public can view active businesses" ON businesses
  FOR SELECT USING (is_active = true);

-- Gift cards: Only validate/redeem with correct permissions
-- Service role can do everything (used by Edge Functions)
CREATE POLICY "Service role can manage gift cards" ON gift_cards
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Public can validate (check) a specific gift card by code
CREATE POLICY "Public can validate gift cards" ON gift_cards
  FOR SELECT USING (true);

-- Activity log: Read-only for auditing
CREATE POLICY "Service role can view activity" ON gift_card_activity
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert activity" ON gift_card_activity
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Transactions: Service role only
CREATE POLICY "Service role can manage transactions" ON transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Customers: Service role only
CREATE POLICY "Service role can manage customers" ON customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert some sample businesses for development
INSERT INTO businesses (name, slug, description, is_active) VALUES
  ('Cafe La Ronda', 'cafe-la-ronda', 'Cozy coffee shop with artisan pastries', true),
  ('The Book Nook', 'book-nook', 'Independent bookstore with curated selections', true),
  ('Green Leaf Yoga', 'green-leaf-yoga', 'Yoga and wellness studio', true),
  ('Artisan Pizza Co', 'artisan-pizza', 'Wood-fired pizza with local ingredients', true);
