import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  email: string;
  userName: string;
  vehicleName: string;
  vehicleCategory: string;
  startTime: string;
  endTime: string;
  pickupAddress: string;
  totalPrice: number;
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.log("Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user:", userId);

    const {
      email,
      userName,
      vehicleName,
      vehicleCategory,
      startTime,
      endTime,
      pickupAddress,
      totalPrice,
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending confirmation to:", email);
    console.log("Booking details:", { vehicleName, startTime, endTime, totalPrice });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EV Carsharing <onboarding@resend.dev>",
        to: [email],
        subject: `Buchungsbestätigung: ${vehicleName}`,
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
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px 16px 0 0; padding: 32px;">
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Buchung bestätigt!</h1>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td>
                          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                            Hallo ${userName || 'Kunde'},
                          </p>
                          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                            Vielen Dank für deine Buchung! Hier sind die Details:
                          </p>
                          
                          <!-- Vehicle Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <tr>
                              <td>
                                <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                                  ${vehicleName}
                                </h2>
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">${vehicleCategory}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Details -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Start:</strong>
                                <span style="color: #6b7280; float: right;">${formatDateTime(startTime)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Ende:</strong>
                                <span style="color: #6b7280; float: right;">${formatDateTime(endTime)}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <strong style="color: #374151;">Abholung:</strong>
                                <span style="color: #6b7280; float: right;">${pickupAddress}</span>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Price -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 20px;">
                            <tr>
                              <td>
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Geschätzter Gesamtpreis</p>
                                <p style="color: white; margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">${totalPrice.toFixed(2)} EUR</p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                            Du kannst deine Buchung jederzeit in der App verwalten.
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
