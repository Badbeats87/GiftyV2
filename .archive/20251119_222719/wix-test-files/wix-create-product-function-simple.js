/**
 * Simplified Wix HTTP Function: createWixProduct
 *
 * COPY THIS TO: Wix Editor → Backend → http-functions.js
 */

import { Permissions, webMethod } from 'wix-web-module';
import wixStoresBackend from 'wix-stores-backend';

export const post_createWixProduct = webMethod(
  Permissions.Anyone,
  async (request) => {
    try {
      const { name, description, price, businessId } = await request.body.json();

      console.log('Creating Wix product:', { name, description, price, businessId });

      // Validate inputs
      if (!name || !businessId) {
        return {
          status: 400,
          body: { error: 'Missing required fields: name, businessId' },
          headers: { 'Content-Type': 'application/json' }
        };
      }

      // Create the product with minimal configuration
      const productPrice = price || 100;

      const productData = {
        name: name,
        productType: 'digital',
        description: description || `Gift card for ${name}`,

        // Price structure matching Wix API requirements
        price: productPrice,
        currency: 'USD',

        // No inventory tracking for digital products
        stock: {
          trackInventory: false,
          inStock: true
        },

        // Make it visible
        visible: true
      };

      console.log('Product data:', JSON.stringify(productData, null, 2));

      // Create the product
      const product = await wixStoresBackend.createProduct(productData);

      console.log('✅ Product created successfully:', product.id);

      // Return the product ID
      return {
        status: 200,
        body: {
          success: true,
          productId: product.id,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug
          }
        },
        headers: { 'Content-Type': 'application/json' }
      };

    } catch (error) {
      console.error('❌ Error creating Wix product:', error);
      console.error('Error stack:', error.stack);

      return {
        status: 500,
        body: {
          error: error.message || 'Failed to create product',
          details: error.toString(),
          stack: error.stack
        },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
);
