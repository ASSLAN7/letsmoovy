import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, KeyRound, Link2, MailCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// MOOVY Brand Colors (Türkis - matching edge function)
const brandColors = {
  primary: "#14b8a6",
  primaryDark: "#0d9488",
  background: "#0f1114",
  cardBackground: "#171b20",
  text: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#2dd4bf",
  error: "#ef4444",
  info: "#3b82f6",
};

// MOOVY Logo SVG as inline string
const moovyLogoSvg = `
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
`;

// MOOVY Logo Header HTML
const getMoovyHeader = () => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${brandColors.background}; border-radius: 16px 16px 0 0; padding: 24px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="vertical-align: middle; padding-right: 10px;">
              ${moovyLogoSvg}
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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
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

// Base email template for Auth emails
function generateAuthEmailTemplate(content: string, title: string): string {
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
          ${getMoovyHeader()}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: ${brandColors.cardBackground}; border-radius: 0 0 16px 16px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td>
              ${getMoovyFooter()}
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

// Booking email template
function generateBookingEmailTemplate(bannerHtml: string, content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${brandColors.background};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header with MOOVY Logo -->
        ${getMoovyHeader()}
        
        <!-- Status Banner -->
        ${bannerHtml}
        
        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.cardBackground}; padding: 32px; border-radius: 0 0 16px 16px;">
          <tr>
            <td>
              ${content}
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
  `;
}

// Auth Email content templates
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
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
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
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
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
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
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
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: ${brandColors.text}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
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

// Booking confirmation email content
function getBookingConfirmationHtml(): string {
  const banner = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); padding: 24px;">
      <tr>
        <td align="center">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">✓ Buchung bestätigt!</h1>
        </td>
      </tr>
    </table>
  `;
  
  const content = `
    <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
      Hallo Max Mustermann,
    </p>
    <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
      Vielen Dank für deine Buchung! Hier sind die Details:
    </p>
    
    <!-- Vehicle Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.background}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <tr>
        <td>
          <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
            Urban E
          </h2>
          <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">Kompakt</p>
        </td>
      </tr>
    </table>
    
    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Start:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Samstag, 11. Januar 2026, 10:00</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Ende:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Samstag, 11. Januar 2026, 14:00</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Abholung:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Musterstraße 123, Berlin</span>
        </td>
      </tr>
    </table>
    
    <!-- Price -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); border-radius: 12px; padding: 20px;">
      <tr>
        <td>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Geschätzter Gesamtpreis</p>
          <p style="color: white; margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">48.00 €</p>
        </td>
      </tr>
    </table>
    
    <p style="color: ${brandColors.textMuted}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
      Du kannst deine Buchung jederzeit in der App verwalten.
    </p>
  `;
  
  return generateBookingEmailTemplate(banner, content, "Buchungsbestätigung");
}

// Booking cancellation email content
function getBookingCancellationHtml(): string {
  const banner = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.error} 0%, #dc2626 100%); padding: 24px;">
      <tr>
        <td align="center">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">✕ Buchung storniert</h1>
        </td>
      </tr>
    </table>
  `;
  
  const content = `
    <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
      Hallo Max Mustermann,
    </p>
    <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
      Deine Buchung wurde erfolgreich storniert. Hier sind die Details der stornierten Buchung:
    </p>
    
    <!-- Vehicle Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <tr>
        <td>
          <p style="color: ${brandColors.error}; margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Storniert</p>
          <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
            Urban E
          </h2>
          <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">Kompakt</p>
        </td>
      </tr>
    </table>
    
    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Geplanter Start:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Samstag, 11. Januar 2026, 10:00</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Geplantes Ende:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Samstag, 11. Januar 2026, 14:00</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">Abholort:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Musterstraße 123, Berlin</span>
        </td>
      </tr>
    </table>
    
    <p style="color: ${brandColors.textMuted}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
      Du kannst jederzeit eine neue Buchung in der App erstellen.
    </p>
  `;
  
  return generateBookingEmailTemplate(banner, content, "Buchung storniert");
}

// Booking reminder email content
function getBookingReminderHtml(): string {
  const banner = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${brandColors.info} 0%, #2563eb 100%); padding: 24px;">
      <tr>
        <td align="center">
          <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 14px;">⏰ Erinnerung</p>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Deine Fahrt startet bald!</h1>
        </td>
      </tr>
    </table>
  `;
  
  const content = `
    <p style="color: ${brandColors.text}; font-size: 16px; margin: 0 0 24px 0;">
      Hallo Max Mustermann,
    </p>
    <p style="color: ${brandColors.textMuted}; font-size: 16px; margin: 0 0 24px 0;">
      In etwa einer Stunde beginnt deine Buchung. Hier sind die Details:
    </p>
    
    <!-- Vehicle Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <tr>
        <td>
          <h2 style="color: ${brandColors.text}; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
            Urban E
          </h2>
          <p style="color: ${brandColors.textMuted}; margin: 0; font-size: 14px;">Kompakt</p>
        </td>
      </tr>
    </table>
    
    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">🕐 Start:</strong>
          <span style="color: ${brandColors.info}; float: right; font-weight: 600;">Samstag, 11. Januar 2026, 10:00</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="color: ${brandColors.text};">📍 Abholort:</strong>
          <span style="color: ${brandColors.textMuted}; float: right;">Musterstraße 123, Berlin</span>
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
  `;
  
  return generateBookingEmailTemplate(banner, content, "Buchungserinnerung");
}

