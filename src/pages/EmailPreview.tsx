import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, KeyRound, Link2, MailCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

// MOOVY Brand Colors (matching edge function)
const brandColors = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  background: "#0f0f23",
  cardBackground: "#1a1a2e",
  text: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#8b5cf6",
};

// Base email template
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

// Email content templates
function getConfirmationEmailContent(): string {
  const confirmationUrl = "https://moovy.app/auth/confirm?token=example123";
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

function getPasswordResetEmailContent(): string {
  const resetUrl = "https://moovy.app/auth/reset?token=example123";
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

function getMagicLinkEmailContent(): string {
  const magicLinkUrl = "https://moovy.app/auth/magic?token=example123";
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

function getEmailChangeEmailContent(): string {
  const confirmationUrl = "https://moovy.app/auth/email-change?token=example123";
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

const emailTemplates = [
  {
    id: "confirmation",
    label: "Registrierung",
    subject: "Willkommen bei MOOVY - Bitte bestätigen Sie Ihre E-Mail",
    icon: Mail,
    getHtml: () => generateEmailTemplate(getConfirmationEmailContent(), "Registrierung"),
  },
  {
    id: "password-reset",
    label: "Passwort-Reset",
    subject: "MOOVY - Passwort zurücksetzen",
    icon: KeyRound,
    getHtml: () => generateEmailTemplate(getPasswordResetEmailContent(), "Passwort-Reset"),
  },
  {
    id: "magic-link",
    label: "Magic Link",
    subject: "MOOVY - Ihr Anmelde-Link",
    icon: Link2,
    getHtml: () => generateEmailTemplate(getMagicLinkEmailContent(), "Magic Link"),
  },
  {
    id: "email-change",
    label: "E-Mail ändern",
    subject: "MOOVY - E-Mail-Adresse bestätigen",
    icon: MailCheck,
    getHtml: () => generateEmailTemplate(getEmailChangeEmailContent(), "E-Mail ändern"),
  },
];

const EmailPreview = () => {
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState("confirmation");

  const currentTemplate = emailTemplates.find((t) => t.id === activeTemplate);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">E-Mail Template Preview</h1>
            <p className="text-muted-foreground">Vorschau der MOOVY Auth-E-Mails</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Template auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                {emailTemplates.map((template) => (
                  <TabsTrigger key={template.id} value={template.id} className="flex items-center gap-2">
                    <template.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{template.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {currentTemplate && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Von:</span>
                  <span>MOOVY &lt;noreply@resend.dev&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">An:</span>
                  <span>nutzer@beispiel.de</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">Betreff:</span>
                  <span className="text-foreground">{currentTemplate.subject}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#0f0f23] rounded-b-lg overflow-hidden">
                <iframe
                  srcDoc={currentTemplate.getHtml()}
                  title={`${currentTemplate.label} E-Mail Preview`}
                  className="w-full border-0"
                  style={{ height: "700px" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailPreview;
