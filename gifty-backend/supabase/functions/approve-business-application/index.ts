import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ApproveRejectRequest {
  applicationId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  ownerUserId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: ApproveRejectRequest = await req.json();
    const { applicationId, status, rejectionReason, ownerUserId } = body;

    if (!applicationId || !status) {
      return new Response(JSON.stringify({ error: 'Missing applicationId or status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (status !== 'approved' && status !== 'rejected') {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: application, error: fetchError } = await supabaseClient
      .from('business_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (application.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Application already ${application.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let businessData = null;
    let wixDebugInfo = null;
    
    // --- Final Debugging for Token ---
    const wixApiToken = Deno.env.get('WIX_API_TOKEN');
    const wixFunctionUrl = Deno.env.get('WIX_CREATE_PRODUCT_URL');
    const tokenExists = !!wixApiToken;
    const tokenPrefix = wixApiToken ? wixApiToken.substring(0, 5) : null;
    // --- End Final Debugging ---
    const wixSiteId = Deno.env.get('WIX_SITE_ID');
    const wixAccountId = Deno.env.get('WIX_ACCOUNT_ID');
    const wixInstanceId = Deno.env.get('WIX_INSTANCE_ID');

    const generateUniqueSlug = async (name: string): Promise<string> => {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
      let slug = baseSlug;
      let i = 1;
      while (true) {
        const { data, error } = await supabaseClient.from('businesses').select('slug').eq('slug', slug).maybeSingle();
        if (error) throw error;
        if (!data) return slug;
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        i++;
      }
    };

    if (status === 'approved') {
      const uniqueSlug = await generateUniqueSlug(application.business_name);
      const { data: newBusiness, error: businessCreateError } = await supabaseClient
        .from('businesses')
        .insert({
          name: application.business_name,
          slug: uniqueSlug,
          contact_email: application.contact_email,
          contact_name: application.contact_name,
          iban: application.iban,
          status: 'active',
          owner_user_id: ownerUserId || null,
        })
        .select()
        .single();

      if (businessCreateError) throw businessCreateError;
      businessData = newBusiness;

      if (wixFunctionUrl) {
        try {
          const wixFunctionResponse = await fetch(wixFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `${application.business_name} Gift Card`,
              description: `Gift card for ${application.business_name}. Purchase different amounts by selecting an option.`,
              businessId: newBusiness.id,
            })
          });

          const wixFunctionText = await wixFunctionResponse.text();
          let wixFunctionData;
          try {
            wixFunctionData = JSON.parse(wixFunctionText || '{}');
          } catch (parseError) {
            console.error('Failed to parse Wix function response:', wixFunctionText);
            return new Response(
              JSON.stringify({
                error: 'Failed to parse Wix function response.',
                details: parseError.message,
                raw_response: wixFunctionText,
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          wixDebugInfo = wixFunctionData;

          if (!wixFunctionResponse.ok) {
            return new Response(
              JSON.stringify({
                error: 'Failed to create Wix product via site function.',
                wix_status: wixFunctionResponse.status,
                wix_response: wixFunctionData,
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const wixProductId = wixFunctionData.productId || wixFunctionData.product?.id;
          if (wixProductId) {
            await supabaseClient
              .from('businesses')
              .update({ wix_product_id: wixProductId })
              .eq('id', newBusiness.id);

            businessData.wix_product_id = wixProductId;
          }
        } catch (functionError) {
          console.error('Error calling Wix create product function:', functionError);
          return new Response(
            JSON.stringify({
              error: 'An unexpected error occurred when calling the Wix function.',
              details: functionError.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (wixApiToken) {
        const authHeaderValue = wixApiToken.startsWith('Bearer ')
          ? wixApiToken
          : `Bearer ${wixApiToken}`;
        try {
          // Gift card amounts and pricing (amount + $3 processing fee)
          const giftAmounts = [
            { amount: 25, price: 28 },
            { amount: 50, price: 53 },
            { amount: 75, price: 78 },
            { amount: 100, price: 103 },
            { amount: 125, price: 128 },
            { amount: 150, price: 153 }
          ];

          // Wix v3 API structure with options - based on official docs
          const productPayload = {
            product: {
              name: `${application.business_name} Gift Card`,
              productType: 'PHYSICAL',
              visible: false, // Hidden by default until business owner reviews
              physicalProperties: {},
              options: [
                {
                  name: 'Gift Amount',
                  optionRenderType: 'TEXT_CHOICES',
                  choicesSettings: {
                    choices: giftAmounts.map(ga => ({
                      choiceType: 'CHOICE_TEXT',
                      name: `$${ga.amount}`
                    }))
                  }
                }
              ],
              variantsInfo: {
                variants: giftAmounts.map(ga => ({
                  visible: true,
                  choices: [
                    {
                      optionChoiceNames: {
                        optionName: 'Gift Amount',
                        choiceName: `$${ga.amount}`,
                        renderType: 'TEXT_CHOICES'
                      }
                    }
                  ],
                  price: {
                    actualPrice: {
                      amount: ga.price.toString()
                    }
                  },
                  inventoryItem: {
                    inStock: true
                  },
                  physicalProperties: {}
                }))
              }
            }
          };

          console.log('Wix API payload:', JSON.stringify(productPayload, null, 2));

          const wixRequestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': authHeaderValue,
          };
          if (wixSiteId) wixRequestHeaders['wix-site-id'] = wixSiteId;
          if (wixAccountId) wixRequestHeaders['wix-account-id'] = wixAccountId;
          if (wixInstanceId) wixRequestHeaders['wix-instance-id'] = wixInstanceId;

          console.log('Wix API headers:', JSON.stringify({...wixRequestHeaders, Authorization: `${authHeaderValue.substring(0, 20)}...`}));

          const wixProductResponse = await fetch('https://www.wixapis.com/stores/v3/products-with-inventory', {
            method: 'POST',
            headers: wixRequestHeaders,
            body: JSON.stringify(productPayload),
          });

          const wixProductData = await wixProductResponse.json();
          wixDebugInfo = wixProductData;

          console.log('Wix API response status:', wixProductResponse.status);
          console.log('Wix API response:', JSON.stringify(wixProductData, null, 2));

          if (!wixProductResponse.ok) {
            console.error(`Failed to create Wix product: ${wixProductResponse.status}`, wixProductData);
            return new Response(
              JSON.stringify({
                error: 'Failed to create Wix product.',
                wix_status: wixProductResponse.status,
                wix_response: wixProductData,
                payload: productPayload,
                headers: {...wixRequestHeaders, Authorization: 'REDACTED'}
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // V1 API returns the product directly
          const wixProductId = wixProductData.product?.id;

          if (wixProductId) {
            await supabaseClient
              .from('businesses')
              .update({ wix_product_id: wixProductId })
              .eq('id', newBusiness.id);

            businessData.wix_product_id = wixProductId;
            console.log(`Wix product created and linked: ${wixProductId}`);
          } else {
             console.error('Wix API response did not contain a product ID.');
          }
        } catch (wixError: unknown) {
          const errorMessage = wixError instanceof Error ? wixError.message : String(wixError);
          console.error('Error calling Wix REST API:', wixError);
          return new Response(
            JSON.stringify({
              error: 'An unexpected error occurred when calling the Wix API.',
              details: errorMessage,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.warn('WIX_API_TOKEN environment variable not set. Skipping Wix product creation.');
      }
    }

    const { data: updatedApplication, error: updateError } = await supabaseClient
      .from('business_applications')
      .update({
        status: status,
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === 'rejected' ? rejectionReason : null,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, application: updatedApplication, business: businessData, wixDebugInfo, tokenExists, tokenPrefix }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing business application:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
