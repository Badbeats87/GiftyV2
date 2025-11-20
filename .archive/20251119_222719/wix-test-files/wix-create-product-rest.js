/**
 * REST API VERSION - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Uses Wix REST API directly instead of SDK to ensure V3 compatibility
 */

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';
import wixSecretsBackend from 'wix-secrets-backend';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (REST API) ===');

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
        return {
          status: 400,
          body: { error: 'name is required' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      if (!businessId) {
        return {
          status: 400,
          body: { error: 'businessId is required' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Step 4: Build product object for Catalog V3 REST API
      const productPayload = {
        product: {
          name: name,
          description: description || `Digital gift card for ${name}`,
          productType: 'digital',
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

      console.log('Step 4 - Product payload:', JSON.stringify(productPayload, null, 2));

      // Step 5: Get site info for API call
      const siteInfo = await wixSecretsBackend.getSecret('SITE_INFO');
      console.log('Step 5 - Site info retrieved');

      // Step 6: Call Wix REST API directly
      console.log('Step 6 - Calling Wix Catalog V3 REST API...');

      const apiUrl = 'https://www.wixapis.com/stores/v1/products';
      console.log('API URL:', apiUrl);

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(productPayload)
      });

      console.log('Step 7 - API Response status:', apiResponse.status);

      const responseText = await apiResponse.text();
      console.log('Step 7 - API Response text:', responseText);

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('Step 8 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product?._id || result.product?.id,
          slug: result.product?.slug,
          message: 'Product created successfully via REST API'
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('=== ERROR CAUGHT (REST API) ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      return {
        status: 500,
        body: {
          error: error.message || 'Unknown error',
          details: error.toString(),
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
