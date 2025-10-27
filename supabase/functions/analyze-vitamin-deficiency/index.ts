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
      eyes: "Analyze this eye image ONLY for signs of vitamin deficiencies related to Vitamins A and B. Look for visible indicators specific to these vitamins only.",
      tongue: "Analyze this tongue image ONLY for signs of vitamin deficiencies related to Vitamin B. Look for visible indicators specific to this vitamin only.",
      nails: "Analyze this nail image ONLY for signs of vitamin deficiencies related to Vitamin C. Look for visible indicators specific to this vitamin only.",
    };

    const systemPrompt = `You are a medical nutrition specialist analyzing images strictly for vitamin deficiency detection.

CRITICAL RULES:
- ONLY analyze for vitamin deficiencies based on the specified vitamins in the prompt
- DO NOT mention or suggest any other health conditions, allergies, infections, hormonal problems, dehydration, or environmental factors
- DO NOT include minerals, proteins, or other nutrients unless they are vitamins
- DO NOT describe what you see in the image (rashes, textures, colors, etc.)
- Your output must be strictly limited to vitamin deficiency detection only

Analyze the image and identify visible signs of vitamin deficiencies for:
- Eyes: Vitamins A, B only
- Tongue: Vitamin B only
- Nails: Vitamin C only

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

IMPORTANT: 
- You MUST include a "confidence" field (numeric value 0-100) for EVERY deficiency detected
- Keep descriptions factual, concise (2-4 sentences), and focused ONLY on health impacts and symptoms of the vitamin deficiency
- DO NOT describe the image appearance or what you observe visually
- Do not include treatment recommendations or diagnostic suggestions in the description
- The confidence percentage should reflect the clarity of visual indicators
- ONLY report on the vitamins specified for each body part - do not include any other conditions or causes`;

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
      analysis.overall_health = "No vitamin deficiency detected.";
      analysis.deficiencies = [];
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
