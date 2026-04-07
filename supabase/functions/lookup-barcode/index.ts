import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeBarcodeCandidates = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const candidates = new Set<string>();

  if (digits) candidates.add(digits);
  if (digits.length === 12) candidates.add(`0${digits}`);
  if (digits.length === 13 && digits.startsWith("0")) candidates.add(digits.slice(1));
  if (digits.length === 8) candidates.add(`00000${digits}`);

  return [...candidates];
};

const fetchProductByBarcode = async (barcode: string) => {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
  );

  const data = await response.json();
  return { response, data };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ found: false, error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ found: false, error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { barcode } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ found: false, error: "Barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidates = normalizeBarcodeCandidates(String(barcode));

    for (const candidate of candidates) {
      const { data } = await fetchProductByBarcode(candidate);

      if (data.status === 1 && data.product) {
        const p = data.product;
        const category =
          p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, "") ||
          p.food_groups_tags?.[0]?.replace(/^[a-z]{2}:/, "") ||
          "";

        const product = {
          name: p.product_name || p.product_name_pt || p.product_name_en || "",
          category,
          barcode: candidate,
          brand: p.brands || "",
          quantity_text: p.quantity || "",
        };

        if (product.name) {
          return new Response(
            JSON.stringify({ found: true, product }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ found: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lookup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ found: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
