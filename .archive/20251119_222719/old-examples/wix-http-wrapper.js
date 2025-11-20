/**
 * HTTP FUNCTION WRAPPER - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * This calls the backend .jsw module which has proper permissions
 */

import { Permissions, webMethod } from 'wix-web-module';
import { createBusinessProduct } from 'backend/products'; // Import from backend module

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== HTTP WRAPPER START ===');

    try {
      const requestBody = await request.body.json();
      console.log('Request body:', JSON.stringify(requestBody));

      const { name, description, price, businessId } = requestBody;

      // Validate
      if (!name || !businessId) {
        return {
          status: 400,
          body: { error: 'Missing required fields: name, businessId' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Call the backend module function
      console.log('Calling backend module createBusinessProduct...');
      const result = await createBusinessProduct(
        name,
        description,
        price || 100,
        businessId
      );

      console.log('Backend module returned:', JSON.stringify(result));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.productId,
          slug: result.slug,
          message: 'Product created successfully via backend module'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR IN HTTP WRAPPER ===');
      console.error('Error:', error.message);

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