const emailTemplates = [
  {
    id: "confirmation",
    label: "Registrierung",
    subject: "Willkommen bei MOOVY - Bitte bestätigen Sie Ihre E-Mail",
    icon: Mail,
    category: "auth",
    getHtml: () => generateAuthEmailTemplate(getConfirmationEmailContent(), "Registrierung"),
  },
  {
    id: "password-reset",
    label: "Passwort-Reset",
    subject: "MOOVY - Passwort zurücksetzen",
    icon: KeyRound,
    category: "auth",
    getHtml: () => generateAuthEmailTemplate(getPasswordResetEmailContent(), "Passwort-Reset"),
  },
  {
    id: "magic-link",
    label: "Magic Link",
    subject: "MOOVY - Ihr Anmelde-Link",
    icon: Link2,
    category: "auth",
    getHtml: () => generateAuthEmailTemplate(getMagicLinkEmailContent(), "Magic Link"),
  },
  {
    id: "email-change",
    label: "E-Mail ändern",
    subject: "MOOVY - E-Mail-Adresse bestätigen",
    icon: MailCheck,
    category: "auth",
    getHtml: () => generateAuthEmailTemplate(getEmailChangeEmailContent(), "E-Mail ändern"),
  },
  {
    id: "booking-confirmation",
    label: "Buchungsbestätigung",
    subject: "Buchungsbestätigung: Urban E",
    icon: CheckCircle,
    category: "booking",
    getHtml: getBookingConfirmationHtml,
  },
  {
    id: "booking-cancellation",
    label: "Stornierung",
    subject: "Buchung storniert: Urban E",
    icon: XCircle,
    category: "booking",
    getHtml: getBookingCancellationHtml,
  },
  {
    id: "booking-reminder",
    label: "Erinnerung",
    subject: "⏰ Erinnerung: Deine Buchung startet in 1 Stunde - Urban E",
    icon: Clock,
    category: "booking",
    getHtml: getBookingReminderHtml,
  },
];

const EmailPreview = () => {
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState("confirmation");
  const [activeCategory, setActiveCategory] = useState("auth");

  const filteredTemplates = emailTemplates.filter(t => t.category === activeCategory);
  const currentTemplate = emailTemplates.find((t) => t.id === activeTemplate);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const firstTemplate = emailTemplates.find(t => t.category === category);
    if (firstTemplate) {
      setActiveTemplate(firstTemplate.id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">E-Mail Template Preview</h1>
            <p className="text-muted-foreground">Vorschau aller MOOVY E-Mail-Templates</p>
          </div>
        </div>

        {/* Category Selection */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Button 
                variant={activeCategory === "auth" ? "default" : "outline"}
                onClick={() => handleCategoryChange("auth")}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Auth E-Mails
              </Button>
              <Button 
                variant={activeCategory === "booking" ? "default" : "outline"}
                onClick={() => handleCategoryChange("booking")}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Buchungs E-Mails
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Template auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className={`grid w-full ${filteredTemplates.length <= 4 ? `grid-cols-${filteredTemplates.length}` : 'grid-cols-4'}`}>
                {filteredTemplates.map((template) => (
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
                  <span>MOOVY &lt;noreply@drive-moovy.de&gt;</span>
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
              <div className="bg-[#0f1114] rounded-b-lg overflow-hidden">
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
