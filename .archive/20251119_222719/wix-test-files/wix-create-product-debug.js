/**
 * ULTRA MINIMAL DEBUG VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START ===');

    try {
      // Step 1: Parse body
      const requestBody = await request.body.json();
      console.log('Step 1 - Request body:', JSON.stringify(requestBody));

      // Step 2: Extract values
      const name = requestBody.name;
      const price = requestBody.price || 100;
      const businessId = requestBody.businessId;

      console.log('Step 2 - Extracted:', { name, price, businessId });

      // Step 3: Validate
      if (!name) {
        console.error('ERROR: name is missing!');
        return {
          status: 400,
          body: { error: 'name is required' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      if (!businessId) {
        console.error('ERROR: businessId is missing!');
        return {
          status: 400,
          body: { error: 'businessId is required' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Step 4: Build product object - ULTRA MINIMAL
      const productToCreate = {
        product: {
          name: String(name),
          priceData: {
            price: String(price)
          }
        }
      };

      console.log('Step 4 - Product to create:', JSON.stringify(productToCreate, null, 2));

      // Step 5: Log each field separately
      console.log('Field check:');
      console.log('  - product:', productToCreate.product);
      console.log('  - product.name:', productToCreate.product.name);
      console.log('  - product.name type:', typeof productToCreate.product.name);
      console.log('  - product.priceData:', productToCreate.product.priceData);
      console.log('  - product.priceData.price:', productToCreate.product.priceData.price);
      console.log('  - product.priceData.price type:', typeof productToCreate.product.priceData.price);

      // Step 6: Call API
      console.log('Step 6 - Calling products.createProduct...');
      const result = await products.createProduct(productToCreate);

      console.log('Step 7 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product._id,
          message: 'Product created successfully'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT ===');
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
