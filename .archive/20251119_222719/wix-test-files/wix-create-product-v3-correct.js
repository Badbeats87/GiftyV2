/**
 * CORRECT CATALOG V3 VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Uses proper Catalog V3 structure with variants
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (CATALOG V3 CORRECT) ===');

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

      // Step 4: Build product object with CATALOG V3 structure
      // In V3, prices go in variants, not at product level
      const productPayload = {
        product: {
          name: name,
          description: description || `Digital gift card for ${name}`,
          productType: 'physical', // API only supports 'physical'

          // In Catalog V3, EVERY product must have at least one variant
          // Prices are at the variant level, not product level
          variantsInfo: {
            variants: [
              {
                price: {
                  // actualPrice is the selling price
                  actualPrice: {
                    amount: price.toString(),
                    currency: 'USD'
                  },
                  // compareAtPrice is the "before discount" price (optional)
                  compareAtPrice: {
                    amount: price.toString(),
                    currency: 'USD'
                  }
                },
                stock: {
                  trackInventory: false,
                  inStock: true
                },
                visible: true
              }
            ]
          },

          visible: true
        }
      };

      console.log('Step 4 - Product payload (V3):', JSON.stringify(productPayload, null, 2));

      // Step 5: Call API
      console.log('Step 5 - Calling products.createProduct with V3 structure...');
      const result = await products.createProduct(productPayload);

      console.log('Step 6 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product._id || result.product.id,
          slug: result.product.slug,
          message: 'Product created successfully with Catalog V3'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (CATALOG V3) ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      return {
        status: 500,
        body: {
          error: error.message || 'Unknown error',
          details: error.details || null,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
