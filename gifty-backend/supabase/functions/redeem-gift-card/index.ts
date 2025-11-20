import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemRequest {
  code: string;
  redeemedBy?: string;
  redemptionNotes?: string;
  partialAmount?: number; // Optional: for partial redemptions
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

    const body: RedeemRequest = await req.json();
    const { code, redeemedBy, redemptionNotes, partialAmount } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Gift card code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find gift card
    const { data: giftCard, error: giftCardError } = await supabaseClient
      .from('gift_cards')
      .select(`
        *,
        business:businesses (
          id,
          name,
          slug
        )
      `)
      .eq('code', normalizedCode)
      .single();

    if (giftCardError || !giftCard) {
      return new Response(
        JSON.stringify({ error: 'Gift card not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(giftCard.expires_at);
    if (expiresAt < now) {
      return new Response(
        JSON.stringify({ error: 'Gift card has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already fully redeemed
    if (giftCard.remaining_balance === 0) {
      return new Response(
        JSON.stringify({ error: 'Gift card has already been fully redeemed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate redemption amount
    const redemptionAmount = partialAmount
      ? Math.min(partialAmount, giftCard.remaining_balance)
      : giftCard.remaining_balance;

    const newBalance = giftCard.remaining_balance - redemptionAmount;
    const isFullyRedeemed = newBalance === 0;

    // Update gift card
    const updateData: any = {
      remaining_balance: newBalance,
      updated_at: new Date().toISOString()
    };

    if (isFullyRedeemed) {
      updateData.status = 'redeemed';
      updateData.redeemed_at = new Date().toISOString();
      updateData.redeemed_by = redeemedBy || 'unknown';
      updateData.redemption_notes = redemptionNotes;
    }

    const { data: updatedCard, error: updateError } = await supabaseClient
      .from('gift_cards')
      .update(updateData)
      .eq('id', giftCard.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log redemption
    await supabaseClient.rpc('log_gift_card_activity', {
      p_gift_card_id: giftCard.id,
      p_code: normalizedCode,
      p_type: 'redeemed',
      p_message: `${isFullyRedeemed ? 'Fully' : 'Partially'} redeemed - $${redemptionAmount} at ${giftCard.business.name}`,
      p_metadata: {
        redemptionAmount,
        newBalance,
        redeemedBy,
        redemptionNotes
      },
      p_performed_by: redeemedBy || 'system'
    });

    // Create transaction record
    await supabaseClient
      .from('transactions')
      .insert({
        gift_card_id: giftCard.id,
        customer_id: giftCard.customer_id,
        type: 'redemption',
        amount: redemptionAmount,
        currency: giftCard.currency,
        description: `Redemption at ${giftCard.business.name}`,
        metadata: {
          redeemedBy,
          redemptionNotes,
          previousBalance: giftCard.remaining_balance,
          newBalance
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        redemption: {
          code: updatedCard.code,
          redeemedAmount: redemptionAmount,
          remainingBalance: newBalance,
          fullyRedeemed: isFullyRedeemed,
          business: giftCard.business.name,
          redeemedAt: updateData.redeemed_at || new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
