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
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return new Response(
        JSON.stringify({ success: false, error: "URL inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the SEFAZ consultation page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `SEFAZ retornou status ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    // Parse products from NFC-e HTML page
    // NFC-e pages typically have product rows in tables or spans with specific classes
    const items: { name: string; quantity: number; unit: string; price: number; total: number }[] = [];

    // Pattern 1: NFC-e pages often use spans with specific IDs/classes
    // Try common NFC-e HTML patterns

    // Pattern: <span class="txtTit">DESCRIPTION</span> with nearby quantity/price
    // Most NFC-e pages use a table or divs with product info

    // Try to extract from common NFC-e HTML structures
    // Pattern for SP, RJ, MG and most states
    const productRegex = /(?:<span[^>]*>|<td[^>]*>)\s*(\d+)\s*[-–]\s*(.+?)(?:<\/span>|<\/td>)/gi;
    const qtyPriceRegex = /(?:Qtde\.?|QTD|Quant)[:\s]*([0-9.,]+)\s*(?:UN|KG|LT|L|PCT|CX|PC|un|kg|lt|pct|cx|pc)?\s*.*?(?:Vl\.?\s*Unit|V\.?\s*Unit|UNIT)[:\s]*([0-9.,]+)\s*.*?(?:Vl\.?\s*Total|V\.?\s*Total|TOTAL)[:\s]*([0-9.,]+)/gi;

    // More flexible: look for product description blocks
    // NFC-e common format: product name, then qty, unit price, total on same or nearby lines
    
    // Strategy: split by lines and look for patterns
    const lines = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(div|p|tr|li)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").split("\n");
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Look for numbered product lines: "1 - PRODUCT NAME" or "001 PRODUCT NAME"
      const prodMatch = line.match(/^\s*(\d{1,4})\s*[-–.)\s]\s*(.{3,80})/);
      if (prodMatch) {
        const name = prodMatch[2].trim();
        
        // Look in next few lines for quantity and price info
        let qty = 1;
        let unitPrice = 0;
        let total = 0;
        let unit = "un";
        
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const nearby = lines[j].trim();
          
          // Try: "Qtde.: 2,0000 UN x Vl.Unit.: 5,99"
          const qtyMatch = nearby.match(/(?:Qtde?\.?|QTD|Quant)[:\s]*([0-9.,]+)\s*(UN|KG|LT|L|PCT|CX|PC|un|kg|lt|pct|cx|pc)?/i);
          if (qtyMatch) {
            qty = parseFloat(qtyMatch[1].replace(",", ".")) || 1;
            unit = (qtyMatch[2] || "un").toLowerCase();
          }
          
          const priceMatch = nearby.match(/(?:Vl\.?\s*Unit\.?|V\.?\s*Unit\.?|UNIT\.?)[:\s]*([0-9.,]+)/i);
          if (priceMatch) {
            unitPrice = parseFloat(priceMatch[1].replace(",", ".")) || 0;
          }
          
          const totalMatch = nearby.match(/(?:Vl\.?\s*Total|V\.?\s*Total|TOTAL)[:\s]*([0-9.,]+)/i);
          if (totalMatch) {
            total = parseFloat(totalMatch[1].replace(",", ".")) || 0;
          }
        }
        
        if (name && name.length > 2 && (unitPrice > 0 || total > 0)) {
          if (total === 0) total = qty * unitPrice;
          if (unitPrice === 0 && total > 0) unitPrice = total / qty;
          
          // Map units
          const unitMap: Record<string, string> = { "un": "un", "kg": "kg", "lt": "L", "l": "L", "pct": "un", "cx": "un", "pc": "un" };
          
          items.push({
            name: name.substring(0, 100),
            quantity: qty,
            unit: unitMap[unit] || "un",
            price: Math.round(unitPrice * 100) / 100,
            total: Math.round(total * 100) / 100,
          });
        }
      }
      i++;
    }

    // If no items found with the above pattern, try a more generic approach
    if (items.length === 0) {
      // Try to find product data in any table-like structure
      const genericRegex = /([A-ZÀ-Ú][A-ZÀ-Ú0-9\s.,/-]{2,60})\s+(\d+[.,]?\d*)\s+(UN|KG|LT|L|PCT|CX|PC)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/gi;
      let match;
      while ((match = genericRegex.exec(html.replace(/<[^>]+>/g, " "))) !== null) {
        const unitMap: Record<string, string> = { "UN": "un", "KG": "kg", "LT": "L", "L": "L", "PCT": "un", "CX": "un", "PC": "un" };
        items.push({
          name: match[1].trim(),
          quantity: parseFloat(match[2].replace(",", ".")) || 1,
          unit: unitMap[match[3].toUpperCase()] || "un",
          price: parseFloat(match[4].replace(",", ".")) || 0,
          total: parseFloat(match[5].replace(",", ".")) || 0,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        items,
        item_count: items.length,
        url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse NF-e URL error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
