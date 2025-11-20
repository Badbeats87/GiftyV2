-- Add your actual businesses to Supabase
-- Run this in Supabase SQL Editor or via: psql < your-businesses.sql

-- Clear sample businesses first (optional)
DELETE FROM businesses WHERE slug IN ('cafe-la-ronda', 'book-nook', 'green-leaf-yoga', 'artisan-pizza');

-- Insert your actual businesses
INSERT INTO businesses (name, slug, description, email, is_active) VALUES
  (
    'Pasquale',
    'pasquale',
    'Authentic Italian flavors at Pasquale. From handcrafted pastas and wood-fired pizzas to house-made cheeses and fine wines. A warm and elegant setting perfect for any occasion.',
    'info@pasquale.com',
    true
  ),
  (
    'Los Naranjos Town Houses',
    'los-naranjos',
    'Cozy themed cabins in the mountains of Los Naranjos. A fairy-tale escape with stunning views, warm hospitality, and unforgettable stays.',
    'info@naranjostownhouses.com',
    true
  ),
  (
    'Il Buongustaio',
    'il-buongustaio',
    'An elegant Italian restaurant in San Salvador, serving handcrafted pastas and refined dishes in a romantic, sophisticated setting.',
    'info@ilbuongustaio.com',
    true
  );

-- View the inserted businesses with their IDs
SELECT id, name, slug FROM businesses ORDER BY name;
