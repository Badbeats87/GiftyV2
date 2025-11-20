/**
 * DIRECT OBJECT VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Passes product object DIRECTLY to createProduct without wrapping
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';
import { elevate } from 'wix-auth';

// Elevate the createProduct function
const createProductElevated = elevate(products.createProduct);

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (DIRECT OBJECT) ===');

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

      // Step 4: Build product object WITHOUT the 'product' wrapper
      // Pass the product data directly to createProduct
      const productData = {
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
      };

      console.log('Step 4 - Product data (DIRECT, no wrapper):', JSON.stringify(productData, null, 2));
      console.log('Step 4a - Verifying fields:');
      console.log('  name:', productData.name, '(type:', typeof productData.name, ')');
      console.log('  priceData:', JSON.stringify(productData.priceData));
      console.log('  priceData.price:', productData.priceData.price, '(type:', typeof productData.priceData.price, ')');

      // Step 5: Pass product data DIRECTLY (not wrapped in { product: {...} })
      console.log('Step 5 - Calling createProductElevated with DIRECT object...');
      const result = await createProductElevated(productData);

      console.log('Step 6 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product?._id || result._id,
          slug: result.product?.slug || result.slug,
          message: 'Product created successfully (direct object)'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (DIRECT OBJECT) ===');
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error.details || {}, null, 2));
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

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
