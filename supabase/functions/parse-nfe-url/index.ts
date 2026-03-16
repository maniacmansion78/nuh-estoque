import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ParsedItem = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
};

function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  const unitMap: Record<string, string> = {
    un: "un",
    und: "un",
    unidade: "un",
    pc: "un",
    pç: "un",
    pct: "un",
    cx: "un",
    kg: "kg",
    gr: "kg",
    g: "kg",
    lt: "L",
    l: "L",
    ml: "L",
  };
  return unitMap[normalized] || "un";
}

function decodeHtml(html: string): string {
  return html
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeName(name: string): string {
  return decodeHtml(name)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeItems(items: ParsedItem[]): ParsedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.name.toLowerCase()}|${item.quantity}|${item.total}`;
    if (!item.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFirstUrl(input: string): string | null {
  const candidates = [
    input.trim(),
    (() => {
      try {
        return decodeURIComponent(input.trim());
      } catch {
        return input.trim();
      }
    })(),
  ];

  for (const candidate of candidates) {
    if (/^https?:\/\//i.test(candidate)) return candidate;

    const urlMatch = candidate.match(/https?:\/\/\S+/i);
    if (urlMatch?.[0]) return urlMatch[0].replace(/[),.;]+$/, "");

    const wwwMatch = candidate.match(/www\.\S+/i);
    if (wwwMatch?.[0]) return `https://${wwwMatch[0].replace(/[),.;]+$/, "")}`;
  }

  return null;
}

function extractAccessKey(input: string): string | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(input.trim());
    } catch {
      return input.trim();
    }
  })();

  const directMatch = decoded.match(/\b\d{44}\b/);
  if (directMatch?.[0]) return directMatch[0];

  const compactDigits = decoded.replace(/\D/g, "");
  const compactMatch = compactDigits.match(/\d{44}/);
  return compactMatch?.[0] || null;
}

function resolveNFeFetchUrl(input: string): string | null {
  const extractedUrl = extractFirstUrl(input);
  if (extractedUrl) return extractedUrl;

  const accessKey = extractAccessKey(input);
  if (accessKey) {
    return `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${accessKey}`;
  }

  return null;
}

function extractItemsWithRegex(html: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  const txtTitMatches = [...cleanHtml.matchAll(/<span[^>]*class=["'][^"']*txtTit[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
  for (const match of txtTitMatches) {
    const name = normalizeName(match[1]);
    if (name.length < 2) continue;

    const afterIndex = (match.index || 0) + match[0].length;
    const block = decodeHtml(cleanHtml.slice(afterIndex, afterIndex + 1200)).replace(/<[^>]+>/g, " ");

    const quantityMatch = block.match(/Qtde?\.?\s*:?\s*([0-9.,]+)/i);
    const unitPriceMatch = block.match(/Vl\.?\s*Unit\.?\s*:?\s*R?\$?\s*([0-9.,]+)/i);
    const totalMatch = block.match(/Vl\.?\s*Total\s*:?\s*R?\$?\s*([0-9.,]+)/i);
    const unitMatch = block.match(/Qtde?\.?\s*:?\s*[0-9.,]+\s*([A-ZÇa-zç]{1,5})/i);

    const quantity = parseNumber(quantityMatch?.[1] || 1) || 1;
    let price = parseNumber(unitPriceMatch?.[1]);
    let total = parseNumber(totalMatch?.[1]);
    if (!total && price) total = Math.round(quantity * price * 100) / 100;
    if (!price && total && quantity) price = Math.round((total / quantity) * 100) / 100;

    if (price > 0 || total > 0) {
      items.push({
        name: name.slice(0, 120),
        quantity,
        unit: mapUnit(unitMatch?.[1] || "un"),
        price,
        total,
      });
    }
  }

  if (items.length > 0) return dedupeItems(items);

  const text = decodeHtml(cleanHtml)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|tr|li|td|span)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const lines = text.split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const numberedProduct = current.match(/^\s*(\d{1,4})\s*[-–.)\s]+\s*(.{3,100})$/);
    if (!numberedProduct) continue;

    const name = numberedProduct[2].trim();
    let quantity = 1;
    let price = 0;
    let total = 0;
    let unit = "un";

    for (let j = i; j < Math.min(i + 8, lines.length); j++) {
      const nearby = lines[j];
      const qtyMatch = nearby.match(/Qtde?\.?\s*:?\s*([0-9.,]+)\s*([A-ZÇa-zç]{1,5})?/i);
      const priceMatch = nearby.match(/(?:Vl\.?\s*Unit\.?|V\.?\s*Unit\.?|Unit[aá]rio)\s*:?\s*R?\$?\s*([0-9.,]+)/i);
      const totalMatch = nearby.match(/(?:Vl\.?\s*Total|V\.?\s*Total|Total)\s*:?\s*R?\$?\s*([0-9.,]+)/i);

      if (qtyMatch) {
        quantity = parseNumber(qtyMatch[1]) || 1;
        if (qtyMatch[2]) unit = qtyMatch[2];
      }
      if (priceMatch) price = parseNumber(priceMatch[1]);
      if (totalMatch) total = parseNumber(totalMatch[1]);
    }

    if (!total && price) total = Math.round(quantity * price * 100) / 100;
    if (!price && total && quantity) price = Math.round((total / quantity) * 100) / 100;

    if (price > 0 || total > 0) {
      items.push({
        name: name.slice(0, 120),
        quantity,
        unit: mapUnit(unit),
        price,
        total,
      });
    }
  }

  return dedupeItems(items);
}

