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
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Imagem não enviada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente especializado em ler notas fiscais brasileiras de supermercados e restaurantes.
Analise a imagem da nota fiscal e extraia TODOS os itens de produto listados.

Para cada item, retorne:
- name: nome do produto (limpo, sem códigos)
- quantity: quantidade numérica (se não especificada, use 1)
- unit: unidade (kg, un, lt, cx, pc, etc.)
- price: preço unitário em reais (número decimal)
- total: valor total do item

IMPORTANTE: Retorne APENAS os itens de produto. Ignore linhas de subtotal, desconto, troco, etc.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
                    url: `data:image/jpeg;base64,${image_base64}`,
                  },
                },
                {
                  type: "text",
                  text: "Extraia todos os itens desta nota fiscal.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_receipt_items",
                description:
                  "Retorna os itens extraídos da nota fiscal",
                parameters: {
                  type: "object",
                  properties: {
                    store_name: {
                      type: "string",
                      description: "Nome do estabelecimento",
                    },
                    date: {
                      type: "string",
                      description: "Data da nota no formato YYYY-MM-DD",
                    },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "number" },
                          unit: { type: "string" },
                          price: { type: "number" },
                          total: { type: "number" },
                        },
                        required: ["name", "quantity", "unit", "price", "total"],
                        additionalProperties: false,
                      },
                    },
                    total: {
                      type: "number",
                      description: "Valor total da nota",
                    },
                  },
                  required: ["items"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_receipt_items" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para processamento de IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao processar a nota fiscal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair itens da nota" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, ...extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scan-receipt error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
