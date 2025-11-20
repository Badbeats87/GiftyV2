/**
 * PLATFORMIZED VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Uses createProductPlatformized which might be the actual V3 method
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (PLATFORMIZED) ===');

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

      // Step 4: Try simple minimal structure first
      const productPayload = {
        product: {
          name: name,
          description: description || `Digital gift card for ${name}`,
          productType: 'physical',
          visible: true
        }
      };

      console.log('Step 4 - Product payload:', JSON.stringify(productPayload, null, 2));

      // Step 5: Try createProductPlatformized instead of createProduct
      console.log('Step 5 - Calling products.createProductPlatformized...');

      if (typeof products.createProductPlatformized === 'function') {
        const result = await products.createProductPlatformized(productPayload);
        console.log('Step 6 - SUCCESS with createProductPlatformized! Result:', JSON.stringify(result, null, 2));

        return {
          status: 200,
          body: {
            success: true,
            productId: result.product?._id || result.product?.id,
            slug: result.product?.slug,
            message: 'Product created successfully with createProductPlatformized',
            method: 'createProductPlatformized'
          },
          headers: { 'Content-Type': 'application/json' }
        };
      } else {
        console.error('createProductPlatformized is not available');
        return {
          status: 500,
          body: {
            error: 'createProductPlatformized method not found',
            availableMethods: Object.keys(products)
          },
          headers: { 'Content-Type': 'application/json' }
        };
      }

    } catch (error) {
      console.error('=== ERROR CAUGHT (PLATFORMIZED) ===');
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
