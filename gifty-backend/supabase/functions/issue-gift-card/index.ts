import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IssueRequest {
  businessId: string;
  amount: number;
  currency?: string;
  quantity?: number;
  customerEmail: string;
  customerName?: string;
  orderId?: string;
  lineItemId?: string;
  source?: string;
  expiresInDays?: number;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const body: IssueRequest = await req.json();
    const {
      businessId,
      amount,
      currency = 'USD',
      quantity = 1,
      customerEmail,
      customerName,
      orderId,
      lineItemId,
      source = 'manual',
      expiresInDays = 365,
      metadata = {}
    } = body;

    // Validate required fields
    if (!businessId || !amount || !customerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: businessId, amount, customerEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create customer
    let customer;
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('email', customerEmail.toLowerCase())
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('customers')
        .insert({
          email: customerEmail.toLowerCase(),
          name: customerName
        })
        .select()
        .single();

      if (customerError) {
        throw customerError;
      }
      customer = newCustomer;
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Generate gift cards
    const giftCards = [];
    for (let i = 0; i < quantity; i++) {
      // Generate unique code
      let code = null;
      try {
        const { data: codeData, error: codeError } = await supabaseClient
          .rpc('generate_gift_card_code');

        if (codeError) {
          console.error('RPC generate_gift_card_code failed:', codeError);
        } else {
          code = codeData;
        }
      } catch (rpcError) {
        console.error('Exception calling generate_gift_card_code:', rpcError);
      }

      // Fallback: generate code manually if RPC failed
      if (!code) {
        console.log('Using fallback code generation');
        const randomPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        code = `GIFT-${randomPart1}-${randomPart2}`;
      }

      // Create gift card
      const { data: giftCard, error: giftCardError } = await supabaseClient
        .from('gift_cards')
        .insert({
          code,
          business_id: businessId,
          customer_id: customer.id,
          amount,
          currency,
          remaining_balance: amount,
          status: 'issued',
          order_id: orderId,
          line_item_id: lineItemId,
          purchase_source: source,
          expires_at: expiresAt.toISOString(),
          metadata
        })
        .select()
        .single();

      if (giftCardError) {
        console.error('Error inserting gift card:', giftCardError);
        throw giftCardError;
      }

      // Log activity
      await supabaseClient.rpc('log_gift_card_activity', {
        p_gift_card_id: giftCard.id,
        p_code: code,
        p_type: 'issued',
        p_message: `Gift card issued for ${business.name} - $${amount}`,
        p_metadata: { source, orderId, lineItemId },
        p_performed_by: 'system'
      });

      // Create transaction record
      await supabaseClient
        .from('transactions')
        .insert({
          gift_card_id: giftCard.id,
          customer_id: customer.id,
          type: 'purchase',
          amount,
          currency,
          payment_provider: source,
          payment_id: orderId,
          description: `Gift card purchase for ${business.name}`
        });

      giftCards.push({
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.amount,
        currency: giftCard.currency,
        businessName: business.name,
        expiresAt: giftCard.expires_at
      });
    }

    // Email sending - Production mode enabled!
    // To disable emails, set DISABLE_EMAILS=true in secrets
    const disableEmails = Deno.env.get('DISABLE_EMAILS') === 'true';
    const testingMode = false; // Production mode - send to actual customers
    const testEmail = 'badbeats87@gmail.com'; // Only used if testingMode = true

    let emailStatus = 'not_attempted';
    let emailError = null;

    if (!disableEmails) {
      console.log('=== EMAIL SECTION START ===');
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      console.log('RESEND_API_KEY exists:', !!resendApiKey);
      console.log('Customer email:', customerEmail);
      console.log('Gift cards count:', giftCards.length);

      emailStatus = 'not_attempted';

      if (!resendApiKey) {
        console.error('ERROR: RESEND_API_KEY is not set!');
        emailStatus = 'no_api_key';
      }

      if (!customerEmail) {
        console.error('ERROR: customerEmail is not set!');
        emailStatus = 'no_email';
      }

      if (resendApiKey) {
      const emailTo = testingMode ? testEmail : customerEmail;
      console.log('=== SENDING EMAIL NOW ===');
      console.log('To:', emailTo, testingMode ? '(TESTING MODE)' : '');
      console.log('Customer:', customerEmail);
      emailStatus = 'attempting';
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GiftySV <giftcards@giftysv.com>',
            to: [emailTo],
            subject: `${testingMode ? '[TEST] ' : ''}Your ${business.name} Gift Card${giftCards.length > 1 ? 's' : ''}`,
            html: `
              ${testingMode ? `<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                <strong>⚠️ TESTING MODE</strong><br>
                Forward this email to: <strong>${customerEmail}</strong>
              </div>` : ''}
              <h2>Gift Card${giftCards.length > 1 ? 's' : ''} for ${business.name}</h2>
              <p><strong>Customer:</strong> ${customerName || 'Customer'} (${customerEmail})</p>
              <p>Thank you for your purchase! Here ${giftCards.length > 1 ? 'are' : 'is'} your gift card${giftCards.length > 1 ? 's' : ''}:</p>
              ${giftCards.map(card => `
                <div style="border: 2px solid #333; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3 style="margin: 0 0 10px 0;">Gift Card Code</h3>
                  <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${card.code}</p>
                  <p><strong>Amount:</strong> $${card.amount} ${card.currency}</p>
                  <p><strong>Expires:</strong> ${new Date(card.expiresAt).toLocaleDateString()}</p>
                </div>
              `).join('')}
              <p>To redeem, present this code at ${business.name}.</p>
              <p style="color: #666; font-size: 12px;">This is an automated email.</p>
            `
          })
        });

        console.log('Email API Response Status:', emailResponse.status);
        const responseText = await emailResponse.text();

        if (!emailResponse.ok) {
          console.error('=== EMAIL FAILED ===');
          console.error('Status:', emailResponse.status);
          console.error('Response:', responseText);
          emailStatus = 'failed';
          emailError = { status: emailResponse.status, response: responseText };
        } else {
          console.log('=== EMAIL SENT SUCCESSFULLY ===');
          console.log('Response:', responseText);
          emailStatus = 'sent';
        }
      } catch (err) {
        console.error('=== EMAIL EXCEPTION ===');
        console.error('Error:', err);
        console.error('Message:', err.message);
        emailStatus = 'error';
        emailError = err.message;
        // Don't fail the whole request if email fails
      }
      } else {
        console.log('=== EMAIL SKIPPED ===');
        console.log('Reason: No Resend API key');
        emailStatus = 'no_api_key';
      }
    } else {
      emailStatus = 'disabled';
    }

    return new Response(
      JSON.stringify({
        success: true,
        giftCards,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        },
        debug: {
          hasResendApiKey: !!Deno.env.get('RESEND_API_KEY'),
          customerEmail: customerEmail,
          giftCardsCount: giftCards.length,
          emailStatus: emailStatus,
          emailError: emailError
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error issuing gift cards:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});