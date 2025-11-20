/**
 * WIX PRODUCT TO SUPABASE BUSINESS MAPPING
 *
 * After running your-businesses.sql in Supabase, come back here and:
 * 1. Go to Supabase → Table Editor → businesses
 * 2. Copy each business's UUID (id column)
 * 3. Paste them below next to the corresponding Wix product ID
 *
 * Then add this to your gift-card-service.js file
 */

// STEP 1: Get these UUIDs from Supabase after running the SQL
const SUPABASE_BUSINESS_IDS = {
  pasquale: 'cc6708e2-ff81-4ca9-a329-2287313970b4',           // Get from Supabase → businesses table
  losNaranjos: '35acdb65-2cba-4ee8-8fe1-baf73ae07ae5',        // Get from Supabase → businesses table
  ilBuongustaio: 'f825bb6e-433e-41b5-9d77-9987d67ae979'       // Get from Supabase → businesses table
};

// STEP 2: This maps your Wix product IDs to Supabase business IDs
const PRODUCT_TO_BUSINESS_MAP = {
  // Pasquale
  'Product_95c8f784-799c-4f33-b820-17b726a65296': SUPABASE_BUSINESS_IDS.pasquale,

  // Los Naranjos Town Houses
  'Product_1515c6dc-51be-487d-b83c-73fb3639e7d6': SUPABASE_BUSINESS_IDS.losNaranjos,

  // Il Buongustaio
  'Product_6e9cc3cb-037d-4842-81c9-95ddb3ed6211': SUPABASE_BUSINESS_IDS.ilBuongustaio
};

// STEP 3: Add this function to your gift-card-service.js
function getBusinessIdForProduct(wixProductId) {
  return PRODUCT_TO_BUSINESS_MAP[wixProductId] || null;
}

// STEP 4: Use it in issueCardsForOrder() like this:
/*
  In wix-supabase-gift-card-service.js, find the issueCardsForOrder() function
  and update this line:

  // OLD:
  const businessId = lineItem.catalogReference?.id || lineItem.productId;

  // NEW:
  const wixProductId = lineItem.catalogReference?.id || lineItem.productId;
  const businessId = getBusinessIdForProduct(wixProductId) || wixProductId;
*/

module.exports = {
  PRODUCT_TO_BUSINESS_MAP,
  getBusinessIdForProduct
};
