import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  customerEmail: string;
  customerName?: string;
  giftCards: Array<{
    code: string;
    amount: number;
    currency: string;
    businessName: string;
    expiresAt: string;
  }>;
  orderId?: string;
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

    const body: EmailRequest = await req.json();
    const { customerEmail, customerName, giftCards, orderId } = body;

    if (!customerEmail || !giftCards || giftCards.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email service configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourgiftcards.com';
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://yoursite.com';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build email HTML
    const giftCardsHtml = giftCards.map(card => `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 10px 0;">
        <h3 style="margin: 0 0 10px 0; color: #111827;">${card.businessName}</h3>
        <div style="background: white; border: 2px dashed #d1d5db; border-radius: 4px; padding: 15px; margin: 10px 0; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; font-family: monospace; color: #059669; letter-spacing: 2px;">
            ${card.code}
          </div>
        </div>
        <p style="margin: 10px 0; color: #6b7280;">
          <strong>Amount:</strong> $${card.amount.toFixed(2)} ${card.currency}<br>
          <strong>Expires:</strong> ${new Date(card.expiresAt).toLocaleDateString()}
        </p>
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #111827; margin: 0;">Your Gift Cards Are Here!</h1>
          </div>

          <div style="background: white; border-radius: 8px; padding: 20px;">
            <p style="font-size: 16px; color: #374151;">
              Hi ${customerName || 'there'},
            </p>
            <p style="font-size: 16px; color: #374151;">
              Thank you for your purchase! Here ${giftCards.length === 1 ? 'is' : 'are'} your gift ${giftCards.length === 1 ? 'card' : 'cards'}:
            </p>

            ${giftCardsHtml}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #111827;">How to Use Your Gift Card${giftCards.length > 1 ? 's' : ''}</h3>
              <ol style="color: #6b7280; padding-left: 20px;">
                <li>Visit the participating business</li>
                <li>Present your gift card code at checkout</li>
                <li>The amount will be applied to your purchase</li>
              </ol>
            </div>

            ${orderId ? `
              <p style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 4px; font-size: 14px; color: #6b7280;">
                <strong>Order ID:</strong> ${orderId}
              </p>
            ` : ''}

            <div style="margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px;">
                Questions? Contact us at ${fromEmail}
              </p>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This email was sent because you purchased a gift card.</p>
            <p>&copy; ${new Date().getFullYear()} Your Gift Cards. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: customerEmail,
        subject: `Your Gift Card${giftCards.length > 1 ? 's' : ''} - ${giftCards.map(c => c.businessName).join(', ')}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email send failed: ${errorText}`);
    }

    const emailData = await emailResponse.json();

    // Update sent_at timestamp for all gift cards
    for (const card of giftCards) {
      const { data: giftCardData } = await supabaseClient
        .from('gift_cards')
        .select('id')
        .eq('code', card.code)
        .single();

      if (giftCardData) {
        await supabaseClient
          .from('gift_cards')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', giftCardData.id);

        // Log activity
        await supabaseClient.rpc('log_gift_card_activity', {
          p_gift_card_id: giftCardData.id,
          p_code: card.code,
          p_type: 'email_sent',
          p_message: `Gift card emailed to ${customerEmail}`,
          p_performed_by: 'system'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
        sentTo: customerEmail,
        cardCount: giftCards.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
