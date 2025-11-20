/**
 * MINIMAL TEST VERSION - Wix HTTP Function
 *
 * COPY THIS TO: Wix Editor → Backend → http-functions.js
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    try {
      console.log('=== START createWixProduct ===');

      // Parse request body
      const requestBody = await request.body.json();
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const { name, description, price, businessId } = requestBody;

      console.log('Extracted values:', {
        name: name,
        description: description,
        price: price,
        businessId: businessId
      });

      // Validate
      if (!name || !businessId) {
        console.error('Validation failed: missing name or businessId');
        return {
          status: 400,
          body: { error: 'Missing required fields: name, businessId' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Absolutely minimal product creation
      const productToCreate = {
        product: {
          name: String(name), // Force string
          priceData: {
            price: String(price || 100), // Force string
            currency: 'USD'
          }
        }
      };

      console.log('About to call products.createProduct with:', JSON.stringify(productToCreate, null, 2));

      const result = await products.createProduct(productToCreate);

      console.log('Success! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product._id,
          fullResult: result
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error.details || {}, null, 2));
      console.error('Full error:', error);

      return {
        status: 500,
        body: {
          error: error.message || 'Failed to create product',
          details: error.details || error.toString()
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
