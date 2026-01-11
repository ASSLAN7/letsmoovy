import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const handler = async (req: Request): Promise<Response> => {
  console.log("send-test-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending test email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MOOVY <noreply@drive-moovy.de>",
        to: [email],
        subject: "MOOVY Test E-Mail",
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
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.background} 0%, #1a2027 50%, ${brandColors.background} 100%); border-radius: 16px 16px 0 0; padding: 32px; border-bottom: 2px solid ${brandColors.primary};">
                      <tr>
                        <td align="center">
                          <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 42px; font-weight: 800; background: linear-gradient(135deg, ${brandColors.accent} 0%, ${brandColors.primary} 50%, ${brandColors.primaryDark} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 4px;">MOOVY</span>
                          <p style="margin: 12px 0 0 0; font-size: 12px; color: ${brandColors.textMuted}; letter-spacing: 3px; text-transform: uppercase;">Mobilität neu gedacht</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Success Banner -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); padding: 24px;">
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🧪 Test E-Mail</h1>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.cardBackground}; padding: 32px; border-radius: 0 0 16px 16px;">
                      <tr>
                        <td>
                          <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
                            Hallo,
                          </p>
                          <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
                            Dies ist eine Test-E-Mail von MOOVY. Wenn du diese E-Mail erhältst, funktioniert das E-Mail-System einwandfrei! ✅
                          </p>
                          
                          <!-- Info Box -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.background}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <tr>
                              <td>
                                <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                                  E-Mail-System aktiv
                                </h2>
                                <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">
                                  Gesendet am: ${new Date().toLocaleString('de-DE', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: ${brandColors.textMuted}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                            Viel Spaß mit MOOVY! 🚗
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Footer -->
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
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
