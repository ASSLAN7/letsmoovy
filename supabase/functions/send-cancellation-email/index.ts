import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  bookingId: string;
}

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-cancellation-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's auth context
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user token
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !userData?.user) {
      console.log("Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user:", userId);

    // Parse request - only accept bookingId
    const { bookingId }: CancellationEmailRequest = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing bookingId' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create service role client for database queries
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch booking from database and verify ownership
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.log("Booking not found:", bookingError?.message);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the authenticated user owns this booking
    if (booking.user_id !== userId) {
      console.log("User does not own this booking. User:", userId, "Booking owner:", booking.user_id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You do not own this booking' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch user profile for email and name
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.email) {
      console.log("Profile not found or missing email:", profileError?.message);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = profile.email;
    const userName = profile.full_name || email.split('@')[0];

    console.log("Sending cancellation email to:", email);
    console.log("Cancelled booking:", { 
      vehicleName: booking.vehicle_name, 
      startTime: booking.start_time, 
      endTime: booking.end_time 
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EV Carsharing <onboarding@resend.dev>",
        to: [email],
        subject: `Buchung storniert: ${booking.vehicle_name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                  <td>
                    <!-- Header -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px 16px 0 0; padding: 32px;">
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Buchung storniert</h1>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td>
                          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                            Hallo ${userName},
                          </p>
                          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                            Deine Buchung wurde erfolgreich storniert. Hier sind die Details der stornierten Buchung:
                          </p>
                          
                          <!-- Vehicle Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <tr>
                              <td>
                                <p style="color: #dc2626; margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Storniert</p>
                                <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                                  ${booking.vehicle_name}
                                </h2>
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">${booking.vehicle_category}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Details -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Geplanter Start:</strong>
                                <span style="color: #6b7280; float: right;">${formatDateTime(booking.start_time)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Geplantes Ende:</strong>
                                <span style="color: #6b7280; float: right;">${formatDateTime(booking.end_time)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Abholort:</strong>
                                <span style="color: #6b7280; float: right;">${booking.pickup_address}</span>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                            Du kannst jederzeit eine neue Buchung in der App erstellen.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
                      <tr>
                        <td align="center">
                          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            2025 EV Carsharing. Alle Rechte vorbehalten.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();
    console.log("Email API response:", data);

    if (!emailResponse.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-cancellation-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
