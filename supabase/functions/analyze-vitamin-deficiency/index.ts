// Edge runtime types are automatically available

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeficiencyAnalysis {
  deficiencies: Array<{
    vitamin: string;
    description: string;
    confidence: number;
  }>;
  overall_health: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, bodyPart } = await req.json();

    if (!image || !bodyPart) {
      throw new Error("Missing required parameters: image and bodyPart");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Step 1: Validate that the image matches the selected body part
    const validationPrompts = {
      skin: "Is this image showing human skin? Look for skin texture, pores, and skin surface. Return true only if you can clearly see skin.",
      eyes: "Is this image showing a human eye? Look for iris, pupil, sclera, eyelid, or eyelashes. Return true only if you can clearly see an eye.",
      tongue: "Is this image showing a human tongue? Look for tongue surface, papillae, or oral cavity. Return true only if you can clearly see a tongue.",
      nails: "Is this image showing human nails? Look for nail plate, nail bed, or fingertips/toes. Return true only if you can clearly see nails.",
    };

    console.log(`Validating ${bodyPart} image`);

    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${validationPrompts[bodyPart as keyof typeof validationPrompts]} Answer with only 'yes' or 'no'.` },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
      }),
    });

    if (!validationResponse.ok) {
      throw new Error(`Validation error: ${validationResponse.status}`);
    }

    const validationData = await validationResponse.json();
    const validationResult = validationData.choices[0].message.content.toLowerCase().trim();
    
    console.log(`Validation result: ${validationResult}`);

    if (!validationResult.includes('yes')) {
      return new Response(
        JSON.stringify({ 
          error: "invalid_image",
          message: `This image does not appear to be a valid ${bodyPart} image. Please upload a clear image of your ${bodyPart}.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Analyze for vitamin deficiencies
    const prompts = {
      skin: "Analyze this skin image for signs of vitamin deficiencies. Look for: pale or yellowish skin (B12, folate, iron), dry/scaly patches (A, E), easy bruising (C, K), poor wound healing (C, zinc). Identify specific deficiencies, severity, visible signs, and provide dietary recommendations.",
      eyes: "Analyze this eye image for vitamin deficiency signs. Look for: night blindness indicators (A), pale conjunctiva (iron, B12), bloodshot eyes (B2), corneal issues (A), dry eyes (A, omega-3). Identify deficiencies, severity, observable signs, and suggest supplements or foods.",
      tongue: "Examine this tongue image for nutritional deficiencies. Look for: pale tongue (iron, B12), red/inflamed tongue (B vitamins), smooth tongue (B12, folate, iron), cracks/fissures (B vitamins, iron, zinc), coating changes. List deficiencies, severity, symptoms seen, and dietary advice.",
      nails: "Inspect this nail image for vitamin deficiency indicators. Look for: brittle/splitting nails (biotin, iron), white spots (zinc), pale nail beds (iron, B12), spoon-shaped nails (iron), ridges (B vitamins, iron). Detail deficiencies, severity levels, nail signs, and nutritional recommendations.",
    };

    const systemPrompt = `You are a medical nutrition specialist analyzing images for vitamin and mineral deficiency detection.

Analyze images carefully and provide concise descriptions of potential deficiencies.

Be conservative - only flag deficiencies with clear visual indicators.

Return a JSON object with this exact structure:
{
  "deficiencies": [
    {
      "vitamin": "Vitamin A",
      "description": "Deficiency of vitamin A is associated with significant morbidity and mortality from common childhood infections, and is the world's leading preventable cause of childhood blindness. Vitamin A deficiency also contributes to maternal mortality and other poor outcomes of pregnancy and lactation.",
      "confidence": 85
    }
  ],
  "overall_health": "Brief overall assessment"
}

Keep descriptions factual, concise (2-4 sentences), and focused on health impacts and symptoms. Do not include treatment recommendations or diagnostic suggestions in the description. Provide a confidence percentage (0-100) for each deficiency based on the clarity of visual indicators.`;

    console.log(`Analyzing ${bodyPart} image for vitamin deficiencies`);

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
              { type: "text", text: prompts[bodyPart as keyof typeof prompts] },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log("Raw AI response:", analysisText);
    
    const analysis: DeficiencyAnalysis = JSON.parse(analysisText);

    // Override overall_health message when no deficiencies are found
    if (analysis.deficiencies.length === 0) {
      const normalMessages = {
        skin: "The skin appears to be within normal limits with no clear visual indicators of nutritional deficiencies.",
        eyes: "The eye appears to be within normal limits with no clear visual indicators of nutritional deficiencies.",
        tongue: "The tongue appears to be within normal limits with no clear visual indicators of nutritional deficiencies.",
        nails: "The nails appears to be within normal limits with no clear visual indicators of nutritional deficiencies.",
      };
      analysis.overall_health = normalMessages[bodyPart as keyof typeof normalMessages] || analysis.overall_health;
    }

    console.log(`Analysis complete: ${analysis.deficiencies.length} deficiencies found`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-vitamin-deficiency function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
