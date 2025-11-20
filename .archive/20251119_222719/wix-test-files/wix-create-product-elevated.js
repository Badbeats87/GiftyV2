/**
 * ELEVATED PERMISSIONS VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Uses wix-auth.elevate() to properly call createProduct
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';
import { elevate } from 'wix-auth';

// Elevate the createProduct function to bypass permissions
const createProductElevated = elevate(products.createProduct);

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (ELEVATED) ===');

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

      // Step 4: Build product object - using simple V1 compatible structure
      // since we're using elevated createProduct which routes to V1
      const productPayload = {
        product: {
          name: name,
          description: description || `Digital gift card for ${name}`,
          productType: 'physical',
          priceData: {
            price: price.toString(),
            currency: 'USD'
          },
          stock: {
            trackInventory: false,
            inStock: true
          },
          visible: true
        }
      };

      console.log('Step 4 - Product payload (with elevation):', JSON.stringify(productPayload, null, 2));

      // Step 5: Call ELEVATED createProduct
      console.log('Step 5 - Calling ELEVATED products.createProduct...');
      const result = await createProductElevated(productPayload);

      console.log('Step 6 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product._id || result.product.id,
          slug: result.product.slug,
          message: 'Product created successfully with elevated permissions'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (ELEVATED) ===');
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
