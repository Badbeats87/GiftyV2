/**
 * REST API WITH SITE CONTEXT - Wix HTTP Function
 * Copy to: Wix Editor → Backend → http-functions.js
 *
 * Calls Wix REST API directly using site context for authentication
 */

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';
import wixSecretsBackend from 'wix-secrets-backend';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    console.log('=== FUNCTION START (REST API FINAL) ===');

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

      // Step 4: Build minimal product payload
      // Try the absolute minimum first
      const productPayload = {
        product: {
          name: name,
          productType: 'physical',
          priceData: {
            price: price.toString(),
            currency: 'USD'
          }
        }
      };

      console.log('Step 4 - Product payload:', JSON.stringify(productPayload, null, 2));

      // Step 5: Call Wix REST API
      const apiUrl = 'https://www.wixapis.com/stores/v1/products';
      console.log('Step 5 - Calling Wix REST API:', apiUrl);

      // Try to get API credentials from secrets if available
      let authToken = '';
      try {
        authToken = await wixSecretsBackend.getSecret('WIX_API_TOKEN');
        console.log('Step 5a - Got API token from secrets');
      } catch (secretError) {
        console.log('Step 5a - No API token in secrets, will try without auth');
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = authToken;
      }

      console.log('Step 5b - Request headers (without auth token):', Object.keys(headers));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(productPayload)
      });

      console.log('Step 6 - Response status:', response.status);
      console.log('Step 6a - Response headers:', JSON.stringify(response.headers));

      const responseText = await response.text();
      console.log('Step 6b - Response body:', responseText);

      if (!response.ok) {
        console.error('Step 6c - API call failed');

        return {
          status: response.status,
          body: {
            error: 'Wix API call failed',
            status: response.status,
            response: responseText,
            hint: response.status === 401 ? 'Authentication required - may need to set up Wix API token in Secrets Manager' : null
          },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      const result = JSON.parse(responseText);
      console.log('Step 7 - SUCCESS! Result:', JSON.stringify(result, null, 2));

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product?.id || result.product?._id,
          slug: result.product?.slug,
          message: 'Product created successfully via REST API'
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
