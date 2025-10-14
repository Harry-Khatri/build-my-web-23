// Edge runtime types are automatically available

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeficiencyAnalysis {
  deficiencies: Array<{
    vitamin: string;
    severity: "low" | "moderate" | "severe";
    confidence: number;
    signs: string[];
    recommendations: string[];
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

    // Create detailed prompt based on body part
    const prompts = {
      skin: "Analyze this skin image for signs of vitamin deficiencies. Look for: pale or yellowish skin (B12, folate, iron), dry/scaly patches (A, E), easy bruising (C, K), poor wound healing (C, zinc). Identify specific deficiencies, severity, visible signs, and provide dietary recommendations.",
      eyes: "Analyze this eye image for vitamin deficiency signs. Look for: night blindness indicators (A), pale conjunctiva (iron, B12), bloodshot eyes (B2), corneal issues (A), dry eyes (A, omega-3). Identify deficiencies, severity, observable signs, and suggest supplements or foods.",
      tongue: "Examine this tongue image for nutritional deficiencies. Look for: pale tongue (iron, B12), red/inflamed tongue (B vitamins), smooth tongue (B12, folate, iron), cracks/fissures (B vitamins, iron, zinc), coating changes. List deficiencies, severity, symptoms seen, and dietary advice.",
      nails: "Inspect this nail image for vitamin deficiency indicators. Look for: brittle/splitting nails (biotin, iron), white spots (zinc), pale nail beds (iron, B12), spoon-shaped nails (iron), ridges (B vitamins, iron). Detail deficiencies, severity levels, nail signs, and nutritional recommendations.",
    };

    const systemPrompt = `You are a medical AI assistant specializing in nutritional deficiency detection through visual analysis. 

Analyze images carefully and provide structured output with:
1. List of potential vitamin/mineral deficiencies
2. Severity level (low/moderate/severe) with confidence score (0-1)
3. Specific visible signs observed
4. Dietary recommendations and supplement suggestions

Be conservative - only flag deficiencies with clear visual indicators. Always recommend consulting healthcare providers for diagnosis.

Return a JSON object with this exact structure:
{
  "deficiencies": [
    {
      "vitamin": "Vitamin Name or Mineral",
      "severity": "low" | "moderate" | "severe",
      "confidence": 0.0-1.0,
      "signs": ["sign1", "sign2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "overall_health": "Brief overall assessment"
}`;

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
