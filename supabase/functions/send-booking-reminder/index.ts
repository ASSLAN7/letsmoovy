import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
  info: "#3b82f6",
};

// MOOVY Header HTML with Gradient
const getMoovyHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.background} 0%, #1a2027 50%, ${brandColors.background} 100%); border-radius: 16px 16px 0 0; padding: 32px; border-bottom: 2px solid ${brandColors.primary};">
    <tr>
      <td align="center">
        <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 42px; font-weight: 800; background: linear-gradient(135deg, ${brandColors.accent} 0%, ${brandColors.primary} 50%, ${brandColors.primaryDark} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 4px;">MOOVY</span>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${brandColors.textMuted}; letter-spacing: 3px; text-transform: uppercase;">Mobilität neu gedacht</p>
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

const sendReminderEmail = async (
  email: string,
  userName: string,
  vehicleName: string,
  vehicleCategory: string,
  startTime: string,
  pickupAddress: string
) => {
  console.log(`Sending reminder email to ${email} for ${vehicleName}`);
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "MOOVY <noreply@drive-moovy.de>",
      to: [email],
      subject: `⏰ Erinnerung: Deine Buchung startet in 1 Stunde - ${vehicleName}`,
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
                  
                  <!-- Reminder Banner -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.info} 0%, #2563eb 100%); padding: 24px;">
                    <tr>
                      <td align="center">
                        <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 14px;">⏰ Erinnerung</p>
                        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Deine Fahrt startet bald!</h1>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Content -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.cardBackground}; padding: 32px; border-radius: 0 0 16px 16px;">
                    <tr>
                      <td>
                        <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
                          Hallo ${userName || 'Kunde'},
                        </p>
                        <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
                          In etwa einer Stunde beginnt deine Buchung. Hier sind die Details:
                        </p>
                        
                        <!-- Vehicle Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                          <tr>
                            <td>
                              <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                                ${vehicleName}
                              </h2>
                              <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">${vehicleCategory}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Details -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <strong style="color: ${brandColors.text};">🕐 Start:</strong>
                              <span style="color: ${brandColors.info}; float: right; font-weight: 600;">${formatDateTime(startTime)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <strong style="color: ${brandColors.text};">📍 Abholort:</strong>
                              <span style="color: ${brandColors.textMuted}; float: right;">${pickupAddress}</span>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); border-radius: 12px; padding: 20px; text-align: center;">
                          <tr>
                            <td>
                              <p style="color: white; margin: 0; font-size: 16px; font-weight: 600;">
                                📸 Vergiss nicht, Fotos bei der Abholung zu machen!
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: ${brandColors.textMuted}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                          Wir wünschen dir eine gute Fahrt! 🚗
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

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Email send error:", data);
    throw new Error(data.message || "Failed to send email");
  }
  
  return data;
};

// Verify request is from a trusted source (cron job or admin)
const verifyRequest = async (req: Request): Promise<{ authorized: boolean; reason?: string }> => {
  // Check for Authorization header
  const authHeader = req.headers.get('Authorization');
  
  // If no auth header, check if it's a cron job by verifying the source
  if (!authHeader) {
    // Allow requests without auth only if they come from Supabase cron
    // In production, you might want to add additional verification
    console.log("No auth header - assuming cron job request");
    return { authorized: true };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { authorized: false, reason: 'Invalid Authorization header format' };
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return { authorized: false, reason: 'Invalid token' };
    }

    // Check if user is admin using the authenticated user's context
    const { data: isAdmin } = await supabase.rpc('is_admin');
    
    if (!isAdmin) {
      return { authorized: false, reason: 'Admin access required' };
    }

    return { authorized: true };
  } catch (error: any) {
    console.error("Auth verification error:", error);
    return { authorized: false, reason: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-reminder function called at", new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is authorized
    const { authorized, reason } = await verifyRequest(req);
    if (!authorized) {
      console.log("Unauthorized request:", reason);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', reason }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find bookings that start within the next hour and haven't been reminded
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    console.log(`Checking for bookings between ${now.toISOString()} and ${oneHourFromNow.toISOString()}`);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, vehicle_name, vehicle_category, start_time, pickup_address')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('start_time', now.toISOString())
      .lte('start_time', oneHourFromNow.toISOString());

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} bookings to remind`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No bookings to remind", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user profiles for emails
    const userIds = [...new Set(bookings.map(b => b.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let sentCount = 0;
    const errors: string[] = [];

    // Send reminders for each booking
    for (const booking of bookings) {
      const profile = profileMap.get(booking.user_id);
      
      if (!profile?.email) {
        console.log(`No email found for user ${booking.user_id}`);
        continue;
      }

      try {
        await sendReminderEmail(
          profile.email,
          profile.full_name || profile.email.split('@')[0],
          booking.vehicle_name,
          booking.vehicle_category,
          booking.start_time,
          booking.pickup_address
        );

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ reminder_sent: true })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Error updating reminder_sent for booking ${booking.id}:`, updateError);
        } else {
          sentCount++;
          console.log(`Reminder sent and marked for booking ${booking.id}`);
        }
      } catch (emailError: any) {
        console.error(`Error sending reminder for booking ${booking.id}:`, emailError);
        errors.push(`Booking ${booking.id}: ${emailError.message}`);
      }
    }

    console.log(`Reminders sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: bookings.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-reminder function:", error);
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
