/**
 * REST API DIRECT CALL - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Calls Wix Catalog V3 REST API directly, bypassing incompatible SDK
 */

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (REST API DIRECT) ===');

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

      // Step 4: Build product payload for Catalog V3 REST API
      // Catalog V3 requires variants with prices
      const productPayload = {
        product: {
          name: name,
          description: description || `Digital gift card for ${name}`,
          productType: 'physical',
          visible: true,
          // In V3, prices are at variant level
          variants: {
            values: [
              {
                choices: {},
                variant: {
                  priceData: {
                    price: price.toString()
                  },
                  stock: {
                    trackInventory: false,
                    inStock: true
                  },
                  visible: true
                }
              }
            ]
          }
        }
      };

      console.log('Step 4 - Product payload for V3 REST API:', JSON.stringify(productPayload, null, 2));

      // Step 5: Call Wix REST API directly
      const apiUrl = 'https://www.wixapis.com/stores/v1/products';
      console.log('Step 5 - Calling REST API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authorization from the original request if available
          'Authorization': request.headers.get('Authorization') || '',
          // Wix API requires account ID and site ID
          'wix-account-id': request.headers.get('wix-account-id') || '',
          'wix-site-id': request.headers.get('wix-site-id') || ''
        },
        body: JSON.stringify(productPayload)
      });

      console.log('Step 6 - Response status:', response.status);

      const responseText = await response.text();
      console.log('Step 6a - Response text:', responseText);

      if (!response.ok) {
        console.error('API call failed:', response.status, responseText);
        throw new Error(`API returned ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('Step 7 - SUCCESS! Parsed result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product?.id || result.product?._id,
          slug: result.product?.slug,
          message: 'Product created successfully via REST API',
          fullResult: result
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (REST API) ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      return {
        status: 500,
        body: {
          error: error.message || 'Unknown error',
          details: error.toString()
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
