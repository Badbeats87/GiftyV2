-- Add the real businesses for GiftySV (matching IDs from wix-supabase-gift-card-service.js)
INSERT INTO businesses (id, name, slug, description, is_active) VALUES
  ('cc6708e2-ff81-4ca9-a329-2287313970b4', 'Pasquale', 'pasquale', 'Authentic Italian flavors at Pasquale. From handcrafted pastas and wood-fired pizzas to house-made cheeses and fine wines.', true),
  ('35acdb65-2cba-4ee8-8fe1-baf73ae07ae5', 'Los Naranjos Town Houses', 'los-naranjos', 'Cozy themed cabins in the mountains of Los Naranjos. A fairy-tale escape with stunning views.', true),
  ('f825bb6e-433e-41b5-9d77-9987d67ae979', 'Il Buongustaio', 'il-buongustaio', 'An elegant Italian restaurant in San Salvador, serving handcrafted pastas and refined dishes.', true)
ON CONFLICT (id) DO NOTHING;
