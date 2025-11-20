-- Add contact_name column to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS contact_name TEXT;
