import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Extract metadata
        const businessId = session.metadata?.businessId;
        const amount = session.metadata?.amount;
        const quantity = parseInt(session.metadata?.quantity || '1');
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name;

        if (!businessId || !amount || !customerEmail) {
          console.error('Missing required metadata in checkout session');
          break;
        }

        // Issue gift cards
        const issueResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/issue-gift-card`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId,
              amount: parseFloat(amount),
              quantity,
              customerEmail,
              customerName,
              orderId: session.id,
              source: 'stripe',
              metadata: {
                sessionId: session.id,
                paymentIntent: session.payment_intent
              }
            })
          }
        );

        if (!issueResponse.ok) {
          throw new Error(`Failed to issue gift cards: ${await issueResponse.text()}`);
        }

        const issueData = await issueResponse.json();

        // Send email with gift cards
        const emailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-gift-card-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerEmail,
              customerName,
              giftCards: issueData.giftCards,
              orderId: session.id
            })
          }
        );

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        }

        break;
      }

      case 'payment_intent.succeeded': {
        console.log('Payment succeeded:', event.data.object.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('Payment failed:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
