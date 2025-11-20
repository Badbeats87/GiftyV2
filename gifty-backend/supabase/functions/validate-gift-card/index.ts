import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  code: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const body: ValidateRequest = await req.json();
    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Gift card code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Find gift card
    const { data: giftCard, error: giftCardError } = await supabaseClient
      .from('gift_cards')
      .select(`
        *,
        business:businesses (
          id,
          name,
          slug,
          description,
          logo_url
        ),
        customer:customers (
          email,
          name
        )
      `)
      .eq('code', normalizedCode)
      .single();

    if (giftCardError || !giftCard) {
      // Log validation attempt
      await supabaseClient.rpc('log_gift_card_activity', {
        p_gift_card_id: null,
        p_code: normalizedCode,
        p_type: 'validation_failed',
        p_message: 'Validation failed - code not found',
        p_performed_by: 'system'
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Gift card not found'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(giftCard.expires_at);
    const isExpired = expiresAt < now;

    // Check if already redeemed
    const isRedeemed = giftCard.status === 'redeemed' || giftCard.remaining_balance === 0;

    // Determine validity
    const isValid = !isExpired && !isRedeemed && giftCard.status === 'issued';

    // Log validation
    await supabaseClient.rpc('log_gift_card_activity', {
      p_gift_card_id: giftCard.id,
      p_code: normalizedCode,
      p_type: 'validated',
      p_message: `Validation ${isValid ? 'successful' : 'failed'} - ${
        isExpired ? 'expired' : isRedeemed ? 'already redeemed' : 'valid'
      }`,
      p_performed_by: 'system'
    });

    return new Response(
      JSON.stringify({
        valid: isValid,
        giftCard: {
          id: giftCard.id,
          code: giftCard.code,
          amount: giftCard.amount,
          remainingBalance: giftCard.remaining_balance,
          currency: giftCard.currency,
          status: giftCard.status,
          issuedAt: giftCard.issued_at,
          expiresAt: giftCard.expires_at,
          redeemedAt: giftCard.redeemed_at,
          business: giftCard.business,
          isExpired,
          isRedeemed
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error validating gift card:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
