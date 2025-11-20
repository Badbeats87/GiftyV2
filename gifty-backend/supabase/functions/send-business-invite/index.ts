import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  invitedBy: string;
  message?: string;
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
    const body: InviteRequest = await req.json();
    const { email, invitedBy, message } = body;

    // Validate required fields
    if (!email || !invitedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, invitedBy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already has a pending invite
    const { data: existingInvites, error: checkError } = await supabaseClient
      .from('business_invites')
      .select('id, status, expires_at')
      .eq('email', email.toLowerCase())
      .in('status', ['pending'])
      .gt('expires_at', new Date().toISOString());

    if (checkError) {
      throw checkError;
    }

    if (existingInvites && existingInvites.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'This email already has a pending invite',
          invite: existingInvites[0]
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create invite using database function
    const { data: inviteData, error: inviteError } = await supabaseClient
      .rpc('create_business_invite', {
        p_email: email.toLowerCase(),
        p_invited_by: invitedBy,
        p_message: message || null
      });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      throw inviteError;
    }

    // Fetch the created invite to get the token
    const { data: invite, error: fetchError } = await supabaseClient
      .from('business_invites')
      .select('*')
      .eq('id', inviteData)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Build registration URL
    const baseUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
    const registrationUrl = `${baseUrl}/register/${invite.invite_token}`;

    // Send email via Wix Triggered Emails (or Resend if configured)
    const sendEmail = Deno.env.get('SEND_EMAILS') !== 'false';

    if (sendEmail) {
      console.log('📧 Sending business invite email...');

      // For now, we'll use a simple approach - you can integrate with Resend or Wix later
      const resendApiKey = Deno.env.get('RESEND_API_KEY');

      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'GiftySV <giftcards@giftysv.com>',
              to: [email],
              subject: 'Invitation to Join GiftySV as a Business Partner',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #333;">You're Invited to Join GiftySV!</h1>

                  <p style="font-size: 16px; line-height: 1.6;">
                    Hello,
                  </p>

                  <p style="font-size: 16px; line-height: 1.6;">
                    You've been invited to join GiftySV as a business partner. GiftySV helps businesses
                    offer digital gift cards to their customers through our easy-to-use platform.
                  </p>

                  ${message ? `
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                      <strong>Personal message from ${invitedBy}:</strong>
                      <p style="margin: 10px 0 0 0;">${message}</p>
                    </div>
                  ` : ''}

                  <p style="font-size: 16px; line-height: 1.6;">
                    Click the button below to complete your registration:
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${registrationUrl}"
                       style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px; display: inline-block;">
                      Complete Registration
                    </a>
                  </div>

                  <p style="font-size: 14px; color: #666;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${registrationUrl}" style="color: #4CAF50;">${registrationUrl}</a>
                  </p>

                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    This invitation will expire in 7 days.
                  </p>

                  <p style="font-size: 14px; color: #666;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>

                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                  <p style="font-size: 12px; color: #999; text-align: center;">
                    GiftySV - Digital Gift Cards Made Simple
                  </p>
                </div>
              `
            })
          });

          if (emailResponse.ok) {
            console.log('✅ Invite email sent successfully');
          } else {
            const errorText = await emailResponse.text();
            console.error('❌ Failed to send email:', errorText);
          }
        } catch (emailError) {
          console.error('❌ Email error:', emailError);
          // Don't fail the whole request if email fails
        }
      } else {
        console.log('⚠️  RESEND_API_KEY not set, skipping email');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          token: invite.invite_token,
          registrationUrl: registrationUrl,
          expiresAt: invite.expires_at
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending business invite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
