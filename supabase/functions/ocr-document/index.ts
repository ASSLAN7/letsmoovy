import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { imageBase64, documentType } = await req.json();

    if (!imageBase64 || !documentType) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or documentType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isDriverLicense = documentType.includes("driver_license");
    const systemPrompt = isDriverLicense
      ? `Du bist ein Experte für OCR-Extraktion von deutschen Führerscheinen. Analysiere das Bild und extrahiere folgende Informationen:
- Führerscheinnummer (Feld 5)
- Ausstellungsdatum (Feld 4a)
- Ablaufdatum (Feld 4b)
- Name (Feld 1)
- Vorname (Feld 2)
- Geburtsdatum (Feld 3)
- Führerscheinklassen (Feld 9)

Antworte NUR mit einem JSON-Objekt ohne zusätzlichen Text.`
      : `Du bist ein Experte für OCR-Extraktion von deutschen Personalausweisen. Analysiere das Bild und extrahiere folgende Informationen:
- Ausweisnummer
- Name
- Vorname
- Geburtsdatum
- Geburtsort
- Nationalität
- Gültig bis

Antworte NUR mit einem JSON-Objekt ohne zusätzlichen Text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: isDriverLicense
                  ? "Extrahiere die Führerscheindaten aus diesem Bild."
                  : "Extrahiere die Ausweisdaten aus diesem Bild.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let ocrData = {};
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse OCR response:", parseError);
      ocrData = { raw_text: content };
    }

    // Map OCR data to profile fields if it's a driver license
    let mappedData = ocrData;
    if (isDriverLicense && typeof ocrData === "object") {
      const ocrObj = ocrData as Record<string, string>;
      mappedData = {
        ...ocrData,
        driver_license_number: ocrObj["Führerscheinnummer"] || ocrObj["license_number"] || null,
        driver_license_expiry: ocrObj["Ablaufdatum"] || ocrObj["expiry_date"] || null,
        driver_license_issued_date: ocrObj["Ausstellungsdatum"] || ocrObj["issue_date"] || null,
        full_name: ocrObj["Vorname"] && ocrObj["Name"] 
          ? `${ocrObj["Vorname"]} ${ocrObj["Name"]}` 
          : ocrObj["full_name"] || null,
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ocrData: mappedData,
      documentType 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OCR error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
