/**
 * Wix HTTP Function: createWixProduct
 *
 * This function creates a gift card product in Wix Stores when a business is approved.
 *
 * SETUP IN WIX:
 * 1. Go to Wix Editor → Code Files → Backend
 * 2. Create new file: http-functions.js (or add to existing)
 * 3. Paste this code
 * 4. Publish your site
 *
 * The function will be accessible at:
 * https://yoursite.com/_functions/createWixProduct
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

      // Create the product in Wix Stores
      const product = await wixStoresBackend.createProduct({
        name: name,
        productType: 'digital', // Gift cards are digital products
        description: description || `Gift card for ${name}`,

        // Price options - gift cards typically have variable pricing
        priceData: {
          price: price || 100,
          currency: 'USD',
          formatted: {
            price: `$${price || 100}`,
            discountedPrice: `$${price || 100}`
          }
        },

        // Product options for different denominations
        productOptions: [
          {
            optionType: 'drop_down',
            name: 'Gift Card Amount',
            selections: [
              { value: '25', description: '$25', key: 'amount_25' },
              { value: '50', description: '$50', key: 'amount_50' },
              { value: '100', description: '$100', key: 'amount_100' },
              { value: '150', description: '$150', key: 'amount_150' },
              { value: '200', description: '$200', key: 'amount_200' }
            ]
          }
        ],

        // Inventory - digital products don't need inventory tracking
        stock: {
          trackInventory: false,
          inStock: true
        },

        // Custom fields to link back to our business
        customTextFields: [
          {
            title: 'Business ID',
            mandatory: false,
            maxLength: 100
          }
        ],

        // Metadata to store business ID
        additionalInfoSections: [
          {
            title: 'Internal Info',
            description: `Business ID: ${businessId}`
          }
        ],

        // Make it visible in the store
        visible: true
      });

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

/**
 * ALTERNATIVE: If you want to use the Wix Stores API directly (more flexible)
 *
 * You'll need to:
 * 1. Install @wix/stores npm package
 * 2. Use the Stores API with proper authentication
 *
 * Example:
 */

/*
import { products } from '@wix/stores';

export const post_createWixProductAdvanced = webMethod(
  Permissions.Anyone,
  async (request) => {
    const { name, description, price, businessId } = await request.body.json();

    const productData = {
      product: {
        name: name,
        productType: 'digital',
        description: description,
        priceData: {
          price: price,
          currency: 'USD'
        },
        customTextFields: [{
          title: 'Business ID',
          mandatory: false
        }],
        visible: true
      }
    };

    const result = await products.createProduct(productData);

    return {
      status: 200,
      body: { productId: result.product.id },
      headers: { 'Content-Type': 'application/json' }
    };
  }
);
*/
