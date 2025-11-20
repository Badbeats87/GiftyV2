/**
 * BASE MODULE VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Trying base wix-stores module instead of wix-stores.v2
 */

import { Permissions, webMethod } from 'wix-web-module';
import wixStores from 'wix-stores';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (BASE MODULE) ===');

    try {
      // Step 1: Parse body
      const requestBody = await request.body.json();
      console.log('Step 1 - Request body:', JSON.stringify(requestBody));

      // Step 2: Extract values
      const name = requestBody.name;
      const price = requestBody.price || 100;
      const description = requestBody.description;
      const businessId = requestBody.businessId;

      console.log('Step 2 - Extracted:', { name, price, description, businessId });

      // Step 3: Validate
      if (!name || !businessId) {
        return {
          status: 400,
          body: { error: 'Missing required fields: name, businessId' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Step 4: Build product object
      const productData = {
        name: name,
        description: description || `Digital gift card for ${name}`,
        productType: 'digital',
        price: price,
        currency: 'USD',
        stock: {
          trackInventory: false,
          inStock: true
        },
        visible: true
      };

      console.log('Step 4 - Product data:', JSON.stringify(productData, null, 2));

      // Step 5: Try creating product with base module
      console.log('Step 5 - Calling wixStores.createProduct...');
      const result = await wixStores.createProduct(productData);

      console.log('Step 6 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.id || result._id,
          slug: result.slug,
          message: 'Product created successfully with base module'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (BASE MODULE) ===');
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      return {
        status: 500,
        body: {
          error: error.message || 'Failed to create product',
          details: error.toString()
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