async function extractItemsWithAi(html: string): Promise<ParsedItem[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  const text = decodeHtml(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|tr|li|td|span|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30000);

  if (text.length < 300) return [];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você extrai itens de páginas HTML de consulta NFC-e/NF-e da SEFAZ. Retorne somente produtos comprados. Ignore totais, descontos, troco, rodapé, impostos e mensagens técnicas.",
        },
        {
          role: "user",
          content: `Extraia os itens desta página de consulta de nota fiscal brasileira. Se não houver itens visíveis, retorne um array vazio.\n\nCONTEÚDO:\n${text}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_nfe_items",
            description: "Extrai itens de uma nota fiscal brasileira",
            parameters: {
              type: "object",
              properties: {
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
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_nfe_items" },
      },
    }),
  });

  if (!response.ok) {
    console.error("AI fallback failed:", response.status, await response.text());
    return [];
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];

  const extracted = JSON.parse(toolCall.function.arguments);
  const items = Array.isArray(extracted?.items) ? extracted.items : [];

  return dedupeItems(
    items
      .map((item) => ({
        name: normalizeName(String(item.name || "")).slice(0, 120),
        quantity: parseNumber(item.quantity) || 1,
        unit: mapUnit(String(item.unit || "un")),
        price: parseNumber(item.price),
        total: parseNumber(item.total),
      }))
      .filter((item) => item.name && (item.price > 0 || item.total > 0))
      .map((item) => ({
        ...item,
        total: item.total || Math.round(item.quantity * item.price * 100) / 100,
        price: item.price || (item.quantity ? Math.round((item.total / item.quantity) * 100) / 100 : 0),
      }))
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ success: false, error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fetchUrl = resolveNFeFetchUrl(url);

    if (!fetchUrl) {
      return new Response(JSON.stringify({ success: false, error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching NFC-e URL:", fetchUrl);

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `SEFAZ retornou status ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log("HTML length:", html.length);
    console.log("HTML preview (first 500 chars):", html.slice(0, 500));

    let items = extractItemsWithRegex(html);
    let extractionMethod = "regex";

    if (items.length === 0) {
      items = await extractItemsWithAi(html);
      if (items.length > 0) extractionMethod = "ai";
    }

    console.log("Items found:", items.length);

    return new Response(
      JSON.stringify({
        success: true,
        items,
        item_count: items.length,
        extraction_method: extractionMethod,
        html_length: html.length,
        url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse NF-e URL error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});