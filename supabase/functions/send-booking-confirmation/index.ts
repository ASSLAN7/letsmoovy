import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// MOOVY Brand Colors
const brandColors = {
  primary: "#14b8a6",
  primaryDark: "#0d9488",
  accent: "#2dd4bf",
  background: "#0f1114",
  cardBackground: "#171b20",
  text: "#ffffff",
  textMuted: "#94a3b8",
};

// MOOVY Logo Header HTML
const getMoovyHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${brandColors.background}; border-radius: 16px 16px 0 0; padding: 24px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="vertical-align: middle; padding-right: 12px;">
              <svg width="48" height="48" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${brandColors.accent};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${brandColors.primary};stop-opacity:1" />
                  </linearGradient>
                </defs>
                <path d="M20,95 C15,70 20,40 35,25 C50,10 65,15 60,40 C55,60 40,70 35,55 C30,40 40,25 55,30 C70,35 75,25 85,15 C100,5 105,25 100,45 C95,65 80,70 75,55 C70,40 80,30 85,40" 
                      fill="none" 
                      stroke="url(#logoGradient)" 
                      stroke-width="18" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"/>
              </svg>
            </td>
            <td style="vertical-align: middle;">
              <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; font-weight: 700; color: ${brandColors.primary}; letter-spacing: 1px;">MOOVY</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// MOOVY Footer HTML
const getMoovyFooter = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
    <tr>
      <td align="center">
        <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} MOOVY. Alle Rechte vorbehalten.
        </p>
        <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 8px 0 0 0;">
          Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.
        </p>
      </td>
    </tr>
  </table>
`;

interface BookingConfirmationRequest {
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
  console.log("send-booking-confirmation function called");

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
    const { bookingId }: BookingConfirmationRequest = await req.json();

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

    console.log("Sending confirmation to:", email);
    console.log("Booking details:", { 
      vehicleName: booking.vehicle_name, 
      startTime: booking.start_time, 
      endTime: booking.end_time, 
      totalPrice: booking.total_price 
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MOOVY <noreply@drive-moovy.de>",
        to: [email],
        subject: `Buchungsbestätigung: ${booking.vehicle_name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${brandColors.background};">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                  <td>
                    <!-- Header with MOOVY Logo -->
                    ${getMoovyHeader()}
                    
                    <!-- Success Banner -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); padding: 24px;">
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">✓ Buchung bestätigt!</h1>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.cardBackground}; padding: 32px; border-radius: 0 0 16px 16px;">
                      <tr>
                        <td>
                          <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
                            Hallo ${userName},
                          </p>
                          <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
                            Vielen Dank für deine Buchung! Hier sind die Details:
                          </p>
                          
                          <!-- Vehicle Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.background}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <tr>
                              <td>
                                <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                                  ${booking.vehicle_name}
                                </h2>
                                <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">${booking.vehicle_category}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Details -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <strong style="color: ${brandColors.text};">Start:</strong>
                                <span style="color: ${brandColors.textMuted}; float: right;">${formatDateTime(booking.start_time)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <strong style="color: ${brandColors.text};">Ende:</strong>
                                <span style="color: ${brandColors.textMuted}; float: right;">${formatDateTime(booking.end_time)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <strong style="color: ${brandColors.text};">Abholung:</strong>
                                <span style="color: ${brandColors.textMuted}; float: right;">${booking.pickup_address}</span>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Price -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); border-radius: 12px; padding: 20px;">
                            <tr>
                              <td>
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Geschätzter Gesamtpreis</p>
                                <p style="color: white; margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">${booking.total_price?.toFixed(2) || '0.00'} €</p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: ${brandColors.textMuted}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                            Du kannst deine Buchung jederzeit in der App verwalten.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Footer -->
                    ${getMoovyFooter()}
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
    console.error("Error in send-booking-confirmation function:", error);
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
