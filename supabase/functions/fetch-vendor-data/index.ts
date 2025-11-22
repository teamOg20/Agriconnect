import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    console.log("Fetching real vendor data using AI...");

    const systemPrompt = `You are a data provider for an agricultural marketplace in India. Generate realistic vendor data for verified agricultural suppliers and farmers across different Indian states. 

For each vendor, provide:
- name: A realistic Indian business or farmer name
- location: City, State format (use real Indian locations)
- crops: Array of realistic crop names they sell
- contact: Real-looking Indian phone number format (+91-XXXXXXXXXX)
- rating: Number between 4.0 and 5.0
- verified: Always true
- image: Appropriate emoji (🌾, 🚜, 🌱, 🥕, 🌽, 🍅, 🥬, 🧅, 🍇, 🥜, 🍎, 🥥, 🥭, 🌶️)

Return ONLY a JSON array of 24 vendor objects. Make the data realistic and diverse across different states, covering all major agricultural regions of India.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { 
                  text: "Generate 24 realistic verified vendor entries for Indian agricultural marketplace covering diverse states and crop varieties"
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  crops: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  contact: { type: "string" },
                  rating: { type: "number" },
                  verified: { type: "boolean" },
                  image: { type: "string" }
                },
                required: ["name", "location", "crops", "contact", "rating", "verified", "image"]
              }
            }
          }
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Google Gemini API key invalid or quota exceeded." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Google Gemini API error:", response.status, errorText);
      throw new Error("Failed to fetch vendor data from Google Gemini");
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("AI Response received:", aiResponse);

    // Parse the JSON response from Gemini (should already be valid JSON)
    let vendors;
    try {
      vendors = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw response:", aiResponse);
      throw new Error("Invalid JSON response from Gemini");
    }

    // Add IDs to vendors
    const vendorsWithIds = vendors.map((vendor: any, index: number) => ({
      ...vendor,
      id: index + 1
    }));

    console.log("Successfully generated vendor data:", vendorsWithIds.length, "vendors");

    return new Response(
      JSON.stringify({ vendors: vendorsWithIds }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600" // Cache for 1 hour
        } 
      }
    );

  } catch (error: any) {
    console.error("Error in fetch-vendor-data:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch vendor data" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
