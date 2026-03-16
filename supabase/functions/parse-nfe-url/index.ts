import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseNumber(str: string): number {
  if (!str) return 0;
  // Handle Brazilian number format: "1.234,56" -> 1234.56
  const cleaned = str.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function extractItems(html: string) {
  const items: { name: string; quantity: number; unit: string; price: number; total: number }[] = [];

  // Remove scripts and styles
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // ===== STRATEGY 1: NFC-e standard layout with txtTit/txtTit2 classes =====
  // Most SEFAZ NFC-e pages use this pattern
  // <span class="txtTit">PRODUCT NAME</span>
  // Qtde.: 1,0000 UN x Vl. Unit.: 5,99
  // Vl. Total: 5,99
  const txtTitPattern = /<span[^>]*class="txtTit"[^>]*>([\s\S]*?)<\/span>/gi;
  let txtMatches = [...cleanHtml.matchAll(txtTitPattern)];
  
  if (txtMatches.length > 0) {
    for (const match of txtMatches) {
      const name = match[1].replace(/<[^>]+>/g, "").trim();
      if (!name || name.length < 2) continue;

      // Get text after this match until next txtTit or end of product block
      const afterIdx = (match.index || 0) + match[0].length;
      const nextBlock = cleanHtml.substring(afterIdx, afterIdx + 800);
      
      let qty = 1, unitPrice = 0, total = 0, unit = "un";
      
      // Pattern: "Qtde.: 2,0000" or "Qtde.:2,0000"
      const qtyMatch = nextBlock.match(/Qtde?\.?\s*:?\s*([0-9.,]+)/i);
      if (qtyMatch) qty = parseNumber(qtyMatch[1]);
      
      // Pattern: unit like "UN", "KG", etc.
      const unitMatch = nextBlock.match(/([0-9.,]+)\s*(UN|KG|LT|L|PCT|CX|PC|MT|M2|M3|GR|MG|ML)\s/i);
      if (unitMatch) unit = unitMatch[2].toLowerCase();
      
      // Pattern: "Vl. Unit.: 5,99" or "Vl.Unit.:5,99"
      const priceMatch = nextBlock.match(/Vl\.?\s*Unit\.?\s*:?\s*([0-9.,]+)/i);
      if (priceMatch) unitPrice = parseNumber(priceMatch[1]);
      
      // Pattern: "Vl. Total: 5,99" or "Vl.Total 5,99"
      const totalMatch = nextBlock.match(/Vl\.?\s*Total\s*:?\s*R?\$?\s*([0-9.,]+)/i);
      if (totalMatch) total = parseNumber(totalMatch[1]);
      
      if (total === 0 && unitPrice > 0) total = Math.round(qty * unitPrice * 100) / 100;
      if (unitPrice === 0 && total > 0 && qty > 0) unitPrice = Math.round((total / qty) * 100) / 100;
      
      if (name.length > 2 && (unitPrice > 0 || total > 0)) {
        items.push({ name: name.substring(0, 100), quantity: qty, unit: mapUnit(unit), price: unitPrice, total });
      }
    }
  }

  // ===== STRATEGY 2: Table-based layout (some states) =====
  if (items.length === 0) {
    // Look for product rows in tables with specific patterns
    // Some states use <td> elements with product info
    const tableRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [...cleanHtml.matchAll(tableRowPattern)];
    
    for (const row of rows) {
      const rowContent = row[1];
      const cells = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").trim());
      
      // Try to identify product rows (typically 4-6 columns: code, name, qty, unit, unitPrice, total)
      if (cells.length >= 4) {
        // Find which cell looks like a product name (longest text, not a number)
        let nameIdx = -1, qtyIdx = -1, priceIdx = -1, totalIdx = -1;
        
        for (let c = 0; c < cells.length; c++) {
          const val = cells[c];
          if (val.length > 3 && !/^[\d.,\s%R$]+$/.test(val) && nameIdx === -1) {
            nameIdx = c;
          }
        }
        
        if (nameIdx >= 0) {
          // Numbers after name are likely qty, unit price, total
          const numericCells = cells.slice(nameIdx + 1).map(c => parseNumber(c)).filter(n => n > 0);
          if (numericCells.length >= 2) {
            const qty = numericCells[0] || 1;
            const unitPrice = numericCells.length >= 3 ? numericCells[1] : numericCells[numericCells.length - 1] / qty;
            const total = numericCells[numericCells.length - 1];
            
            items.push({
              name: cells[nameIdx].substring(0, 100),
              quantity: qty,
              unit: "un",
              price: Math.round(unitPrice * 100) / 100,
              total: Math.round(total * 100) / 100,
            });
          }
        }
      }
    }
  }

  // ===== STRATEGY 3: div-based layout with product blocks =====
  if (items.length === 0) {
    // Some pages use divs with classes like "det", "prod", "item"
    const divPattern = /<div[^>]*class="[^"]*(?:det|prod|item)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>)?/gi;
    const divMatches = [...cleanHtml.matchAll(divPattern)];
    
    for (const dm of divMatches) {
      const block = dm[1].replace(/<[^>]+>/g, " ").trim();
      const nameMatch = block.match(/^(.{3,80}?)(?:\s+\d)/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        const nums = [...block.matchAll(/(\d+[.,]\d{2,4})/g)].map(m => parseNumber(m[1]));
        if (nums.length >= 2) {
          items.push({
            name: name.substring(0, 100),
            quantity: nums[0] || 1,
            unit: "un",
            price: Math.round((nums.length >= 3 ? nums[1] : nums[nums.length - 1] / (nums[0] || 1)) * 100) / 100,
            total: Math.round(nums[nums.length - 1] * 100) / 100,
          });
        }
      }
    }
  }

  // ===== STRATEGY 4: Plain text extraction (fallback) =====
  if (items.length === 0) {
    const text = cleanHtml.replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Numbered product: "1 - PRODUCT NAME" or "001 PRODUCT NAME"  
      const prodMatch = line.match(/^\s*(\d{1,4})\s*[-–.)\s]+\s*(.{3,80})/);
      if (prodMatch) {
        const name = prodMatch[2].trim();
        let qty = 1, unitPrice = 0, total = 0, unit = "un";
        
        // Search next lines for qty/price data
        for (let j = i; j < Math.min(i + 8, lines.length); j++) {
          const nearby = lines[j];
          
          const qtyMatch = nearby.match(/Qtde?\.?\s*:?\s*([0-9.,]+)\s*(UN|KG|LT|L|PCT|CX|PC|un|kg|lt|l|pct|cx|pc)?/i);
          if (qtyMatch) {
            qty = parseNumber(qtyMatch[1]);
            if (qtyMatch[2]) unit = qtyMatch[2].toLowerCase();
          }
          
          const priceMatch = nearby.match(/(?:Vl\.?\s*Unit\.?|V\.?\s*Unit\.?|Unitário|unitario)\s*:?\s*R?\$?\s*([0-9.,]+)/i);
          if (priceMatch) unitPrice = parseNumber(priceMatch[1]);
          
          const totalMatch = nearby.match(/(?:Vl\.?\s*Total|V\.?\s*Total|Total)\s*:?\s*R?\$?\s*([0-9.,]+)/i);
          if (totalMatch) total = parseNumber(totalMatch[1]);
        }
        
        if (total === 0 && unitPrice > 0) total = Math.round(qty * unitPrice * 100) / 100;
        if (unitPrice === 0 && total > 0 && qty > 0) unitPrice = Math.round((total / qty) * 100) / 100;
        
        if (name.length > 2 && (unitPrice > 0 || total > 0)) {
          items.push({ name: name.substring(0, 100), quantity: qty, unit: mapUnit(unit), price: unitPrice, total });
        }
      }
      i++;
    }
  }

  // ===== STRATEGY 5: Look for "xProd" or "descricao" spans/elements =====
  if (items.length === 0) {
    const xProdPattern = /(?:xProd|descricao|txtDescProd)[^>]*>([^<]{3,80})</gi;
    const xProdMatches = [...cleanHtml.matchAll(xProdPattern)];
    
    for (const xm of xProdMatches) {
      const name = xm[1].trim();
      const afterIdx = (xm.index || 0) + xm[0].length;
      const nextBlock = cleanHtml.substring(afterIdx, afterIdx + 500).replace(/<[^>]+>/g, " ");
      
      const nums = [...nextBlock.matchAll(/(\d+[.,]\d{2,4})/g)].map(m => parseNumber(m[1]));
      if (nums.length >= 2) {
        items.push({
          name: name.substring(0, 100),
          quantity: nums[0] || 1,
          unit: "un",
          price: Math.round(nums[1] * 100) / 100,
          total: Math.round((nums[2] || nums[0] * nums[1]) * 100) / 100,
        });
      }
    }
  }

  return items;
}

function mapUnit(unit: string): string {
  const map: Record<string, string> = {
    un: "un", kg: "kg", lt: "L", l: "L", pct: "un", cx: "un", pc: "un",
    mt: "un", m2: "un", m3: "un", gr: "kg", mg: "kg", ml: "L",
  };
  return map[unit.toLowerCase()] || "un";
}

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

    console.log("Fetching NFC-e URL:", url);

    // Fetch the SEFAZ consultation page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error("SEFAZ returned status:", response.status);
      return new Response(
        JSON.stringify({ success: false, error: `SEFAZ retornou status ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log("HTML length:", html.length);
    console.log("HTML preview (first 500 chars):", html.substring(0, 500));

    const items = extractItems(html);
    console.log("Items found:", items.length);

    return new Response(
      JSON.stringify({
        success: true,
        items,
        item_count: items.length,
        url,
        html_length: html.length,
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
