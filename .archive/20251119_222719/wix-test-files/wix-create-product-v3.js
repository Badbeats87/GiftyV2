/**
 * Wix HTTP Function: createWixProduct (Catalog V3)
 *
 * COPY THIS TO: Wix Editor → Backend → http-functions.js
 *
 * This uses the new Catalog V3 API
 */

import { Permissions, webMethod } from 'wix-web-module';
import { products } from 'wix-stores.v2';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    try {
      const { name, description, price, businessId } = await request.body.json();

      console.log('Creating Wix product (V3):', { name, description, price, businessId });

      // Validate inputs
      if (!name || !businessId) {
        return {
          status: 400,
          body: { error: 'Missing required fields: name, businessId' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      const productPrice = price || 100;

      // Build product object
      const productObj = {
        name: name,
        productType: 'digital',
        description: description || `Gift card for ${name}`,

        // V3 price structure
        priceData: {
          price: productPrice.toString(), // V3 expects string
          currency: 'USD'
        },

        // Stock/inventory
        stock: {
          trackInventory: false,
          inStock: true
        },

        // Visibility
        visible: true
      };

      console.log('Product object to create:', JSON.stringify(productObj, null, 2));

      // Create product using Catalog V3 API
      const result = await products.createProduct({
        product: productObj
      });

      console.log('Result from Wix API:', JSON.stringify(result, null, 2));

      console.log('✅ Product created successfully (V3):', result.product._id);

      return {
        status: 200,
        body: {
          success: true,
          productId: result.product._id,
          product: {
            id: result.product._id,
            name: result.product.name,
            slug: result.product.slug
          }
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('❌ Error creating Wix product (V3):', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

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
