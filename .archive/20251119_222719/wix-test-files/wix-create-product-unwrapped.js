/**
 * UNWRAPPED VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Testing if products.createProduct expects the product object directly
 * without the 'product' wrapper
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (UNWRAPPED TEST) ===');

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

      // Step 4: Build product object WITHOUT the 'product' wrapper
      const productData = {
        name: String(name),
        description: description || `Digital gift card for ${name}`,
        productType: 'digital',
        priceData: {
          price: String(price),
          currency: 'USD'
        },
        stock: {
          trackInventory: false,
          inStock: true
        },
        visible: true
      };

      console.log('Step 4 - Product data (unwrapped):', JSON.stringify(productData, null, 2));

      // Step 5: Try calling with just the product data
      console.log('Step 5 - Calling products.createProduct with unwrapped data...');
      const result = await products.createProduct(productData);

      console.log('Step 6 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product?._id || result._id,
          slug: result.product?.slug || result.slug,
          message: 'Product created successfully'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (UNWRAPPED TEST) ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      // If this approach fails, try the wrapped version
      console.log('=== TRYING WRAPPED VERSION AS FALLBACK ===');

      try {
        const requestBody = await request.body.json();
        const { name, price = 100, description, businessId } = requestBody;

        const wrappedProduct = {
          product: {
            name: String(name),
            description: description || `Digital gift card for ${name}`,
            productType: 'digital',
            priceData: {
              price: String(price),
              currency: 'USD'
            },
            stock: {
              trackInventory: false,
              inStock: true
            },
            visible: true
          }
        };

        console.log('Fallback - Trying wrapped version:', JSON.stringify(wrappedProduct, null, 2));
        const fallbackResult = await products.createProduct(wrappedProduct);

        console.log('Fallback - SUCCESS!:', JSON.stringify(fallbackResult, null, 2));

        return {
          status: 200,
          body: {
            success: true,
            productId: fallbackResult.product._id,
            slug: fallbackResult.product.slug,
            message: 'Product created successfully (via fallback)'
          },
          headers: { 'Content-Type': 'application/json' }
        };

      } catch (fallbackError) {
        console.error('=== FALLBACK ALSO FAILED ===');
        console.error('Fallback error:', JSON.stringify(fallbackError, Object.getOwnPropertyNames(fallbackError)));

        return {
          status: 500,
          body: {
            error: error.message || 'Unknown error',
            details: error.details || null,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            fallbackError: JSON.stringify(fallbackError, Object.getOwnPropertyNames(fallbackError))
          },
          headers: { 'Content-Type': 'application/json' }
        };
      }
    }
  }
);
