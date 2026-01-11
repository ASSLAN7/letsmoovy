import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MOOVY Brand Colors (Türkis)
const brandColors = {
  primary: "#14b8a6", // Türkis
  primaryDark: "#0d9488",
  background: "#0f1114",
  cardBackground: "#171b20",
  text: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#2dd4bf", // Helles Türkis
};

// Generate MOOVY branded email template
function generateEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${brandColors.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 30px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; color: ${brandColors.text}; letter-spacing: -1px;">
                MOOVY
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); letter-spacing: 2px; text-transform: uppercase;">
                Premium Carsharing
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: ${brandColors.cardBackground}; border-radius: 0 0 16px 16px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: ${brandColors.textMuted};">
                © ${new Date().getFullYear()} MOOVY. Alle Rechte vorbehalten.
              </p>
              <p style="margin: 0; font-size: 12px; color: ${brandColors.textMuted};">
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
  `;
}

// Confirmation email template
function getConfirmationEmailContent(confirmationUrl: string): string {
  return `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: ${brandColors.text};">
      Willkommen bei MOOVY! 🚗
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: ${brandColors.textMuted};">
      Vielen Dank für Ihre Registrierung! Um Ihr Konto zu aktivieren und loszufahren, bestätigen Sie bitte Ihre E-Mail-Adresse.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${confirmationUrl}" 
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            E-Mail bestätigen
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textMuted};">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin: 0; font-size: 12px; color: ${brandColors.primary}; word-break: break-all;">
      ${confirmationUrl}
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
    <p style="margin: 0; font-size: 14px; color: ${brandColors.textMuted};">
      Falls Sie sich nicht bei MOOVY registriert haben, können Sie diese E-Mail ignorieren.
    </p>
  `;
}

// Password reset email template
function getPasswordResetEmailContent(resetUrl: string): string {
  return `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: ${brandColors.text};">
      Passwort zurücksetzen 🔐
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: ${brandColors.textMuted};">
      Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den Button unten, um ein neues Passwort zu erstellen.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            Neues Passwort erstellen
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textMuted};">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin: 0; font-size: 12px; color: ${brandColors.primary}; word-break: break-all;">
      ${resetUrl}
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
    <p style="margin: 0; font-size: 14px; color: ${brandColors.textMuted};">
      Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.
    </p>
  `;
}

// Magic link email template
function getMagicLinkEmailContent(magicLinkUrl: string): string {
  return `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: ${brandColors.text};">
      Ihr Anmelde-Link 🔗
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: ${brandColors.textMuted};">
      Klicken Sie auf den Button unten, um sich bei MOOVY anzumelden.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${magicLinkUrl}" 
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            Jetzt anmelden
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textMuted};">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin: 0; font-size: 12px; color: ${brandColors.primary}; word-break: break-all;">
      ${magicLinkUrl}
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
    <p style="margin: 0; font-size: 14px; color: ${brandColors.textMuted};">
      Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.
    </p>
  `;
}

// Email change confirmation template
function getEmailChangeEmailContent(confirmationUrl: string): string {
  return `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: ${brandColors.text};">
      E-Mail-Adresse ändern ✉️
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: ${brandColors.textMuted};">
      Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert. Bitte bestätigen Sie diese Änderung.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${confirmationUrl}" 
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            E-Mail-Änderung bestätigen
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textMuted};">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin: 0; font-size: 12px; color: ${brandColors.primary}; word-break: break-all;">
      ${confirmationUrl}
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
    <p style="margin: 0; font-size: 14px; color: ${brandColors.textMuted};">
      Falls Sie diese Änderung nicht angefordert haben, kontaktieren Sie bitte umgehend unseren Support.
    </p>
  `;
}

interface AuthEmailPayload {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the webhook signature if hook secret is set
    if (hookSecret) {
      const signature = req.headers.get("x-webhook-signature");
      if (signature) {
        // Webhook verification would go here in production
        console.log("Webhook signature present");
      }
    }

    const payload: AuthEmailPayload = await req.json();
    console.log("Auth email request received:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;
    const { email } = user;
    const { token_hash, redirect_to, email_action_type, site_url } = email_data;

    // Build the confirmation URL
    const baseUrl = site_url || redirect_to || "https://moovy.app";
    const confirmationUrl = `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}`;

    let subject: string;
    let htmlContent: string;

    switch (email_action_type) {
      case "signup":
      case "email_signup":
        subject = "Willkommen bei MOOVY - Bitte bestätigen Sie Ihre E-Mail";
        htmlContent = generateEmailTemplate(
          getConfirmationEmailContent(confirmationUrl),
          subject
        );
        break;

      case "recovery":
      case "password_recovery":
        subject = "MOOVY - Passwort zurücksetzen";
        htmlContent = generateEmailTemplate(
          getPasswordResetEmailContent(confirmationUrl),
          subject
        );
        break;

      case "magiclink":
        subject = "MOOVY - Ihr Anmelde-Link";
        htmlContent = generateEmailTemplate(
          getMagicLinkEmailContent(confirmationUrl),
          subject
        );
        break;

      case "email_change":
      case "email_change_new":
        subject = "MOOVY - E-Mail-Adresse bestätigen";
        htmlContent = generateEmailTemplate(
          getEmailChangeEmailContent(confirmationUrl),
          subject
        );
        break;

      default:
        console.log(`Unknown email action type: ${email_action_type}`);
        subject = "MOOVY - Konto-Benachrichtigung";
        htmlContent = generateEmailTemplate(
          getConfirmationEmailContent(confirmationUrl),
          subject
        );
    }

    console.log(`Sending ${email_action_type} email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "MOOVY <noreply@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Resend response:", emailResponse);

    // Resend returns { data, error }. If error is set, do NOT report success.
    if ((emailResponse as any)?.error) {
      return new Response(
        JSON.stringify({ success: false, error: (emailResponse as any).error }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email accepted",
        id: (emailResponse as any)?.data?.id ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
