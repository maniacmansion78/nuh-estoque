import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ found: false, error: "Barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query Open Food Facts API (free, no key needed)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
    );

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const p = data.product;

      // Try to get a meaningful category
      const category =
        p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, "") ||
        p.food_groups_tags?.[0]?.replace(/^[a-z]{2}:/, "") ||
        "";

      const product = {
        name: p.product_name || p.product_name_pt || p.product_name_en || "",
        category: category,
        barcode: barcode,
        brand: p.brands || "",
        quantity_text: p.quantity || "",
      };

      return new Response(
        JSON.stringify({ found: true, product }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ found: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lookup error:", error);
    return new Response(
      JSON.stringify({ found: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
