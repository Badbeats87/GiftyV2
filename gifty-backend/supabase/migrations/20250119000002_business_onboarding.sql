-- Migration: Business Onboarding System
-- Adds support for business invites, registration, and approval workflow

-- 1. Add new columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wix_product_id TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update is_active to be computed from status for backwards compatibility
-- (Can't easily change existing column, so we'll keep both for now)

-- 2. Create business_invites table
CREATE TABLE business_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  invited_by TEXT, -- admin email or user ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),

  -- Metadata
  message TEXT,
  metadata JSONB,

  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create business_applications table (stores pending registrations)
CREATE TABLE business_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES business_invites(id) ON DELETE SET NULL,

  -- Business info
  business_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  iban TEXT,

  -- Business details
  description TEXT,
  website TEXT,
  address JSONB,
  logo_url TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Links to created business (after approval)
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX idx_business_invites_token ON business_invites(invite_token);
CREATE INDEX idx_business_invites_email ON business_invites(email);
CREATE INDEX idx_business_invites_status ON business_invites(status);

CREATE INDEX idx_business_applications_status ON business_applications(status);
CREATE INDEX idx_business_applications_email ON business_applications(contact_email);
CREATE INDEX idx_business_applications_business_id ON business_applications(business_id);

CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_owner_user_id ON businesses(owner_user_id);
CREATE INDEX idx_businesses_wix_product_id ON businesses(wix_product_id);

-- 5. Add updated_at trigger for business_applications
CREATE TRIGGER update_business_applications_updated_at BEFORE UPDATE ON business_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on new tables
ALTER TABLE business_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_applications ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Business Invites: Only service role and admins
CREATE POLICY "Service role can manage invites" ON business_invites
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Business Applications: Service role, and users can view their own
CREATE POLICY "Service role can manage applications" ON business_applications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own applications" ON business_applications
  FOR SELECT USING (contact_email = auth.jwt() ->> 'email');

-- Update businesses RLS policies for multi-tenant access
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;

-- New policies:
-- 1. Public can view active businesses
CREATE POLICY "Public can view active businesses" ON businesses
  FOR SELECT USING (status = 'active' AND is_active = true);

-- 2. Service role can manage all businesses
CREATE POLICY "Service role can manage businesses" ON businesses
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Business owners can view and update their own business
CREATE POLICY "Owners can view their business" ON businesses
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their business" ON businesses
  FOR UPDATE USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Update gift_cards RLS for business owners
CREATE POLICY "Business owners can view their gift cards" ON gift_cards
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their gift cards" ON gift_cards
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

-- 8. Helper functions

-- Generate unique invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token (URL-safe)
    token := ENCODE(gen_random_bytes(32), 'base64');
    token := REPLACE(REPLACE(REPLACE(token, '+', '-'), '/', '_'), '=', '');

    -- Check if token already exists
    SELECT COUNT(*) > 0 INTO exists FROM business_invites WHERE invite_token = token;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to send business invite (called from Edge Function)
CREATE OR REPLACE FUNCTION create_business_invite(
  p_email TEXT,
  p_invited_by TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  invite_id UUID;
  token TEXT;
BEGIN
  -- Generate token
  token := generate_invite_token();

  -- Create invite
  INSERT INTO business_invites (
    email,
    invite_token,
    invited_by,
    message
  ) VALUES (
    p_email,
    token,
    p_invited_by,
    p_message
  ) RETURNING id INTO invite_id;

  RETURN invite_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing businesses to have 'active' status
UPDATE businesses
SET status = 'active',
    activated_at = created_at
WHERE is_active = true AND status IS NULL;

UPDATE businesses
SET status = 'suspended'
WHERE is_active = false AND status IS NULL;

-- Comments for documentation
COMMENT ON TABLE business_invites IS 'Tracks business invitation emails and tokens';
COMMENT ON TABLE business_applications IS 'Stores business registration applications pending admin approval';
COMMENT ON COLUMN businesses.status IS 'pending: awaiting approval, active: approved and operational, rejected: application denied, suspended: temporarily disabled';
COMMENT ON COLUMN businesses.owner_user_id IS 'References auth.users - the business owner who can access the business dashboard';
COMMENT ON COLUMN businesses.wix_product_id IS 'Links to the Wix Stores product ID for this business gift cards';
